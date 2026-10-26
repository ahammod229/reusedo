import type { ForgotPasswordInput, LoginInput, RegisterInput } from "@/shared/validation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase.config";

// biome-ignore lint/complexity/noStaticOnlyClass: Used as a namespace for auth methods
export class AuthService {
  static async login(data: LoginInput) {
    return signInWithEmailAndPassword(auth, data.email, data.password);
  }

  static async register(data: RegisterInput) {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await updateProfile(userCredential.user, {
      displayName: data.displayName,
    });
    return userCredential;
  }

  static async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  static async resetPassword(data: ForgotPasswordInput) {
    return sendPasswordResetEmail(auth, data.email);
  }

  static async logout() {
    return signOut(auth);
  }

  static async getIdToken(forceRefresh = false): Promise<string | null> {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken(forceRefresh);
    }
    return null;
  }

  /**
   * Firebase's own "verify your email" link, used while our 6-digit codes aren't set
   * up on the server. Coming back from the link lands on /verify-email, which re-checks.
   */
  static async sendVerificationLink(lang: "bn" | "en") {
    const user = auth.currentUser;
    if (!user) throw new Error("not_signed_in");
    auth.languageCode = lang;
    try {
      await sendEmailVerification(user, { url: `${window.location.origin}/verify-email` });
    } catch (e) {
      // The return address must be an authorized domain; the link still works without it.
      if ((e as { code?: string }).code !== "auth/unauthorized-continue-uri") throw e;
      await sendEmailVerification(user);
    }
  }

  /** Re-reads emailVerified from Firebase and refreshes the token the API checks. */
  static async refreshVerification(): Promise<boolean> {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    return auth.currentUser.emailVerified;
  }
}
