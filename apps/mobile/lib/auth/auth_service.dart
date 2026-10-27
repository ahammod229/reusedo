import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Same Firebase project as the website, so one account works in both.
class AuthService {
  static final _auth = FirebaseAuth.instance;

  static Future<void> signIn(String email, String password) =>
      _auth.signInWithEmailAndPassword(email: email.trim(), password: password);

  static Future<void> register(String name, String email, String password) async {
    final cred = await _auth.createUserWithEmailAndPassword(email: email.trim(), password: password);
    await cred.user?.updateDisplayName(name.trim());
    await cred.user?.sendEmailVerification();
  }

  /// Google: a popup on the web, the system browser sheet on phones (no extra SDK setup).
  static Future<void> google() async {
    final provider = GoogleAuthProvider()..setCustomParameters({'prompt': 'select_account'});
    if (kIsWeb) {
      await _auth.signInWithPopup(provider);
    } else {
      await _auth.signInWithProvider(provider);
    }
  }

  static Future<void> resetPassword(String email) => _auth.sendPasswordResetEmail(email: email.trim());

  static Future<void> sendVerification() async => _auth.currentUser?.sendEmailVerification();

  /// Re-reads the account; true once the email link was clicked. Refreshes the token so the
  /// API sees `email_verified` straight away.
  static Future<bool> checkVerified() async {
    final u = _auth.currentUser;
    if (u == null) return false;
    await u.reload();
    final fresh = _auth.currentUser;
    if (fresh?.emailVerified == true) {
      await fresh!.getIdToken(true);
      return true;
    }
    return false;
  }

  static Future<void> signOut() => _auth.signOut();
}

/// Firebase error codes in plain words.
String authMessage(Object e, String Function(String, String) tr) {
  final code = e is FirebaseAuthException ? e.code : '';
  switch (code) {
    case 'invalid-credential':
    case 'wrong-password':
    case 'user-not-found':
      return tr('ইমেইল বা পাসওয়ার্ড ভুল।', 'Wrong email or password.');
    case 'email-already-in-use':
      return tr('এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে।', 'An account with this email already exists.');
    case 'weak-password':
      return tr('পাসওয়ার্ড অন্তত ৬ অক্ষরের দিন।', 'Use at least 6 characters.');
    case 'invalid-email':
      return tr('ইমেইল ঠিকানাটা ঠিক নেই।', "That email address isn't valid.");
    case 'too-many-requests':
      return tr('অনেকবার চেষ্টা হয়েছে। একটু পরে আবার চেষ্টা করুন।', 'Too many attempts. Try again later.');
    case 'network-request-failed':
      return tr('ইন্টারনেট সংযোগ দেখুন।', 'Check your internet connection.');
    case 'web-context-canceled':
    case 'popup-closed-by-user':
    case 'canceled':
      return '';
    default:
      return tr('কিছু ভুল হয়েছে। আবার চেষ্টা করুন।', 'Something went wrong. Please try again.');
  }
}
