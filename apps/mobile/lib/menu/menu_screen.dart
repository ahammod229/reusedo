import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../auth/auth_service.dart';
import '../core/config.dart';
import '../core/i18n.dart';
import '../core/prefs.dart';
import '../core/widgets.dart';
import '../data/providers.dart';

/// Menu tab: profile, shortcuts, settings. Rarer screens (courier, exchanges, help) open the website.
class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final me = ref.watch(meProvider).value;
    final scheme = Theme.of(context).colorScheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    void web(String path) => launchUrl(Uri.parse('$webUrl$path'), mode: LaunchMode.inAppBrowserView);

    final tiles = [
      (Icons.inventory_2_outlined, tr('আমার পোস্ট', 'My posts'), Colors.green, () => context.push('/my-posts')),
      (Icons.bookmark_border_rounded, tr('সেভ করা', 'Saved'), Colors.pink, () => context.push('/saved')),
      (Icons.notifications_none_rounded, tr('নোটিফিকেশন', 'Notifications'), Colors.orange, () => context.push('/notifications')),
      (Icons.swap_horiz_rounded, tr('আদান-প্রদান', 'Exchanges'), Colors.blue, () => web('/exchanges')),
      (Icons.local_shipping_outlined, tr('কুরিয়ার', 'Courier'), Colors.teal, () => web('/courier')),
      (Icons.help_outline_rounded, tr('সাহায্য', 'Help'), Colors.purple, () => web('/help')),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(tr('মেনু', 'Menu'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (me != null)
          Card(
            elevation: 0,
            color: scheme.surface,
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              leading: Initial(me.name, size: 46, url: me.avatarUrl),
              title: Text(me.name, style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(tr('আপনার প্রোফাইল দেখুন', 'See your profile')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/users/${me.username}'),
            ),
          ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 2.1,
          children: [
            for (final (icon, label, color, onTap) in tiles)
              Material(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: onTap,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.13), borderRadius: BorderRadius.circular(10)),
                        child: Icon(icon, color: color, size: 22),
                      ),
                      Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
                    ]),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          color: scheme.surface,
          child: Column(children: [
            ListTile(
              leading: const Icon(Icons.language_rounded),
              title: Text(tr('ভাষা', 'Language')),
              trailing: Text(tr('বাংলা → English', 'English → বাংলা')),
              onTap: () => ref.read(langProvider.notifier).toggle(),
            ),
            ListTile(
              leading: Icon(dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
              title: Text(dark ? tr('লাইট মোড', 'Light mode') : tr('ডার্ক মোড', 'Dark mode')),
              onTap: () => ref.read(themeProvider.notifier).set(dark ? ThemeMode.light : ThemeMode.dark),
            ),
            ListTile(
              leading: Icon(Icons.logout_rounded, color: scheme.error),
              title: Text(tr('লগআউট', 'Log out'), style: TextStyle(color: scheme.error)),
              onTap: AuthService.signOut,
            ),
          ]),
        ),
        const SizedBox(height: 12),
        Wrap(alignment: WrapAlignment.center, children: [
          for (final (path, label) in [
            ('/about', tr('আমাদের কথা', 'About')),
            ('/terms', tr('শর্তাবলী', 'Terms')),
            ('/privacy', tr('প্রাইভেসি', 'Privacy')),
          ])
            TextButton(onPressed: () => web(path), child: Text(label, style: TextStyle(color: scheme.onSurfaceVariant))),
        ]),
      ]),
    );
  }
}
