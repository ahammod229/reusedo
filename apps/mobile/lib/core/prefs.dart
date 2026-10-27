import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Loaded once in main() and injected, so settings are ready on the first frame.
final prefsProvider = Provider<SharedPreferences>((_) => throw UnimplementedError());

class LangNotifier extends Notifier<String> {
  @override
  String build() => ref.read(prefsProvider).getString('lang') ?? 'bn';

  void toggle() {
    state = state == 'bn' ? 'en' : 'bn';
    ref.read(prefsProvider).setString('lang', state);
  }
}

final langProvider = NotifierProvider<LangNotifier, String>(LangNotifier.new);

class ThemeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.values.byName(ref.read(prefsProvider).getString('theme') ?? 'system');

  void set(ThemeMode m) {
    state = m;
    ref.read(prefsProvider).setString('theme', m.name);
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(ThemeNotifier.new);

/// Posts bookmarked on this device.
class SavedNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => (ref.read(prefsProvider).getStringList('saved') ?? []).toSet();

  void toggle(String id) {
    state = state.contains(id) ? ({...state}..remove(id)) : {...state, id};
    ref.read(prefsProvider).setStringList('saved', state.toList());
  }
}

final savedProvider = NotifierProvider<SavedNotifier, Set<String>>(SavedNotifier.new);
