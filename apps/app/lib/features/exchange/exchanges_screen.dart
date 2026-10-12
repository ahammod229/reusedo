import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../core/prefs.dart';
import '../../data/data_source.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';

enum _Tab { active, done, all }

class ExchangesScreen extends ConsumerStatefulWidget {
  const ExchangesScreen({super.key});
  @override
  ConsumerState<ExchangesScreen> createState() => _ExchangesState();
}

class _ExchangesState extends ConsumerState<ExchangesScreen> {
  _Tab _tab = _Tab.active;
  final Set<String> _thanked = {};

  String _label(Tx t, ExchangeStatus s) => switch (s) {
        ExchangeStatus.requested => t('রিকোয়েস্ট', 'Requested'),
        ExchangeStatus.accepted => t('গৃহীত', 'Accepted'),
        ExchangeStatus.scheduled => t('সময় ঠিক', 'Scheduled'),
        ExchangeStatus.completed => t('সম্পন্ন', 'Completed'),
        ExchangeStatus.cancelled => t('বাতিল', 'Cancelled'),
      };

  Future<void> _advance(String id) async {
    await ref.read(dataSourceProvider).advanceExchange(id);
    ref.invalidate(exchangesProvider);
    ref.invalidate(dashboardProvider);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final cs = Theme.of(context).colorScheme;
    final items = ref.watch(exchangesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t('আদান-প্রদান', 'Exchanges'))),
      body: Column(children: [
        Constrained(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SegmentedButton<_Tab>(
              segments: [
                ButtonSegment(value: _Tab.active, label: Text(t('চলমান', 'Active'))),
                ButtonSegment(value: _Tab.done, label: Text(t('শেষ', 'Finished'))),
                ButtonSegment(value: _Tab.all, label: Text(t('সব', 'All'))),
              ],
              selected: {_tab},
              onSelectionChanged: (s) => setState(() => _tab = s.first),
            ),
          ),
        ),
        Expanded(
          child: AsyncView<List<Exchange>>(
            value: items,
            onRetry: () => ref.invalidate(exchangesProvider),
            builder: (all) {
              final shown = all.where((e) {
                final finished = e.status == ExchangeStatus.completed || e.status == ExchangeStatus.cancelled;
                return switch (_tab) {
                  _Tab.all => true,
                  _Tab.done => finished,
                  _Tab.active => !finished,
                };
              }).toList();
              if (shown.isEmpty) {
                return EmptyState(
                  emoji: '🤝',
                  title: t('এখানে কিছু নেই', 'Nothing here'),
                  action: FilledButton(onPressed: () => context.go('/feed'), child: Text(t('ফিড দেখুন', 'Browse feed'))),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: shown.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final e = shown[i];
                  final giver = e.role == Role.giver;
                  final done = e.status == ExchangeStatus.completed;
                  return Constrained(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Text(categoryOf(e.category).emoji, style: const TextStyle(fontSize: 28)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(e.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                Text(
                                  '${giver ? t('আপনি দিচ্ছেন', 'You give') : t('আপনি নিচ্ছেন', 'You receive')} · ${e.other}',
                                  style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                                ),
                              ]),
                            ),
                            Pill(
                              _label(t, e.status),
                              bg: done ? Brand.greenSoft : e.status == ExchangeStatus.cancelled ? cs.errorContainer : Brand.amberSoft,
                              fg: done ? Brand.green : e.status == ExchangeStatus.cancelled ? cs.onErrorContainer : Brand.amber,
                            ),
                          ]),
                          const SizedBox(height: 10),
                          Row(children: [
                            Icon(e.via == Delivery.courier ? Icons.local_shipping_outlined : Icons.handshake_outlined, size: 16, color: cs.onSurfaceVariant),
                            const SizedBox(width: 6),
                            Text(e.via == Delivery.courier ? t('কুরিয়ারে', 'By courier') : t('নিজে দেখা করে', 'In person'),
                                style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                            const Spacer(),
                            Text(e.updated, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                          ]),
                          const SizedBox(height: 10),
                          Wrap(spacing: 8, runSpacing: 8, children: [
                            OutlinedButton.icon(
                              onPressed: () => context.go('/messages/${e.chatId}'),
                              icon: const Icon(Icons.chat_bubble_outline, size: 18),
                              label: Text(t('চ্যাট', 'Chat')),
                            ),
                            if (giver && e.status == ExchangeStatus.requested)
                              FilledButton(onPressed: () => _advance(e.id), child: Text(t('গ্রহণ করুন', 'Accept'))),
                            if (e.status == ExchangeStatus.accepted && e.via == Delivery.courier)
                              FilledButton(onPressed: () => context.push('/courier/${e.id}'), child: Text(t('কুরিয়ার', 'Courier'))),
                            if (e.status == ExchangeStatus.scheduled || (e.status == ExchangeStatus.accepted && e.via == Delivery.pickup))
                              FilledButton(
                                onPressed: () => showHandoverDialog(context, e),
                                child: Text(giver ? t('হস্তান্তরের কোড', 'Handover code') : t('পেয়েছি', 'Received')),
                              ),
                            if (done)
                              _thanked.contains(e.id)
                                  ? Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      child: Text('✓ ${giver ? t('রিভিউ দেওয়া হয়েছে', 'Reviewed') : t('ধন্যবাদ জানানো হয়েছে', 'Thanked')}',
                                          style: TextStyle(color: cs.primary, fontWeight: FontWeight.w600)),
                                    )
                                  : FilledButton(
                                      onPressed: () async {
                                        await showThanksDialog(context, ref, e);
                                        if (mounted) setState(() => _thanked.add(e.id));
                                      },
                                      child: Text(giver ? t('রিভিউ দিন', 'Leave a review') : '💌 ${t('ধন্যবাদ জানান', 'Say thanks')}'),
                                    ),
                          ]),
                        ]),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ]),
    );
  }
}

/// In-person handover needs both people: the giver reads a 4-digit code aloud,
/// the receiver types it in. Neither can complete the exchange alone.
Future<void> showHandoverDialog(BuildContext context, Exchange e) => showDialog<void>(
      context: context,
      builder: (_) => _HandoverDialog(exchange: e),
    );

class _HandoverDialog extends ConsumerStatefulWidget {
  const _HandoverDialog({required this.exchange});
  final Exchange exchange;
  @override
  ConsumerState<_HandoverDialog> createState() => _HandoverState();
}

class _HandoverState extends ConsumerState<_HandoverDialog> {
  final _code = TextEditingController();
  bool _wrong = false;
  bool _busy = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    if (_code.text.length != 4 || _busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(dataSourceProvider).confirmHandover(widget.exchange.id, _code.text);
      ref.invalidate(exchangesProvider);
      ref.invalidate(dashboardProvider);
      if (mounted) Navigator.of(context).pop();
    } on WrongCode {
      if (mounted) {
        setState(() {
          _wrong = true;
          _busy = false;
          _code.clear();
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _busy = false);
        toast(context, ref.tx('সংযোগে সমস্যা, আবার চেষ্টা করুন', 'Connection problem, try again'));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final giver = widget.exchange.role == Role.giver;
    final cs = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Row(children: [
        Icon(Icons.shield_outlined, color: cs.primary),
        const SizedBox(width: 8),
        Text(t('হস্তান্তরের কোড', 'Handover code')),
      ]),
      content: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 380),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(giver
              ? t('জিনিস দেওয়ার সময় গ্রহীতাকে এই কোডটি বলুন। তিনি কোড দিলে তবেই আদান-প্রদান সম্পন্ন হবে।',
                  'Tell the receiver this code when you hand the item over. The exchange completes once they enter it.')
              : t('জিনিস হাতে পাওয়ার পর দাতার কাছ থেকে ৪ সংখ্যার কোডটি নিয়ে এখানে লিখুন।',
                  'After you receive the item, ask the giver for their 4-digit code and enter it here.')),
          const SizedBox(height: 16),
          if (giver)
            Consumer(builder: (context, ref, _) {
              final code = ref.watch(_codeProvider(widget.exchange.id));
              return Center(
                child: Text(
                  code.maybeWhen(data: (c) => t.n(c), orElse: () => '••••'),
                  style: TextStyle(fontSize: 44, fontWeight: FontWeight.w800, letterSpacing: 10, color: cs.primary),
                ),
              );
            })
          else ...[
            TextField(
              controller: _code,
              autofocus: true,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 4,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: 12),
              decoration: InputDecoration(counterText: '', errorText: _wrong ? t('কোডটি মেলেনি।', "That code doesn't match.") : null),
              onChanged: (v) {
                setState(() => _wrong = false);
                if (v.length == 4) _confirm();
              },
            ),
          ],
        ]),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(t('বন্ধ করুন', 'Close'))),
        if (!giver)
          FilledButton(
            onPressed: _code.text.length == 4 && !_busy ? _confirm : null,
            child: Text(t('পেয়েছি — নিশ্চিত করুন', 'I received it — confirm')),
          ),
      ],
    );
  }
}

final _codeProvider = FutureProvider.family<String, String>(
  (ref, id) => ref.watch(dataSourceProvider).handoverCode(id),
);

Future<void> showThanksDialog(BuildContext context, WidgetRef ref, Exchange e) async {
  final controller = TextEditingController();
  final t = Tx(ref.read(langProvider));
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(e.role == Role.receiver ? t('ধন্যবাদ জানান', 'Say thanks') : t('রিভিউ দিন', 'Leave a review')),
      content: TextField(
        controller: controller,
        maxLines: 3,
        maxLength: 200,
        decoration: InputDecoration(hintText: t('দুটো কথা লিখুন…', 'Write a few words…')),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: Text(t('পরে', 'Later'))),
        FilledButton(
          onPressed: () async {
            await ref.read(dataSourceProvider).sendThanks(e.id, controller.text.trim());
            if (ctx.mounted) Navigator.pop(ctx);
          },
          child: Text(t('পাঠান', 'Send')),
        ),
      ],
    ),
  );
  controller.dispose();
}
