import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/i18n.dart';
import '../core/widgets.dart';
import '../data/providers.dart';
import '../feed/post_card.dart';

/// Search in plain words; the server's AI widens it to related terms.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _q = TextEditingController();
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    final suggestions = [
      tr('ক্লাস ৯ বই', 'Class 9 books'),
      tr('শীতের জামা', 'Winter clothes'),
      tr('পড়ার টেবিল', 'Study table'),
      tr('স্কুল ব্যাগ', 'School bag'),
    ];
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: TextField(
          controller: _q,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onSubmitted: (v) => setState(() => _query = v.trim()),
          decoration: InputDecoration(
            hintText: tr('কী খুঁজছেন? যেমন: শীতের জামা', 'What are you looking for?'),
            prefixIcon: const Icon(Icons.search_rounded),
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
            isDense: true,
          ),
        ),
      ),
      body: _query.isEmpty
          ? ListView(padding: const EdgeInsets.all(16), children: [
              Row(children: [
                Icon(Icons.auto_awesome, size: 18, color: scheme.primary),
                const SizedBox(width: 6),
                Text(tr('AI আপনার কথা বুঝে খুঁজে দেবে', 'AI understands what you mean'),
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final s in suggestions)
                  ActionChip(
                    label: Text(s),
                    onPressed: () => setState(() {
                      _q.text = s;
                      _query = s;
                    }),
                  ),
              ]),
            ])
          : _Results(query: _query),
    );
  }
}

class _Results extends ConsumerWidget {
  const _Results({required this.query});
  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    return AsyncView(
      value: ref.watch(searchProvider(query)),
      onRetry: () => ref.invalidate(searchProvider(query)),
      data: (r) => ListView(padding: const EdgeInsets.only(bottom: 24), children: [
        if (r.aiSummary != null)
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14)),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Icon(Icons.auto_awesome, size: 18, color: scheme.primary),
              const SizedBox(width: 8),
              Expanded(child: Text(r.aiSummary!)),
            ]),
          ),
        if (r.posts.isEmpty)
          EmptyNote(
            emoji: '🔍',
            text: tr('এখনো কেউ পোস্ট করেননি। আপনার দরকারটা পোস্ট করুন — কেউ হয়তো দিতে চাইবেন।',
                'Nobody has posted this yet. Post your need — someone may want to give.'),
            action: FilledButton(
              onPressed: () => context.push('/post/new?kind=need'),
              child: Text(tr('আমার দরকার — পোস্ট করি', 'Post what I need')),
            ),
          ),
        for (final p in r.posts) ...[PostCard(post: p), const SizedBox(height: 8)],
        if (r.posts.isEmpty && r.related.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Text(tr('কাছাকাছি জিনিস', 'Related posts'), style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          for (final p in r.related) ...[PostCard(post: p), const SizedBox(height: 8)],
        ],
      ]),
    );
  }
}
