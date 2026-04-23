-- Step 8: production hardening

-- 1) Security + audit primitives
create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity text not null,
  entity_id text,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.rate_limit_events enable row level security;
alter table public.audit_events enable row level security;

create policy "rate_limit_events_select_own"
on public.rate_limit_events
for select
to authenticated
using (user_id = auth.uid());

create policy "rate_limit_events_insert_own"
on public.rate_limit_events
for insert
to authenticated
with check (user_id = auth.uid());

-- app users can read own audit events
create policy "audit_events_select_own"
on public.audit_events
for select
to authenticated
using (actor_id = auth.uid());

-- inserts are reserved for server-side execution
revoke insert on public.audit_events from authenticated;

-- 2) generic rate-limit helper
create or replace function public.enforce_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*)
    into v_count
  from public.rate_limit_events
  where user_id = p_user_id
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    raise exception 'Rate limit exceeded for action %', p_action;
  end if;

  insert into public.rate_limit_events (user_id, action)
  values (p_user_id, p_action);
end;
$$;

-- 3) stricter status transition authorization
create or replace function public.enforce_order_status_transition_strict()
returns trigger
language plpgsql
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();

  -- immutable fields for regular users
  if old.customer_id <> new.customer_id
     or old.provider_id <> new.provider_id
     or old.listing_id <> new.listing_id
     or old.total_cents <> new.total_cents then
    raise exception 'Immutable order fields cannot be changed';
  end if;

  if old.status = new.status then
    return new;
  end if;

  if old.status in ('cancelled', 'completed') then
    raise exception 'Cannot transition from terminal status %', old.status;
  end if;

  if old.status = 'requested' and new.status = 'accepted' and v_actor = old.provider_id then
    return new;
  end if;

  if old.status = 'requested' and new.status = 'cancelled' and v_actor = old.customer_id then
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'in_progress' and v_actor = old.provider_id then
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'cancelled' and v_actor = old.customer_id then
    return new;
  end if;

  if old.status = 'in_progress' and new.status = 'completed' and v_actor = old.provider_id then
    return new;
  end if;

  raise exception 'Unauthorized or invalid transition % -> % by %', old.status, new.status, v_actor;
end;
$$;

drop trigger if exists trg_orders_status_transition on public.orders;
create trigger trg_orders_status_transition
before update on public.orders
for each row
execute function public.enforce_order_status_transition_strict();

-- 4) anti-abuse hooks on high-frequency writes
create or replace function public.enforce_message_insert_rate_limit()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_rate_limit(auth.uid(), 'message_insert', 25, 60);
  return new;
end;
$$;

drop trigger if exists trg_messages_rate_limit on public.messages;
create trigger trg_messages_rate_limit
before insert on public.messages
for each row
execute function public.enforce_message_insert_rate_limit();

create or replace function public.enforce_order_create_rate_limit()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_rate_limit(auth.uid(), 'order_create', 8, 300);
  return new;
end;
$$;

drop trigger if exists trg_orders_create_rate_limit on public.orders;
create trigger trg_orders_create_rate_limit
before insert on public.orders
for each row
execute function public.enforce_order_create_rate_limit();
