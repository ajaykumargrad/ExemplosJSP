-- Step 7: push notifications plumbing
create table if not exists public.user_push_tokens (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id bigint references public.orders(id) on delete set null,
  channel text not null check (channel in ('push', 'email', 'sms', 'in_app')),
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_user_push_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_push_tokens_updated_at on public.user_push_tokens;
create trigger trg_user_push_tokens_updated_at
before update on public.user_push_tokens
for each row
execute function public.handle_user_push_tokens_updated_at();

alter table public.user_push_tokens enable row level security;
alter table public.notification_events enable row level security;

create policy "push_tokens_select_own"
on public.user_push_tokens
for select
to authenticated
using (user_id = auth.uid());

create policy "push_tokens_insert_own"
on public.user_push_tokens
for insert
to authenticated
with check (user_id = auth.uid());

create policy "push_tokens_update_own"
on public.user_push_tokens
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notification_events_select_own"
on public.notification_events
for select
to authenticated
using (user_id = auth.uid());

create policy "notification_events_insert_own"
on public.notification_events
for insert
to authenticated
with check (user_id = auth.uid());
