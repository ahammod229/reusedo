import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api.dart';
import 'i18n.dart';

/// Loading / error / data for one AsyncValue, the same treatment on every screen.
class AsyncView<T> extends ConsumerWidget {
  const AsyncView({super.key, required this.value, required this.data, this.onRetry});
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tr = trOf(ref);
    return value.when(
      data: data,
      loading: () => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off_rounded, size: 40),
            const SizedBox(height: 12),
            Text(
              e is ApiError && e.code == 'network'
                  ? tr('ইন্টারনেট সংযোগ নেই', 'No internet connection')
                  : tr('লোড করা যায়নি', "Couldn't load this"),
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onRetry, child: Text(tr('আবার চেষ্টা', 'Retry'))),
            ],
          ]),
        ),
      ),
    );
  }
}

/// Round letter avatar, or the photo when there is one.
class Initial extends StatelessWidget {
  const Initial(this.name, {super.key, this.size = 40, this.url});
  final String name;
  final double size;
  final String? url;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: scheme.primary.withValues(alpha: 0.14),
      foregroundImage: url != null ? NetworkImage(url!) : null,
      child: Text(name.isEmpty ? '🙂' : name.characters.first.toUpperCase(),
          style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w700, fontSize: size * 0.4)),
    );
  }
}

/// Empty list message with an optional action.
class EmptyNote extends StatelessWidget {
  const EmptyNote({super.key, required this.emoji, required this.text, this.action});
  final String emoji, text;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(children: [
          Text(emoji, style: const TextStyle(fontSize: 44)),
          const SizedBox(height: 12),
          Text(text, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (action != null) ...[const SizedBox(height: 16), action!],
        ]),
      );
}

/// Rounded toggle, like the website's filter pills. Sizes itself to the text (Material chips
/// clip Bengali labels).
class Pill extends StatelessWidget {
  const Pill({super.key, required this.label, required this.selected, required this.onTap, this.icon});
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bg = selected
        ? scheme.primary
        : Theme.of(context).brightness == Brightness.dark
            ? const Color(0xFF232E29)
            : const Color(0xFFEDEEE9);
    return Material(
      color: bg,
      shape: const StadiumBorder(),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[icon!, const SizedBox(width: 6)],
            Text(label,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                    height: 1.2,
                    color: selected ? scheme.onPrimary : scheme.onSurface)),
          ]),
        ),
      ),
    );
  }
}
