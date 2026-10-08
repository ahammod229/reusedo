-- Email OTP verification (PRD §4.1). Server-side only: RLS on, no policies, so
-- only the service-role key used by the API can read or write these rows.
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
    firebase_uid TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
