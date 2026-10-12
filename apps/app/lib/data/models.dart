import 'dart:typed_data';

import 'package:flutter/material.dart';

enum PostKind { offer, need }

enum Condition { brandNew, good, used }

enum Delivery { pickup, courier }

enum Urgency { urgent, soon, anytime }

enum PostStatus { available, reserved, given }

enum EduLevel { primary, junior, ssc, hsc, admission, university }

extension EduLevelText on EduLevel {
  String get bn => switch (this) {
        EduLevel.primary => 'প্রাথমিক (১–৫)',
        EduLevel.junior => 'নিম্ন মাধ্যমিক (৬–৮)',
        EduLevel.ssc => 'SSC (৯–১০)',
        EduLevel.hsc => 'HSC (১১–১২)',
        EduLevel.admission => 'ভর্তি প্রস্তুতি',
        EduLevel.university => 'বিশ্ববিদ্যালয়',
      };
  String get en => switch (this) {
        EduLevel.primary => 'Primary (1–5)',
        EduLevel.junior => 'Junior (6–8)',
        EduLevel.ssc => 'SSC (9–10)',
        EduLevel.hsc => 'HSC (11–12)',
        EduLevel.admission => 'Admission prep',
        EduLevel.university => 'University',
      };
}

enum CategoryId { books, stationery, furniture, clothes, electronics, kids, other }

class Category {
  const Category(this.id, this.bn, this.en, this.emoji, this.tone);
  final CategoryId id;
  final String bn;
  final String en;
  final String emoji;
  final Color tone;
}

const categories = <Category>[
  Category(CategoryId.books, 'বই', 'Books', '📚', Color(0xFFFDE9B8)),
  Category(CategoryId.stationery, 'খাতা-কলম', 'Stationery', '📓', Color(0xFFCFE8F7)),
  Category(CategoryId.furniture, 'আসবাব', 'Furniture', '🪑', Color(0xFFFFDCB8)),
  Category(CategoryId.clothes, 'কাপড়', 'Clothes', '👕', Color(0xFFFFD3DA)),
  Category(CategoryId.electronics, 'ইলেকট্রনিক্স', 'Electronics', '🔌', Color(0xFFD7DBFA)),
  Category(CategoryId.kids, 'শিশুদের', 'Kids', '🧸', Color(0xFFFBD0E6)),
  Category(CategoryId.other, 'অন্যান্য', 'Other', '🎁', Color(0xFFCDEFD9)),
];

Category categoryOf(CategoryId id) => categories.firstWhere((c) => c.id == id);

class Author {
  const Author({
    required this.name,
    required this.username,
    required this.verified,
    required this.trust,
  });
  final String name;
  final String username;
  final bool verified;
  final int trust;
}

class Post {
  const Post({
    required this.id,
    required this.kind,
    required this.title,
    required this.description,
    required this.category,
    required this.condition,
    required this.area,
    required this.district,
    required this.distanceKm,
    required this.author,
    required this.postedAt,
    required this.hoursAgo,
    required this.delivery,
    this.images = const [],
    this.requests = 0,
    this.eduLevel,
    this.eduDetail,
    this.urgency,
    this.qty,
    this.status = PostStatus.available,
    this.mine = false,
  });

  final String id;
  final PostKind kind;
  final String title;
  final String description;
  final CategoryId category;
  final Condition condition;
  final String area;
  final String district;
  final double distanceKm;
  final Author author;

  /// Photo bytes picked on this device (a real API returns URLs instead).
  final List<Uint8List> images;
  final String postedAt;
  final int hoursAgo;
  final int requests;
  final EduLevel? eduLevel;
  final String? eduDetail;
  final List<Delivery> delivery;
  final Urgency? urgency;
  final int? qty;
  final PostStatus status;
  final bool mine;

  Post copyWith({int? requests, PostStatus? status}) => Post(
        id: id,
        kind: kind,
        title: title,
        description: description,
        category: category,
        condition: condition,
        area: area,
        district: district,
        distanceKm: distanceKm,
        author: author,
        postedAt: postedAt,
        hoursAgo: hoursAgo,
        delivery: delivery,
        images: images,
        requests: requests ?? this.requests,
        eduLevel: eduLevel,
        eduDetail: eduDetail,
        urgency: urgency,
        qty: qty,
        status: status ?? this.status,
        mine: mine,
      );
}

class ChatMessage {
  const ChatMessage({required this.from, required this.text, required this.time});
  final String from; // me | them | system
  final String text;
  final String time;
}

class Chat {
  const Chat({
    required this.id,
    required this.withName,
    required this.verified,
    required this.postTitle,
    required this.postKind,
    required this.last,
    required this.when,
    required this.unread,
    required this.messages,
  });
  final String id;
  final String withName;
  final bool verified;
  final String postTitle;
  final PostKind postKind;
  final String last;
  final String when;
  final int unread;
  final List<ChatMessage> messages;

  Chat copyWith({String? last, String? when, int? unread, List<ChatMessage>? messages}) => Chat(
        id: id,
        withName: withName,
        verified: verified,
        postTitle: postTitle,
        postKind: postKind,
        last: last ?? this.last,
        when: when ?? this.when,
        unread: unread ?? this.unread,
        messages: messages ?? this.messages,
      );
}

enum ExchangeStatus { requested, accepted, scheduled, completed, cancelled }

enum Role { giver, receiver }

class Exchange {
  const Exchange({
    required this.id,
    required this.title,
    required this.category,
    required this.role,
    required this.other,
    required this.status,
    required this.via,
    required this.updated,
    this.chatId = 'c1',
  });
  final String id;
  final String title;
  final CategoryId category;
  final Role role;
  final String other;
  final ExchangeStatus status;
  final Delivery via;
  final String updated;
  final String chatId;

  Exchange copyWith({ExchangeStatus? status}) => Exchange(
        id: id,
        title: title,
        category: category,
        role: role,
        other: other,
        status: status ?? this.status,
        via: via,
        updated: updated,
        chatId: chatId,
      );
}

enum NotifKind { request, accepted, message, courier, match, review }

class AppNotification {
  const AppNotification({
    required this.id,
    required this.kind,
    required this.text,
    required this.when,
    required this.unread,
    required this.route,
  });
  final String id;
  final NotifKind kind;
  final String text;
  final String when;
  final bool unread;
  final String route;

  AppNotification read() => AppNotification(
        id: id,
        kind: kind,
        text: text,
        when: when,
        unread: false,
        route: route,
      );
}

class ImpactStats {
  const ImpactStats({
    required this.given,
    required this.received,
    required this.thanksReceived,
    required this.kgSaved,
  });
  final int given;
  final int received;
  final int thanksReceived;
  final double kgSaved;
}

class UserProfile {
  const UserProfile({
    required this.username,
    required this.name,
    required this.verified,
    required this.trust,
    required this.area,
    required this.district,
    required this.joined,
    required this.bio,
    required this.badges,
    required this.stats,
  });
  final String username;
  final String name;
  final bool verified;
  final int trust;
  final String area;
  final String district;
  final String joined;
  final String bio;
  final List<String> badges;
  final ImpactStats stats;
}

class ThanksNote {
  const ThanksNote({required this.by, required this.item, required this.text, required this.when});
  final String by;
  final String item;
  final String text;
  final String when;
}

class Dashboard {
  const Dashboard({
    required this.requestsToAnswer,
    required this.unreadMessages,
    required this.activeExchanges,
    required this.forYou,
    required this.needsNearby,
    required this.recentThanks,
    required this.activeNearby,
  });
  final int requestsToAnswer;
  final int unreadMessages;
  final int activeExchanges;
  final List<Post> forYou;
  final List<Post> needsNearby;
  final List<ThanksNote> recentThanks;
  final int activeNearby;
}

class DonationHub {
  const DonationHub({
    required this.district,
    required this.donors,
    required this.items,
    required this.fresh,
    required this.recentName,
    required this.recentItem,
    required this.whenBn,
    required this.whenEn,
  });
  final String district;
  final int donors;
  final int items;
  final bool fresh;
  final String recentName;
  final String recentItem;
  final String whenBn;
  final String whenEn;
}

class DonationMapData {
  const DonationMapData({
    required this.hubs,
    required this.givenToday,
    required this.givenThisMonth,
  });
  final List<DonationHub> hubs;
  final int givenToday;
  final int givenThisMonth;
  int get districtsActive => hubs.length;
}

class CourierRequest {
  const CourierRequest({
    required this.id,
    required this.item,
    required this.from,
    required this.to,
    required this.weightKg,
    required this.charge,
    required this.status,
    this.tracking,
  });
  final String id;
  final String item;
  final String from;
  final String to;
  final double weightKg;
  final int charge;
  final String status; // pending | confirmed | rejected
  final String? tracking;
}

class FeedFilters {
  const FeedFilters({
    this.kind,
    this.category,
    this.scope = Scope.country,
    this.level,
    this.query = '',
    this.sort = SortBy.near,
  });
  final PostKind? kind;
  final CategoryId? category;
  final Scope scope;
  final EduLevel? level;
  final String query;
  final SortBy sort;

  FeedFilters copyWith({
    Object? kind = _unset,
    Object? category = _unset,
    Scope? scope,
    Object? level = _unset,
    String? query,
    SortBy? sort,
  }) =>
      FeedFilters(
        kind: identical(kind, _unset) ? this.kind : kind as PostKind?,
        category: identical(category, _unset) ? this.category : category as CategoryId?,
        scope: scope ?? this.scope,
        level: identical(level, _unset) ? this.level : level as EduLevel?,
        query: query ?? this.query,
        sort: sort ?? this.sort,
      );

  @override
  bool operator ==(Object other) =>
      other is FeedFilters &&
      other.kind == kind &&
      other.category == category &&
      other.scope == scope &&
      other.level == level &&
      other.query == query &&
      other.sort == sort;

  @override
  int get hashCode => Object.hash(kind, category, scope, level, query, sort);
}

const _unset = Object();

enum Scope { area, district, country }

enum SortBy { near, newest, urgent, popular }

class AiDraft {
  const AiDraft({
    required this.title,
    required this.description,
    required this.category,
    required this.condition,
  });
  final String title;
  final String description;
  final CategoryId category;
  final Condition condition;
}

class NewPost {
  const NewPost({
    required this.kind,
    required this.title,
    required this.description,
    required this.category,
    required this.condition,
    required this.delivery,
    this.images = const [],
    this.eduLevel,
    this.urgency,
    this.qty,
  });
  final PostKind kind;
  final String title;
  final String description;
  final CategoryId category;
  final Condition condition;
  final List<Delivery> delivery;
  final List<Uint8List> images;
  final EduLevel? eduLevel;
  final Urgency? urgency;
  final int? qty;
}
