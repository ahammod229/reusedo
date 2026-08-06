import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle escaped newlines in environment variable
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
};

export const adminAuth = getAuth(initializeFirebaseAdmin());
