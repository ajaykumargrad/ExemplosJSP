-- Step 2: listings feed + category/location filtering support
create table if not exists public.listings (
  id bigint generated always as identity primary key,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  price_cents integer not null check (price_cents >= 0),
  lat double precision,
  lng double precision,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.handle_listings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
before update on public.listings
for each row
execute function public.handle_listings_updated_at();

-- RLS
alter table public.listings enable row level security;

-- Active listings are public-readable by authenticated users
create policy "listings_select_active"
on public.listings
for select
to authenticated
using (is_active = true);

-- Providers can create their own listings
create policy "listings_insert_own"
on public.listings
for insert
to authenticated
with check (auth.uid() = provider_id);

-- Providers can update their own listings
create policy "listings_update_own"
on public.listings
for update
to authenticated
using (auth.uid() = provider_id)
with check (auth.uid() = provider_id);

-- Optional seed data for local development
insert into public.listings (provider_id, title, description, category, price_cents, lat, lng)
select p.id, 'Express grocery pickup', 'Get essentials in under 30 minutes.', 'grocery', 1899, 40.758, -73.9855
from public.profiles p
limit 1
on conflict do nothing;
