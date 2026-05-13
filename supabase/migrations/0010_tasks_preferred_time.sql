alter table public.tasks
  add column if not exists preferred_time text
    not null default 'flexible'
    check (preferred_time in ('morning','afternoon','evening','flexible'));
