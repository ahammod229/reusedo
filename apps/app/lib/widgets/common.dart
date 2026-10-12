import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// Pages stay readable on wide screens: content is centred and capped.
class Constrained extends StatelessWidget {
  const Constrained({super.key, required this.child, this.maxWidth = 720, this.padding});
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) => Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: Padding(
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 16),
            child: child,
          ),
        ),
      );
}

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.bg, this.fg, this.icon});
  final String text;
  final Color? bg;
  final Color? fg;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg ?? cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 14, color: fg ?? cs.onSurfaceVariant), const SizedBox(width: 4)],
        Flexible(
          child: Text(
            text,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg ?? cs.onSurfaceVariant),
          ),
        ),
      ]),
    );
  }
}

/// Offer = green, need = amber, on a soft background.
class KindPill extends ConsumerWidget {
  const KindPill(this.kind, {super.key});
  final PostKind kind;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return kind == PostKind.offer
        ? Pill('🎁 ${t('আমার কাছে আছে', 'I have this')}',
            bg: dark ? const Color(0xFF1C3A2B) : Brand.greenSoft,
            fg: dark ? const Color(0xFF7FE0AC) : Brand.green)
        : Pill('🙏 ${t('আমার দরকার', 'I need this')}',
            bg: dark ? const Color(0xFF3F2E10) : Brand.amberSoft,
            fg: dark ? const Color(0xFFFBBF6A) : Brand.amber);
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.action});
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(0, 8, 0, 10),
        child: Row(children: [
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          ),
          ?action,
        ]),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.emoji, required this.title, this.body, this.action});
  final String emoji;
  final String title;
  final String? body;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(emoji, style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            if (body != null) ...[
              const SizedBox(height: 6),
              Text(body!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}

/// Loading skeleton, error with retry, or the data.
class AsyncView<T> extends ConsumerWidget {
  const AsyncView({super.key, required this.value, required this.builder, this.onRetry});
  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    return value.when(
      data: builder,
      loading: () => const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => EmptyState(
        emoji: '⚠️',
        title: t('লোড করা যায়নি', "Couldn't load this"),
        body: t('ইন্টারনেট দেখে আবার চেষ্টা করুন।', 'Check your connection and try again.'),
        action: onRetry == null
            ? null
            : OutlinedButton(onPressed: onRetry, child: Text(t('আবার চেষ্টা', 'Try again'))),
      ),
    );
  }
}

/// Category emoji on a soft tint, or the person's own photo.
class PhotoBox extends StatelessWidget {
  const PhotoBox({super.key, required this.post, this.height = 180, this.radius = 16});
  final Post post;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final cat = categoryOf(post.category);
    final dark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: post.images.isNotEmpty
            ? Image.memory(
                Uint8List.fromList(post.images.first),
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => _tint(cat, dark),
              )
            : _tint(cat, dark),
      ),
    );
  }

  Widget _tint(Category cat, bool dark) => Container(
        color: dark ? Colors.white10 : cat.tone,
        alignment: Alignment.center,
        child: Text(cat.emoji, style: TextStyle(fontSize: height * 0.36)),
      );
}

void toast(BuildContext context, String text) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));
}

String conditionText(Tx t, Condition c) => switch (c) {
      Condition.brandNew => t('নতুন', 'New'),
      Condition.good => t('ভালো', 'Good'),
      Condition.used => t('ব্যবহৃত', 'Used'),
    };

String urgencyText(Tx t, Urgency u) => switch (u) {
      Urgency.urgent => t('জরুরি', 'Urgent'),
      Urgency.soon => t('শিগগির', 'Soon'),
      Urgency.anytime => t('যখন হয়', 'Anytime'),
    };

String distanceText(Tx t, double km) {
  if (km < 0.1) return t('আপনার কাছেই', 'Right here');
  final v = km < 10 ? km.toStringAsFixed(1) : km.round().toString();
  return '${t.n(v)} ${t('কিমি', 'km')}';
}
