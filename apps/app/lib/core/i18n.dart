import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'prefs.dart';

const _bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/// Bilingual text helper. Call it as `t('বাংলা', 'English')` and format every
/// number with `t.n(value)` so Bangla shows ১২৩ and English shows 123.
class Tx {
  const Tx(this.lang);
  final Lang lang;

  bool get isBn => lang == Lang.bn;

  String call(String bn, String en) => isBn ? bn : en;

  String n(Object value) {
    final s = value.toString();
    if (!isBn) return s;
    return s.replaceAllMapped(RegExp(r'\d'), (m) => _bnDigits[int.parse(m[0]!)]);
  }
}

extension TxRef on WidgetRef {
  /// Rebuilds the widget when the language changes.
  Tx get tx => Tx(watch(langProvider));
}

extension TxRead on Ref {
  /// For code outside widgets (controllers, data sources).
  Tx get txRead => Tx(read(langProvider));
}
