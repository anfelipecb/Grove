-- Allow users to reschedule (PATCH) their own scheduled_tasks (calendar drag-and-drop).
create policy "profile-owned scheduled_tasks update"
  on public.scheduled_tasks for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = scheduled_tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = scheduled_tasks.profile_id
      and p.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
  );
