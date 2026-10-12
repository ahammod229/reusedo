import 'models.dart';

/// Everything the screens need from a backend. `MockSource` implements it with
/// sample data; `ApiSource` (to write) maps each method to a REST endpoint,
/// exactly like the web app's `features/data/apiSource.ts`.
abstract class DataSource {
  Future<List<Post>> listFeed(FeedFilters filters);
  Future<Post?> getPost(String id);
  Future<Post> publishPost(NewPost input);
  Future<AiDraft> aiDraft(int photoCount);

  Future<List<Chat>> listChats();
  Future<Chat?> getChat(String id);
  Future<Chat> sendMessage(String chatId, String text);

  Future<List<Exchange>> listExchanges();
  Future<Exchange> advanceExchange(String id);
  Future<String> handoverCode(String exchangeId);

  /// Throws [WrongCode] when the giver's code doesn't match.
  Future<Exchange> confirmHandover(String exchangeId, String code);

  Future<List<AppNotification>> listNotifications();
  Future<void> markNotificationRead(String idOrAll);

  Future<UserProfile?> getUser(String username);
  Future<Dashboard> getDashboard();
  Future<DonationMapData> getDonationMap();

  Future<void> requestItem(String postId, {required String message, required Delivery via});
  Future<void> reportPost(String postId, String reason, String details);
  Future<void> sendThanks(String exchangeId, String text);

  Future<List<CourierRequest>> listCourierRequests();
  Future<CourierRequest> createCourierRequest(String exchangeId);
}

class WrongCode implements Exception {
  const WrongCode();
}
