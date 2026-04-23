# Pronto Mobile Starter

This folder now contains:

- ✅ **Step 1**: Phone/email auth + profile setup
- ✅ **Step 2**: Home feed with category filters + nearby sort using device location
- ✅ **Step 3**: Listing detail + request booking/order
- ✅ **Step 4**: Order status timeline
- ✅ **Step 5**: In-app chat per order
- ✅ **Step 6**: Ratings and reviews
- ✅ **Step 7**: Push notifications
- ✅ **Step 8**: Production hardening

## What is implemented

- OTP sign-in with **email** or **phone**
- Session persistence using AsyncStorage
- Profile setup screen (`full_name`, `phone`)
- Home feed that loads active `listings` from Supabase
- Horizontal category filters (`all`, `delivery`, `beauty`, `services`, `grocery`)
- Foreground location permission + distance sorting (closest first)
- Route guard:
  - Not signed in -> Auth screen
  - Signed in but no profile name -> Profile setup
  - Profile completed -> Home feed and listing detail
- Listing detail screen with one-tap order request (`orders` insert with `requested` status)
- My Orders timeline screen with status progression actions (accept, in progress, complete, cancel)
- Realtime-ready order chat screen (`OrderChat`) with message list and composer
- Review flow (`ReviewOrder`) to rate completed orders and save feedback
- Notification provider to register Expo push tokens and react to order status changes
- Edge Function `order-actions` for server-side validated order creation/status updates
- Hardening migration with strict transition authorization, audit events, and rate-limit hooks
- SQL migrations for `profiles`, `listings`, `orders`, `messages`, `reviews`, and push notification/security tables with RLS + transition enforcement

## Run locally

1. Create project env file:

```bash
cp .env.example .env
```

2. Fill these values from Supabase project settings:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. Install and start app:

```bash
npm install
npm run start
```

## Apply migrations

Inside this `mobile` folder:

```bash
supabase db push
```

(or paste migration SQL in Supabase SQL editor if you are not using the CLI yet)

## Notes

- Phone auth requires SMS provider configured in Supabase.
- If location permission is denied, the app still loads listings but skips distance sorting.
- For production, add anti-abuse rate limits and audit logs in Edge Functions.


## Deploy edge functions

```bash
supabase functions deploy order-actions
```

Invoke from the app/backend with a Supabase JWT in `Authorization` header.


## Suggested next milestones

1. **Provider app controls**
   - Create/edit listings screens
   - Availability slots + blackout dates
   - Pause/reactivate listings

2. **Payments and escrow**
   - Stripe PaymentIntent + webhook confirmation
   - Mark orders paid before moving to `in_progress`
   - Payout-ready reporting for providers

3. **Admin + trust and safety**
   - Admin moderation dashboard for listings/reviews/messages
   - Report/block user flows
   - Fraud rules (velocity checks, device fingerprint flags)

4. **Observability + operations**
   - Sentry crash + performance monitoring
   - Centralized audit log explorer
   - Alerting on failed edge function calls / error spikes

5. **Testing + CI/CD**
   - Unit tests for status transition helpers
   - Integration tests for edge functions and RLS assumptions
   - GitHub Actions pipeline for lint/typecheck/test/migrations dry-run


## Immediate next step recommendation

Implement **Stripe PaymentIntent + webhook reconciliation** next, then gate `in_progress` transitions to paid orders only. This gives you revenue safety and cleaner provider payouts.


## Run on your phone (Expo Go)

1. Install **Expo Go** on your phone:
   - iOS: App Store
   - Android: Play Store

2. In terminal (inside `mobile/`):

```bash
npm install
cp .env.example .env
# edit .env with your real Supabase URL + anon key
supabase db push
supabase functions deploy order-actions
npm run start
```

3. Open the app:
   - iOS: use Camera app to scan the QR code shown by Expo.
   - Android: open Expo Go and scan the QR code.

4. If connection fails:
   - press `s` in Expo terminal to switch to **tunnel** mode
   - ensure phone and laptop share internet (same Wi-Fi is easiest)

## Test checklist on mobile

- Sign in with email OTP and phone OTP
- Complete profile setup
- Open feed and change categories
- Open a listing and create request
- Update order status from timeline
- Send chat messages in an order
- Submit a review on completed order
- Verify notification prompt appears
