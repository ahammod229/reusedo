import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'prefs.dart';

/// `tr(bn, en)` picks the current language, the same way the website does.
typedef Tr = String Function(String bn, String en);

Tr trOf(WidgetRef ref) {
  final bn = ref.watch(langProvider) == 'bn';
  return (b, e) => bn ? b : e;
}

const _bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/// Bengali digits in Bengali mode.
String numOf(WidgetRef ref, Object n) {
  final s = '$n';
  if (ref.watch(langProvider) != 'bn') return s;
  return s.split('').map((c) {
    final d = int.tryParse(c);
    return d == null ? c : _bnDigits[d];
  }).join();
}

/// "৩ ঘণ্টা আগে" / "3h ago" from an ISO time.
String relTime(WidgetRef ref, String iso) {
  final t = DateTime.tryParse(iso);
  if (t == null) return '';
  final tr = trOf(ref);
  final d = DateTime.now().difference(t);
  String n(int v) => numOf(ref, v);
  if (d.inMinutes < 1) return tr('এইমাত্র', 'just now');
  if (d.inHours < 1) return tr('${n(d.inMinutes)} মিনিট আগে', '${d.inMinutes}m ago');
  if (d.inDays < 1) return tr('${n(d.inHours)} ঘণ্টা আগে', '${d.inHours}h ago');
  if (d.inDays < 30) return tr('${n(d.inDays)} দিন আগে', '${d.inDays}d ago');
  return tr('${n(d.inDays ~/ 30)} মাস আগে', '${d.inDays ~/ 30}mo ago');
}

extension ContextX on BuildContext {
  void toast(String text) =>
      ScaffoldMessenger.of(this).showSnackBar(SnackBar(content: Text(text), behavior: SnackBarBehavior.floating));
}
