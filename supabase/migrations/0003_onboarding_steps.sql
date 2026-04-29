-- Track onboarding completion (0 = not started, 5 = complete) for auth redirects.
alter table public.profiles
  add column if not exists onboarding_step integer not null default 0
  check (onboarding_step >= 0 and onboarding_step <= 5);

-- Optional weights per life domain (0-100), set during onboarding step 3.
alter table public.profiles
  add column if not exists xp_domain_weights jsonb not null default '{}'::jsonb;

create index if not exists profiles_onboarding_step_idx on public.profiles (onboarding_step);
