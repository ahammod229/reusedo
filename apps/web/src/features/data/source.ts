import { UI_PREVIEW } from "@/shared/uiPreview";
import { mockSource } from "./mockSource";
import { supabaseSource } from "./supabaseSource";
import type { DataSource } from "./types";

/**
 * Real data (Supabase) everywhere except local development with VITE_USE_MOCK=true (or the UI-preview switch).
 * `import.meta.env.DEV` is false in production builds, so the mock can never be on in a deployed site.
 */
export const USE_MOCK = import.meta.env.DEV && (UI_PREVIEW || import.meta.env.VITE_USE_MOCK === "true");
export const source: DataSource = USE_MOCK ? mockSource : supabaseSource;
