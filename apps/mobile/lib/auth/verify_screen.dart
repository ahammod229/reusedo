import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n.dart';
import '../data/providers.dart';
import 'auth_service.dart';

/// Waits for the emailed verification link; checks again whenever the app comes back.
class VerifyScreen extends ConsumerStatefulWidget {
  const VerifyScreen({super.key});
  @override
  ConsumerState<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends ConsumerState<VerifyScreen> with WidgetsBindingObserver {
  bool _busy = false;
  String? _note;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState s) {
    if (s == AppLifecycleState.resumed) _check(quiet: true);
  }

  Future<void> _check({bool quiet = false}) async {
    final tr = trOf(ref);
    setState(() => _busy = true);
    try {
      if (await AuthService.checkVerified()) {
        ref.invalidate(meProvider);
      } else if (!quiet) {
        setState(() => _note = tr('এখনো যাচাই হয়নি। ইমেইলের লিংকে ক্লিক করে আবার চাপুন।',
            'Not verified yet. Click the link in the email, then try again.'));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = trOf(ref);
    final email = FirebaseAuth.instance.currentUser?.email ?? '';
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: scheme.primary.withValues(alpha: 0.12),
                    child: Icon(Icons.mark_email_read_outlined, size: 36, color: scheme.primary),
                  ),
                  const SizedBox(height: 20),
                  Text(tr('ইমেইল যাচাই করুন', 'Verify your email'),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(
                    tr('$email ঠিকানায় একটি লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে এখানে ফিরে আসুন।',
                        'We sent a link to $email. Click it, then come back here.'),
                    textAlign: TextAlign.center,
                    style: TextStyle(color: scheme.onSurfaceVariant),
                  ),
                  if (_note != null) ...[
                    const SizedBox(height: 12),
                    Text(_note!, textAlign: TextAlign.center, style: TextStyle(color: scheme.error)),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _busy ? null : _check,
                    child: Text(tr('আমি যাচাই করেছি', "I've verified")),
                  ),
                  TextButton(
                    onPressed: () async {
                      await AuthService.sendVerification();
                      if (context.mounted) context.toast(tr('নতুন লিংক পাঠানো হয়েছে', 'A new link has been sent'));
                    },
                    child: Text(tr('আবার লিংক পাঠান', 'Send the link again')),
                  ),
                  TextButton(
                    onPressed: AuthService.signOut,
                    child: Text(tr('অন্য ইমেইল ব্যবহার করুন', 'Use another email')),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
