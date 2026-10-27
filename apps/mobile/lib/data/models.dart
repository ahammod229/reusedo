// Shapes the API sends, mirrored from apps/web/src/features/data/apiSource.ts.

class Category {
  const Category(this.id, this.bn, this.en, this.emoji);
  final String id, bn, en, emoji;
}

const categories = [
  Category('books', 'বই', 'Books', '📚'),
  Category('stationery', 'খাতা-কলম', 'Stationery', '📓'),
  Category('furniture', 'আসবাব', 'Furniture', '🪑'),
  Category('clothes', 'কাপড়', 'Clothes', '👕'),
  Category('electronics', 'ইলেকট্রনিক্স', 'Electronics', '🔌'),
  Category('kids', 'শিশুদের', 'Kids', '🧸'),
  Category('other', 'অন্যান্য', 'Other', '🎁'),
];

Category categoryOf(String id) => categories.firstWhere((c) => c.id == id, orElse: () => categories.last);

class Author {
  Author.fromJson(Map<String, dynamic> j)
      : name = j['name'] as String? ?? '',
        username = j['username'] as String? ?? '',
        verified = j['verified'] == true;
  final String name, username;
  final bool verified;
}

class Post {
  Post.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        kind = j['kind'] as String,
        title = j['title'] as String? ?? '',
        description = j['description'] as String? ?? '',
        category = j['category'] as String? ?? 'other',
        condition = j['condition'] as String? ?? 'good',
        area = j['area'] as String? ?? '',
        district = j['district'] as String? ?? '',
        distanceKm = (j['distanceKm'] as num?)?.toDouble(),
        author = Author.fromJson(j['author'] as Map<String, dynamic>),
        images = (j['images'] as List? ?? const []).cast<String>(),
        createdAt = j['createdAt'] as String? ?? '',
        requests = (j['requests'] as num?)?.toInt() ?? 0,
        delivery = (j['delivery'] as List? ?? const []).cast<String>(),
        urgency = j['urgency'] as String?,
        qty = (j['qty'] as num?)?.toInt(),
        status = j['status'] as String? ?? 'available',
        mine = j['mine'] == true,
        myRequest = j['myRequest'] as Map<String, dynamic>?;

  final String id, kind, title, description, category, condition, area, district, createdAt, status;
  final double? distanceKm;
  final Author author;
  final List<String> images, delivery;
  final int requests;
  final String? urgency;
  final int? qty;
  final bool mine;
  final Map<String, dynamic>? myRequest;

  bool get isOffer => kind == 'offer';
  bool get open => status == 'available';
}

class Me {
  Me.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        username = j['username'] as String? ?? '',
        name = j['name'] as String? ?? '',
        email = j['email'] as String? ?? '',
        avatarUrl = j['avatarUrl'] as String?,
        district = j['district'] as String?,
        area = j['area'] as String?,
        emailVerified = j['emailVerified'] == true,
        onboarded = j['onboarded'] == true;
  final String id, username, name, email;
  final String? avatarUrl, district, area;
  final bool emailVerified, onboarded;
}

class UserProfile {
  UserProfile.fromJson(Map<String, dynamic> j)
      : username = j['username'] as String,
        name = j['name'] as String? ?? '',
        verified = j['verified'] == true,
        trust = (j['trust'] as num?)?.toInt() ?? 0,
        area = j['area'] as String? ?? '',
        district = j['district'] as String? ?? '',
        bio = j['bio'] as String? ?? '',
        joinedAt = j['joinedAt'] as String? ?? '',
        given = ((j['stats'] as Map?)?['given'] as num?)?.toInt() ?? 0,
        received = ((j['stats'] as Map?)?['received'] as num?)?.toInt() ?? 0,
        thanks = ((j['stats'] as Map?)?['thanksReceived'] as num?)?.toInt() ?? 0;
  final String username, name, area, district, bio, joinedAt;
  final bool verified;
  final int trust, given, received, thanks;
}

class ChatMessage {
  ChatMessage.fromJson(Map<String, dynamic> j)
      : from = j['from'] as String,
        type = j['type'] as String? ?? 'text',
        text = j['text'] as String? ?? '',
        at = j['at'] as String? ?? '';
  final String from, type, text, at;
}

class Chat {
  Chat.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        withName = j['with'] as String? ?? '',
        verified = j['verified'] == true,
        postTitle = j['postTitle'] as String? ?? '',
        postKind = j['postKind'] as String? ?? 'offer',
        last = j['last'] == null ? null : ChatMessage.fromJson(j['last'] as Map<String, dynamic>),
        lastAt = j['lastAt'] as String? ?? '',
        unread = (j['unread'] as num?)?.toInt() ?? 0,
        messages = (j['messages'] as List? ?? const [])
            .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
            .toList();
  final String id, withName, postTitle, postKind, lastAt;
  final bool verified;
  final ChatMessage? last;
  final int unread;
  final List<ChatMessage> messages;
}

class AppNotification {
  AppNotification.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        text = j['text'] as String? ?? '',
        href = j['href'] as String? ?? '',
        unread = j['unread'] == true,
        at = j['at'] as String? ?? '';
  final String id, text, href, at;
  final bool unread;
}

/// Feed filters, sent as query parameters to /feed and /search.
class FeedFilters {
  const FeedFilters({this.kind = 'all', this.category = 'all', this.scope = 'country', this.q});
  final String kind, category, scope;
  final String? q;

  FeedFilters copyWith({String? kind, String? category, String? scope}) =>
      FeedFilters(kind: kind ?? this.kind, category: category ?? this.category, scope: scope ?? this.scope, q: q);

  Map<String, dynamic> toQuery() => {'kind': kind, 'category': category, 'scope': scope, 'q': q};

  @override
  bool operator ==(Object other) =>
      other is FeedFilters &&
      other.kind == kind &&
      other.category == category &&
      other.scope == scope &&
      other.q == q;
  @override
  int get hashCode => Object.hash(kind, category, scope, q);
}

class SearchResult {
  SearchResult.fromJson(Map<String, dynamic> j)
      : posts = _posts(j['posts']),
        related = _posts(j['related']),
        aiSummary = (j['ai'] as Map?)?['summary'] as String?,
        aiTerms = ((j['ai'] as Map?)?['terms'] as List? ?? const []).cast<String>();
  final List<Post> posts, related;
  final String? aiSummary;
  final List<String> aiTerms;
}

List<Post> _posts(Object? list) =>
    (list as List? ?? const []).map((p) => Post.fromJson(p as Map<String, dynamic>)).toList();
List<Post> postsFrom(Object? list) => _posts(list);
