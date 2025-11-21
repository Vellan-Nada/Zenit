create table if not exists public.reading_list_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  author text,
  notes text,
  status text not null check (status in ('want_to_read','reading','finished')) default 'want_to_read',
  background_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_reading_list_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reading_list_updated_at on public.reading_list_items;
create trigger trg_reading_list_updated_at
before update on public.reading_list_items
for each row execute function public.set_reading_list_updated_at();

alter table public.reading_list_items enable row level security;

create policy if not exists "Users select their reading list" on public.reading_list_items
for select using (auth.uid() = user_id);

create policy if not exists "Users insert their reading list" on public.reading_list_items
for insert with check (auth.uid() = user_id);

create policy if not exists "Users update their reading list" on public.reading_list_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users delete their reading list" on public.reading_list_items
for delete using (auth.uid() = user_id);
