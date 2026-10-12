import 'data_source.dart';
import 'mock_data.dart';
import 'models.dart';

/// In-memory backend for development and demos. State lives for the app session.
class MockSource implements DataSource {
  MockSource({this.myDistrict = 'ঢাকা'});

  final String myDistrict;
  // The seeds are const lists, so copy them before mutating.
  final List<Post> _posts = [...seedPosts()];
  final List<Chat> _chats = [...seedChats()];
  final List<Exchange> _exchanges = [...seedExchanges()];
  final List<AppNotification> _notes = [...seedNotifications()];
  final List<CourierRequest> _courier = [];

  Future<T> _wait<T>(T v, [int ms = 220]) =>
      Future.delayed(Duration(milliseconds: ms), () => v);

  @override
  Future<List<Post>> listFeed(FeedFilters f) {
    var list = _posts.where((p) {
      if (f.kind != null && p.kind != f.kind) return false;
      if (f.category != null && p.category != f.category) return false;
      if (f.level != null && p.eduLevel != f.level) return false;
      switch (f.scope) {
        case Scope.area:
          if (p.distanceKm > 5) return false;
        case Scope.district:
          if (p.district != myDistrict) return false;
        case Scope.country:
          break;
      }
      final q = f.query.trim();
      if (q.isNotEmpty && !('${p.title} ${p.description} ${p.area}'.contains(q))) return false;
      return true;
    }).toList();

    int urgencyRank(Post p) => switch (p.urgency) {
          Urgency.urgent => 0,
          Urgency.soon => 1,
          Urgency.anytime => 2,
          null => 3,
        };
    switch (f.sort) {
      case SortBy.near:
        list.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
      case SortBy.newest:
        list.sort((a, b) => a.hoursAgo.compareTo(b.hoursAgo));
      case SortBy.urgent:
        list.sort((a, b) => urgencyRank(a).compareTo(urgencyRank(b)));
      case SortBy.popular:
        list.sort((a, b) => b.requests.compareTo(a.requests));
    }
    return _wait(list);
  }

  @override
  Future<Post?> getPost(String id) {
    for (final p in _posts) {
      if (p.id == id) return _wait<Post?>(p, 120);
    }
    return _wait<Post?>(null, 120);
  }

  @override
  Future<Post> publishPost(NewPost i) {
    final post = Post(
      id: 'p${_posts.length + 1}',
      kind: i.kind,
      title: i.title,
      description: i.description,
      category: i.category,
      condition: i.condition,
      area: 'আপনার এলাকা',
      district: myDistrict,
      distanceKm: 0,
      author: const Author(name: 'আপনি', username: 'me', verified: true, trust: 60),
      images: i.images,
      postedAt: 'এখনই',
      hoursAgo: 0,
      delivery: i.delivery,
      eduLevel: i.eduLevel,
      urgency: i.urgency,
      qty: i.qty,
      mine: true,
    );
    _posts.insert(0, post);
    return _wait(post, 500);
  }

  @override
  Future<AiDraft> aiDraft(int photoCount) => _wait(
        const AiDraft(
          title: 'ব্যবহৃত স্কুলের বইয়ের সেট',
          description: 'ভালো অবস্থায় আছে, কয়েকটি পাতায় সামান্য দাগ। বিনামূল্যে দিয়ে দিতে চাই।',
          category: CategoryId.books,
          condition: Condition.good,
        ),
        1400,
      );

  @override
  Future<List<Chat>> listChats() => _wait(List.of(_chats), 150);

  @override
  Future<Chat?> getChat(String id) {
    final i = _chats.indexWhere((c) => c.id == id);
    if (i < 0) return _wait<Chat?>(null, 100);
    // Opening a chat reads it.
    _chats[i] = _chats[i].copyWith(unread: 0);
    return _wait<Chat?>(_chats[i], 100);
  }

  @override
  Future<Chat> sendMessage(String chatId, String text) async {
    final i = _chats.indexWhere((c) => c.id == chatId);
    if (i < 0) throw StateError('chat_not_found');
    final c = _chats[i];
    _chats[i] = c.copyWith(
      last: text,
      when: 'এখনই',
      messages: [...c.messages, ChatMessage(from: 'me', text: text, time: 'এখনই')],
    );
    return _wait(_chats[i], 120);
  }

  @override
  Future<List<Exchange>> listExchanges() => _wait(List.of(_exchanges), 150);

  static const _steps = [
    ExchangeStatus.requested,
    ExchangeStatus.accepted,
    ExchangeStatus.scheduled,
    ExchangeStatus.completed,
  ];

  @override
  Future<Exchange> advanceExchange(String id) async {
    final i = _exchanges.indexWhere((e) => e.id == id);
    if (i < 0) throw StateError('exchange_not_found');
    final at = _steps.indexOf(_exchanges[i].status);
    if (at >= 0 && at < _steps.length - 1) {
      _exchanges[i] = _exchanges[i].copyWith(status: _steps[at + 1]);
    }
    return _wait(_exchanges[i], 120);
  }

  // Sample-only: the real code is random, stored hashed and never derivable from the id.
  String _code(String id) =>
      (id.codeUnits.fold<int>(7, (n, c) => (n * 31 + c) % 9000) + 1000).toString();

  @override
  Future<String> handoverCode(String exchangeId) => _wait(_code(exchangeId), 120);

  @override
  Future<Exchange> confirmHandover(String exchangeId, String code) async {
    final i = _exchanges.indexWhere((e) => e.id == exchangeId);
    if (i < 0) throw StateError('exchange_not_found');
    if (code != _code(exchangeId)) throw const WrongCode();
    _exchanges[i] = _exchanges[i].copyWith(status: ExchangeStatus.completed);
    return _wait(_exchanges[i], 120);
  }

  @override
  Future<List<AppNotification>> listNotifications() => _wait(List.of(_notes), 150);

  @override
  Future<void> markNotificationRead(String idOrAll) {
    for (var i = 0; i < _notes.length; i++) {
      if (idOrAll == 'all' || _notes[i].id == idOrAll) _notes[i] = _notes[i].read();
    }
    return _wait(null, 60);
  }

  @override
  Future<UserProfile?> getUser(String username) {
    final known = mockUsers[username];
    if (known != null) return _wait<UserProfile?>(known);
    final theirs = _posts.where((p) => p.author.username == username).toList();
    if (theirs.isEmpty) return _wait<UserProfile?>(null);
    final a = theirs.first.author;
    final given =
        theirs.where((p) => p.kind == PostKind.offer && p.status == PostStatus.given).length;
    return _wait<UserProfile?>(UserProfile(
      username: a.username,
      name: a.name,
      verified: a.verified,
      trust: a.trust,
      area: theirs.first.area,
      district: theirs.first.district,
      joined: '২০২৬',
      bio: '',
      badges: [if (a.verified) 'ইমেইল যাচাই'],
      stats: ImpactStats(given: given, received: 0, thanksReceived: 0, kgSaved: given * 1.5),
    ));
  }

  @override
  Future<Dashboard> getDashboard() {
    final live =
        _posts.where((p) => p.status == PostStatus.available && !p.mine).toList();
    final forYou = live.where((p) => p.kind == PostKind.offer).toList()
      ..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
    final needs = live.where((p) => p.kind == PostKind.need && p.distanceKm <= 10).toList()
      ..sort((a, b) => a.hoursAgo.compareTo(b.hoursAgo));
    return _wait(Dashboard(
      requestsToAnswer: _exchanges
          .where((e) => e.role == Role.giver && e.status == ExchangeStatus.requested)
          .length,
      unreadMessages: _chats.fold(0, (n, c) => n + c.unread),
      activeExchanges: _exchanges
          .where((e) =>
              e.status == ExchangeStatus.accepted || e.status == ExchangeStatus.scheduled)
          .length,
      forYou: forYou.take(6).toList(),
      needsNearby: needs.take(4).toList(),
      recentThanks: mockThanks,
      activeNearby: 18,
    ));
  }

  @override
  Future<DonationMapData> getDonationMap() {
    final hubs = [
      for (final s in donationSample)
        DonationHub(
          district: s.$1,
          donors: s.$2,
          items: s.$3,
          fresh: RegExp('আজ|ঘণ্টা').hasMatch(s.$6),
          recentName: s.$4,
          recentItem: s.$5,
          whenBn: s.$6,
          whenEn: s.$7,
        ),
    ];
    return _wait(DonationMapData(
      hubs: hubs,
      givenToday: 38,
      givenThisMonth: hubs.fold(0, (n, h) => n + h.items),
    ));
  }

  @override
  Future<void> requestItem(String postId, {required String message, required Delivery via}) {
    final i = _posts.indexWhere((p) => p.id == postId);
    if (i >= 0) _posts[i] = _posts[i].copyWith(requests: _posts[i].requests + 1);
    return _wait(null, 400);
  }

  @override
  Future<void> reportPost(String postId, String reason, String details) => _wait(null, 300);

  @override
  Future<void> sendThanks(String exchangeId, String text) => _wait(null, 300);

  @override
  Future<List<CourierRequest>> listCourierRequests() => _wait(List.of(_courier), 150);

  @override
  Future<CourierRequest> createCourierRequest(String exchangeId) async {
    final e = _exchanges.firstWhere((x) => x.id == exchangeId);
    final r = CourierRequest(
      id: 'cr${_courier.length + 1}',
      item: e.title,
      from: 'দাতার এলাকা',
      to: 'আপনার ঠিকানা',
      weightKg: 2,
      charge: 130,
      status: 'pending',
    );
    _courier.add(r);
    return _wait(r, 400);
  }
}
