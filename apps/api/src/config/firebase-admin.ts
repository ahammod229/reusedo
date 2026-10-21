import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  // Verifying ID tokens only needs the project id (Google's public keys are fetched);
  // the service account is required for writes such as setting emailVerified.
  if (!privateKey) return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
};

export const adminAuth = getAuth(initializeFirebaseAdmin());
