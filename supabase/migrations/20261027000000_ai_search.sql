-- AI search: Gemini reads the search text and widens it into the words posts use.
-- Admin → Feature flags can switch it off; search then falls back to plain matching.

insert into public.feature_flags (key, label, description, enabled) values
  ('ai_search', 'AI দিয়ে খোঁজা', 'খোঁজার কথা বুঝে বাংলা-ইংরেজি সমার্থক শব্দেও মিল খোঁজে (Gemini)', true)
on conflict (key) do nothing;
