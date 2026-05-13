alter table public.profiles
  add column if not exists schedule_profile jsonb;
