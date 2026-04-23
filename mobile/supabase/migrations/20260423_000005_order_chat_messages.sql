-- Step 5: in-app chat messages per order
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- participants can read messages for their orders
create policy "messages_select_participant"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = messages.order_id
      and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
  )
);

-- participants can send messages in their orders
create policy "messages_insert_participant"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = messages.order_id
      and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
  )
);
