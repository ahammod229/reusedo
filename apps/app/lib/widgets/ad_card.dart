import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n.dart';

/// Native in-feed ad slot (PRD §5). Until an AdMob unit id is configured this
/// shows a clearly labelled placeholder so the layout is final. Never place it
/// in chat, verification or hand-over screens.
class AdCard extends ConsumerWidget {
  const AdCard({super.key, required this.index});
  final int index;

  static const _ads = [
    ('স্থানীয় বইয়ের দোকান', 'Local bookshop', 'ব্যবহৃত বই কিনুন অর্ধেক দামে', 'Buy used books at half price'),
    ('শিক্ষা অ্যাপ', 'Learning app', 'ঘরে বসে পড়াশোনা — ৭ দিন ফ্রি', 'Study from home — 7 days free'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final cs = Theme.of(context).colorScheme;
    final ad = _ads[index % _ads.length];
    return Card(
      color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Semantics(
          label: t('স্পন্সরড', 'Sponsored'),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(6)),
                child: Text(t('স্পন্সরড', 'Sponsored'),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
              ),
              const Spacer(),
              Text(t(ad.$1, ad.$2), style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
            ]),
            const SizedBox(height: 8),
            Text(t(ad.$3, ad.$4), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ]),
        ),
      ),
    );
  }
}
