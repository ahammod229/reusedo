import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/i18n.dart';
import '../core/widgets.dart';
import '../data/models.dart';
import '../data/providers.dart';

/// Text of a chat line; system lines come as codes.
String messageText(ChatMessage m, Tr tr) => m.type == 'system' && m.text == 'request_sent'
    ? tr('এই পোস্টে রিকোয়েস্ট পাঠানো হয়েছে।', 'A request was sent on this post.')
    : m.text;

class ChatsScreen extends ConsumerWidget {
  const ChatsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(tr('মেসেজ', 'Messages'))),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(chatsProvider.future),
        child: AsyncView(
          value: ref.watch(chatsProvider),
          onRetry: () => ref.invalidate(chatsProvider),
          data: (chats) => chats.isEmpty
              ? ListView(children: [
                  EmptyNote(
                      emoji: '💬',
                      text: tr('এখনো কোনো মেসেজ নেই। কোনো পোস্টে রিকোয়েস্ট পাঠালে এখানে কথা হবে।',
                          'No messages yet. Requesting a post starts a chat here.')),
                ])
              : ListView.separated(
                  itemCount: chats.length,
                  separatorBuilder: (_, _) => const Divider(height: 1, indent: 76),
                  itemBuilder: (_, i) {
                    final c = chats[i];
                    return Material(
                      color: scheme.surface,
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        leading: Initial(c.withName, size: 48),
                        title: Row(children: [
                          Expanded(
                            child: Text(c.withName,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontWeight: c.unread > 0 ? FontWeight.w800 : FontWeight.w600)),
                          ),
                          Text(relTime(ref, c.lastAt), style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
                        ]),
                        subtitle: Text(
                          c.last == null ? c.postTitle : messageText(c.last!, tr),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontWeight: c.unread > 0 ? FontWeight.w700 : null),
                        ),
                        trailing: c.unread > 0
                            ? CircleAvatar(
                                radius: 11,
                                backgroundColor: scheme.primary,
                                child: Text(numOf(ref, c.unread),
                                    style: TextStyle(fontSize: 11, color: scheme.onPrimary, fontWeight: FontWeight.w800)),
                              )
                            : null,
                        onTap: () => context.push('/messages/${c.id}'),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
