import { AuthService } from "@/features/auth/auth.service";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | undefined;

/**
 * The browser talks to Supabase directly. Identity is the Firebase ID token (Supabase "Third-party Auth"), sent on
 * every request; row-level security decides what that person can see or change. The anon key is public by design.
 */
export function supabase(): SupabaseClient {
  if (!URL || !ANON) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set");
  client ??= createClient(URL, ANON, {
    accessToken: () => AuthService.getIdToken(),
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return client;
}

/** Public URL of a stored post photo (the bucket is public-read; uploads are restricted to the owner's folder). */
export const postImageUrl = (path: string) =>
  `${URL}/storage/v1/object/public/post-images/${path.split("/").map(encodeURIComponent).join("/")}`;

export class FunctionError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** Calls a Supabase Edge Function with the person's Firebase token. Errors carry the function's error code. */
export async function callFunction<T = unknown>(name: string, body: unknown): Promise<T> {
  if (!URL || !ANON) throw new Error("Supabase is not configured");
  const token = await AuthService.getIdToken();
  const res = await fetch(`${URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!res.ok) throw new FunctionError(data.error ?? "network", res.status);
  return data as T;
}
