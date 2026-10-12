import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';
import '../auth/auth.dart';

/// "Me" when [username] is null, otherwise someone else's public profile.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, this.username});
  final String? username;

  static const _levels = [
    (0, '🌱', 'নতুন বন্ধু', 'New friend'),
    (1, '🤝', 'সহায়ক', 'Helper'),
    (5, '📚', 'বইবন্ধু', 'Book buddy'),
    (15, '🌟', 'কমিউনিটি হিরো', 'Community hero'),
    (40, '🏆', 'কিংবদন্তি', 'Legend'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final isMe = username == null;
    final auth = ref.watch(authProvider);
    // Sample: the signed-in demo account shows rakib's numbers until the API provides real ones.
    final profile = ref.watch(userProvider(username ?? 'rakib'));

    return Scaffold(
      appBar: AppBar(
        leading: isMe ? null : BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/feed')),
        automaticallyImplyLeading: false,
        title: Text(isMe ? t('প্রোফাইল', 'Profile') : t('ব্যবহারকারী', 'Member')),
        actions: [
          if (isMe)
            IconButton(
              tooltip: t('সেটিংস', 'Settings'),
              onPressed: () => context.go('/settings'),
              icon: const Icon(Icons.settings_outlined),
            ),
        ],
      ),
      body: AsyncView<UserProfile?>(
        value: profile,
        onRetry: () => ref.invalidate(userProvider(username ?? 'rakib')),
        builder: (p) {
          if (p == null) {
            return EmptyState(emoji: '🙈', title: t('ব্যবহারকারী পাওয়া যায়নি', 'Member not found'));
          }
          final cs = Theme.of(context).colorScheme;
          final name = isMe && auth.name.isNotEmpty ? auth.name : p.name;
          final given = p.stats.given;
          var lv = _levels.first;
          for (final l in _levels) {
            if (given >= l.$1) lv = l;
          }
          final next = _levels.where((l) => l.$1 > given).firstOrNull;
          final progress = next == null ? 1.0 : (given - lv.$1) / (next.$1 - lv.$1);

          return ListView(padding: const EdgeInsets.symmetric(vertical: 12), children: [
            Constrained(
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(children: [
                      CircleAvatar(
                        radius: 38,
                        backgroundColor: cs.primary.withValues(alpha: 0.15),
                        child: Text(name.characters.first, style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: cs.primary)),
                      ),
                      const SizedBox(height: 10),
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Flexible(child: Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800))),
                        if (p.verified) ...[const SizedBox(width: 6), Icon(Icons.verified, color: cs.primary)],
                      ]),
                      const SizedBox(height: 4),
                      Text(
                        isMe && auth.district.isNotEmpty ? auth.district : '${p.area}, ${p.district}',
                        style: TextStyle(color: cs.onSurfaceVariant),
                      ),
                      if (p.bio.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(p.bio, textAlign: TextAlign.center, style: const TextStyle(height: 1.5)),
                      ],
                      const SizedBox(height: 12),
                      Wrap(alignment: WrapAlignment.center, spacing: 6, runSpacing: 6, children: [
                        for (final b in p.badges) Pill('✓ $b', bg: Brand.greenSoft, fg: Brand.green),
                      ]),
                    ]),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(lv.$2, style: const TextStyle(fontSize: 28)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(t(lv.$3, lv.$4), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                            Text(
                              next == null
                                  ? t('সর্বোচ্চ স্তরে আছেন', 'Top level reached')
                                  : '${t('আর', 'Give')} ${t.n(next.$1 - given)}${t('টি দিলেই', ' more to reach')} ${t(next.$3, next.$4)}',
                              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                            ),
                          ]),
                        ),
                      ]),
                      const SizedBox(height: 12),
                      ClipRRect(borderRadius: BorderRadius.circular(99), child: LinearProgressIndicator(value: progress, minHeight: 8)),
                      const SizedBox(height: 16),
                      Row(children: [
                        _Stat('🎁', t.n(p.stats.given), t('দিয়েছেন', 'Given')),
                        _Stat('🙏', t.n(p.stats.received), t('পেয়েছেন', 'Received')),
                        _Stat('💌', t.n(p.stats.thanksReceived), t('ধন্যবাদ', 'Thank-yous')),
                        _Stat('🌿', '≈${t.n(p.stats.kgSaved.round())}', t('কেজি', 'kg saved')),
                      ]),
                      const SizedBox(height: 6),
                      Text(t('কেজির হিসাব আনুমানিক — জিনিসের ধরন দেখে।', 'The kg figure is an estimate by item type.'),
                          style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                    ]),
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(height: 12),
                  Card(
                    child: Column(children: [
                      ListTile(leading: const Icon(Icons.inventory_2_outlined), title: Text(t('আমার পোস্ট', 'My posts')), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/my-posts')),
                      const Divider(height: 1),
                      ListTile(leading: const Icon(Icons.bookmark_border), title: Text(t('সেভ করা', 'Saved')), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/saved')),
                      const Divider(height: 1),
                      ListTile(leading: const Icon(Icons.swap_horiz), title: Text(t('আদান-প্রদান', 'Exchanges')), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/exchanges')),
                      const Divider(height: 1),
                      ListTile(leading: const Icon(Icons.notifications_outlined), title: Text(t('নোটিফিকেশন', 'Notifications')), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/notifications')),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.ios_share),
                        title: Text(t('বন্ধুদের আমন্ত্রণ জানান', 'Invite friends')),
                        onTap: () => Share.share(t('আমি ReuseDo-তে ব্যবহৃত জিনিস বিনামূল্যে দিচ্ছি ও নিচ্ছি। আপনিও যোগ দিন!', 'I give and get used things for free on ReuseDo. Join me!')),
                      ),
                    ]),
                  ),
                ],
              ]),
            ),
          ]);
        },
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.emoji, this.value, this.label);
  final String emoji;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(children: [
          Text(emoji, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]),
      );
}
