# Pronto Mobile Starter

This folder now contains:

- ✅ **Step 1**: Phone/email auth + profile setup
- ✅ **Step 2**: Home feed with category filters + nearby sort using device location
- ✅ **Step 3**: Listing detail + request booking/order
- ✅ **Step 4**: Order status timeline
- ✅ **Step 5**: In-app chat per order
- ✅ **Step 6**: Ratings and reviews
- ✅ **Step 7**: Push notifications

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
- SQL migrations for `profiles`, `listings`, `orders`, `messages`, `reviews`, and push notification tables with RLS + transition enforcement

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
