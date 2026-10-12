import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n.dart';
import '../../core/prefs.dart';
import '../../widgets/common.dart';
import '../auth/auth.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final lang = ref.watch(langProvider);
    final mode = ref.watch(themeProvider);
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t('সেটিংস', 'Settings'))),
      body: ListView(padding: const EdgeInsets.symmetric(vertical: 12), children: [
        Constrained(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const SectionTitle('👤'),
            Card(
              child: ListTile(
                title: Text(auth.name.isEmpty ? '—' : auth.name),
                subtitle: Text(auth.email),
              ),
            ),
            SectionTitle(t('ভাষা', 'Language')),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: SegmentedButton<Lang>(
                  segments: const [
                    ButtonSegment(value: Lang.bn, label: Text('বাংলা')),
                    ButtonSegment(value: Lang.en, label: Text('English')),
                  ],
                  selected: {lang},
                  onSelectionChanged: (s) => ref.read(langProvider.notifier).set(s.first),
                ),
              ),
            ),
            SectionTitle(t('থিম', 'Theme')),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: SegmentedButton<ThemeMode>(
                  segments: [
                    ButtonSegment(value: ThemeMode.system, label: Text(t('সিস্টেম', 'System')), icon: const Icon(Icons.brightness_auto)),
                    ButtonSegment(value: ThemeMode.light, label: Text(t('হালকা', 'Light')), icon: const Icon(Icons.light_mode_outlined)),
                    ButtonSegment(value: ThemeMode.dark, label: Text(t('গাঢ়', 'Dark')), icon: const Icon(Icons.dark_mode_outlined)),
                  ],
                  selected: {mode},
                  onSelectionChanged: (s) => ref.read(themeProvider.notifier).set(s.first),
                ),
              ),
            ),
            SectionTitle(t('নিরাপত্তা ও গোপনীয়তা', 'Safety & privacy')),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  t('পাবলিকে শুধু আপনার এলাকা দেখানো হয়। ফোন নম্বর ও ঠিকানা কেবল দুজন সম্মত হলে চ্যাটে শেয়ার হবে। মানচিত্রে শুধু জেলা দেখা যায়।',
                      'Only your area is shown publicly. Phone and address are shared in chat only after both agree. The map shows districts only.'),
                  style: const TextStyle(height: 1.6),
                ),
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: () => ref.read(authProvider.notifier).signOut(),
              icon: const Icon(Icons.logout),
              label: Text(t('লগআউট', 'Sign out')),
            ),
            const SizedBox(height: 12),
            Center(child: Text('ReuseDo 1.0.0', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant))),
          ]),
        ),
      ]),
    );
  }
}
