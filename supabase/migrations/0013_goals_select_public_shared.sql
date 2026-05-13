-- Allow community members to read other members' shared goals for their communities (RLS-safe).

create policy "community members select public shared goals"
  on public.goals for select
  to authenticated
  using (
    goals.community_id is not null
    and goals.is_public is true
    and public.current_user_is_member_of_community(goals.community_id)
  );
