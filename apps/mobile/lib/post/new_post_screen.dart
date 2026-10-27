import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api.dart';
import '../core/i18n.dart';
import '../core/prefs.dart';
import '../core/theme.dart';
import '../core/widgets.dart';
import '../data/models.dart';
import '../data/providers.dart';

/// Give or ask: photos first (AI can fill the rest in), then a few taps.
class NewPostScreen extends ConsumerStatefulWidget {
  const NewPostScreen({super.key, this.kind = 'offer'});
  final String kind;
  @override
  ConsumerState<NewPostScreen> createState() => _NewPostScreenState();
}

class _NewPostScreenState extends ConsumerState<NewPostScreen> {
  late String _kind = widget.kind;
  final _photos = <XFile>[];
  final _title = TextEditingController();
  final _desc = TextEditingController();
  String _category = 'books';
  String _condition = 'good';
  final _delivery = {'pickup'};
  String _urgency = 'anytime';
  bool _busy = false;
  bool _drafting = false;

  static const _maxPhotos = 5;

  Future<void> _pick(ImageSource source) async {
    final picker = ImagePicker();
    // The server converts to WebP; sending ≤1600px keeps uploads fast on mobile data.
    final picked = source == ImageSource.camera
        ? [?await picker.pickImage(source: source, maxWidth: 1600, imageQuality: 85)]
        : await picker.pickMultiImage(maxWidth: 1600, imageQuality: 85, limit: _maxPhotos - _photos.length);
    if (picked.isEmpty) return;
    setState(() => _photos.addAll(picked.take(_maxPhotos - _photos.length)));
  }

  Future<void> _aiFill() async {
    final tr = trOf(ref);
    setState(() => _drafting = true);
    try {
      final d = await ref.read(actionsProvider).aiDraft(_photos);
      setState(() {
        _title.text = d['title'] as String? ?? _title.text;
        _desc.text = d['description'] as String? ?? _desc.text;
        if (categories.any((c) => c.id == d['category'])) _category = d['category'] as String;
        if (['new', 'good', 'used'].contains(d['condition'])) _condition = d['condition'] as String;
      });
    } on ApiError catch (e) {
      if (mounted) {
        context.toast(e.code == 'ai_limit'
            ? tr('AI এখন ব্যস্ত — নিজে লিখুন বা একটু পরে চেষ্টা করুন।', 'AI is busy — type it yourself or try later.')
            : tr('AI দিয়ে লেখা গেল না — নিজে লিখুন।', "AI couldn't help — please type it yourself."));
      }
    } finally {
      if (mounted) setState(() => _drafting = false);
    }
  }

  Future<void> _publish() async {
    final tr = trOf(ref);
    if (_title.text.trim().length < 3) {
      context.toast(tr('একটা ছোট শিরোনাম দিন (অন্তত ৩ অক্ষর)।', 'Add a short title (3+ letters).'));
      return;
    }
    if (_kind == 'offer' && _photos.isEmpty) {
      context.toast(tr('দেওয়ার জিনিসের অন্তত একটা ছবি দিন।', 'Add at least one photo of what you give.'));
      return;
    }
    setState(() => _busy = true);
    try {
      final post = await ref.read(actionsProvider).publish(
            kind: _kind,
            title: _title.text.trim(),
            description: _desc.text.trim(),
            category: _category,
            condition: _condition,
            delivery: _delivery.toList(),
            urgency: _kind == 'need' ? _urgency : null,
            photos: _photos,
          );
      ref.invalidate(feedProvider);
      ref.invalidate(myPostsProvider);
      if (!mounted) return;
      context.toast(tr('পোস্ট হয়েছে! 🎉', 'Posted! 🎉'));
      context.pushReplacement('/post/${post.id}');
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      context.toast(switch (e.code) {
        'network' => tr('ইন্টারনেট সংযোগ দেখুন।', 'Check your internet connection.'),
        'image_too_large' => tr('ছবিটা অনেক বড় — অন্য ছবি দিন।', 'That photo is too large.'),
        'email_not_verified' => tr('আগে ইমেইল যাচাই করুন।', 'Verify your email first.'),
        _ => tr('পোস্ট করা যায়নি। আবার চেষ্টা করুন।', "Couldn't post. Try again."),
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final bn = ref.watch(langProvider) == 'bn';
    final scheme = Theme.of(context).colorScheme;
    final offer = _kind == 'offer';
    Widget label(String t) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 8),
        child: Text(t, style: const TextStyle(fontWeight: FontWeight.w700)));

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('পোস্ট করুন', 'Create post')),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton(
              onPressed: _busy ? null : _publish,
              style: FilledButton.styleFrom(minimumSize: const Size(72, 38)),
              child: _busy
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(tr('পোস্ট', 'Post')),
            ),
          ),
        ],
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 12, 16, 40), children: [
        SegmentedButton<String>(
          segments: [
            ButtonSegment(value: 'offer', label: Text(tr('🎁 আমি দিতে চাই', '🎁 I want to give'))),
            ButtonSegment(value: 'need', label: Text(tr('🙏 আমার দরকার', '🙏 I need'))),
          ],
          selected: {_kind},
          showSelectedIcon: false,
          onSelectionChanged: (s) => setState(() => _kind = s.first),
        ),
        label(offer ? tr('ছবি', 'Photos') : tr('ছবি (ঐচ্ছিক)', 'Photos (optional)')),
        SizedBox(
          height: 96,
          child: ListView(scrollDirection: Axis.horizontal, children: [
            for (var i = 0; i < _photos.length; i++)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Stack(children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: kIsWeb
                        ? Image.network(_photos[i].path, width: 96, height: 96, fit: BoxFit.cover)
                        : FutureBuilder(
                            future: _photos[i].readAsBytes(),
                            builder: (_, s) => s.hasData
                                ? Image.memory(s.data!, width: 96, height: 96, fit: BoxFit.cover)
                                : Container(width: 96, height: 96, color: scheme.surfaceContainerHighest),
                          ),
                  ),
                  Positioned(
                    right: 2,
                    top: 2,
                    child: InkWell(
                      onTap: () => setState(() => _photos.removeAt(i)),
                      child: const CircleAvatar(
                          radius: 12, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 14, color: Colors.white)),
                    ),
                  ),
                ]),
              ),
            if (_photos.length < _maxPhotos) ...[
              if (!kIsWeb) _AddTile(icon: Icons.photo_camera_outlined, text: tr('ক্যামেরা', 'Camera'), onTap: () => _pick(ImageSource.camera)),
              _AddTile(icon: Icons.photo_library_outlined, text: tr('গ্যালারি', 'Gallery'), onTap: () => _pick(ImageSource.gallery)),
            ],
          ]),
        ),
        if (_photos.isNotEmpty) ...[
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _drafting ? null : _aiFill,
            icon: _drafting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.auto_awesome),
            label: Text(tr('AI দিয়ে বাকিটা লিখে দিন', 'Let AI fill in the rest')),
          ),
        ],
        label(tr('শিরোনাম', 'Title')),
        TextField(
          controller: _title,
          maxLength: 150,
          decoration: InputDecoration(
              hintText: offer ? tr('যেমন: ক্লাস ৮-এর সব বই', 'e.g. All class 8 books') : tr('যেমন: HSC পদার্থবিজ্ঞান বই দরকার', 'e.g. Need HSC physics book')),
        ),
        label(tr('বিস্তারিত', 'Details')),
        TextField(
          controller: _desc,
          maxLines: 4,
          maxLength: 2000,
          decoration: InputDecoration(hintText: tr('অবস্থা, কোথা থেকে নেওয়া যাবে…', 'Condition, where to pick up…')),
        ),
        label(tr('ক্যাটাগরি', 'Category')),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final c in categories)
            Pill(
              label: '${c.emoji} ${bn ? c.bn : c.en}',
              selected: _category == c.id,
              onTap: () => setState(() => _category = c.id),
            ),
        ]),
        if (offer) ...[
          label(tr('অবস্থা', 'Condition')),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'new', label: Text(tr('নতুনের মতো', 'Like new'))),
              ButtonSegment(value: 'good', label: Text(tr('ভালো', 'Good'))),
              ButtonSegment(value: 'used', label: Text(tr('ব্যবহৃত', 'Used'))),
            ],
            selected: {_condition},
            showSelectedIcon: false,
            onSelectionChanged: (s) => setState(() => _condition = s.first),
          ),
        ] else ...[
          label(tr('কবে দরকার?', 'When do you need it?')),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'urgent', label: Text(tr('জরুরি', 'Urgent'))),
              ButtonSegment(value: 'soon', label: Text(tr('এই মাসে', 'This month'))),
              ButtonSegment(value: 'anytime', label: Text(tr('যেকোনো সময়', 'Anytime'))),
            ],
            selected: {_urgency},
            showSelectedIcon: false,
            onSelectionChanged: (s) => setState(() => _urgency = s.first),
          ),
        ],
        label(tr('কীভাবে হাতবদল?', 'How to hand over?')),
        Wrap(spacing: 8, children: [
          for (final d in {'pickup': tr('নিজে নেওয়া', 'Pickup'), 'courier': tr('কুরিয়ার', 'Courier')}.entries)
            Pill(
              label: d.value,
              selected: _delivery.contains(d.key),
              onTap: () => setState(() {
                // At least one way must stay selected.
                if (!_delivery.contains(d.key)) {
                  _delivery.add(d.key);
                } else if (_delivery.length > 1) {
                  _delivery.remove(d.key);
                }
              }),
            ),
        ]),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _busy ? null : _publish,
          style: FilledButton.styleFrom(backgroundColor: offer ? Brand.green : Brand.amber),
          child: Text(tr('পোস্ট করুন', 'Publish')),
        ),
      ]),
    );
  }
}

class _AddTile extends StatelessWidget {
  const _AddTile({required this.icon, required this.text, required this.onTap});
  final IconData icon;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: 96,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: scheme.outlineVariant, width: 1.5),
            color: scheme.surface,
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, color: scheme.primary),
            const SizedBox(height: 4),
            Text(text, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    );
  }
}
