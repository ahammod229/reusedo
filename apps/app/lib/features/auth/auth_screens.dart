import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/prefs.dart';
import '../../data/districts.dart';
import 'auth.dart';

final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// Shared frame: logo, title, card on wide screens, language toggle.
class AuthShell extends ConsumerWidget {
  const AuthShell({super.key, required this.title, this.subtitle, required this.child, this.footer});
  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? footer;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Row(children: [
                  const Text('🎁', style: TextStyle(fontSize: 28)),
                  const SizedBox(width: 8),
                  const Text('ReuseDo', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const Spacer(),
                  TextButton(
                    onPressed: () => ref
                        .read(langProvider.notifier)
                        .set(lang == Lang.bn ? Lang.en : Lang.bn),
                    child: Text(lang == Lang.bn ? 'English' : 'বাংলা'),
                  ),
                ]),
                const SizedBox(height: 24),
                Text(title, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                if (subtitle != null) ...[
                  const SizedBox(height: 6),
                  Text(subtitle!,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                ],
                const SizedBox(height: 24),
                child,
                if (footer != null) ...[const SizedBox(height: 20), Center(child: footer)],
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.tx;
    final lang = ref.watch(langProvider);
    final steps = [
      ('📸', t('ছবি তুলুন', 'Snap a photo'), t('AI শিরোনাম, বিবরণ আর ক্যাটাগরি লিখে দেবে।', 'AI writes the title, description and category.')),
      ('💬', t('মিলিয়ে নিন', 'Get matched'), t('কাছের মানুষ রিকোয়েস্ট করবে, চ্যাটে কথা বলুন।', 'Someone nearby requests it — talk in chat.')),
      ('🤝', t('হস্তান্তর', 'Hand over'), t('নিজে দেখা করে অথবা কুরিয়ারে — গ্রহীতা শুধু কুরিয়ার চার্জ দেবেন।', 'Meet in person or use courier — the receiver pays only the courier fee.')),
    ];
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => ref
                          .read(langProvider.notifier)
                          .set(lang == Lang.bn ? Lang.en : Lang.bn),
                      child: Text(lang == Lang.bn ? 'English' : 'বাংলা'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('🎁', textAlign: TextAlign.center, style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  Text(
                    t('যা আপনার দরকার নেই, তা কারও জন্য আশীর্বাদ',
                        "What you don't need is a blessing for someone else"),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, height: 1.3),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    t('বই, খাতা, টেবিল, কাপড় — ফেলে না দিয়ে বিনামূল্যে দিয়ে দিন। যার দরকার সে খুঁজে নেবে। পুরোটাই ফ্রি।',
                        'Books, notebooks, tables, clothes — give them away instead of throwing them out. Completely free.'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 16, height: 1.6, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 28),
                  FilledButton(onPressed: () => context.go('/register'), child: Text(t('অ্যাকাউন্ট খুলুন', 'Create account'))),
                  const SizedBox(height: 10),
                  OutlinedButton(onPressed: () => context.go('/login'), child: Text(t('লগইন', 'Sign in'))),
                  const SizedBox(height: 32),
                  for (final s in steps)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          width: 48,
                          height: 48,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Text(s.$1, style: const TextStyle(fontSize: 24)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(s.$2, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                            Text(s.$3, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                          ]),
                        ),
                      ]),
                    ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginState();
}

class _LoginState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _busy = false;
  bool _show = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _pass.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final t = ref.read(langProvider) == Lang.bn;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).signIn(_email.text.trim(), _pass.text);
    } on AuthFailure {
      if (mounted) {
        setState(() => _error = t ? 'ইমেইল বা পাসওয়ার্ড ভুল।' : 'Wrong email or password.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = t ? 'ইন্টারনেট সংযোগ পরীক্ষা করুন।' : 'Check your internet connection.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    return AuthShell(
      title: t('স্বাগতম', 'Welcome back'),
      subtitle: t('আপনার অ্যাকাউন্টে লগইন করুন', 'Sign in to your account'),
      footer: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(t('অ্যাকাউন্ট নেই?', "Don't have an account?")),
        TextButton(onPressed: () => context.go('/register'), child: Text(t('নিবন্ধন করুন', 'Sign up'))),
      ]),
      child: Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (_error != null) _ErrorBox(_error!),
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            decoration: InputDecoration(labelText: t('ইমেইল', 'Email')),
            validator: (v) => _emailRe.hasMatch(v?.trim() ?? '')
                ? null
                : t('সঠিক ইমেইল দিন', 'Enter a valid email'),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _pass,
            obscureText: !_show,
            autofillHints: const [AutofillHints.password],
            decoration: InputDecoration(
              labelText: t('পাসওয়ার্ড', 'Password'),
              suffixIcon: IconButton(
                tooltip: _show ? t('লুকান', 'Hide') : t('দেখান', 'Show'),
                icon: Icon(_show ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _show = !_show),
              ),
            ),
            validator: (v) => (v ?? '').isEmpty ? t('পাসওয়ার্ড দিন', 'Enter your password') : null,
            onFieldSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(t('লগইন', 'Sign in')),
          ),
        ]),
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterState();
}

class _RegisterState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _pass.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final bn = ref.read(langProvider) == Lang.bn;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .register(_name.text.trim(), _email.text.trim(), _pass.text);
    } on AuthFailure catch (e) {
      if (mounted) {
        setState(() => _error = e.code == 'email_in_use'
            ? (bn ? 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে।' : 'An account with this email already exists.')
            : (bn ? 'কিছু ভুল হয়েছে।' : 'Something went wrong.'));
      }
    } catch (_) {
      if (mounted) setState(() => _error = bn ? 'ইন্টারনেট সংযোগ পরীক্ষা করুন।' : 'Check your internet connection.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    return AuthShell(
      title: t('অ্যাকাউন্ট খুলুন', 'Create your account'),
      subtitle: t('এটা সম্পূর্ণ বিনামূল্যে', 'It is completely free'),
      footer: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(t('আগে থেকেই অ্যাকাউন্ট আছে?', 'Already have an account?')),
        TextButton(onPressed: () => context.go('/login'), child: Text(t('লগইন', 'Sign in'))),
      ]),
      child: Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (_error != null) _ErrorBox(_error!),
          TextFormField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.name],
            decoration: InputDecoration(labelText: t('আপনার নাম', 'Your name')),
            validator: (v) => (v?.trim().length ?? 0) >= 2 ? null : t('নাম লিখুন', 'Enter your name'),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            decoration: InputDecoration(labelText: t('ইমেইল', 'Email')),
            validator: (v) => _emailRe.hasMatch(v?.trim() ?? '') ? null : t('সঠিক ইমেইল দিন', 'Enter a valid email'),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _pass,
            obscureText: true,
            autofillHints: const [AutofillHints.newPassword],
            decoration: InputDecoration(
              labelText: t('পাসওয়ার্ড', 'Password'),
              helperText: t('কমপক্ষে ৮ অক্ষর, একটি সংখ্যা সহ', 'At least 8 characters with a number'),
            ),
            validator: (v) {
              final s = v ?? '';
              if (s.length < 8 || !RegExp(r'\d').hasMatch(s) || !RegExp(r'[a-zA-Z]').hasMatch(s)) {
                return t('৮+ অক্ষর, অক্ষর ও সংখ্যা মিলিয়ে দিন', 'Use 8+ characters with letters and a number');
              }
              return null;
            },
            onFieldSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(t('চালিয়ে যান', 'Continue')),
          ),
        ]),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(12)),
      child: Text(text, style: TextStyle(color: cs.onErrorContainer)),
    );
  }
}

class VerifyScreen extends ConsumerStatefulWidget {
  const VerifyScreen({super.key});
  @override
  ConsumerState<VerifyScreen> createState() => _VerifyState();
}

class _VerifyState extends ConsumerState<VerifyScreen> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _info;
  int _left = 60;

  @override
  void initState() {
    super.initState();
    _tick();
  }

  void _tick() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      if (_left > 0) {
        setState(() => _left--);
        _tick();
      }
    });
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_code.text.length != 6 || _busy) return;
    final bn = ref.read(langProvider) == Lang.bn;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).verify(_code.text);
    } on AuthFailure {
      if (mounted) {
        setState(() {
          _error = bn ? 'কোডটি ঠিক নয়। আবার চেষ্টা করুন।' : 'That code is not right. Try again.';
          _code.clear();
        });
      }
    } catch (_) {
      if (mounted) setState(() => _error = bn ? 'ইন্টারনেট সংযোগ পরীক্ষা করুন।' : 'Check your internet connection.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    final bn = ref.read(langProvider) == Lang.bn;
    try {
      await ref.read(authProvider.notifier).resendCode();
      if (!mounted) return;
      setState(() {
        _info = bn ? 'নতুন কোড পাঠানো হয়েছে' : 'A new code was sent';
        _left = 60;
      });
      _tick();
    } catch (_) {
      if (mounted) setState(() => _error = bn ? 'কোড পাঠানো যায়নি।' : 'Could not send the code.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final email = ref.watch(authProvider).email;
    return AuthShell(
      title: t('ইমেইল যাচাই করুন', 'Verify your email'),
      footer: TextButton(
        onPressed: () => ref.read(authProvider.notifier).signOut(),
        child: Text(t('ইমেইল বদলাতে চাই', 'Use a different email')),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(t('আমরা ৬ সংখ্যার একটি কোড পাঠিয়েছি:', 'We sent a 6-digit code to:'),
            textAlign: TextAlign.center),
        const SizedBox(height: 4),
        Text(email, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 20),
        TextField(
          controller: _code,
          autofocus: true,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          autofillHints: const [AutofillHints.oneTimeCode],
          style: const TextStyle(fontSize: 30, letterSpacing: 10, fontWeight: FontWeight.w800),
          decoration: const InputDecoration(counterText: '', hintText: '••••••'),
          onChanged: (v) {
            setState(() => _error = null);
            if (v.length == 6) _submit();
          },
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 44,
          child: Center(
            child: _error != null
                ? Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error))
                : _info != null
                    ? Text(_info!, style: TextStyle(color: Theme.of(context).colorScheme.primary))
                    : null,
          ),
        ),
        FilledButton(
          onPressed: _code.text.length == 6 && !_busy ? _submit : null,
          child: _busy
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(t('যাচাই করুন', 'Verify')),
        ),
        const SizedBox(height: 14),
        Center(
          child: _left > 0
              ? Text('${t('নতুন কোড নিতে', 'Resend in')} ${t.n(_left)} ${t('সেকেন্ড', 'seconds')}')
              : TextButton(onPressed: _resend, child: Text(t('কোড আবার পাঠান', 'Resend code'))),
        ),
        Center(
          child: Text(t('স্প্যাম ফোল্ডারও দেখুন।', 'Check your spam folder too.'),
              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ),
      ]),
    );
  }
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingState();
}

class _OnboardingState extends ConsumerState<OnboardingScreen> {
  final _phone = TextEditingController();
  Division? _division;
  String? _district;
  bool _touched = false;

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  String _latin(String s) {
    const bn = '০১২৩৪৫৬৭৮৯';
    return s.replaceAllMapped(RegExp('[০-৯]'), (m) => bn.indexOf(m[0]!).toString());
  }

  String get _phoneNorm =>
      _latin(_phone.text).replaceAll(RegExp(r'[\s-]'), '').replaceFirst(RegExp(r'^\+?88'), '');

  bool get _phoneOk => RegExp(r'^01[3-9]\d{8}$').hasMatch(_phoneNorm);

  void _finish() {
    setState(() => _touched = true);
    if (_district == null || !_phoneOk) return;
    ref.read(authProvider.notifier).completeOnboarding(district: _district!, phone: _phoneNorm);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.tx;
    final isBn = t.isBn;
    return AuthShell(
      title: t('আপনার এলাকা', 'Your area'),
      subtitle: t('কাছের মানুষের সাথে মেলাতে আমাদের এটা দরকার। পাবলিকে শুধু এলাকা দেখানো হবে।',
          "We use this to match you with people nearby. Only your area is shown publicly."),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        DropdownButtonFormField<Division>(
          initialValue: _division,
          decoration: InputDecoration(labelText: t('বিভাগ', 'Division')),
          items: [for (final d in divisions) DropdownMenuItem(value: d, child: Text(isBn ? d.bn : d.en))],
          onChanged: (d) => setState(() {
            _division = d;
            _district = null;
          }),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          key: ValueKey(_division?.id),
          initialValue: _district,
          decoration: InputDecoration(
            labelText: t('জেলা', 'District'),
            errorText: _touched && _district == null ? t('জেলা বাছুন', 'Choose your district') : null,
          ),
          items: [for (final d in _division?.districts ?? const <String>[]) DropdownMenuItem(value: d, child: Text(d))],
          onChanged: _division == null ? null : (d) => setState(() => _district = d),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: t('মোবাইল নম্বর', 'Mobile number'),
            hintText: '01XXXXXXXXX',
            helperText: t('শুধু চ্যাটে সম্মতির পর শেয়ার হবে', 'Shared only after both agree in chat'),
            errorText: _touched && !_phoneOk ? t('সঠিক বাংলাদেশি নম্বর দিন', 'Enter a valid Bangladesh number') : null,
          ),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 22),
        FilledButton(onPressed: _finish, child: Text(t('শুরু করুন', 'Get started'))),
      ]),
    );
  }
}
