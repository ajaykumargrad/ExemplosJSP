-- Step 6: ratings and reviews
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  order_id bigint not null unique references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row
execute function public.handle_reviews_updated_at();

alter table public.reviews enable row level security;

-- participants can read reviews tied to their orders
create policy "reviews_select_participant"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = reviews.order_id
      and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
  )
);

-- customer can insert review for completed order
create policy "reviews_insert_customer_completed"
on public.reviews
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = reviews.order_id
      and o.customer_id = auth.uid()
      and o.provider_id = reviews.reviewee_id
      and o.status = 'completed'
  )
);

-- customer can edit own review
create policy "reviews_update_customer_own"
on public.reviews
for update
to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());
