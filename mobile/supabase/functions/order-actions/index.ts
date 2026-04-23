import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ActionPayload =
  | {
      action: 'create_order';
      listing_id: number;
    }
  | {
      action: 'update_status';
      order_id: number;
      next_status: 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    };

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const {
    data: { user },
    error: userError
  } = await admin.auth.getUser();

  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await req.json()) as ActionPayload;

  try {
    if (body.action === 'create_order') {
      await admin.rpc('enforce_rate_limit', {
        p_user_id: user.id,
        p_action: 'edge_create_order',
        p_limit: 8,
        p_window_seconds: 300
      });

      const { data: listing, error: listingError } = await admin
        .from('listings')
        .select('id, provider_id, price_cents, is_active')
        .eq('id', body.listing_id)
        .maybeSingle();

      if (listingError || !listing || !listing.is_active) {
        return json({ error: 'Listing unavailable' }, 400);
      }

      if (listing.provider_id === user.id) {
        return json({ error: 'Cannot order your own listing' }, 400);
      }

      const { data, error } = await admin
        .from('orders')
        .insert({
          customer_id: user.id,
          provider_id: listing.provider_id,
          listing_id: listing.id,
          status: 'requested',
          total_cents: listing.price_cents
        })
        .select('id, status')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ order: data }, 200);
    }

    if (body.action === 'update_status') {
      await admin.rpc('enforce_rate_limit', {
        p_user_id: user.id,
        p_action: 'edge_update_status',
        p_limit: 20,
        p_window_seconds: 300
      });

      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('id, customer_id, provider_id, status')
        .eq('id', body.order_id)
        .maybeSingle();

      if (orderError || !order) {
        return json({ error: 'Order not found' }, 404);
      }

      const isProvider = order.provider_id === user.id;
      const isCustomer = order.customer_id === user.id;

      const allowed =
        (order.status === 'requested' && body.next_status === 'accepted' && isProvider) ||
        (order.status === 'requested' && body.next_status === 'cancelled' && isCustomer) ||
        (order.status === 'accepted' && body.next_status === 'in_progress' && isProvider) ||
        (order.status === 'accepted' && body.next_status === 'cancelled' && isCustomer) ||
        (order.status === 'in_progress' && body.next_status === 'completed' && isProvider);

      if (!allowed) {
        return json({ error: 'Transition not allowed' }, 400);
      }

      const { data, error } = await admin
        .from('orders')
        .update({ status: body.next_status })
        .eq('id', body.order_id)
        .select('id, status')
        .single();

      if (error) return json({ error: error.message }, 400);

      await admin.from('audit_events').insert({
        actor_id: user.id,
        entity: 'orders',
        entity_id: String(body.order_id),
        action: 'status_update',
        payload: { from: order.status, to: body.next_status }
      });

      return json({ order: data }, 200);
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
