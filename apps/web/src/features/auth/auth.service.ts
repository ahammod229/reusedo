import type { ForgotPasswordInput, LoginInput, RegisterInput } from "@/shared/validation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
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

  /** Re-reads emailVerified from Firebase and refreshes the token the API checks. */
  static async refreshVerification(): Promise<boolean> {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    return auth.currentUser.emailVerified;
  }
}
