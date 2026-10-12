import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../data/providers.dart';

class _Dest {
  const _Dest(this.path, this.icon, this.selected, this.bn, this.en);
  final String path;
  final IconData icon;
  final IconData selected;
  final String bn;
  final String en;
}

const _all = [
  _Dest('/home', Icons.home_outlined, Icons.home, 'হোম', 'Home'),
  _Dest('/feed', Icons.dynamic_feed_outlined, Icons.dynamic_feed, 'ফিড', 'Feed'),
  _Dest('/exchanges', Icons.swap_horiz, Icons.swap_horiz, 'আদান-প্রদান', 'Exchanges'),
  _Dest('/messages', Icons.chat_bubble_outline, Icons.chat_bubble, 'মেসেজ', 'Messages'),
  _Dest('/saved', Icons.bookmark_border, Icons.bookmark, 'সেভ করা', 'Saved'),
  _Dest('/my-posts', Icons.inventory_2_outlined, Icons.inventory_2, 'আমার পোস্ট', 'My posts'),
  _Dest('/profile', Icons.person_outline, Icons.person, 'প্রোফাইল', 'Profile'),
  _Dest('/settings', Icons.settings_outlined, Icons.settings, 'সেটিংস', 'Settings'),
];

// The five tabs shown on a phone; the rest live under Profile.
const _phoneTabs = ['/home', '/feed', '/messages', '/profile'];

/// Phone: bottom bar + centre "post" button. Tablet: rail. Desktop: wide side menu.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.location, required this.child});
  final String location;
  final Widget child;

  int _indexIn(List<_Dest> list) {
    for (var i = 0; i < list.length; i++) {
      if (location == list[i].path || location.startsWith('${list[i].path}/')) return i;
    }
    return -1;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final width = MediaQuery.sizeOf(context).width;
    final unread = ref.watch(chatsProvider).maybeWhen(
          data: (c) => c.fold<int>(0, (n, x) => n + x.unread),
          orElse: () => 0,
        );
    final notes = ref.watch(notificationsProvider).maybeWhen(
          data: (n) => n.where((x) => x.unread).length,
          orElse: () => 0,
        );

    Widget badge(Widget icon, int n) =>
        n == 0 ? icon : Badge(label: Text(t.n(n)), child: icon);

    if (width < 700) {
      final tabs = [for (final p in _phoneTabs) _all.firstWhere((d) => d.path == p)];
      final idx = _indexIn(tabs);
      final inChat = RegExp(r'^/messages/.+').hasMatch(location);
      return Scaffold(
        body: SafeArea(bottom: false, child: child),
        floatingActionButton: inChat
            ? null
            : FloatingActionButton(
                tooltip: t('পোস্ট করুন', 'New post'),
                onPressed: () => context.push('/post/new'),
                child: const Icon(Icons.add),
              ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
        bottomNavigationBar: inChat
            ? null
            : NavigationBar(
                selectedIndex: idx < 0 ? 0 : idx,
                onDestinationSelected: (i) => context.go(tabs[i].path),
                destinations: [
                  for (final d in tabs)
                    NavigationDestination(
                      icon: d.path == '/messages' ? badge(Icon(d.icon), unread) : Icon(d.icon),
                      selectedIcon: Icon(d.selected),
                      label: t(d.bn, d.en),
                    ),
                ],
              ),
      );
    }

    final extended = width >= 1100;
    final idx = _indexIn(_all);
    return Scaffold(
      body: Row(children: [
        NavigationRail(
          extended: extended,
          minExtendedWidth: 220,
          selectedIndex: idx < 0 ? null : idx,
          onDestinationSelected: (i) => context.go(_all[i].path),
          labelType: extended ? NavigationRailLabelType.none : NavigationRailLabelType.all,
          leading: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(children: [
              if (extended)
                FloatingActionButton.extended(
                  onPressed: () => context.push('/post/new'),
                  icon: const Icon(Icons.add),
                  label: Text(t('পোস্ট করুন', 'New post')),
                )
              else
                FloatingActionButton(
                  tooltip: t('পোস্ট করুন', 'New post'),
                  onPressed: () => context.push('/post/new'),
                  child: const Icon(Icons.add),
                ),
            ]),
          ),
          trailing: Expanded(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: IconButton(
                  tooltip: t('নোটিফিকেশন', 'Notifications'),
                  onPressed: () => context.go('/notifications'),
                  icon: badge(const Icon(Icons.notifications_outlined), notes),
                ),
              ),
            ),
          ),
          destinations: [
            for (final d in _all)
              NavigationRailDestination(
                icon: d.path == '/messages' ? badge(Icon(d.icon), unread) : Icon(d.icon),
                selectedIcon: Icon(d.selected),
                label: Text(t(d.bn, d.en)),
              ),
          ],
        ),
        const VerticalDivider(width: 1),
        Expanded(child: child),
      ]),
    );
  }
}
