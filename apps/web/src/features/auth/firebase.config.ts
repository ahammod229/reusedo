import { UI_PREVIEW } from "@/shared/uiPreview";
/// <reference types="node" />
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const getEnvVar = (viteKey: unknown, nodeKey?: string): string | undefined => {
  if (typeof viteKey === "string") return viteKey;
  if (typeof process !== "undefined" && process.env) {
    return process.env[nodeKey || ""];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey:
    (UI_PREVIEW ? "ui-preview" : undefined) ??
    getEnvVar(
      (import.meta as unknown as { env: Record<string, string> }).env?.VITE_FIREBASE_API_KEY,
      "VITE_FIREBASE_API_KEY",
    ),
  authDomain: getEnvVar(
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_FIREBASE_AUTH_DOMAIN,
    "VITE_FIREBASE_AUTH_DOMAIN",
  ),
  projectId: getEnvVar(
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_FIREBASE_PROJECT_ID,
    "VITE_FIREBASE_PROJECT_ID",
  ),
  storageBucket: getEnvVar(
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_FIREBASE_STORAGE_BUCKET,
    "VITE_FIREBASE_STORAGE_BUCKET",
  ),
  messagingSenderId: getEnvVar(
    (import.meta as unknown as { env: Record<string, string> }).env
      ?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: getEnvVar(
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_FIREBASE_APP_ID,
    "VITE_FIREBASE_APP_ID",
  ),
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Local development without a Firebase project: `firebase emulators:start --only auth`
// and VITE_FIREBASE_AUTH_EMULATOR="http://127.0.0.1:9099" (the API then needs
// FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099").
const emulator = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR as string | undefined;
if (emulator && import.meta.env.DEV) connectAuthEmulator(auth, emulator, { disableWarnings: true });

export { app, auth };
