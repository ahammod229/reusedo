import 'package:flutter/material.dart';

/// Brand colours match the web app: green = giving, amber = needing.
class Brand {
  static const green = Color(0xFF1F7A4D);
  static const amber = Color(0xFFB45309);
  static const amberSoft = Color(0xFFFEF3C7);
  static const greenSoft = Color(0xFFE3F4EA);
}

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.green,
    brightness: b,
  ).copyWith(primary: dark ? const Color(0xFF52C48A) : Brand.green);

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: 'NotoSansBengali',
    // Taller lines keep Bengali conjuncts from being clipped.
    textTheme: Typography.material2021().black.apply(
          fontFamily: 'NotoSansBengali',
          bodyColor: scheme.onSurface,
          displayColor: scheme.onSurface,
        ),
    scaffoldBackgroundColor: dark ? const Color(0xFF111413) : const Color(0xFFF7F8F7),
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.surface,
      foregroundColor: scheme.onSurface,
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'NotoSansBengali',
        fontSize: 20,
        fontWeight: FontWeight.w800,
        color: scheme.onSurface,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: scheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      side: BorderSide(color: scheme.outlineVariant),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surface,
      indicatorColor: scheme.primary.withValues(alpha: 0.15),
      labelTextStyle: const WidgetStatePropertyAll(
        TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}

/// Soft amber panel colour that works in light and dark mode.
Color warnTint(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark ? const Color(0xFF3F2E10) : Brand.amberSoft;
