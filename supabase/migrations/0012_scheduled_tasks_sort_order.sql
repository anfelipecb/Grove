alter table public.scheduled_tasks
  add column if not exists sort_order integer not null default 0;
