-- pomodoro_settings: per-user preferences
create table if not exists public.pomodoro_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pomodoro_minutes integer not null default 20,
  short_break_minutes integer not null default 5,
  long_break_minutes integer not null default 15,
  long_break_after_sessions integer not null default 2,
  play_sound boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.pomodoro_settings enable row level security;

create policy if not exists "Users manage their settings"
on public.pomodoro_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- pomodoro_sessions: session history
create table if not exists public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('pomodoro','short_break','long_break')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  completed boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pomodoro_sessions enable row level security;

create policy if not exists "Users manage their sessions"
on public.pomodoro_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
