alter table public.profiles
  add column if not exists google_calendar_token jsonb;
