import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n.dart';
import '../core/widgets.dart';
import '../data/providers.dart';
import 'chats_screen.dart';

/// One conversation. Refreshes every few seconds while open.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _text = TextEditingController();
  Timer? _poll;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    ref.read(actionsProvider).markChatRead(widget.id).ignore();
    _poll = Timer.periodic(const Duration(seconds: 5), (_) => ref.invalidate(chatsProvider));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _text.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ref.read(actionsProvider).send(widget.id, text);
      _text.clear();
      ref.invalidate(chatsProvider);
    } catch (_) {
      if (mounted) context.toast(trOf(ref)('পাঠানো যায়নি', "Couldn't send"));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    final chats = ref.watch(chatsProvider);
    final chat = chats.value?.where((c) => c.id == widget.id).firstOrNull;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: chat == null
            ? null
            : Row(children: [
                Initial(chat.withName, size: 36),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(chat.withName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(chat.postTitle,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant, fontWeight: FontWeight.w400)),
                  ]),
                ),
              ]),
      ),
      body: Column(children: [
        Expanded(
          child: chat == null
              ? AsyncView(value: chats, data: (_) => const SizedBox())
              : ListView(
                  reverse: true,
                  padding: const EdgeInsets.all(12),
                  children: [
                    for (final m in chat.messages.reversed)
                      if (m.from == 'system')
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(messageText(m, tr),
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12.5, color: scheme.onSurfaceVariant)),
                        )
                      else
                        Align(
                          alignment: m.from == 'me' ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 3),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.75),
                            decoration: BoxDecoration(
                              color: m.from == 'me' ? scheme.primary : scheme.surface,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Text(m.text,
                                style: TextStyle(color: m.from == 'me' ? scheme.onPrimary : scheme.onSurface, fontSize: 15)),
                          ),
                        ),
                  ],
                ),
        ),
        SafeArea(
          top: false,
          child: Container(
            color: scheme.surface,
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _text,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(
                    hintText: tr('মেসেজ লিখুন…', 'Write a message…'),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  ),
                ),
              ),
              IconButton(onPressed: _send, icon: Icon(Icons.send_rounded, color: scheme.primary)),
            ]),
          ),
        ),
      ]),
    );
  }
}
