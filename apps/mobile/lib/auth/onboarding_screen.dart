import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api.dart';
import '../core/bd.dart';
import '../core/i18n.dart';
import '../data/providers.dart';
import 'auth_service.dart';

/// Last step before the feed: district, area and phone (kept private; used for handovers).
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  String? _division;
  String? _district;
  final _area = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _save() async {
    final tr = trOf(ref);
    final phone = _phone.text.replaceAll(RegExp(r'[\s-]'), '').replaceFirst(RegExp(r'^\+?88'), '');
    if (_district == null) {
      setState(() => _error = tr('জেলা বেছে নিন।', 'Choose your district.'));
      return;
    }
    if (!RegExp(r'^01[3-9]\d{8}$').hasMatch(phone)) {
      setState(() => _error = tr('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।', 'Enter a valid mobile number (01XXXXXXXXX).'));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(actionsProvider).saveProfile({
        'division': _division,
        'district': _district,
        'area': _area.text.trim(),
        'phone': phone,
      });
      ref.invalidate(meProvider);
    } on ApiError catch (e) {
      setState(() => _error = e.code == 'phone_blocked'
          ? tr('এই নম্বর ব্যবহার করা যাবে না।', "This number can't be used.")
          : tr('সেভ করা যায়নি। আবার চেষ্টা করুন।', "Couldn't save. Try again."));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(tr('আপনার এলাকা', 'Your area')),
        actions: [TextButton(onPressed: AuthService.signOut, child: Text(tr('লগআউট', 'Log out')))],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              tr('কাছের মানুষদের পোস্ট দেখাতে আপনার এলাকা লাগবে। ঠিকানা কখনো কাউকে দেখানো হয় না।',
                  'We use your area to show posts near you. Your address is never shown to anyone.'),
              style: TextStyle(color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              initialValue: _division,
              decoration: InputDecoration(hintText: tr('বিভাগ', 'Division')),
              items: [for (final d in bdDivisions.keys) DropdownMenuItem(value: d, child: Text(d))],
              onChanged: (v) => setState(() {
                _division = v;
                _district = null;
              }),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey(_division),
              initialValue: _district,
              decoration: InputDecoration(hintText: tr('জেলা', 'District')),
              items: [
                for (final d in bdDivisions[_division] ?? const <String>[]) DropdownMenuItem(value: d, child: Text(d))
              ],
              onChanged: (v) => setState(() => _district = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _area,
              decoration: InputDecoration(hintText: tr('এলাকা (যেমন: মিরপুর ১০)', 'Area (e.g. Mirpur 10)')),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(hintText: tr('মোবাইল নম্বর', 'Mobile number'), prefixText: '+88 '),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: scheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: Text(tr('শুরু করি', "Let's start")),
            ),
          ],
        ),
      ),
    );
  }
}
