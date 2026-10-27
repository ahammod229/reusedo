import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/login_screen.dart';
import '../auth/onboarding_screen.dart';
import '../auth/verify_screen.dart';
import '../chat/chat_screen.dart';
import '../chat/chats_screen.dart';
import '../core/i18n.dart';
import '../data/providers.dart';
import '../feed/feed_screen.dart';
import '../menu/menu_screen.dart';
import '../post/new_post_screen.dart';
import '../post/post_detail_screen.dart';
import '../profile/lists_screens.dart';
import '../profile/profile_screen.dart';
import '../search/search_screen.dart';

const _gates = ['/splash', '/login', '/verify', '/onboarding'];

/// Sends people to the right step: sign in → verify email → set area → app.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref.listen(authUserProvider, (_, _) => refresh.value++);
  ref.listen(meProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/feed',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authUserProvider);
      final me = ref.read(meProvider);
      final here = state.matchedLocation;
      String? go(String to) => here == to ? null : to;

      if (auth.isLoading) return go('/splash');
      final user = auth.value;
      if (user == null) return go('/login');
      if (!user.emailVerified) return go('/verify');
      if (me.isLoading || me.hasError) return go('/splash');
      if (me.value != null && !me.value!.onboarded) return go('/onboarding');
      return _gates.contains(here) ? '/feed' : null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/verify', builder: (_, _) => const VerifyScreen()),
      GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/feed', builder: (_, _) => const FeedScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/search', builder: (_, _) => const SearchScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/messages', builder: (_, _) => const ChatsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/menu', builder: (_, _) => const MenuScreen())]),
        ],
      ),
      GoRoute(
        path: '/post/new',
        builder: (_, s) => NewPostScreen(kind: s.uri.queryParameters['kind'] == 'need' ? 'need' : 'offer'),
      ),
      GoRoute(
        path: '/post/:id',
        builder: (_, s) => PostDetailScreen(
          id: s.pathParameters['id']!,
          openRequest: s.uri.queryParameters['request'] == '1',
          openReport: s.uri.queryParameters['report'] == '1',
        ),
      ),
      GoRoute(path: '/messages/:id', builder: (_, s) => ChatScreen(id: s.pathParameters['id']!)),
      GoRoute(path: '/users/:username', builder: (_, s) => ProfileScreen(username: s.pathParameters['username']!)),
      GoRoute(path: '/my-posts', builder: (_, _) => const MyPostsScreen()),
      GoRoute(path: '/saved', builder: (_, _) => const SavedScreen()),
      GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),
    ],
  );
});

/// Logo while signing in; a retry button if the profile couldn't load.
class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final failed = ref.watch(meProvider).hasError;
    return Scaffold(
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ClipRRect(borderRadius: BorderRadius.circular(24), child: Image.asset('assets/icon.png', width: 88, height: 88)),
          const SizedBox(height: 24),
          if (failed) ...[
            Text(tr('সার্ভারে পৌঁছানো যাচ্ছে না', "Can't reach the server")),
            const SizedBox(height: 12),
            FilledButton(onPressed: () => ref.invalidate(meProvider), child: Text(tr('আবার চেষ্টা', 'Retry'))),
          ] else
            const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 3)),
        ]),
      ),
    );
  }
}

/// Bottom tabs: Home, Search, Post (opens the composer), Messages, Menu.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final unread = ref.watch(chatsProvider).value?.fold<int>(0, (n, c) => n + c.unread) ?? 0;
    // Tab 2 is the Post button, so shell branches after it are shifted by one.
    final selected = shell.currentIndex >= 2 ? shell.currentIndex + 1 : shell.currentIndex;
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected,
        onDestinationSelected: (i) {
          if (i == 2) {
            context.push('/post/new');
            return;
          }
          final branch = i > 2 ? i - 1 : i;
          shell.goBranch(branch, initialLocation: branch == shell.currentIndex);
        },
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home_rounded), label: tr('হোম', 'Home')),
          NavigationDestination(icon: const Icon(Icons.search_rounded), label: tr('খুঁজুন', 'Search')),
          NavigationDestination(
            icon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.add_rounded, color: Theme.of(context).colorScheme.onPrimary),
            ),
            label: tr('পোস্ট', 'Post'),
          ),
          NavigationDestination(
            icon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: const Icon(Icons.chat_bubble_outline_rounded)),
            selectedIcon: const Icon(Icons.chat_bubble_rounded),
            label: tr('মেসেজ', 'Messages'),
          ),
          NavigationDestination(icon: const Icon(Icons.menu_rounded), label: tr('মেনু', 'Menu')),
        ],
      ),
    );
  }
}
