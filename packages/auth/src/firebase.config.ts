/// <reference types="node" />
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // biome-ignore lint/suspicious/noExplicitAny: Vite env vars
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  // biome-ignore lint/suspicious/noExplicitAny: Vite env vars
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  // biome-ignore lint/suspicious/noExplicitAny: Vite env vars
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  // biome-ignore lint/suspicious/noExplicitAny: Vite env vars
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  // biome-ignore lint/suspicious/noExplicitAny: Vite env vars
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // biome-ignore lint/suspicious/noExplicitAny: Vite env vars
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
