import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase.config";
import type { LoginInput, RegisterInput, ForgotPasswordInput } from "@reusedo/validation";

// biome-ignore lint/complexity/noStaticOnlyClass: Used as a namespace for auth methods
export class AuthService {
  static async login(data: LoginInput) {
    return signInWithEmailAndPassword(auth, data.email, data.password);
  }

  static async register(data: RegisterInput) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    await updateProfile(userCredential.user, {
      displayName: data.displayName,
    });
    await sendEmailVerification(userCredential.user);
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

  static async sendVerificationEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    throw new Error("No authenticated user.");
  }

  static async getIdToken(): Promise<string | null> {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  }
}
