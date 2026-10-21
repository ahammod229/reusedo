import { apiSource } from "./apiSource";
import { mockSource } from "./mockSource";
import { USE_MOCK } from "./mode";
import type { DataSource } from "./types";

export { USE_MOCK };
export const source: DataSource = USE_MOCK ? mockSource : apiSource;
