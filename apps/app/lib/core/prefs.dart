import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Overridden in main() with the loaded instance.
final prefsProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('prefsProvider must be overridden'),
);

enum Lang { bn, en }

class LangController extends Notifier<Lang> {
  @override
  Lang build() =>
      ref.read(prefsProvider).getString('lang') == 'en' ? Lang.en : Lang.bn;

  void set(Lang l) {
    ref.read(prefsProvider).setString('lang', l.name);
    state = l;
  }
}

final langProvider = NotifierProvider<LangController, Lang>(LangController.new);

class ThemeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    switch (ref.read(prefsProvider).getString('theme')) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      default:
        return ThemeMode.system;
    }
  }

  void set(ThemeMode m) {
    ref.read(prefsProvider).setString('theme', m.name);
    state = m;
  }
}

final themeProvider = NotifierProvider<ThemeController, ThemeMode>(ThemeController.new);
