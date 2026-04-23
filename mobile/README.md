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


## Visual Studio Code setup (step by step)

1. Open VS Code.
2. `File -> Open Folder...` and choose the `mobile` folder.
3. Open terminal in VS Code: `Terminal -> New Terminal`.
4. Run install:

```bash
npm install
```

5. Create env file:

```bash
cp .env.example .env
```

6. In VS Code Explorer, open `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

7. Login and link Supabase CLI (if not already):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

8. Apply database migrations:

```bash
supabase db push
```

9. Deploy edge function:

```bash
supabase functions deploy order-actions
```

10. Start app:

```bash
npm run start
```

11. Scan QR with Expo Go (phone) and test flows.

Tip: In VS Code terminal, press `s` to switch Expo to tunnel mode if QR connection fails.


## Windows ENOENT fix (package.json not found)

If you see:

```text
npm error enoent Could not read package.json ... C:\Users\ADMIN\package.json
```

you are running `npm install` in the wrong folder.

Use this exact flow in PowerShell:

```powershell
cd "C:\Users\ADMIN\New folder\ExemplosJSP\mobile"
Get-ChildItem package.json
npm install
npm run start
```

If `Get-ChildItem package.json` fails, you are not in the `mobile` directory yet.


## Windows fix: "not a git repository" + ENOENT

If you see both errors:

- `fatal: not a git repository (or any of the parent directories): .git`
- `npm ERR! enoent Could not read package.json ... C:\Users\ADMIN\package.json`

it means you are in a folder that is **not** the cloned repo and npm is running outside the app folder.

Use this exact clean setup in PowerShell:

```powershell
# 1) Go to a parent workspace
cd "C:\Users\ADMIN\Documents\GitHub"

# 2) Fresh clone (if folder does not exist)
git clone https://github.com/ajaykumargrad/ExemplosJSP.git

# 3) Enter repo root (must contain .git)
cd .\ExemplosJSP
Get-ChildItem .git

# 4) Enter mobile app folder (must contain package.json)
cd .\mobile
Get-ChildItem package.json

# 5) Install and run
npm install
cp .env.example .env
npm run start
```

If `Get-ChildItem .git` fails, you're not at repo root.
If `Get-ChildItem package.json` fails, you're not in `mobile`.


## Start coding from App.tsx

After `npm run start`, open this file in VS Code:

- `mobile/App.tsx`

This project already mounts providers and navigation there. Edit the screen content/components and save — Expo Fast Refresh will update your phone automatically.

Quick open from terminal:

```powershell
code App.tsx
```


## Are login and other pages already created?

Yes. These screens are already in the project:

- `src/features/auth/AuthScreen.tsx` (login with OTP)
- `src/features/profile/ProfileSetupScreen.tsx`
- `src/features/listings/HomeFeedScreen.tsx`
- `src/features/listings/ListingDetailScreen.tsx`
- `src/features/orders/OrderTimelineScreen.tsx`
- `src/features/orders/OrderChatScreen.tsx`
- `src/features/orders/ReviewOrderScreen.tsx`

To see them on mobile:

1. In `mobile/` run `npm run start`
2. Scan QR in Expo Go
3. Flow on first run:
   - AuthScreen -> ProfileSetupScreen -> HomeFeedScreen
   - then open a listing to reach detail/orders/chat/review flows


## Seeing "open App.tsx to start working on your app" screen?

That screen means you are running the default Expo template, not this scaffolded app UI yet.

Check in `mobile/` terminal:

```powershell
Get-ChildItem .\src\features
Get-Content .\App.tsx
```

Expected `App.tsx` imports:

- `AuthProvider`
- `NotificationProvider`
- `RootNavigator`

If those imports are missing, you are on a fresh Expo template. Pull/switch to the branch that contains this scaffold, then restart Expo:

```powershell
git branch
npm run start -- --clear
```


## SDK 54 / Expo Go compatibility fix

If Expo Go says your device uses SDK 54 but project is SDK 53, run:

```powershell
cd .\mobile
npm install
npm run doctor
npm run start -- --clear
```

This project is pinned to Expo SDK 54 in `package.json`.

If you see `ENOENT ... scandir ... mobile\assets`, ensure the assets folder exists:

```powershell
mkdir assets
```

(An `assets/.gitkeep` file is included in this repo to avoid this issue.)
