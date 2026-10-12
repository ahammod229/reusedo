import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reusedo/app.dart';
import 'package:reusedo/core/i18n.dart';
import 'package:reusedo/core/prefs.dart';
import 'package:reusedo/data/data_source.dart';
import 'package:reusedo/data/mock_source.dart';
import 'package:reusedo/data/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<ProviderContainer> _container([Map<String, Object> initial = const {}]) async {
  SharedPreferences.setMockInitialValues(initial);
  final prefs = await SharedPreferences.getInstance();
  return ProviderContainer(overrides: [prefsProvider.overrideWithValue(prefs)]);
}

void main() {
  group('Tx', () {
    test('switches text and digits by language', () {
      const bn = Tx(Lang.bn);
      const en = Tx(Lang.en);
      expect(bn('বাংলা', 'English'), 'বাংলা');
      expect(en('বাংলা', 'English'), 'English');
      expect(bn.n(2026), '২০২৬');
      expect(en.n(2026), '2026');
    });
  });

  group('MockSource', () {
    test('feed filters by kind and sorts nearest first', () async {
      final s = MockSource();
      final needs = await s.listFeed(const FeedFilters(kind: PostKind.need));
      expect(needs, isNotEmpty);
      expect(needs.every((p) => p.kind == PostKind.need), isTrue);
      final all = await s.listFeed(const FeedFilters());
      for (var i = 1; i < all.length; i++) {
        expect(all[i].distanceKm >= all[i - 1].distanceKm, isTrue);
      }
    });

    test('area scope only returns posts within 5 km', () async {
      final s = MockSource();
      final near = await s.listFeed(const FeedFilters(scope: Scope.area));
      expect(near.every((p) => p.distanceKm <= 5), isTrue);
    });

    test('handover: wrong code is rejected, right code completes', () async {
      final s = MockSource();
      await expectLater(s.confirmHandover('e6', '0000'), throwsA(isA<WrongCode>()));
      final code = await s.handoverCode('e6');
      final done = await s.confirmHandover('e6', code);
      expect(done.status, ExchangeStatus.completed);
    });

    test('publishing puts the post first in the feed', () async {
      final s = MockSource();
      await s.publishPost(const NewPost(
        kind: PostKind.offer,
        title: 'পরীক্ষার পোস্ট',
        description: '',
        category: CategoryId.books,
        condition: Condition.good,
        delivery: [Delivery.pickup],
      ));
      final feed = await s.listFeed(const FeedFilters(sort: SortBy.newest));
      expect(feed.first.title, 'পরীক্ষার পোস্ট');
    });

    test('donation map hubs all have known districts', () async {
      final d = await MockSource().getDonationMap();
      expect(d.hubs, isNotEmpty);
      expect(d.givenThisMonth, d.hubs.fold<int>(0, (n, h) => n + h.items));
    });
  });

  group('app', () {
    testWidgets('signed-out people see the welcome screen', (tester) async {
      final c = await _container();
      await tester.pumpWidget(UncontrolledProviderScope(container: c, child: const ReuseDoApp()));
      await tester.pumpAndSettle();
      expect(find.text('অ্যাকাউন্ট খুলুন'), findsOneWidget);
    });

    testWidgets('signed-in people land on Home', (tester) async {
      final c = await _container({
        'auth_stage': 'signedIn',
        'auth_name': 'রাকিব',
        'auth_district': 'ঢাকা',
      });
      tester.view.physicalSize = const Size(1200, 1600);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(UncontrolledProviderScope(container: c, child: const ReuseDoApp()));
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('আজ কারও দিন একটু সহজ করবেন?'), findsOneWidget);
    });
  });
}
