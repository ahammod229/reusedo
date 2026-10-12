import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/i18n.dart';
import '../../core/prefs.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/providers.dart';
import '../../widgets/common.dart';

const _maxPhotos = 5;
const _draftKey = 'post_draft';

class QuickPostScreen extends ConsumerStatefulWidget {
  const QuickPostScreen({super.key, this.startAsNeed = false});
  final bool startAsNeed;
  @override
  ConsumerState<QuickPostScreen> createState() => _QuickPostState();
}

class _QuickPostState extends ConsumerState<QuickPostScreen> {
  late PostKind _kind = widget.startAsNeed ? PostKind.need : PostKind.offer;
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _qty = TextEditingController();
  final List<Uint8List> _photos = [];
  CategoryId _category = CategoryId.books;
  Condition _condition = Condition.good;
  EduLevel? _level;
  Urgency _urgency = Urgency.soon;
  final Set<Delivery> _delivery = {Delivery.pickup};
  bool _analyzing = false;
  bool _publishing = false;
  bool _aiUsed = false;
  bool _touched = false;
  Map<String, dynamic>? _saved;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final raw = ref.read(prefsProvider).getString(_draftKey);
    if (raw != null) {
      try {
        _saved = jsonDecode(raw) as Map<String, dynamic>;
      } catch (_) {
        _saved = null;
      }
    }
    _title.addListener(_scheduleSave);
    _desc.addListener(_scheduleSave);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _title.dispose();
    _desc.dispose();
    _qty.dispose();
    super.dispose();
  }

  // Text-only autosave, so a closed app or dropped connection doesn't lose the write-up.
  void _scheduleSave() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      if (_title.text.trim().isEmpty && _desc.text.trim().isEmpty) return;
      ref.read(prefsProvider).setString(
            _draftKey,
            jsonEncode({
              'kind': _kind.name,
              'title': _title.text,
              'desc': _desc.text,
              'category': _category.name,
            }),
          );
    });
  }

  void _restore() {
    final d = _saved;
    if (d == null) return;
    setState(() {
      _kind = PostKind.values.asNameMap()[d['kind']] ?? _kind;
      _category = CategoryId.values.asNameMap()[d['category']] ?? _category;
      _title.text = (d['title'] as String?) ?? '';
      _desc.text = (d['desc'] as String?) ?? '';
      _saved = null;
    });
  }

  void _discard() {
    ref.read(prefsProvider).remove(_draftKey);
    setState(() => _saved = null);
  }

  Future<void> _pick(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final List<XFile> files;
      if (source == ImageSource.gallery) {
        files = await picker.pickMultiImage(
          maxWidth: 1280,
          imageQuality: 80,
          limit: _maxPhotos - _photos.length,
        );
      } else {
        final one = await picker.pickImage(source: source, maxWidth: 1280, imageQuality: 80);
        files = [?one];
      }
      final bytes = [for (final f in files) await f.readAsBytes()];
      if (!mounted) return;
      setState(() => _photos.addAll(bytes.take(_maxPhotos - _photos.length)));
    } catch (_) {
      if (mounted) toast(context, ref.tx('ছবি নেওয়া যায়নি', "Couldn't get the photo"));
    }
  }

  void _addPhotoSheet() {
    final t = ref.tx;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.photo_camera_outlined),
            title: Text(t('ক্যামেরা', 'Camera')),
            onTap: () {
              Navigator.pop(context);
              _pick(ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined),
            title: Text(t('গ্যালারি / ফাইল', 'Gallery / files')),
            onTap: () {
              Navigator.pop(context);
              _pick(ImageSource.gallery);
            },
          ),
        ]),
      ),
    );
  }

  Future<void> _analyze() async {
    final t = ref.tx;
    setState(() => _analyzing = true);
    try {
      final d = await ref.read(dataSourceProvider).aiDraft(_photos.length);
      if (!mounted) return;
      setState(() {
        _title.text = d.title;
        _desc.text = d.description;
        _category = d.category;
        _condition = d.condition;
        _aiUsed = true;
      });
    } catch (_) {
      if (mounted) toast(context, t('আজকের AI সীমা শেষ — নিজে লিখুন', 'Daily AI limit reached — write it yourself'));
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }

  bool get _valid => _title.text.trim().length >= 5 && _delivery.isNotEmpty;

  Future<void> _publish() async {
    final t = ref.tx;
    setState(() => _touched = true);
    if (!_valid) return;
    setState(() => _publishing = true);
    try {
      await ref.read(dataSourceProvider).publishPost(NewPost(
            kind: _kind,
            title: _title.text.trim(),
            description: _desc.text.trim(),
            category: _category,
            condition: _condition,
            delivery: _delivery.toList(),
            images: _kind == PostKind.offer ? _photos : const [],
            eduLevel: _level,
            urgency: _kind == PostKind.need ? _urgency : null,
            qty: int.tryParse(_qty.text),
          ));
      ref.read(prefsProvider).remove(_draftKey);
      ref.invalidate(feedProvider);
      ref.invalidate(dashboardProvider);
      if (!mounted) return;
      toast(context, t('পোস্ট পাবলিশ হয়েছে!', 'Post published!'));
      context.go('/feed');
    } catch (_) {
      if (!mounted) return;
      setState(() => _publishing = false);
      toast(context, t('পাবলিশ করা যায়নি, আবার চেষ্টা করুন', "Couldn't publish, try again"));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final lang = ref.watch(langProvider);
    final cs = Theme.of(context).colorScheme;
    final offer = _kind == PostKind.offer;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: t('বন্ধ করুন', 'Close'),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: Text(t('পোস্ট করুন', 'New post')),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(0, 8, 0, 24 + MediaQuery.viewInsetsOf(context).bottom),
        child: Constrained(
          maxWidth: 640,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            if (_saved != null)
              Card(
                color: warnTint(context),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(children: [
                    Expanded(
                      child: Text('📝 ${t('আগের একটি অসমাপ্ত পোস্টের খসড়া আছে।', 'You have an unfinished draft.')}'),
                    ),
                    TextButton(onPressed: _restore, child: Text(t('ফিরিয়ে আনুন', 'Restore'))),
                    TextButton(onPressed: _discard, child: Text(t('মুছুন', 'Discard'))),
                  ]),
                ),
              ),
            const SizedBox(height: 8),
            SegmentedButton<PostKind>(
              segments: [
                ButtonSegment(value: PostKind.offer, label: Text(t('আমার কাছে আছে', 'I have this')), icon: const Text('🎁')),
                ButtonSegment(value: PostKind.need, label: Text(t('আমার দরকার', 'I need this')), icon: const Text('🙏')),
              ],
              selected: {_kind},
              onSelectionChanged: (s) => setState(() => _kind = s.first),
            ),
            const SizedBox(height: 4),
            Text(
              offer
                  ? t('ছবি তুলুন — বাকিটা AI লিখে দেবে। আপনি শুধু দেখে নিন।', 'Snap a photo — AI writes the rest. You just check it.')
                  : t('কী দরকার দুই লাইনে লিখুন। দাতারা পড়তে পছন্দ করেন।', 'Say what you need in two lines. Givers like to know.'),
              style: TextStyle(color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            if (offer) ...[
              SizedBox(
                height: 96,
                child: ListView(scrollDirection: Axis.horizontal, children: [
                  for (var i = 0; i < _photos.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Stack(children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.memory(_photos[i], width: 96, height: 96, fit: BoxFit.cover),
                        ),
                        Positioned(
                          top: 2,
                          right: 2,
                          child: InkWell(
                            onTap: () => setState(() => _photos.removeAt(i)),
                            child: const CircleAvatar(
                              radius: 12,
                              backgroundColor: Colors.black54,
                              child: Icon(Icons.close, size: 14, color: Colors.white),
                            ),
                          ),
                        ),
                      ]),
                    ),
                  if (_photos.length < _maxPhotos)
                    InkWell(
                      onTap: _addPhotoSheet,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: cs.outline, style: BorderStyle.solid),
                        ),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.add_a_photo_outlined),
                          const SizedBox(height: 4),
                          Text('${t('ছবি', 'Photos')} (${t.n(_maxPhotos)})',
                              textAlign: TextAlign.center, style: const TextStyle(fontSize: 11)),
                        ]),
                      ),
                    ),
                ]),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _photos.isEmpty || _analyzing ? null : _analyze,
                icon: _analyzing
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.auto_awesome),
                label: Text(_analyzing ? t('AI ছবি দেখছে…', 'AI is looking…') : t('AI দিয়ে পোস্ট বানান', 'Write it with AI')),
              ),
              if (_aiUsed)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text('✨ ${t('AI-এর খসড়া — ঠিক আছে কিনা দেখে নিন, দরকারে বদলান।', 'AI draft — check it, edit if needed.')}',
                      style: TextStyle(color: cs.primary)),
                ),
              const SizedBox(height: 16),
            ],
            TextField(
              controller: _title,
              maxLength: 80,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                labelText: offer ? t('শিরোনাম', 'Title') : t('কী দরকার?', 'What do you need?'),
                hintText: offer ? t('যেমন: ক্লাস ৮-এর সব বই (সেট)', 'e.g. Full set of class 8 books') : t('যেমন: ক্লাস ৯-এর বিজ্ঞান বই', 'e.g. Class 9 science books'),
                errorText: _touched && _title.text.trim().length < 5 ? t('অন্তত ৫ অক্ষর লিখুন', 'Write at least 5 characters') : null,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _desc,
              maxLines: 3,
              maxLength: 500,
              decoration: InputDecoration(
                labelText: offer ? t('বিবরণ', 'Description') : t('কেন দরকার? (ঐচ্ছিক)', 'Why? (optional)'),
                helperText: '🔒 ${t('ফোন নম্বর বা পুরো ঠিকানা লিখবেন না — চ্যাটেই দেবেন।', "Don't write your phone or full address — share it in chat.")}',
                helperMaxLines: 2,
              ),
            ),
            const SizedBox(height: 12),
            Text(t('ক্যাটাগরি', 'Category'), style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final c in categories)
                ChoiceChip(
                  label: Text('${c.emoji} ${lang == Lang.bn ? c.bn : c.en}'),
                  selected: _category == c.id,
                  showCheckmark: false,
                  onSelected: (_) => setState(() => _category = c.id),
                ),
            ]),
            const SizedBox(height: 16),
            Text(t('কোন স্তরের শিক্ষার্থীর কাজে লাগবে? (ঐচ্ছিক)', 'Which study level is it for? (optional)'),
                style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final l in EduLevel.values)
                ChoiceChip(
                  label: Text(lang == Lang.bn ? l.bn : l.en),
                  selected: _level == l,
                  showCheckmark: false,
                  onSelected: (on) => setState(() => _level = on ? l : null),
                ),
            ]),
            const SizedBox(height: 16),
            if (offer) ...[
              Text(t('অবস্থা', 'Condition'), style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              SegmentedButton<Condition>(
                segments: [
                  for (final c in Condition.values) ButtonSegment(value: c, label: Text(conditionText(t, c))),
                ],
                selected: {_condition},
                onSelectionChanged: (s) => setState(() => _condition = s.first),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _qty,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: t('কয়টি? (ঐচ্ছিক)', 'How many? (optional)')),
              ),
            ] else ...[
              Text(t('কতটা জরুরি?', 'How urgent?'), style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              SegmentedButton<Urgency>(
                segments: [
                  for (final u in Urgency.values) ButtonSegment(value: u, label: Text(urgencyText(t, u))),
                ],
                selected: {_urgency},
                onSelectionChanged: (s) => setState(() => _urgency = s.first),
              ),
            ],
            const SizedBox(height: 16),
            Text(t('হস্তান্তর', 'Hand-over'), style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              FilterChip(
                label: Text(t('নিজে দেখা করে', 'In person')),
                selected: _delivery.contains(Delivery.pickup),
                onSelected: (on) => setState(() => on ? _delivery.add(Delivery.pickup) : _delivery.remove(Delivery.pickup)),
              ),
              FilterChip(
                label: Text(t('কুরিয়ার', 'Courier')),
                selected: _delivery.contains(Delivery.courier),
                onSelected: (on) => setState(() => on ? _delivery.add(Delivery.courier) : _delivery.remove(Delivery.courier)),
              ),
            ]),
            if (_touched && _delivery.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(t('অন্তত একটি বাছুন', 'Pick at least one'), style: TextStyle(color: cs.error, fontSize: 12)),
              ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _publishing ? null : _publish,
              child: _publishing
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(t('পাবলিশ করুন', 'Publish')),
            ),
          ]),
        ),
      ),
    );
  }
}
