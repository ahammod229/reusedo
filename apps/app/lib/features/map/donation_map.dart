import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../core/i18n.dart';
import '../../data/districts.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';

/// Where people are giving, by district. Marker = ✓ sized by donors; districts
/// with a donation in the last 24h pulse. Never shows a street address.
class DonationMap extends ConsumerWidget {
  const DonationMap({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final data = ref.watch(donationMapProvider);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
          child: Row(children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.volunteer_activism, size: 20, color: Theme.of(context).colorScheme.primary),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t('কোথা থেকে মানুষ দান করছেন', 'Where people are giving'),
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                Text(t('জেলা অনুযায়ী — ঠিকানা কখনো দেখানো হয় না', 'By district — addresses are never shown'),
                    style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
              ]),
            ),
          ]),
        ),
        AsyncView<DonationMapData>(
          value: data,
          onRetry: () => ref.invalidate(donationMapProvider),
          builder: (d) => _Body(data: d),
        ),
      ]),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.data});
  final DonationMapData data;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final hubs = data.hubs.where((h) => districtCoords.containsKey(h.district)).toList();
    final maxDonors = hubs.fold<int>(1, (m, h) => math.max(m, h.donors));
    final top = [...hubs]..sort((a, b) => b.donors.compareTo(a.donors));
    final recent = [...hubs]..sort((a, b) => (b.fresh ? 1 : 0).compareTo(a.fresh ? 1 : 0));

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Wrap(spacing: 8, runSpacing: 6, children: [
          _Stat(t.n(data.givenToday), t('আজ', 'today')),
          _Stat(t.n(data.givenThisMonth), t('এই মাসে', 'this month')),
          _Stat(t.n(data.districtsActive), t('জেলা', 'districts')),
        ]),
      ),
      const SizedBox(height: 12),
      SizedBox(
        height: 300,
        child: Semantics(
          label: t('দানের মানচিত্র', 'Donation map'),
          child: FlutterMap(
            options: MapOptions(
              initialCameraFit: CameraFit.bounds(
                bounds: LatLngBounds(bdBoundsSw, bdBoundsNe),
                padding: const EdgeInsets.all(8),
              ),
              minZoom: 5,
              maxZoom: 10,
              cameraConstraint: CameraConstraint.contain(
                bounds: LatLngBounds(const LatLng(18.5, 86.0), const LatLng(28.5, 94.5)),
              ),
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag | InteractiveFlag.doubleTapZoom,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.reusedo.app',
                maxNativeZoom: 10,
              ),
              MarkerLayer(markers: [
                for (final h in hubs)
                  Marker(
                    point: districtCoords[h.district]!,
                    width: 52,
                    height: 52,
                    child: _HubMarker(hub: h, size: 26 + math.sqrt(h.donors / maxDonors) * 22),
                  ),
              ]),
              const RichAttributionWidget(
                attributions: [TextSourceAttribution('© OpenStreetMap contributors')],
              ),
            ],
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.all(16),
        child: LayoutBuilder(builder: (context, c) {
          final wide = c.maxWidth > 520;
          final topList = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            for (var i = 0; i < math.min(5, top.length); i++)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(children: [
                  SizedBox(width: 22, child: Text(t.n(i + 1), style: const TextStyle(fontSize: 12))),
                  Icon(Icons.check_circle_outline, size: 16, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 6),
                  Expanded(child: Text(top[i].district, style: const TextStyle(fontWeight: FontWeight.w600))),
                  Text('${t.n(top[i].donors)} ${t('জন', 'donors')}',
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                ]),
              ),
          ]);
          final recentList = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            for (final h in recent.take(4))
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Text.rich(TextSpan(children: [
                  TextSpan(text: '✓ ', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                  TextSpan(text: h.recentName, style: const TextStyle(fontWeight: FontWeight.w700)),
                  TextSpan(text: ', ${h.district} — ${h.recentItem} '),
                  TextSpan(
                    text: '(${t(h.whenBn, h.whenEn)})',
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ])),
              ),
          ]);
          return wide
              ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(child: topList),
                  const SizedBox(width: 16),
                  Expanded(child: recentList),
                ])
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  topList,
                  const Divider(height: 20),
                  recentList,
                ]);
        }),
      ),
    ]);
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.value, this.label);
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text.rich(TextSpan(children: [
          TextSpan(text: value, style: const TextStyle(fontWeight: FontWeight.w800)),
          TextSpan(text: ' $label', style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]), style: const TextStyle(fontSize: 12)),
      );
}

class _HubMarker extends StatefulWidget {
  const _HubMarker({required this.hub, required this.size});
  final DonationHub hub;
  final double size;
  @override
  State<_HubMarker> createState() => _HubMarkerState();
}

class _HubMarkerState extends State<_HubMarker> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 2),
  );

  @override
  void initState() {
    super.initState();
    if (widget.hub.fresh) _pulse.repeat();
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Respect "reduce motion": a static marker instead of a pulse.
    final reduce = MediaQuery.of(context).disableAnimations;
    if (reduce && _pulse.isAnimating) _pulse.stop();
    final color = Theme.of(context).colorScheme.primary;
    final s = widget.size;
    return Consumer(builder: (context, ref, _) {
      final t = ref.tx;
      final h = widget.hub;
      return Tooltip(
        message: '${h.district}: ${t.n(h.donors)} ${t('জন দাতা', 'donors')}, ${t.n(h.items)} ${t('জিনিস', 'items')}',
        triggerMode: TooltipTriggerMode.tap,
        child: AnimatedBuilder(
          animation: _pulse,
          builder: (_, child) => Stack(alignment: Alignment.center, children: [
            if (h.fresh && !reduce)
              Container(
                width: s + 20 * _pulse.value,
                height: s + 20 * _pulse.value,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: 0.35 * (1 - _pulse.value)),
                ),
              ),
            child!,
          ]),
          child: Container(
            width: s,
            height: s,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2))],
            ),
            child: const Icon(Icons.check, color: Colors.white, size: 16),
          ),
        ),
      );
    });
  }
}
