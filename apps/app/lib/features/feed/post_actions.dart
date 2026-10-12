import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/i18n.dart';
import '../../core/prefs.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';

/// "I want this" (offer) or "I have this" (need): a short message and how to hand over.
Future<void> showRequestSheet(BuildContext context, WidgetRef ref, Post post) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _RequestSheet(post: post),
  );
}

class _RequestSheet extends ConsumerStatefulWidget {
  const _RequestSheet({required this.post});
  final Post post;
  @override
  ConsumerState<_RequestSheet> createState() => _RequestSheetState();
}

class _RequestSheetState extends ConsumerState<_RequestSheet> {
  final _msg = TextEditingController();
  late Delivery _via = widget.post.delivery.first;
  bool _busy = false;

  @override
  void dispose() {
    _msg.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final t = Tx(ref.read(langProvider));
    setState(() => _busy = true);
    try {
      await ref.read(dataSourceProvider).requestItem(
            widget.post.id,
            message: _msg.text.trim(),
            via: _via,
          );
      ref.invalidate(postProvider(widget.post.id));
      ref.invalidate(feedProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      toast(context, t('রিকোয়েস্ট পাঠানো হয়েছে', 'Request sent'));
    } catch (_) {
      if (!mounted) return;
      setState(() => _busy = false);
      toast(context, t('পাঠানো যায়নি, আবার চেষ্টা করুন', "Couldn't send, try again"));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final offer = widget.post.kind == PostKind.offer;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
          Text(offer ? t('এটা আমার চাই', 'I want this') : t('এটা আমার কাছে আছে', 'I have this'),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(widget.post.title),
          const SizedBox(height: 16),
          TextField(
            controller: _msg,
            maxLines: 3,
            maxLength: 300,
            decoration: InputDecoration(
              labelText: t('একটি ছোট বার্তা', 'A short message'),
              hintText: offer
                  ? t('কেন দরকার, কবে নিতে পারবেন…', 'Why you need it, when you can collect…')
                  : t('কী আছে, কেমন অবস্থায়…', 'What you have and its condition…'),
            ),
          ),
          if (widget.post.delivery.length > 1) ...[
            const SizedBox(height: 8),
            Text(t('কীভাবে নেবেন?', 'How to hand over?'),
                style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            SegmentedButton<Delivery>(
              segments: [
                ButtonSegment(value: Delivery.pickup, label: Text(t('নিজে দেখা করে', 'In person')), icon: const Icon(Icons.handshake_outlined)),
                ButtonSegment(value: Delivery.courier, label: Text(t('কুরিয়ার', 'Courier')), icon: const Icon(Icons.local_shipping_outlined)),
              ],
              selected: {_via},
              onSelectionChanged: (s) => setState(() => _via = s.first),
            ),
            if (_via == Delivery.courier)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  t('কুরিয়ার চার্জ গ্রহীতা ডেলিভারির সময় দেবেন।', 'The receiver pays the courier fee on delivery.'),
                  style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
              ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _send,
            child: _busy
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(t('পাঠান', 'Send')),
          ),
        ]),
      ),
    );
  }
}

Future<void> showReportSheet(BuildContext context, WidgetRef ref, Post post) async {
  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (_) => _ReportSheet(post: post),
  );
}

class _ReportSheet extends ConsumerWidget {
  const _ReportSheet({required this.post});
  final Post post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final reasons = {
      'spam': t('স্প্যাম', 'Spam'),
      'fraud': t('প্রতারণা', 'Fraud'),
      'fake_item': t('ভুয়া জিনিস', 'Fake item'),
      'inappropriate': t('অনুপযুক্ত কনটেন্ট', 'Inappropriate'),
      'sold': t('জিনিসটি আর নেই', 'No longer available'),
      'other': t('অন্য কারণ', 'Other'),
    };
    return SafeArea(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(t('রিপোর্ট করুন', 'Report this post'),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          ),
        ),
        for (final e in reasons.entries)
          ListTile(
            title: Text(e.value),
            onTap: () async {
              await ref.read(dataSourceProvider).reportPost(post.id, e.key, '');
              if (!context.mounted) return;
              Navigator.of(context).pop();
              toast(context, t('ধন্যবাদ — আমরা দেখব', "Thanks — we'll review it"));
            },
          ),
      ]),
    );
  }
}

void sharePost(Post post) {
  Share.share('${post.title} — ReuseDo\n${post.area}, ${post.district}');
}
