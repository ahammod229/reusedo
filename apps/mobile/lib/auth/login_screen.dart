import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n.dart';
import '../core/prefs.dart';
import 'auth_service.dart';

/// Sign in and create account on one screen, with Google on top.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _register = false;
  bool _busy = false;
  bool _hide = true;
  String? _error;

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      final msg = authMessage(e, trOf(ref));
      if (mounted && msg.isNotEmpty) setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _submit() {
    final tr = trOf(ref);
    if (_register && _name.text.trim().length < 2) {
      setState(() => _error = tr('আপনার নাম লিখুন।', 'Enter your name.'));
      return;
    }
    _run(() => _register
        ? AuthService.register(_name.text, _email.text, _password.text)
        : AuthService.signIn(_email.text, _password.text));
  }

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => ref.read(langProvider.notifier).toggle(),
                        child: Text(tr('English', 'বাংলা')),
                      ),
                    ),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset('assets/icon.png', height: 72, width: 72),
                    ),
                    const SizedBox(height: 16),
                    Text('ReuseDo',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(tr('ফেলবেন না, দিয়ে দিন — পুরোটাই বিনামূল্যে।', "Don't throw it away, give it — free."),
                        textAlign: TextAlign.center, style: TextStyle(color: scheme.onSurfaceVariant)),
                    const SizedBox(height: 28),
                    OutlinedButton.icon(
                      onPressed: _busy ? null : () => _run(AuthService.google),
                      icon: const Text('G', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                      label: Text(tr('Google দিয়ে চালিয়ে যান', 'Continue with Google')),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      child: Row(children: [
                        const Expanded(child: Divider()),
                        Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(tr('অথবা', 'or'), style: TextStyle(color: scheme.onSurfaceVariant))),
                        const Expanded(child: Divider()),
                      ]),
                    ),
                    if (_register) ...[
                      TextField(
                        controller: _name,
                        textCapitalization: TextCapitalization.words,
                        autofillHints: const [AutofillHints.name],
                        decoration: InputDecoration(hintText: tr('আপনার নাম', 'Your name')),
                      ),
                      const SizedBox(height: 12),
                    ],
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: InputDecoration(hintText: tr('ইমেইল', 'Email')),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _password,
                      obscureText: _hide,
                      autofillHints: [_register ? AutofillHints.newPassword : AutofillHints.password],
                      onSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        hintText: tr('পাসওয়ার্ড', 'Password'),
                        suffixIcon: IconButton(
                          icon: Icon(_hide ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                          onPressed: () => setState(() => _hide = !_hide),
                        ),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: TextStyle(color: scheme.error)),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_register ? tr('অ্যাকাউন্ট খুলুন', 'Create account') : tr('লগইন', 'Log in')),
                    ),
                    if (!_register)
                      TextButton(
                        onPressed: () async {
                          if (_email.text.trim().isEmpty) {
                            setState(() => _error = tr('আগে ইমেইল লিখুন।', 'Enter your email first.'));
                            return;
                          }
                          await _run(() => AuthService.resetPassword(_email.text));
                          if (context.mounted && _error == null) {
                            context.toast(tr('পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে', 'Password reset link sent'));
                          }
                        },
                        child: Text(tr('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot password?')),
                      ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => setState(() {
                        _register = !_register;
                        _error = null;
                      }),
                      child: Text(_register
                          ? tr('আগেই অ্যাকাউন্ট আছে? লগইন করুন', 'Have an account? Log in')
                          : tr('নতুন? অ্যাকাউন্ট খুলুন', 'New here? Create an account')),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
