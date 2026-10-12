import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/prefs.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/ad_card.dart';
import '../../widgets/common.dart';
import 'post_card.dart';

/// One ad after every N posts. Mirrors the web `ads_frequency` setting.
const adEvery = 6;

class FeedFiltersController extends Notifier<FeedFilters> {
  @override
  FeedFilters build() => const FeedFilters();
  void set(FeedFilters f) => state = f;
}

final feedFiltersProvider = NotifierProvider<FeedFiltersController, FeedFilters>(FeedFiltersController.new);

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key, this.initialKind});
  final String? initialKind;
  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    final kind = switch (widget.initialKind) {
      'need' => PostKind.need,
      'offer' => PostKind.offer,
      _ => null,
    };
    if (kind != null) {
      Future.microtask(() {
        final f = ref.read(feedFiltersProvider);
        ref.read(feedFiltersProvider.notifier).set(f.copyWith(kind: kind));
      });
    }
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _update(FeedFilters Function(FeedFilters) fn) =>
      ref.read(feedFiltersProvider.notifier).set(fn(ref.read(feedFiltersProvider)));

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final lang = ref.watch(langProvider);
    final f = ref.watch(feedFiltersProvider);
    final feed = ref.watch(feedProvider(f));

    Widget chip(String label, bool on, VoidCallback tap) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ChoiceChip(label: Text(label), selected: on, onSelected: (_) => tap(), showCheckmark: false),
        );

    return Scaffold(
      appBar: AppBar(
        title: Text(t('ফিড', 'Feed')),
        actions: [
          IconButton(
            tooltip: t('নোটিফিকেশন', 'Notifications'),
            onPressed: () => context.go('/notifications'),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(124),
          child: Constrained(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Column(children: [
              TextField(
                controller: _search,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: t('বই, টেবিল, কাপড় খুঁজুন…', 'Search books, tables, clothes…'),
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: f.query.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close),
                          tooltip: t('মুছুন', 'Clear'),
                          onPressed: () {
                            _search.clear();
                            _update((x) => x.copyWith(query: ''));
                          },
                        ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
                onSubmitted: (v) => _update((x) => x.copyWith(query: v)),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 38,
                child: ListView(scrollDirection: Axis.horizontal, children: [
                  chip(t('সব', 'All'), f.kind == null, () => _update((x) => x.copyWith(kind: null))),
                  chip('🎁 ${t('দিচ্ছি', 'Give')}', f.kind == PostKind.offer, () => _update((x) => x.copyWith(kind: PostKind.offer))),
                  chip('🙏 ${t('চাই', 'Need')}', f.kind == PostKind.need, () => _update((x) => x.copyWith(kind: PostKind.need))),
                  const SizedBox(width: 4),
                  chip(t('আমার এলাকা', 'My area'), f.scope == Scope.area, () => _update((x) => x.copyWith(scope: Scope.area))),
                  chip(t('আমার জেলা', 'My district'), f.scope == Scope.district, () => _update((x) => x.copyWith(scope: Scope.district))),
                  chip(t('সারা দেশ', 'Nationwide'), f.scope == Scope.country, () => _update((x) => x.copyWith(scope: Scope.country))),
                ]),
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 38,
                child: ListView(scrollDirection: Axis.horizontal, children: [
                  chip(t('সব ক্যাটাগরি', 'All categories'), f.category == null, () => _update((x) => x.copyWith(category: null))),
                  for (final c in categories)
                    chip('${c.emoji} ${lang == Lang.bn ? c.bn : c.en}', f.category == c.id, () => _update((x) => x.copyWith(category: c.id))),
                ]),
              ),
            ]),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(feedProvider(f).future),
        child: AsyncView<List<Post>>(
          value: feed,
          onRetry: () => ref.invalidate(feedProvider(f)),
          builder: (posts) {
            if (posts.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 60),
                EmptyState(
                  emoji: '🔍',
                  title: t('এই ফিল্টারে কিছু পাওয়া যায়নি', 'Nothing found for this filter'),
                  action: OutlinedButton(
                    onPressed: () {
                      _search.clear();
                      ref.read(feedFiltersProvider.notifier).set(const FeedFilters());
                    },
                    child: Text(t('ফিল্টার মুছুন', 'Clear filters')),
                  ),
                ),
              ]);
            }
            final count = posts.length + (posts.length - 1) ~/ adEvery;
            return ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 12),
              itemCount: count,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                // Every (adEvery+1)th slot is an ad, but never the very last item.
                final isAd = (i + 1) % (adEvery + 1) == 0;
                final postIndex = i - (i + 1) ~/ (adEvery + 1);
                return Constrained(
                  child: isAd ? AdCard(index: i ~/ (adEvery + 1)) : PostCard(post: posts[postIndex]),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
