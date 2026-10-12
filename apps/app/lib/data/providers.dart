import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/prefs.dart';
import 'data_source.dart';
import 'mock_source.dart';
import 'models.dart';

/// Swap `MockSource` for `ApiSource` here once the backend is connected.
final dataSourceProvider = Provider<DataSource>((ref) => MockSource());

final feedProvider = FutureProvider.family<List<Post>, FeedFilters>(
  (ref, f) => ref.watch(dataSourceProvider).listFeed(f),
);

final postProvider = FutureProvider.family<Post?, String>(
  (ref, id) => ref.watch(dataSourceProvider).getPost(id),
);

final chatsProvider = FutureProvider<List<Chat>>(
  (ref) => ref.watch(dataSourceProvider).listChats(),
);

final chatProvider = FutureProvider.family<Chat?, String>(
  (ref, id) => ref.watch(dataSourceProvider).getChat(id),
);

final exchangesProvider = FutureProvider<List<Exchange>>(
  (ref) => ref.watch(dataSourceProvider).listExchanges(),
);

final notificationsProvider = FutureProvider<List<AppNotification>>(
  (ref) => ref.watch(dataSourceProvider).listNotifications(),
);

final dashboardProvider = FutureProvider<Dashboard>(
  (ref) => ref.watch(dataSourceProvider).getDashboard(),
);

final donationMapProvider = FutureProvider<DonationMapData>(
  (ref) => ref.watch(dataSourceProvider).getDonationMap(),
);

final userProvider = FutureProvider.family<UserProfile?, String>(
  (ref, u) => ref.watch(dataSourceProvider).getUser(u),
);

final courierProvider = FutureProvider<List<CourierRequest>>(
  (ref) => ref.watch(dataSourceProvider).listCourierRequests(),
);

/// Posts the person saved, kept on the device.
class SavedController extends Notifier<Set<String>> {
  static const _key = 'saved_posts';

  @override
  Set<String> build() => ref.read(prefsProvider).getStringList(_key)?.toSet() ?? {};

  void toggle(String id) {
    final next = {...state};
    if (!next.remove(id)) next.add(id);
    ref.read(prefsProvider).setStringList(_key, next.toList());
    state = next;
  }
}

final savedProvider = NotifierProvider<SavedController, Set<String>>(SavedController.new);
