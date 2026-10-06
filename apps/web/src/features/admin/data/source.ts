import { USE_MOCK } from "@/features/data/source";
import { adminApi } from "./apiSource";
import { adminMock } from "./mockSource";
import type { AdminSource } from "./types";

export const adminSource: AdminSource = USE_MOCK ? adminMock : adminApi;
