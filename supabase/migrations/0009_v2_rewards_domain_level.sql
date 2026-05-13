alter table public.rewards
  add column if not exists domain text,
  add column if not exists unlock_level integer not null default 1;

comment on column public.rewards.domain is 'Life domain id (e.g. wellbeing); optional for legacy rows.';
comment on column public.rewards.unlock_level is 'Domain level (points // 100) required before redeeming.';

create index if not exists rewards_profile_domain_idx on public.rewards (profile_id, domain);

drop policy if exists "profile-owned reward redemptions insert" on public.reward_redemptions;

create policy "profile-owned reward redemptions insert"
  on public.reward_redemptions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = reward_redemptions.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
