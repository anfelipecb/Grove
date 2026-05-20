alter table public.tasks
  add column if not exists difficulty text check (difficulty in ('low', 'medium', 'high'));
