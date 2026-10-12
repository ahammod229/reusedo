import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/auth.dart';
import 'features/auth/auth_screens.dart';
import 'features/chat/messages_screen.dart';
import 'features/exchange/courier_screen.dart';
import 'features/exchange/exchanges_screen.dart';
import 'features/feed/feed_screen.dart';
import 'features/home/home_screen.dart';
import 'features/post/post_detail_screen.dart';
import 'features/post/quick_post_screen.dart';
import 'features/profile/lists_screens.dart';
import 'features/profile/profile_screen.dart';
import 'features/profile/settings_screen.dart';
import 'features/shell/app_shell.dart';

const _authPaths = {'/welcome', '/login', '/register'};

final routerProvider = Provider<GoRouter>((ref) {
  // Tells go_router to re-run `redirect` whenever the sign-in stage changes.
  final refresh = ValueNotifier<int>(0);
  ref.listen(authProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  String? redirect(BuildContext _, GoRouterState state) {
    final stage = ref.read(authProvider).stage;
    final path = state.matchedLocation;
    switch (stage) {
      case AuthStage.signedOut:
        return _authPaths.contains(path) ? null : '/welcome';
      case AuthStage.needsVerify:
        return path == '/verify' ? null : '/verify';
      case AuthStage.needsOnboarding:
        return path == '/onboarding' ? null : '/onboarding';
      case AuthStage.signedIn:
        if (_authPaths.contains(path) || path == '/verify' || path == '/onboarding' || path == '/') {
          return '/home';
        }
        return null;
    }
  }

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: refresh,
    redirect: redirect,
    routes: [
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/verify', builder: (_, _) => const VerifyScreen()),
      GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      GoRoute(path: '/post/new', builder: (_, s) => QuickPostScreen(startAsNeed: s.uri.queryParameters['kind'] == 'need')),
      ShellRoute(
        builder: (_, state, child) => AppShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
          GoRoute(path: '/feed', builder: (_, s) => FeedScreen(initialKind: s.uri.queryParameters['kind'])),
          GoRoute(path: '/post/:id', builder: (_, s) => PostDetailScreen(id: s.pathParameters['id']!)),
          GoRoute(path: '/messages', builder: (_, _) => const MessagesScreen()),
          GoRoute(path: '/messages/:id', builder: (_, s) => MessagesScreen(openId: s.pathParameters['id'])),
          GoRoute(path: '/exchanges', builder: (_, _) => const ExchangesScreen()),
          GoRoute(path: '/courier/:exchangeId', builder: (_, s) => CourierScreen(exchangeId: s.pathParameters['exchangeId']!)),
          GoRoute(path: '/notifications', builder: (_, _) => const NotificationsScreen()),
          GoRoute(path: '/saved', builder: (_, _) => const SavedScreen()),
          GoRoute(path: '/my-posts', builder: (_, _) => const MyPostsScreen()),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
          GoRoute(path: '/users/:username', builder: (_, s) => ProfileScreen(username: s.pathParameters['username'])),
          GoRoute(path: '/settings', builder: (_, _) => const SettingsScreen()),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('🔍', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 12),
          const Text('404', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          FilledButton(onPressed: () => context.go('/home'), child: const Text('Home')),
        ]),
      ),
    ),
  );
});
