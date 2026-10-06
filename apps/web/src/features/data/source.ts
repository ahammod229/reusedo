import { apiSource } from "./apiSource";
import { mockSource } from "./mockSource";
import type { DataSource } from "./types";

/** Mock data is the default until the backend is connected: set VITE_USE_MOCK=false to switch. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const source: DataSource = USE_MOCK ? mockSource : apiSource;
