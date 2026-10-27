import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/i18n.dart';
import '../core/prefs.dart';
import '../core/widgets.dart';
import '../data/providers.dart';
import '../feed/post_card.dart';

class MyPostsScreen extends ConsumerWidget {
  const MyPostsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    return Scaffold(
      appBar: AppBar(title: Text(tr('আমার পোস্ট', 'My posts'))),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(myPostsProvider.future),
        child: AsyncView(
          value: ref.watch(myPostsProvider),
          onRetry: () => ref.invalidate(myPostsProvider),
          data: (posts) => posts.isEmpty
              ? ListView(children: [
                  EmptyNote(
                    emoji: '📦',
                    text: tr('এখনো কিছু পোস্ট করেননি', "You haven't posted anything yet"),
                    action: FilledButton(onPressed: () => context.push('/post/new'), child: Text(tr('পোস্ট করুন', 'Post'))),
                  ),
                ])
              : ListView.separated(
                  itemCount: posts.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => PostCard(post: posts[i]),
                ),
        ),
      ),
    );
  }
}

/// Bookmarks live on this device; each post is loaded fresh so given/removed ones show correctly.
class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final ids = ref.watch(savedProvider).toList();
    return Scaffold(
      appBar: AppBar(title: Text(tr('সেভ করা', 'Saved'))),
      body: ids.isEmpty
          ? EmptyNote(emoji: '🔖', text: tr('পোস্টের "সেভ" চাপলে এখানে থাকবে', 'Tap "Save" on a post to keep it here'))
          : ListView.separated(
              itemCount: ids.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, i) => ref.watch(postProvider(ids[i])).when(
                    data: (p) => PostCard(post: p),
                    loading: () => const SizedBox(height: 120, child: Center(child: CircularProgressIndicator())),
                    error: (_, _) => const SizedBox.shrink(),
                  ),
            ),
    );
  }
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('নোটিফিকেশন', 'Notifications')),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(actionsProvider).markAllRead();
              ref.invalidate(notificationsProvider);
            },
            child: Text(tr('সব পড়া হয়েছে', 'Mark all read')),
          ),
        ],
      ),
      body: AsyncView(
        value: ref.watch(notificationsProvider),
        onRetry: () => ref.invalidate(notificationsProvider),
        data: (list) => list.isEmpty
            ? EmptyNote(emoji: '🔔', text: tr('কোনো নোটিফিকেশন নেই', 'No notifications'))
            : ListView.separated(
                itemCount: list.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final n = list[i];
                  return Material(
                    color: n.unread ? scheme.primary.withValues(alpha: 0.06) : scheme.surface,
                    child: ListTile(
                      leading: Icon(Icons.notifications_rounded, color: n.unread ? scheme.primary : scheme.outline),
                      title: Text(n.text, style: TextStyle(fontWeight: n.unread ? FontWeight.w700 : null)),
                      subtitle: Text(relTime(ref, n.at)),
                      // Links point at web routes; the app has the same paths for posts and chats.
                      onTap: () {
                        final h = n.href;
                        if (h.startsWith('/post/') || h.startsWith('/messages') || h.startsWith('/users/')) {
                          context.push(h);
                        }
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}
