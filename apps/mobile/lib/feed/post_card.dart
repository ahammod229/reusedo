import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../core/config.dart';
import '../core/i18n.dart';
import '../core/prefs.dart';
import '../core/theme.dart';
import '../core/widgets.dart';
import '../data/models.dart';

/// A post in the feed: author row, text, full-width photo, then an equal-width action bar.
class PostCard extends ConsumerWidget {
  const PostCard({super.key, required this.post});
  final Post post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final bn = ref.watch(langProvider) == 'bn';
    final saved = ref.watch(savedProvider).contains(post.id);
    final scheme = Theme.of(context).colorScheme;
    final cat = categoryOf(post.category);
    final muted = TextStyle(color: scheme.onSurfaceVariant, fontSize: 12.5);
    final dist = post.distanceKm == null ? '' : ' · ${numOf(ref, post.distanceKm!.toStringAsFixed(1))} ${tr('কিমি', 'km')}';
    void open() => context.push('/post/${post.id}');

    return Material(
      color: scheme.surface,
      child: Opacity(
        opacity: post.status == 'given' ? 0.75 : 1,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 4, 8),
            child: Row(children: [
              GestureDetector(
                onTap: () => context.push('/users/${post.author.username}'),
                child: Initial(post.author.name),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Flexible(
                      child: Text(post.author.name,
                          overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    ),
                    if (post.author.verified) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.verified_rounded, size: 16, color: scheme.primary),
                    ],
                    const SizedBox(width: 6),
                    KindBadge(offer: post.isOffer),
                  ]),
                  const SizedBox(height: 2),
                  Text('${relTime(ref, post.createdAt)} · ${post.area}$dist',
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: muted),
                ]),
              ),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_horiz, color: scheme.onSurfaceVariant),
                onSelected: (v) {
                  if (v == 'open') open();
                  if (v == 'report') context.push('/post/${post.id}?report=1');
                },
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'open', child: Text(tr('বিস্তারিত দেখুন', 'View details'))),
                  if (!post.mine) PopupMenuItem(value: 'report', child: Text(tr('রিপোর্ট করুন', 'Report'))),
                ],
              ),
            ]),
          ),
          InkWell(
            onTap: open,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(post.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
                if (post.description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(post.description,
                      maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, height: 1.45)),
                ],
                if (post.urgency == 'urgent') ...[
                  const SizedBox(height: 8),
                  Text('⏰ ${tr('জরুরি', 'Urgent')}',
                      style: TextStyle(color: scheme.error, fontWeight: FontWeight.w700, fontSize: 12.5)),
                ],
              ]),
            ),
          ),
          GestureDetector(onTap: open, child: PostPhoto(post: post)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(children: [
              Expanded(child: Text('${cat.emoji} ${bn ? cat.bn : cat.en} · ${tr('বিনামূল্যে', 'Free')}', style: muted)),
              if (post.requests > 0)
                Text(
                    '${numOf(ref, post.requests)} ${post.isOffer ? tr('জন চেয়েছেন', 'requested') : tr('জন সাহায্য করতে চান', 'offered help')}',
                    style: muted),
            ]),
          ),
          const Divider(height: 1, indent: 16, endIndent: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            child: Row(children: [
              if (post.mine)
                _Action(icon: Icons.tune_rounded, label: tr('ম্যানেজ', 'Manage'), onTap: open)
              else if (post.open)
                _Action(
                  icon: post.isOffer ? Icons.card_giftcard_rounded : Icons.volunteer_activism_outlined,
                  label: post.isOffer ? tr('আমার চাই', 'I want this') : tr('আমার কাছে আছে', 'I have this'),
                  color: post.isOffer ? scheme.primary : Brand.amber,
                  flex: 14,
                  onTap: () => context.push('/post/${post.id}?request=1'),
                )
              else
                _Action(icon: Icons.visibility_outlined, label: tr('বিস্তারিত', 'Details'), onTap: open),
              _Action(
                icon: saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                label: saved ? tr('সেভ হয়েছে', 'Saved') : tr('সেভ', 'Save'),
                color: saved ? scheme.primary : null,
                onTap: () => ref.read(savedProvider.notifier).toggle(post.id),
              ),
              _Action(
                icon: Icons.share_outlined,
                label: tr('শেয়ার', 'Share'),
                onTap: () => sharePost(post),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, required this.onTap, this.color, this.flex = 10});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final int flex;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurfaceVariant;
    return Expanded(
      flex: flex,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: SizedBox(
          height: 42,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 19, color: c),
            const SizedBox(width: 6),
            Flexible(
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: c, fontWeight: FontWeight.w700, fontSize: 13.5)),
            ),
          ]),
        ),
      ),
    );
  }
}

class KindBadge extends ConsumerWidget {
  const KindBadge({super.key, required this.offer});
  final bool offer;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: offer ? Brand.offerSoft : Brand.needSoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(offer ? tr('আমার কাছে আছে', 'Giving') : tr('আমার দরকার', 'Needs'),
          style: TextStyle(
              fontSize: 10.5, fontWeight: FontWeight.w800, color: offer ? Brand.green : Brand.amber)),
    );
  }
}

/// First photo full width; a short emoji band when the post has none.
class PostPhoto extends StatelessWidget {
  const PostPhoto({super.key, required this.post, this.index = 0, this.tall = false});
  final Post post;
  final int index;
  final bool tall;

  @override
  Widget build(BuildContext context) {
    final cat = categoryOf(post.category);
    Widget band(double h) => Container(
          height: h,
          alignment: Alignment.center,
          color: post.isOffer ? Brand.offerSoft : Brand.needSoft,
          child: Text(cat.emoji, style: TextStyle(fontSize: h * 0.4)),
        );
    if (post.images.length <= index) return band(tall ? 220 : 110);
    return AspectRatio(
      aspectRatio: 4 / 3,
      child: CachedNetworkImage(
        imageUrl: post.images[index],
        fit: BoxFit.cover,
        placeholder: (_, _) => Container(color: Theme.of(context).colorScheme.surfaceContainerHighest),
        errorWidget: (_, _, _) => band(110),
      ),
    );
  }
}

/// The phone's own share sheet (WhatsApp, Messenger…) with a link to the post.
void sharePost(Post post) =>
    SharePlus.instance.share(ShareParams(text: '${post.title}\n$webUrl/post/${post.id}', subject: post.title));
