import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';
import '../feed/post_card.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _icon(NotifKind k) => switch (k) {
        NotifKind.request => Icons.inbox_outlined,
        NotifKind.accepted => Icons.check_circle_outline,
        NotifKind.message => Icons.chat_bubble_outline,
        NotifKind.courier => Icons.local_shipping_outlined,
        NotifKind.match => Icons.search,
        NotifKind.review => Icons.star_outline,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final notes = ref.watch(notificationsProvider);
    final cs = Theme.of(context).colorScheme;

    Future<void> mark(String id) async {
      await ref.read(dataSourceProvider).markNotificationRead(id);
      ref.invalidate(notificationsProvider);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(t('নোটিফিকেশন', 'Notifications')),
        actions: [TextButton(onPressed: () => mark('all'), child: Text(t('সব পড়া হয়েছে', 'Mark all read')))],
      ),
      body: AsyncView<List<AppNotification>>(
        value: notes,
        onRetry: () => ref.invalidate(notificationsProvider),
        builder: (list) {
          if (list.isEmpty) return EmptyState(emoji: '🔔', title: t('কোনো নোটিফিকেশন নেই', 'No notifications'));
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final n = list[i];
              return Constrained(
                child: Card(
                  color: n.unread ? cs.primary.withValues(alpha: 0.07) : null,
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(backgroundColor: cs.primary.withValues(alpha: 0.12), child: Icon(_icon(n.kind), color: cs.primary)),
                    title: Text(n.text, style: TextStyle(fontWeight: n.unread ? FontWeight.w700 : FontWeight.w400)),
                    subtitle: Text(n.when),
                    trailing: n.unread ? Icon(Icons.circle, size: 10, color: cs.primary) : null,
                    onTap: () {
                      mark(n.id);
                      context.go(n.route);
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final ids = ref.watch(savedProvider);
    final all = ref.watch(feedProvider(const FeedFilters()));
    return Scaffold(
      appBar: AppBar(title: Text(t('সেভ করা', 'Saved'))),
      body: AsyncView<List<Post>>(
        value: all,
        onRetry: () => ref.invalidate(feedProvider(const FeedFilters())),
        builder: (posts) {
          final saved = posts.where((p) => ids.contains(p.id)).toList();
          if (saved.isEmpty) {
            return EmptyState(
              emoji: '🔖',
              title: t('এখনও কিছু সেভ করেননি', 'Nothing saved yet'),
              body: t('পোস্টের বুকমার্ক চিহ্নে চাপ দিন।', 'Tap the bookmark on any post.'),
              action: FilledButton(onPressed: () => context.go('/feed'), child: Text(t('ফিড দেখুন', 'Browse feed'))),
            );
          }
          return _PostList(posts: saved);
        },
      ),
    );
  }
}

class MyPostsScreen extends ConsumerWidget {
  const MyPostsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final all = ref.watch(feedProvider(const FeedFilters()));
    return Scaffold(
      appBar: AppBar(title: Text(t('আমার পোস্ট', 'My posts'))),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/post/new'),
        icon: const Icon(Icons.add),
        label: Text(t('নতুন পোস্ট', 'New post')),
      ),
      body: AsyncView<List<Post>>(
        value: all,
        onRetry: () => ref.invalidate(feedProvider(const FeedFilters())),
        builder: (posts) {
          final mine = posts.where((p) => p.mine || p.author.username == 'rakib').toList();
          if (mine.isEmpty) {
            return EmptyState(emoji: '📦', title: t('আপনি এখনও কোনো পোস্ট করেননি', "You haven't posted yet"));
          }
          return _PostList(posts: mine);
        },
      ),
    );
  }
}

class _PostList extends StatelessWidget {
  const _PostList({required this.posts});
  final List<Post> posts;

  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: posts.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (_, i) => Constrained(child: PostCard(post: posts[i])),
      );
}
