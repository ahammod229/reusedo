import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api.dart';
import '../core/i18n.dart';
import '../core/prefs.dart';
import '../core/theme.dart';
import '../core/widgets.dart';
import '../data/models.dart';
import '../data/providers.dart';
import '../feed/post_card.dart';

class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({super.key, required this.id, this.openRequest = false, this.openReport = false});
  final String id;
  final bool openRequest, openReport;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  bool _opened = false;

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final value = ref.watch(postProvider(widget.id));
    // Arriving from the feed's "I want this" or "Report": open that sheet once the post is here.
    final post = value.value;
    if (post != null && !_opened && (widget.openRequest || widget.openReport)) {
      _opened = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        widget.openReport ? _report(post) : (post.open && !post.mine ? _request(post) : null);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('পোস্ট', 'Post')),
        actions: [
          if (post != null) IconButton(onPressed: () => sharePost(post), icon: const Icon(Icons.share_outlined)),
          if (post != null && !post.mine)
            IconButton(onPressed: () => _report(post), icon: const Icon(Icons.outlined_flag_rounded)),
        ],
      ),
      body: AsyncView(
        value: value,
        onRetry: () => ref.invalidate(postProvider(widget.id)),
        data: (p) => _Body(post: p),
      ),
      bottomNavigationBar: post == null ? null : SafeArea(child: _BottomBar(post: post, onRequest: () => _request(post))),
    );
  }

  Future<void> _request(Post post) async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _RequestSheet(post: post),
    );
    if (sent == true) ref.invalidate(postProvider(post.id));
  }

  Future<void> _report(Post post) async {
    final tr = trOf(ref);
    final reasons = {
      'fraud': tr('প্রতারণা / টাকা চাইছে', 'Scam / asking for money'),
      'fake_item': tr('জিনিস ছবির সাথে মেলে না', "Item doesn't match"),
      'inappropriate': tr('অশালীন বা নিষিদ্ধ জিনিস', 'Inappropriate or banned'),
      'spam': tr('স্প্যাম / বারবার পোস্ট', 'Spam'),
      'sold': tr('বিক্রি করছে (বিনামূল্যে নয়)', 'Selling, not free'),
      'other': tr('অন্য কিছু', 'Something else'),
    };
    final reason = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(
        child: ListView(shrinkWrap: true, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(tr('কেন রিপোর্ট করছেন?', 'Why are you reporting this?'),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          ),
          for (final r in reasons.entries) ListTile(title: Text(r.value), onTap: () => Navigator.pop(context, r.key)),
        ]),
      ),
    );
    if (reason == null) return;
    try {
      await ref.read(actionsProvider).report(post.id, reason);
      if (mounted) {
        context.toast(tr('ধন্যবাদ — মডারেটর ২৪ ঘণ্টার মধ্যে দেখবেন।', 'Thanks — a moderator reviews it within 24 hours.'));
      }
    } on ApiError {
      if (mounted) context.toast(tr('পাঠানো যায়নি। আবার চেষ্টা করুন।', "Couldn't send. Try again."));
    }
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.post});
  final Post post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final bn = ref.watch(langProvider) == 'bn';
    final scheme = Theme.of(context).colorScheme;
    final cat = categoryOf(post.category);
    final conditions = {
      'new': tr('নতুনের মতো', 'Like new'),
      'good': tr('ভালো অবস্থায়', 'Good'),
      'used': tr('ব্যবহৃত', 'Used'),
    };
    return ListView(padding: EdgeInsets.zero, children: [
      if (post.images.length > 1)
        SizedBox(
          height: MediaQuery.sizeOf(context).width * 3 / 4,
          child: PageView(children: [for (var i = 0; i < post.images.length; i++) PostPhoto(post: post, index: i)]),
        )
      else
        PostPhoto(post: post, tall: true),
      Container(
        color: scheme.surface,
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Wrap(spacing: 6, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
            KindBadge(offer: post.isOffer),
            Text('${cat.emoji} ${bn ? cat.bn : cat.en}', style: TextStyle(color: scheme.onSurfaceVariant)),
            if (post.status == 'given') Text('🎉 ${tr('দেওয়া হয়ে গেছে', 'Given away')}'),
            if (post.status == 'reserved') Text(tr('রিজার্ভ করা', 'Reserved')),
          ]),
          const SizedBox(height: 10),
          Text(post.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text('📍 ${post.area}, ${post.district} · ${relTime(ref, post.createdAt)}',
              style: TextStyle(color: scheme.onSurfaceVariant)),
          if (post.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(post.description, style: const TextStyle(fontSize: 15.5, height: 1.5)),
          ],
          const SizedBox(height: 14),
          Wrap(spacing: 8, runSpacing: 8, children: [
            Chip(label: Text(conditions[post.condition] ?? post.condition)),
            for (final d in post.delivery)
              Chip(
                avatar: Icon(d == 'pickup' ? Icons.inventory_2_outlined : Icons.local_shipping_outlined, size: 18),
                label: Text(d == 'pickup' ? tr('নিজে নেওয়া', 'Pickup') : tr('কুরিয়ার', 'Courier')),
              ),
            if (post.requests > 0) Chip(label: Text('${numOf(ref, post.requests)} ${tr('রিকোয়েস্ট', 'requests')}')),
          ]),
        ]),
      ),
      const SizedBox(height: 8),
      Material(
        color: scheme.surface,
        child: ListTile(
          leading: Initial(post.author.name),
          title: Row(children: [
            Flexible(child: Text(post.author.name, style: const TextStyle(fontWeight: FontWeight.w700))),
            if (post.author.verified) ...[
              const SizedBox(width: 4),
              Icon(Icons.verified_rounded, size: 16, color: scheme.primary),
            ],
          ]),
          subtitle: Text(tr('প্রোফাইল দেখুন', 'View profile')),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/users/${post.author.username}'),
        ),
      ),
      Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Icon(Icons.shield_outlined, color: scheme.primary, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
                tr('নিরাপত্তা: পাবলিক জায়গায় দেখা করুন, কখনো টাকা পাঠাবেন না।',
                    'Stay safe: meet in public and never send money.'),
                style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13)),
          ),
        ]),
      ),
    ]);
  }
}

class _BottomBar extends ConsumerWidget {
  const _BottomBar({required this.post, required this.onRequest});
  final Post post;
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    Widget bar(Widget child) => Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          decoration: BoxDecoration(color: scheme.surface, border: Border(top: BorderSide(color: scheme.outlineVariant))),
          child: child,
        );

    if (post.mine) {
      Future<void> set(String status) async {
        try {
          await ref.read(actionsProvider).setStatus(post.id, status);
          ref.invalidate(postProvider(post.id));
          ref.invalidate(myPostsProvider);
          if (status == 'deleted' && context.mounted) context.pop();
        } on ApiError {
          if (context.mounted) context.toast(tr('হলো না। আবার চেষ্টা করুন।', "That didn't work. Try again."));
        }
      }

      return bar(Row(children: [
        Expanded(
          child: post.status == 'given'
              ? OutlinedButton(onPressed: () => set('available'), child: Text(tr('আবার চালু করুন', 'Put back')))
              : FilledButton(onPressed: () => set('given'), child: Text(tr('দেওয়া হয়ে গেছে', 'Mark as given'))),
        ),
        const SizedBox(width: 8),
        IconButton.outlined(
          onPressed: () async {
            final ok = await showDialog<bool>(
              context: context,
              builder: (c) => AlertDialog(
                title: Text(tr('পোস্ট মুছবেন?', 'Delete this post?')),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(c, false), child: Text(tr('না', 'No'))),
                  FilledButton(onPressed: () => Navigator.pop(c, true), child: Text(tr('মুছুন', 'Delete'))),
                ],
              ),
            );
            if (ok == true) set('deleted');
          },
          icon: const Icon(Icons.delete_outline),
        ),
      ]));
    }
    if (post.myRequest != null) {
      return bar(FilledButton.tonalIcon(
        onPressed: () => context.go('/messages'),
        icon: const Icon(Icons.chat_bubble_outline),
        label: Text(tr('রিকোয়েস্ট পাঠানো হয়েছে · চ্যাট খুলুন', 'Request sent · open chat')),
      ));
    }
    if (!post.open) return const SizedBox.shrink();
    return bar(FilledButton.icon(
      style: FilledButton.styleFrom(backgroundColor: post.isOffer ? scheme.primary : Brand.amber),
      onPressed: onRequest,
      icon: Icon(post.isOffer ? Icons.card_giftcard_rounded : Icons.volunteer_activism_outlined),
      label: Text(post.isOffer ? tr('আমার এটা দরকার', 'I want this') : tr('আমার কাছে আছে', 'I have this')),
    ));
  }
}

class _RequestSheet extends ConsumerStatefulWidget {
  const _RequestSheet({required this.post});
  final Post post;
  @override
  ConsumerState<_RequestSheet> createState() => _RequestSheetState();
}

class _RequestSheetState extends ConsumerState<_RequestSheet> {
  final _msg = TextEditingController();
  late String _via = widget.post.delivery.isNotEmpty ? widget.post.delivery.first : 'pickup';
  bool _busy = false;

  Future<void> _send() async {
    final tr = trOf(ref);
    setState(() => _busy = true);
    try {
      await ref.read(actionsProvider).request(widget.post.id, _msg.text.trim(), _via);
      if (!mounted) return;
      Navigator.pop(context, true);
      context.toast(tr('রিকোয়েস্ট পাঠানো হয়েছে! মেসেজে উত্তর পাবেন।', "Request sent! You'll get a reply in Messages."));
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      context.toast(e.code == 'email_not_verified'
          ? tr('আগে ইমেইল যাচাই করুন।', 'Verify your email first.')
          : tr('পাঠানো যায়নি। আবার চেষ্টা করুন।', "Couldn't send. Try again."));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final p = widget.post;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(p.isOffer ? tr('কেন দরকার, ছোট করে লিখুন', 'Say briefly why you need it') : tr('আপনার কাছে কী আছে?', 'What do you have?'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        TextField(
          controller: _msg,
          maxLines: 3,
          maxLength: 500,
          autofocus: true,
          decoration: InputDecoration(
              hintText: tr('যেমন: আমার ছোট বোনের ক্লাস ৮-এর জন্য দরকার', "e.g. It's for my sister's class 8")),
        ),
        if (p.delivery.length > 1) ...[
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'pickup', label: Text(tr('নিজে নেব', 'Pickup'))),
              ButtonSegment(value: 'courier', label: Text(tr('কুরিয়ার', 'Courier'))),
            ],
            selected: {_via},
            onSelectionChanged: (s) => setState(() => _via = s.first),
          ),
          const SizedBox(height: 12),
        ],
        FilledButton(onPressed: _busy ? null : _send, child: Text(tr('রিকোয়েস্ট পাঠান', 'Send request'))),
      ]),
    );
  }
}
