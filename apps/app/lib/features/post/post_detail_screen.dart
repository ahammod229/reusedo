import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../core/prefs.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';
import '../feed/post_actions.dart';

class PostDetailScreen extends ConsumerWidget {
  const PostDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final lang = ref.watch(langProvider);
    final cs = Theme.of(context).colorScheme;
    final post = ref.watch(postProvider(id));
    final saved = ref.watch(savedProvider).contains(id);

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/feed')),
        title: Text(t('বিস্তারিত', 'Details')),
        actions: [
          IconButton(
            tooltip: saved ? t('সেভ বাতিল', 'Unsave') : t('সেভ', 'Save'),
            onPressed: () => ref.read(savedProvider.notifier).toggle(id),
            icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border),
          ),
          post.maybeWhen(
            data: (p) => p == null
                ? const SizedBox.shrink()
                : IconButton(
                    tooltip: t('শেয়ার', 'Share'),
                    onPressed: () => sharePost(p),
                    icon: const Icon(Icons.share_outlined),
                  ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: AsyncView<Post?>(
        value: post,
        onRetry: () => ref.invalidate(postProvider(id)),
        builder: (p) {
          if (p == null) {
            return EmptyState(
              emoji: '🔍',
              title: t('পোস্টটি পাওয়া যায়নি', 'Post not found'),
              action: FilledButton(onPressed: () => context.go('/feed'), child: Text(t('ফিডে ফিরুন', 'Back to feed'))),
            );
          }
          final cat = categoryOf(p.category);
          final offer = p.kind == PostKind.offer;
          final given = p.status == PostStatus.given;
          return ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              Constrained(
                maxWidth: 720,
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  const SizedBox(height: 8),
                  PhotoBox(post: p, height: 240, radius: 20),
                  const SizedBox(height: 14),
                  Row(children: [KindPill(p.kind), const Spacer(), Text(p.postedAt, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12))]),
                  const SizedBox(height: 10),
                  Text(p.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, height: 1.3)),
                  const SizedBox(height: 8),
                  Text(p.description, style: const TextStyle(fontSize: 16, height: 1.6)),
                  const SizedBox(height: 14),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    Pill(lang == Lang.bn ? cat.bn : cat.en),
                    Pill(conditionText(t, p.condition)),
                    if (p.eduLevel != null) Pill(lang == Lang.bn ? p.eduLevel!.bn : p.eduLevel!.en),
                    if (p.eduDetail != null) Pill(p.eduDetail!),
                    if (p.qty != null) Pill('${t.n(p.qty!)} ${t('টি', 'pcs')}'),
                    if (p.urgency != null && !offer) Pill(urgencyText(t, p.urgency!), bg: Brand.amberSoft, fg: Brand.amber),
                  ]),
                  const SizedBox(height: 16),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.place_outlined),
                      title: Text('${p.area}, ${p.district}'),
                      subtitle: Text(distanceText(t, p.distanceKm)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Card(
                    child: ListTile(
                      leading: Icon(p.delivery.contains(Delivery.courier) ? Icons.local_shipping_outlined : Icons.handshake_outlined),
                      title: Text(p.delivery.map((d) => d == Delivery.pickup ? t('নিজে দেখা করে', 'In person') : t('কুরিয়ার', 'Courier')).join(' · ')),
                      subtitle: p.delivery.contains(Delivery.courier)
                          ? Text(t('কুরিয়ার চার্জ গ্রহীতা দেবেন।', 'The receiver pays the courier fee.'))
                          : null,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Card(
                    child: ListTile(
                      onTap: () => context.push('/users/${p.author.username}'),
                      leading: CircleAvatar(
                        backgroundColor: cs.primary.withValues(alpha: 0.15),
                        child: Text(p.author.name.characters.first, style: TextStyle(color: cs.primary, fontWeight: FontWeight.w800)),
                      ),
                      title: Row(children: [
                        Flexible(child: Text(p.author.name, overflow: TextOverflow.ellipsis)),
                        if (p.author.verified) ...[const SizedBox(width: 4), Icon(Icons.verified, size: 16, color: cs.primary)],
                      ]),
                      subtitle: Text('${t('ট্রাস্ট', 'Trust')} ${t.n(p.author.trust)}'),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: given || p.mine ? null : () => showRequestSheet(context, ref, p),
                    icon: Icon(offer ? Icons.front_hand_outlined : Icons.volunteer_activism),
                    label: Text(given
                        ? t('দেওয়া হয়ে গেছে', 'Already given away')
                        : offer
                            ? t('এটা আমার চাই', 'I want this')
                            : t('এটা আমার কাছে আছে', 'I have this')),
                  ),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: p.mine ? null : () => context.go('/messages'),
                        icon: const Icon(Icons.chat_bubble_outline),
                        label: Text(t('চ্যাট', 'Chat')),
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: () => showReportSheet(context, ref, p),
                      icon: const Icon(Icons.flag_outlined),
                      label: Text(t('রিপোর্ট', 'Report')),
                    ),
                  ]),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: cs.surfaceContainerHighest.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(14)),
                    child: Text(
                      '🛡️ ${t('নিরাপত্তা: জনসমাগমের জায়গায় দেখা করুন। কাউকে আগাম টাকা দেবেন না। সন্দেহ হলে রিপোর্ট করুন।', 'Safety: meet in a public place. Never pay in advance. Report anything suspicious.')}',
                      style: const TextStyle(fontSize: 13, height: 1.5),
                    ),
                  ),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}
