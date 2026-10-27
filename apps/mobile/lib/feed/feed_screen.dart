import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/i18n.dart';
import '../core/prefs.dart';
import '../core/theme.dart';
import '../core/widgets.dart';
import '../data/models.dart';
import '../data/providers.dart';
import 'post_card.dart';

class FiltersNotifier extends Notifier<FeedFilters> {
  @override
  FeedFilters build() => const FeedFilters();
  void set(FeedFilters f) => state = f;
}

final feedFiltersProvider = NotifierProvider<FiltersNotifier, FeedFilters>(FiltersNotifier.new);

/// Home tab: composer, one row of filters, category chips, then posts edge to edge.
class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final filters = ref.watch(feedFiltersProvider);
    final feed = ref.watch(feedProvider(filters));
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(feedProvider(filters).future),
        child: CustomScrollView(slivers: [
          SliverAppBar(
            floating: true,
            snap: true,
            titleSpacing: 16,
            title: Row(children: [
              ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset('assets/icon.png', height: 30, width: 30)),
              const SizedBox(width: 8),
              Text('Reuse', style: TextStyle(color: scheme.onSurface, fontWeight: FontWeight.w800)),
              Text('Do', style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w800)),
            ]),
            actions: [
              _RoundIcon(icon: Icons.search_rounded, onTap: () => context.go('/search')),
              _RoundIcon(icon: Icons.notifications_none_rounded, onTap: () => context.push('/notifications')),
              const SizedBox(width: 8),
            ],
          ),
          const SliverToBoxAdapter(child: _Composer()),
          const SliverToBoxAdapter(child: SizedBox(height: 8)),
          SliverToBoxAdapter(child: _FilterBar(filters: filters)),
          const SliverToBoxAdapter(child: SizedBox(height: 8)),
          ...feed.when(
            data: (posts) => posts.isEmpty
                ? [
                    SliverToBoxAdapter(
                      child: EmptyNote(
                        emoji: '🔍',
                        text: tr('এই ফিল্টারে কিছু নেই', 'Nothing matches these filters'),
                        action: FilledButton(
                          onPressed: () => context.push('/post/new?kind=need'),
                          child: Text(tr('আমার দরকার — পোস্ট করি', 'Post what I need')),
                        ),
                      ),
                    )
                  ]
                : [
                    SliverList.separated(
                      itemCount: posts.length,
                      itemBuilder: (_, i) => PostCard(post: posts[i]),
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  ],
            loading: () => [
              const SliverFillRemaining(hasScrollBody: false, child: Center(child: CircularProgressIndicator())),
            ],
            error: (e, _) => [
              SliverToBoxAdapter(
                child: AsyncView(
                    value: AsyncValue<void>.error(e, StackTrace.empty),
                    data: (_) => const SizedBox(),
                    onRetry: () => ref.invalidate(feedProvider(filters))),
              ),
            ],
          ),
        ]),
      ),
    );
  }
}

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 6),
        child: IconButton.filledTonal(
          onPressed: onTap,
          icon: Icon(icon),
          style: IconButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.6)),
        ),
      );
}

/// "What would you like to give?" — one tap to start a post.
class _Composer extends ConsumerWidget {
  const _Composer();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final me = ref.watch(meProvider).value;
    final scheme = Theme.of(context).colorScheme;
    final divider = Divider(height: 1, color: scheme.outlineVariant.withValues(alpha: 0.5));
    return Material(
      color: scheme.surface,
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 8, 10),
          child: Row(children: [
            Initial(me?.name ?? '', url: me?.avatarUrl),
            const SizedBox(width: 10),
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(30),
                onTap: () => context.push('/post/new'),
                child: Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  alignment: Alignment.centerLeft,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: scheme.outlineVariant),
                  ),
                  child: Text(tr('আজ কী দিয়ে দিতে চান?', 'What would you like to give?'),
                      style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 15)),
                ),
              ),
            ),
            IconButton(
              onPressed: () => context.push('/post/new'),
              icon: const Icon(Icons.add_photo_alternate_outlined, color: Brand.green, size: 28),
            ),
          ]),
        ),
        divider,
        Row(children: [
          Expanded(
            child: TextButton.icon(
              onPressed: () => context.push('/post/new'),
              icon: const Icon(Icons.photo_camera_outlined, color: Brand.green),
              label: Text(tr('কিছু দিন', 'Give'), style: TextStyle(color: scheme.onSurfaceVariant)),
            ),
          ),
          SizedBox(height: 28, child: VerticalDivider(width: 1, color: scheme.outlineVariant)),
          Expanded(
            child: TextButton.icon(
              onPressed: () => context.push('/post/new?kind=need'),
              icon: const Icon(Icons.volunteer_activism_outlined, color: Brand.amber),
              label: Text(tr('কিছু চাই', 'Ask'), style: TextStyle(color: scheme.onSurfaceVariant)),
            ),
          ),
        ]),
      ]),
    );
  }
}

class _FilterBar extends ConsumerWidget {
  const _FilterBar({required this.filters});
  final FeedFilters filters;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final bn = ref.watch(langProvider) == 'bn';
    void set(FeedFilters f) => ref.read(feedFiltersProvider.notifier).set(f);
    final scopes = {
      'area': tr('আমার এলাকা', 'My area'),
      'district': tr('আমার জেলা', 'My district'),
      'country': tr('সারা দেশ', 'Nationwide'),
    };
    final kinds = {'all': tr('সব', 'All'), 'offer': tr('🎁 দিচ্ছেন', '🎁 Giving'), 'need': tr('🙏 চাইছেন', '🙏 Asking')};

    Widget row(List<Widget> children) => SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            for (final c in children) Padding(padding: const EdgeInsets.only(right: 8), child: c),
          ]),
        );

    return Material(
      color: Theme.of(context).colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(children: [
          row([
            for (final k in kinds.entries)
              Pill(
                label: k.value,
                selected: filters.kind == k.key,
                onTap: () => set(filters.copyWith(kind: k.key)),
              ),
            PopupMenuButton<String>(
              onSelected: (s) => set(filters.copyWith(scope: s)),
              itemBuilder: (_) => [for (final s in scopes.entries) PopupMenuItem(value: s.key, child: Text(s.value))],
              child: Pill(
                label: '${scopes[filters.scope]} ▾',
                selected: false,
                onTap: null,
                icon: const Icon(Icons.place_outlined, size: 17, color: Brand.green),
              ),
            ),
          ]),
          const SizedBox(height: 8),
          row([
            for (final c in [const Category('all', 'সব ক্যাটাগরি', 'All categories', '✨'), ...categories])
              Pill(
                label: '${c.emoji} ${bn ? c.bn : c.en}',
                selected: filters.category == c.id,
                onTap: () => set(filters.copyWith(category: c.id)),
              ),
          ]),
        ]),
      ),
    );
  }
}
