import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../core/prefs.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';
import 'post_actions.dart';

class PostCard extends ConsumerWidget {
  const PostCard({super.key, required this.post});
  final Post post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final lang = ref.watch(langProvider);
    final cs = Theme.of(context).colorScheme;
    final saved = ref.watch(savedProvider).contains(post.id);
    final cat = categoryOf(post.category);
    final offer = post.kind == PostKind.offer;
    final given = post.status == PostStatus.given;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/post/${post.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: cs.primary.withValues(alpha: 0.15),
                child: Text(post.author.name.characters.first,
                    style: TextStyle(color: cs.primary, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Flexible(
                      child: Text(post.author.name,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                    if (post.author.verified) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.verified, size: 16, color: cs.primary, semanticLabel: t('যাচাইকৃত', 'Verified')),
                    ],
                  ]),
                  Text(
                    '${post.area}, ${post.district} · ${distanceText(t, post.distanceKm)} · ${post.postedAt}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                  ),
                ]),
              ),
              KindPill(post.kind),
            ]),
            const SizedBox(height: 12),
            Text(post.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(post.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: cs.onSurfaceVariant, height: 1.5)),
            const SizedBox(height: 10),
            Stack(children: [
              PhotoBox(post: post, height: 160),
              if (given)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Pill(t('দেওয়া হয়ে গেছে', 'Given away'), bg: Colors.black54, fg: Colors.white),
                ),
            ]),
            const SizedBox(height: 10),
            Wrap(spacing: 6, runSpacing: 6, children: [
              Pill(lang == Lang.bn ? cat.bn : cat.en),
              Pill(conditionText(t, post.condition)),
              if (post.eduLevel != null) Pill(lang == Lang.bn ? post.eduLevel!.bn : post.eduLevel!.en),
              if (post.urgency != null && !offer)
                Pill(urgencyText(t, post.urgency!), bg: Brand.amberSoft, fg: Brand.amber),
              if (post.delivery.contains(Delivery.courier))
                Pill(t('কুরিয়ার সম্ভব', 'Courier OK'), icon: Icons.local_shipping_outlined),
              if (post.requests > 0) Pill('${t.n(post.requests)} ${t('জন চেয়েছেন', 'requested')}'),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: FilledButton(
                  onPressed: given || post.mine ? null : () => showRequestSheet(context, ref, post),
                  child: Text(offer ? t('আমার চাই', 'I want this') : t('আমার কাছে আছে', 'I have this')),
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                tooltip: saved ? t('সেভ বাতিল', 'Unsave') : t('সেভ', 'Save'),
                onPressed: () => ref.read(savedProvider.notifier).toggle(post.id),
                icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border, color: saved ? cs.primary : null),
              ),
              IconButton(
                tooltip: t('শেয়ার', 'Share'),
                onPressed: () => sharePost(post),
                icon: const Icon(Icons.share_outlined),
              ),
              PopupMenuButton<String>(
                tooltip: t('আরও', 'More'),
                onSelected: (v) {
                  if (v == 'report') showReportSheet(context, ref, post);
                },
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'report', child: Text(t('রিপোর্ট করুন', 'Report'))),
                ],
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}
