-- Supabase schema reference for EverDay
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique,
  full_name text,
  avatar_url text,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  message text not null,
  created_at timestamptz default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  task text not null,
  status text default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.pomodoros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  config jsonb default '{}'::jsonb,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table public.reading_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  author text,
  status text default 'planned',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  format text,
  status text default 'planned',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  entry_date date default current_date,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.source_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text,
  payload jsonb,
  created_at timestamptz default now()
);

create table public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text,
  response text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table public.subscriptions (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  status text,
  current_period_end timestamptz,
  plan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_session_id text,
  amount integer,
  currency text default 'usd',
  type text,
  status text,
  created_at timestamptz default now()
);

-- Example RLS policies will be added when each table is wired up.
