import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/i18n.dart';
import '../core/widgets.dart';
import '../data/providers.dart';
import '../feed/post_card.dart';

/// A member's page: who they are, how much they've given, and their posts.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, required this.username});
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    final own = ref.watch(meProvider).value?.username == username;
    return Scaffold(
      appBar: AppBar(title: Text(own ? tr('আমার প্রোফাইল', 'My profile') : tr('প্রোফাইল', 'Profile'))),
      body: AsyncView(
        value: ref.watch(userProvider(username)),
        onRetry: () => ref.invalidate(userProvider(username)),
        data: (u) {
          final posts = ref.watch(userPostsProvider(username)).value ?? const [];
          Widget stat(String v, String l) => Expanded(
                child: Column(children: [
                  Text(v, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  Text(l, style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
                ]),
              );
          return ListView(children: [
            Container(
              color: scheme.surface,
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Initial(u.name, size: 72),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Flexible(
                          child: Text(u.name,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                        ),
                        if (u.verified) ...[
                          const SizedBox(width: 4),
                          Icon(Icons.verified_rounded, color: scheme.primary, size: 20),
                        ],
                      ]),
                      const SizedBox(height: 4),
                      Text('📍 ${u.area}, ${u.district}', style: TextStyle(color: scheme.onSurfaceVariant)),
                      Text('${tr('বিশ্বাসযোগ্যতা', 'Trust')} ${numOf(ref, u.trust)}/১০০',
                          style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w700)),
                    ]),
                  ),
                ]),
                if (u.bio.isNotEmpty) ...[const SizedBox(height: 12), Text(u.bio, style: const TextStyle(fontSize: 15))],
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Row(children: [
                  stat(numOf(ref, u.given), tr('দিয়েছেন', 'Given')),
                  stat(numOf(ref, u.received), tr('পেয়েছেন', 'Received')),
                  stat(numOf(ref, u.thanks), tr('ধন্যবাদ', 'Thank-yous')),
                ]),
                if (own) ...[
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => context.push('/my-posts'),
                    icon: const Icon(Icons.inventory_2_outlined),
                    label: Text(tr('আমার পোস্ট ম্যানেজ করুন', 'Manage my posts')),
                  ),
                ],
              ]),
            ),
            const SizedBox(height: 8),
            if (posts.isEmpty)
              EmptyNote(emoji: '📦', text: tr('এখনো কোনো পোস্ট নেই', 'No posts yet'))
            else
              for (final p in posts) ...[PostCard(post: p), const SizedBox(height: 8)],
          ]);
        },
      ),
    );
  }
}
