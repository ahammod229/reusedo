import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/prefs.dart';

/// Where someone is in sign-up. The router sends them to the matching screen.
enum AuthStage { signedOut, needsVerify, needsOnboarding, signedIn }

class AuthState {
  const AuthState({
    this.stage = AuthStage.signedOut,
    this.email = '',
    this.name = '',
    this.district = '',
    this.phone = '',
  });
  final AuthStage stage;
  final String email;
  final String name;
  final String district;
  final String phone;

  AuthState copyWith({AuthStage? stage, String? email, String? name, String? district, String? phone}) =>
      AuthState(
        stage: stage ?? this.stage,
        email: email ?? this.email,
        name: name ?? this.name,
        district: district ?? this.district,
        phone: phone ?? this.phone,
      );
}

class AuthFailure implements Exception {
  const AuthFailure(this.code);
  final String code; // invalid_credentials | email_in_use | invalid_code | network
}

/// Sign-in/up behind one interface. `MockAuthRepository` accepts any well-formed
/// account so the app can be reviewed; the Firebase version replaces it and
/// calls the same email-code endpoints as the web app.
abstract class AuthRepository {
  Future<void> signIn(String email, String password);
  Future<void> register(String name, String email, String password);
  Future<void> sendCode();
  Future<void> verifyCode(String code);
  Future<void> signOut();
}

class MockAuthRepository implements AuthRepository {
  @override
  Future<void> signIn(String email, String password) async =>
      Future<void>.delayed(const Duration(milliseconds: 500));

  @override
  Future<void> register(String name, String email, String password) async =>
      Future<void>.delayed(const Duration(milliseconds: 500));

  @override
  Future<void> sendCode() async => Future<void>.delayed(const Duration(milliseconds: 300));

  @override
  Future<void> verifyCode(String code) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (code != '123456') throw const AuthFailure('invalid_code');
  }

  @override
  Future<void> signOut() async {}
}

final authRepositoryProvider = Provider<AuthRepository>((ref) => MockAuthRepository());

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    final p = ref.read(prefsProvider);
    final stage = AuthStage.values.asNameMap()[p.getString('auth_stage')] ?? AuthStage.signedOut;
    return AuthState(
      stage: stage,
      email: p.getString('auth_email') ?? '',
      name: p.getString('auth_name') ?? '',
      district: p.getString('auth_district') ?? '',
      phone: p.getString('auth_phone') ?? '',
    );
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  void _save(AuthState s) {
    final p = ref.read(prefsProvider);
    p.setString('auth_stage', s.stage.name);
    p.setString('auth_email', s.email);
    p.setString('auth_name', s.name);
    p.setString('auth_district', s.district);
    p.setString('auth_phone', s.phone);
    state = s;
  }

  Future<void> signIn(String email, String password) async {
    await _repo.signIn(email, password);
    _save(state.copyWith(
      stage: state.district.isEmpty ? AuthStage.needsOnboarding : AuthStage.signedIn,
      email: email,
      name: state.name.isEmpty ? email.split('@').first : state.name,
    ));
  }

  Future<void> register(String name, String email, String password) async {
    await _repo.register(name, email, password);
    await _repo.sendCode();
    _save(AuthState(stage: AuthStage.needsVerify, email: email, name: name));
  }

  Future<void> resendCode() => _repo.sendCode();

  Future<void> verify(String code) async {
    await _repo.verifyCode(code);
    _save(state.copyWith(stage: AuthStage.needsOnboarding));
  }

  void completeOnboarding({required String district, required String phone}) =>
      _save(state.copyWith(stage: AuthStage.signedIn, district: district, phone: phone));

  Future<void> signOut() async {
    await _repo.signOut();
    _save(const AuthState());
  }
}

final authProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
