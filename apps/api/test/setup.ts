import { execSync } from "node:child_process";
import { vi } from "vitest";

// Point the API at the local stack. `supabase status` gives the current local keys.
if (!process.env.SUPABASE_URL) {
  const env = execSync("supabase status -o env", { cwd: `${__dirname}/../../..`, encoding: "utf8" });
  const get = (k: string) => env.match(new RegExp(`^${k}="?([^"\\n]+)"?`, "m"))?.[1];
  process.env.SUPABASE_URL = get("API_URL");
  process.env.SUPABASE_SERVICE_ROLE_KEY = get("SERVICE_ROLE_KEY");
  process.env.TEST_DB_URL = get("DB_URL");
}
process.env.SETTINGS_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
process.env.NODE_ENV = "test";

// Test tokens are "test:" + JSON of the decoded Firebase token.
vi.mock("../src/config/firebase-admin", () => ({
  adminAuth: {
    verifyIdToken: async (t: string) => {
      if (!t.startsWith("test:")) throw new Error("invalid token");
      return JSON.parse(t.slice(5));
    },
    deleteUser: async () => undefined,
    setCustomUserClaims: async () => undefined,
    updateUser: async () => undefined,
  },
}));
