import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';

/// Courier flow: both people agree, the request goes to an admin, who confirms
/// and books the parcel with Steadfast. The receiver pays the courier fee on delivery.
class CourierScreen extends ConsumerStatefulWidget {
  const CourierScreen({super.key, required this.exchangeId});
  final String exchangeId;
  @override
  ConsumerState<CourierScreen> createState() => _CourierState();
}

class _CourierState extends ConsumerState<CourierScreen> {
  bool _receiverAgrees = false;
  bool _sent = false;
  bool _busy = false;

  Future<void> _send() async {
    setState(() => _busy = true);
    try {
      await ref.read(dataSourceProvider).createCourierRequest(widget.exchangeId);
      ref.invalidate(courierProvider);
      if (mounted) setState(() => _sent = true);
    } catch (_) {
      if (mounted) toast(context, ref.tx('পাঠানো যায়নি', "Couldn't send"));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final cs = Theme.of(context).colorScheme;
    final steps = [
      t('সম্মতি', 'Agreement'),
      t('অ্যাডমিন রিভিউ', 'Admin review'),
      t('কুরিয়ার প্রস্তুত', 'Courier ready'),
      t('পিকআপ', 'Picked up'),
      t('পথে', 'In transit'),
      t('ডেলিভারি', 'Delivered'),
    ];
    final current = _sent ? 1 : 0;
    final exchange = ref.watch(exchangesProvider).maybeWhen(
          data: (l) => l.where((e) => e.id == widget.exchangeId).firstOrNull,
          orElse: () => null,
        );

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.canPop() ? context.pop() : context.go('/exchanges')),
        title: Text(t('কুরিয়ারে ডেলিভারি', 'Courier delivery')),
      ),
      body: ListView(padding: const EdgeInsets.symmetric(vertical: 12), children: [
        Constrained(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(t('দুজন রাজি হলে অ্যাডমিন যাচাই করে কনফার্ম করবেন।', 'Once both agree, an admin reviews and confirms.'),
                style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 12),
            Card(child: ListTile(title: Text(exchange?.title ?? '—'), subtitle: Text(t('জিনিস', 'Item')))),
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _Agree(label: t('দাতা সম্মত', 'Giver agreed'), on: true),
                  const SizedBox(height: 8),
                  _Agree(
                    label: t('গ্রহীতা সম্মত', 'Receiver agreed'),
                    on: _receiverAgrees,
                    action: _receiverAgrees ? null : TextButton(onPressed: () => setState(() => _receiverAgrees = true), child: Text(t('কুরিয়ারে নিতে রাজি', 'I agree to courier'))),
                  ),
                  const Divider(height: 24),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: warnTint(context), borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      Expanded(child: Text(t('কুরিয়ার চার্জ (গ্রহীতা দেবেন, ডেলিভারিতে)', 'Courier fee (paid by the receiver on delivery)'))),
                      Text('৳${t.n(130)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _receiverAgrees && !_sent && !_busy ? _send : null,
                    child: Text(_sent
                        ? t('রিকোয়েস্ট পাঠানো হয়েছে ✓', 'Request sent ✓')
                        : _receiverAgrees
                            ? t('অ্যাডমিনকে রিকোয়েস্ট পাঠান', 'Send request to admin')
                            : t('দুজনের সম্মতির অপেক্ষা', 'Waiting for both to agree')),
                  ),
                ]),
              ),
            ),
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(children: [
                  for (var i = 0; i < steps.length; i++)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(children: [
                        Icon(i <= current ? Icons.check_circle : Icons.radio_button_unchecked,
                            color: i <= current ? cs.primary : cs.outline),
                        const SizedBox(width: 10),
                        Text(steps[i], style: TextStyle(color: i > current ? cs.onSurfaceVariant : null)),
                        if (i == current) ...[const SizedBox(width: 8), Pill(t('এখন', 'Now'))],
                      ]),
                    ),
                ]),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _Agree extends StatelessWidget {
  const _Agree({required this.label, required this.on, this.action});
  final String label;
  final bool on;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(on ? Icons.check_circle : Icons.radio_button_unchecked, color: on ? Theme.of(context).colorScheme.primary : null),
        const SizedBox(width: 8),
        Expanded(child: Text(label)),
        ?action,
      ]);
}
