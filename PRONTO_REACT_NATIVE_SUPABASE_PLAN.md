# Pronto-like Mobile App with React Native + Supabase

> ✅ Step 1 (Phone/email auth + profile setup) now has a starter implementation in `mobile/`.
> ✅ Step 2 (home feed with category filters + nearby sorting) is also scaffolded in `mobile/`.
> ✅ Step 3 (listing detail + booking/order request) is scaffolded in `mobile/`.
> ✅ Step 4 (order status timeline) is scaffolded in `mobile/`.
> ✅ Step 5 (in-app chat per order) is scaffolded in `mobile/`.
> ✅ Step 6 (ratings and reviews) is scaffolded in `mobile/`.
> ✅ Step 7 (push notifications) is scaffolded in `mobile/`.
> ✅ Step 8 (production hardening: edge validation + strict authorization + rate limits) is scaffolded in `mobile/`. See `mobile/README.md`.

This guide gives you a practical starter architecture to build a **Pronto-style app** (fast onboarding, location-aware listings, bookings/orders, in-app chat, and payments).

---

## 1) Recommended stack

- **React Native**: Expo + TypeScript
- **Navigation**: React Navigation
- **State/data**: TanStack Query + Zustand
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Maps**: `react-native-maps` or Mapbox
- **Push notifications**: Expo Notifications
- **Payments**: Stripe (via Supabase Edge Functions)

---

## 2) MVP feature set

Build in this order:

1. Phone/email auth + profile setup
2. Home feed (nearby items/services)
3. Detail page + booking/order request
4. Order status timeline (requested -> accepted -> in progress -> completed)
5. In-app chat for each order
6. Ratings/reviews
7. Push notifications

---

## 3) Supabase database design (MVP)

```sql
-- Users profile
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role text check (role in ('customer', 'provider', 'admin')) default 'customer',
  created_at timestamptz default now()
);

-- Listings/services
create table public.listings (
  id bigint generated always as identity primary key,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null,
  category text not null,
  lat double precision,
  lng double precision,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Orders/bookings
create table public.orders (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  listing_id bigint not null references public.listings(id),
  status text not null check (status in ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  total_cents integer not null,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

-- Messages per order
create table public.messages (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- Ratings
create table public.reviews (
  id bigint generated always as identity primary key,
  order_id bigint unique not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
```

---

## 4) Row Level Security (essential)

Enable RLS on all tables and add policies like:

- `profiles`: users can read/update only their own row
- `listings`: everyone can read active listings; provider can write own listings
- `orders`: only customer/provider involved can read; customer creates; provider/customer can update status based on rules
- `messages`: only users in the order can read/send

---

## 5) React Native folder structure

```text
src/
  app/
    navigation/
  features/
    auth/
    listings/
    orders/
    chat/
    profile/
  components/
  lib/
    supabase.ts
    queryClient.ts
  store/
  hooks/
  types/
```

---

## 6) Supabase client setup

```ts
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

---

## 7) First sprint checklist (7 days)

- Day 1: Project bootstrap + auth flow
- Day 2: Profile + onboarding
- Day 3: Listings feed + filters (category/location)
- Day 4: Listing details + create order
- Day 5: Order status + realtime updates
- Day 6: Chat + push notifications
- Day 7: QA, analytics, app store prep

---

## 8) Production essentials

- Add server-side validation in **Edge Functions**
- Never trust client-side prices/status updates
- Add abuse protections (rate limits + report/block)
- Store secrets only in Supabase/CI env variables
- Add monitoring (Sentry + logs)

---

## 9) Suggested next command sequence

```bash
npx create-expo-app pronto-mobile -t expo-template-blank-typescript
cd pronto-mobile
npm i @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npm i @tanstack/react-query zustand
npx supabase init
```

Then create your tables/policies and wire the app screen by screen.

---

If you want, the next step can be a full **starter code scaffold** (navigation, auth context, listings, order creation, and realtime chat) ready to run.
