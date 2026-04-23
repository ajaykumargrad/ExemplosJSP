-- Step 3: listing detail + booking/order request
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  listing_id bigint not null references public.listings(id),
  status text not null check (status in ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.handle_orders_updated_at();

alter table public.orders enable row level security;

-- Users can read only orders where they are customer or provider
create policy "orders_select_participant"
on public.orders
for select
to authenticated
using (auth.uid() = customer_id or auth.uid() = provider_id);

-- Customers can create order requests for themselves
create policy "orders_insert_customer"
on public.orders
for insert
to authenticated
with check (
  auth.uid() = customer_id
  and customer_id <> provider_id
  and status = 'requested'
);

-- Either participant can update status
create policy "orders_update_participant"
on public.orders
for update
to authenticated
using (auth.uid() = customer_id or auth.uid() = provider_id)
with check (auth.uid() = customer_id or auth.uid() = provider_id);
