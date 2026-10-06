/// <reference types="node" />
import { getApp, getApps, initializeApp } from "firebase/app";
import { UI_PREVIEW } from "@/shared/uiPreview";
import { getAuth } from "firebase/auth";

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

export { app, auth };
