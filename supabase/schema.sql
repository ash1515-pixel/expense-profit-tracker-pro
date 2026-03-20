create table if not exists businesses (
  id text primary key,
  user_id uuid not null,
  name text not null,
  sector text,
  created_at date,
  inserted_at timestamptz default now()
);

create table if not exists entries (
  id text primary key,
  user_id uuid not null,
  business_id text not null,
  date date not null,
  type text not null,
  amount numeric not null,
  category text,
  item_name text,
  vendor text,
  note text,
  inserted_at timestamptz default now()
);

alter table businesses enable row level security;
alter table entries enable row level security;

drop policy if exists "businesses owner policy" on businesses;
drop policy if exists "entries owner policy" on entries;

create policy "businesses owner policy"
on businesses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "entries owner policy"
on entries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
