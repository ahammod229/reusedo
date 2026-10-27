import 'package:flutter/material.dart';

/// Brand colours, matched to the website: leaf green for giving, warm amber for asking.
class Brand {
  static const green = Color(0xFF1F7A4D);
  static const amber = Color(0xFFB45F12);
  static const offerSoft = Color(0xFFE3F3EA);
  static const needSoft = Color(0xFFFBEFD9);
}

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(seedColor: Brand.green, brightness: b).copyWith(
    primary: dark ? const Color(0xFF6FD49B) : Brand.green,
    surface: dark ? const Color(0xFF1B2420) : Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    // Soft grey page behind white posts, like a social feed.
    scaffoldBackgroundColor: dark ? const Color(0xFF121916) : const Color(0xFFF1F2EE),
    fontFamilyFallback: const ['NotoSansBengali'],
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      titleTextStyle: TextStyle(
          color: scheme.onSurface, fontSize: 20, fontWeight: FontWeight.w700),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      indicatorColor: scheme.primary.withValues(alpha: 0.12),
      height: 64,
      labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: scheme.onSurface)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF232E29) : const Color(0xFFF4F5F1),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    chipTheme: ChipThemeData(
      shape: const StadiumBorder(),
      side: BorderSide.none,
      backgroundColor: dark ? const Color(0xFF232E29) : const Color(0xFFEDEEE9),
      selectedColor: scheme.primary,
      labelStyle: const TextStyle(fontWeight: FontWeight.w600),
      showCheckmark: false,
    ),
  );
}
