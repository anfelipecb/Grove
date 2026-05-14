alter table public.scheduled_tasks
  add column if not exists start_time text
    check (start_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  add column if not exists duration_minutes integer not null default 30
    check (duration_minutes > 0 and duration_minutes <= 480);

create index if not exists scheduled_tasks_date_time_idx
  on public.scheduled_tasks (profile_id, scheduled_date, start_time);
