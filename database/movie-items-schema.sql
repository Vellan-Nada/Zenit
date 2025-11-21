create table if not exists public.movie_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('to_watch','watching','watched')),
  title text,
  actor_actress text,
  director text,
  notes text,
  card_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint movie_items_nonempty check (
    coalesce(nullif(title, ''), nullif(actor_actress, ''), nullif(director, ''), nullif(notes, '')) is not null
  )
);

create or replace function public.set_movie_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_movie_items_updated_at on public.movie_items;
create trigger trg_movie_items_updated_at
before update on public.movie_items
for each row execute function public.set_movie_items_updated_at();

alter table public.movie_items enable row level security;

create policy if not exists "Users can insert their own movie items"
  on public.movie_items for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can select their own movie items"
  on public.movie_items for select
  using (auth.uid() = user_id);

create policy if not exists "Users can update their own movie items"
  on public.movie_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Users can delete their own movie items"
  on public.movie_items for delete
  using (auth.uid() = user_id);
