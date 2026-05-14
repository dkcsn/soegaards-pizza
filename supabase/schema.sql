create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pizzas (
  id text primary key,
  name text not null,
  price integer not null,
  description text not null,
  ingredients text[] not null default '{}',
  active boolean not null default true,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  slot_id text not null,
  pickup_label text not null,
  pickup_time timestamptz not null,
  pizza_count integer not null,
  total integer not null,
  items jsonb not null default '[]',
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists status text not null default 'pending';

alter table public.orders
add column if not exists completed_at timestamptz;

alter table public.settings enable row level security;
alter table public.pizzas enable row level security;
alter table public.orders enable row level security;

drop policy if exists "public read settings" on public.settings;
drop policy if exists "public write settings" on public.settings;
drop policy if exists "public read pizzas" on public.pizzas;
drop policy if exists "public write pizzas" on public.pizzas;
drop policy if exists "public read orders" on public.orders;
drop policy if exists "public write orders" on public.orders;

create policy "public read settings"
on public.settings
for select
to anon
using (true);

create policy "public write settings"
on public.settings
for all
to anon
using (true)
with check (true);

create policy "public read pizzas"
on public.pizzas
for select
to anon
using (true);

create policy "public write pizzas"
on public.pizzas
for all
to anon
using (true)
with check (true);

create policy "public read orders"
on public.orders
for select
to anon
using (true);

create policy "public write orders"
on public.orders
for all
to anon
using (true)
with check (true);

insert into public.settings (key, value)
values ('daily_pizza_capacity', '{"value": 30}'::jsonb)
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('max_order_pizzas', '{"value": 8}'::jsonb)
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('release_control_enabled', '{"value": true}'::jsonb)
on conflict (key) do nothing;

insert into public.pizzas
  (id, name, price, description, ingredients, active, image_url, sort_order)
values
  ('margherita', 'Margherita', 145, 'San Marzano-tomat, Fior di Latte, frisk basilikum og olivenolie.', array['San Marzano-tomat', 'Fior di Latte', 'basilikum', 'olivenolie'], true, null, 10),
  ('marinara', 'Marinara', 145, 'San Marzano-tomat, hvidløg, oregano og olivenolie.', array['San Marzano-tomat', 'hvidløg', 'oregano', 'olivenolie'], true, null, 20),
  ('salame', 'Salame', 165, 'Tomat, Fior di Latte og italiensk salame.', array['tomat', 'Fior di Latte', 'italiensk salame'], true, null, 30),
  ('nduja', 'Nduja', 175, 'Tomat, Fior di Latte, nduja og rødløg.', array['tomat', 'Fior di Latte', 'nduja', 'rødløg'], true, null, 40),
  ('funghi', 'Funghi', 165, 'Fior di Latte, svampe, timian og olivenolie.', array['Fior di Latte', 'svampe', 'timian', 'olivenolie'], true, null, 50),
  ('bianca', 'Bianca', 155, 'Fior di Latte, ricotta, citron og sort peber.', array['Fior di Latte', 'ricotta', 'citron', 'sort peber'], true, null, 60)
on conflict (id) do nothing;
