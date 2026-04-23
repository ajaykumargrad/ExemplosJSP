-- Step 4: enforce timeline status transitions
create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  -- cancelled and completed are terminal states
  if old.status in ('cancelled', 'completed') then
    raise exception 'Cannot transition from terminal status %', old.status;
  end if;

  if old.status = 'requested' and new.status in ('accepted', 'cancelled') then
    return new;
  end if;

  if old.status = 'accepted' and new.status in ('in_progress', 'cancelled') then
    return new;
  end if;

  if old.status = 'in_progress' and new.status = 'completed' then
    return new;
  end if;

  raise exception 'Invalid order status transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists trg_orders_status_transition on public.orders;
create trigger trg_orders_status_transition
before update on public.orders
for each row
execute function public.enforce_order_status_transition();
