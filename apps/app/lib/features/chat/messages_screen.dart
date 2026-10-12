import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';

/// Phone: list, then a full-screen chat. Wide: both side by side.
class MessagesScreen extends ConsumerWidget {
  const MessagesScreen({super.key, this.openId});
  final String? openId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final width = MediaQuery.sizeOf(context).width;
    final wide = width >= 900;
    if (wide) {
      return Row(children: [
        SizedBox(width: 340, child: _ChatList(selected: openId)),
        const VerticalDivider(width: 1),
        Expanded(child: openId == null ? const _PickAChat() : ChatView(id: openId!, showBack: false)),
      ]);
    }
    return openId == null ? const _ChatList() : ChatView(id: openId!, showBack: true);
  }
}

class _PickAChat extends ConsumerWidget {
  const _PickAChat();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    return EmptyState(emoji: '💬', title: t('আপনার মেসেজ', 'Your messages'), body: t('বাঁ দিক থেকে একটি কথোপকথন বাছুন', 'Select a conversation on the left'));
  }
}

class _ChatList extends ConsumerWidget {
  const _ChatList({this.selected});
  final String? selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final chats = ref.watch(chatsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(t('মেসেজ', 'Messages'))),
      body: AsyncView<List<Chat>>(
        value: chats,
        onRetry: () => ref.invalidate(chatsProvider),
        builder: (list) {
          if (list.isEmpty) {
            return EmptyState(
              emoji: '💬',
              title: t('এখনও কোনো মেসেজ নেই', 'No messages yet'),
              body: t('কোনো পোস্টে রিকোয়েস্ট করলে এখানে চ্যাট শুরু হবে।', 'Request something and the chat starts here.'),
            );
          }
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final c = list[i];
              return ListTile(
                selected: c.id == selected,
                selectedTileColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
                leading: CircleAvatar(child: Text(c.withName.characters.first)),
                title: Row(children: [
                  Flexible(child: Text(c.withName, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
                  if (c.verified) ...[const SizedBox(width: 4), Icon(Icons.verified, size: 14, color: Theme.of(context).colorScheme.primary)],
                ]),
                subtitle: Text('${c.postTitle}\n${c.last}', maxLines: 2, overflow: TextOverflow.ellipsis),
                isThreeLine: true,
                trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(c.when, style: const TextStyle(fontSize: 12)),
                  if (c.unread > 0) ...[
                    const SizedBox(height: 4),
                    Badge(label: Text(t.n(c.unread))),
                  ],
                ]),
                onTap: () {
                  ref.invalidate(chatsProvider);
                  context.go('/messages/${c.id}');
                },
              );
            },
          );
        },
      ),
    );
  }
}

class ChatView extends ConsumerStatefulWidget {
  const ChatView({super.key, required this.id, required this.showBack});
  final String id;
  final bool showBack;
  @override
  ConsumerState<ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends ConsumerState<ChatView> {
  final _text = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;

  @override
  void dispose() {
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final s = _text.text.trim();
    if (s.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ref.read(dataSourceProvider).sendMessage(widget.id, s);
      _text.clear();
      ref.invalidate(chatProvider(widget.id));
      ref.invalidate(chatsProvider);
    } catch (_) {
      if (mounted) toast(context, ref.tx('পাঠানো যায়নি', "Couldn't send"));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final cs = Theme.of(context).colorScheme;
    final chat = ref.watch(chatProvider(widget.id));
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: widget.showBack
            ? BackButton(onPressed: () => context.go('/messages'))
            : null,
        title: chat.maybeWhen(
          data: (c) => c == null
              ? const SizedBox.shrink()
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(c.withName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  Text(c.postTitle, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant, fontWeight: FontWeight.w400)),
                ]),
          orElse: () => const SizedBox.shrink(),
        ),
      ),
      body: Column(children: [
        Expanded(
          child: AsyncView<Chat?>(
            value: chat,
            onRetry: () => ref.invalidate(chatProvider(widget.id)),
            builder: (c) {
              if (c == null) return EmptyState(emoji: '💬', title: t('কথোপকথন পাওয়া যায়নি', 'Conversation not found'));
              return ListView.builder(
                controller: _scroll,
                reverse: true,
                padding: const EdgeInsets.all(16),
                itemCount: c.messages.length + 1,
                itemBuilder: (_, i) {
                  if (i == 0) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        '🔒 ${t('ফোন নম্বর বা বাইরের লিংক শেয়ারে সতর্ক থাকুন।', 'Be careful sharing phone numbers or outside links.')}',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                      ),
                    );
                  }
                  final m = c.messages[c.messages.length - i];
                  return _Bubble(m: m);
                },
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _text,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(hintText: t('মেসেজ লিখুন…', 'Type a message…')),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                tooltip: t('পাঠান', 'Send'),
                onPressed: _sending ? null : _send,
                icon: const Icon(Icons.send),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.m});
  final ChatMessage m;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (m.from == 'system') {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(m.text, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
      );
    }
    final mine = m.from == 'me';
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 3),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.75 > 480 ? 480 : MediaQuery.sizeOf(context).width * 0.75),
        decoration: BoxDecoration(
          color: mine ? cs.primary : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(mine ? 18 : 4),
            bottomRight: Radius.circular(mine ? 4 : 18),
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(m.text, style: TextStyle(color: mine ? cs.onPrimary : cs.onSurface, height: 1.4)),
          const SizedBox(height: 2),
          Text(m.time, style: TextStyle(fontSize: 10, color: (mine ? cs.onPrimary : cs.onSurface).withValues(alpha: 0.7))),
        ]),
      ),
    );
  }
}
