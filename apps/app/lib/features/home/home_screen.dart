import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';
import '../auth/auth.dart';
import '../feed/post_card.dart';
import '../map/donation_map.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _greeting(Tx t) {
    final h = DateTime.now().hour;
    if (h >= 5 && h < 12) return t('শুভ সকাল', 'Good morning');
    if (h >= 12 && h < 18) return t('শুভ অপরাহ্ন', 'Good afternoon');
    if (h >= 18 && h < 20) return t('শুভ সন্ধ্যা', 'Good evening');
    return t('শুভ রাত্রি', 'Good evening');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final auth = ref.watch(authProvider);
    final dash = ref.watch(dashboardProvider);
    final firstName = auth.name.split(' ').first;
    final width = MediaQuery.sizeOf(context).width;
    final twoCol = width >= 1000;

    return Scaffold(
      appBar: AppBar(
        title: const Text('ReuseDo'),
        actions: [
          IconButton(
            tooltip: t('নোটিফিকেশন', 'Notifications'),
            onPressed: () => context.go('/notifications'),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(donationMapProvider);
          await ref.read(dashboardProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            Constrained(
              maxWidth: twoCol ? 1100 : 720,
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _Hero(name: firstName, greeting: _greeting(t)),
                const SizedBox(height: 16),
                if (twoCol)
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Expanded(flex: 3, child: DonationMap()),
                    const SizedBox(width: 16),
                    Expanded(flex: 2, child: _Side(dash: dash)),
                  ])
                else ...[
                  const DonationMap(),
                  const SizedBox(height: 16),
                  _Side(dash: dash),
                ],
                const SizedBox(height: 16),
                AsyncView<Dashboard>(
                  value: dash,
                  onRetry: () => ref.invalidate(dashboardProvider),
                  builder: (d) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    if (d.needsNearby.isNotEmpty) ...[
                      SectionTitle(
                        t('কাছের কারও দরকার', 'Needed nearby'),
                        action: TextButton(
                          onPressed: () => context.go('/feed?kind=need'),
                          child: Text(t('সব দেখুন', 'See all')),
                        ),
                      ),
                      _PostGrid(posts: d.needsNearby, wide: twoCol),
                    ],
                    if (d.forYou.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      SectionTitle(
                        t('আপনার জন্য', 'For you'),
                        action: TextButton(
                          onPressed: () => context.go('/feed?kind=offer'),
                          child: Text(t('সব দেখুন', 'See all')),
                        ),
                      ),
                      _PostGrid(posts: d.forYou.take(4).toList(), wide: twoCol),
                    ],
                  ]),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _PostGrid extends StatelessWidget {
  const _PostGrid({required this.posts, required this.wide});
  final List<Post> posts;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    if (!wide) {
      return Column(children: [
        for (final p in posts) Padding(padding: const EdgeInsets.only(bottom: 12), child: PostCard(post: p)),
      ]);
    }
    // Two columns on desktop; cards keep their natural height.
    final left = <Widget>[];
    final right = <Widget>[];
    for (var i = 0; i < posts.length; i++) {
      (i.isEven ? left : right).add(Padding(padding: const EdgeInsets.only(bottom: 12), child: PostCard(post: posts[i])));
    }
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: Column(children: left)),
      const SizedBox(width: 12),
      Expanded(child: Column(children: right)),
    ]);
  }
}

class _Hero extends ConsumerWidget {
  const _Hero({required this.name, required this.greeting});
  final String name;
  final String greeting;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF1F7A4D), Color(0xFF0F5F66)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('$greeting${name.isEmpty ? '' : ', $name'} 👋',
            style: const TextStyle(color: Colors.white70, fontSize: 14)),
        const SizedBox(height: 6),
        Text(t('আজ কারও দিন একটু সহজ করবেন?', "Make someone's day easier today?"),
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, height: 1.25)),
        const SizedBox(height: 16),
        Wrap(spacing: 10, runSpacing: 10, children: [
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF1F7A4D)),
            onPressed: () => context.push('/post/new'),
            icon: const Icon(Icons.photo_camera_outlined),
            label: Text(t('কিছু দিন', 'Give something')),
          ),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white70),
            ),
            onPressed: () => context.push('/post/new?kind=need'),
            icon: const Icon(Icons.front_hand_outlined),
            label: Text(t('কিছু চান', 'Ask for something')),
          ),
        ]),
      ]),
    );
  }
}

/// What needs attention now, and recent thank-yous.
class _Side extends ConsumerWidget {
  const _Side({required this.dash});
  final AsyncValue<Dashboard> dash;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    return dash.maybeWhen(
      data: (d) {
        final todos = [
          (Icons.inbox_outlined, t('উত্তর দেওয়ার রিকোয়েস্ট', 'Requests to answer'), d.requestsToAnswer, '/exchanges'),
          (Icons.chat_bubble_outline, t('না-পড়া মেসেজ', 'Unread messages'), d.unreadMessages, '/messages'),
          (Icons.swap_horiz, t('চলমান আদান-প্রদান', 'Active exchanges'), d.activeExchanges, '/exchanges'),
        ];
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Column(children: [
                for (final e in todos)
                  ListTile(
                    leading: Icon(e.$1),
                    title: Text(e.$2),
                    trailing: e.$3 > 0
                        ? Badge(label: Text(t.n(e.$3)), backgroundColor: Theme.of(context).colorScheme.primary)
                        : Text(t('০', '0'), style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    onTap: () => context.go(e.$4),
                  ),
              ]),
            ),
          ),
          if (d.recentThanks.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('💌 ${t('সাম্প্রতিক ধন্যবাদ', 'Recent thank-yous')}',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 8),
                  for (final n in d.recentThanks)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('“${n.text}”', style: const TextStyle(height: 1.5)),
                        Text('— ${n.by} · ${n.item}',
                            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                      ]),
                    ),
                ]),
              ),
            ),
          ],
        ]);
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}
