import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api.dart';
import 'models.dart';

/// Firebase sign-in state.
final authUserProvider = StreamProvider<User?>((_) => FirebaseAuth.instance.idTokenChanges());

/// The signed-in member's profile, or null when signed out. Creating it on first sign-in is
/// the server's job: GET /users/me makes the profile row if it doesn't exist yet.
final meProvider = FutureProvider<Me?>((ref) async {
  final user = ref.watch(authUserProvider).value;
  if (user == null) return null;
  return Me.fromJson(await ref.read(apiProvider).get<Map<String, dynamic>>('/users/me'));
});

final feedProvider = FutureProvider.autoDispose.family<List<Post>, FeedFilters>((ref, f) async {
  return postsFrom(await ref.read(apiProvider).get<List<dynamic>>('/feed', f.toQuery()));
});

final searchProvider = FutureProvider.autoDispose.family<SearchResult, String>((ref, q) async {
  return SearchResult.fromJson(await ref.read(apiProvider).get<Map<String, dynamic>>('/search', {'q': q}));
});

final postProvider = FutureProvider.autoDispose.family<Post, String>((ref, id) async {
  return Post.fromJson(await ref.read(apiProvider).get<Map<String, dynamic>>('/posts/$id'));
});

final myPostsProvider = FutureProvider.autoDispose<List<Post>>((ref) async {
  return postsFrom(await ref.read(apiProvider).get<List<dynamic>>('/posts/mine'));
});

final userProvider = FutureProvider.autoDispose.family<UserProfile, String>((ref, username) async {
  return UserProfile.fromJson(
      await ref.read(apiProvider).get<Map<String, dynamic>>('/users/${Uri.encodeComponent(username)}'));
});

final userPostsProvider = FutureProvider.autoDispose.family<List<Post>, String>((ref, username) async {
  return postsFrom(await ref
      .read(apiProvider)
      .get<List<dynamic>>('/feed', {'user': username, 'showGiven': true, 'scope': 'country'}));
});

final chatsProvider = FutureProvider.autoDispose<List<Chat>>((ref) async {
  final rows = await ref.read(apiProvider).get<List<dynamic>>('/chat');
  return rows.map((c) => Chat.fromJson(c as Map<String, dynamic>)).toList();
});

final notificationsProvider = FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  final rows = await ref.read(apiProvider).get<List<dynamic>>('/notifications');
  return rows.map((n) => AppNotification.fromJson(n as Map<String, dynamic>)).toList();
});

/// Writes that several screens share.
class Actions {
  Actions(this.api);
  final Api api;

  Future<Post> publish({
    required String kind,
    required String title,
    required String description,
    required String category,
    required String condition,
    required List<String> delivery,
    String? urgency,
    required List<XFile> photos,
  }) async {
    final form = FormData();
    form.fields.add(MapEntry(
        'data',
        _json({
          'kind': kind,
          'title': title,
          'description': description,
          'category': category,
          'condition': condition,
          'delivery': delivery,
          'urgency': ?urgency,
        })));
    for (final p in photos) {
      form.files.add(MapEntry('photos', MultipartFile.fromBytes(await p.readAsBytes(), filename: p.name)));
    }
    return Post.fromJson(await api.upload<Map<String, dynamic>>('/posts', form));
  }

  /// Gemini looks at the photos and suggests title, description, category and condition.
  Future<Map<String, dynamic>> aiDraft(List<XFile> photos) async {
    final form = FormData();
    for (final p in photos) {
      form.files.add(MapEntry('photos', MultipartFile.fromBytes(await p.readAsBytes(), filename: p.name)));
    }
    return api.upload<Map<String, dynamic>>('/ai/draft', form);
  }

  Future<void> request(String postId, String message, String via) =>
      api.post('/posts/$postId/requests', {'message': message, 'via': via});

  Future<void> setStatus(String postId, String status) => api.patch('/posts/$postId', {'status': status});

  Future<void> send(String chatId, String text) => api.post('/chat/$chatId/messages', {'text': text});

  Future<void> markChatRead(String chatId) => api.post('/chat/$chatId/read');

  Future<void> report(String postId, String reason) =>
      api.post('/reports', {'targetType': 'post', 'targetId': postId, 'reason': reason, 'details': ''});

  Future<void> markAllRead() => api.post('/notifications/read', {'id': 'all'});

  Future<void> saveProfile(Map<String, dynamic> fields) => api.patch('/users/me', fields);
}

String _json(Object o) => jsonEncode(o);

final actionsProvider = Provider((ref) => Actions(ref.read(apiProvider)));
