# Wedflow Deployment & Launch Guide

This guide covers how to launch Wedflow beyond local Expo testing, including mobile store builds, web deployment, and backend server setup.

## Overview

Wedflow consists of two parts:
- Frontend (React Native via Expo) — mobile (Android/iOS) and web.
- Backend (Node/Express) — API and database access.

## Prerequisites
- Node.js 18+
- Expo account + EAS CLI (`npm install -g eas-cli`)
- Supabase project with Google OAuth enabled
- Environment variables configured in `.env.local`

## Environment Configuration
Ensure these are set in `.env.local` (already present in this repo):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_WEBSOCKET_URL`
- `ADMIN_SECRET` and `EXPO_PUBLIC_ADMIN_SECRET`
- `DATABASE_URL`

For Codespaces/GitHub dev domains, `EXPO_PUBLIC_DOMAIN` should match your current dev URL (see `package.json` script `expo:dev`).

## Backend Server (API)

### Development
```bash
npm run server:dev
```
- Starts the Express server using `tsx` on your dev machine.

### Production
1. Build the server bundle:
```bash
npm run server:build
```
2. Run in production:
```bash
npm run server:prod
```
Optional: Run behind a process manager like PM2 or a reverse proxy (NGINX). Ensure environment variables are provided to the process.

## Mobile App (Android/iOS)

### Why EAS (Expo Application Services)?
Expo is great for testing; production builds for app stores are created with EAS.

### Prepare
- Verify bundle identifiers in `app.json`:
  - iOS: `ios.bundleIdentifier`
  - Android: `android.package`
- Confirm app scheme is set: `scheme: "wedflow"` (used for OAuth deep links).
- In Supabase → Auth → Providers → Google, add authorized redirect URIs for store builds using your app scheme.

Examples (adjust to your app scheme and domain):
- `wedflow://oauth-callback`
- `https://YOUR_DOMAIN/oauth-callback`
- For Expo dev/client: `exp://localhost:19000/--/oauth-callback`

### Build
```bash
# Install and login once
npm install -g eas-cli
eas login

# Create Android build (APK/AAB)
eas build --platform android

# Create iOS build (requires Apple Developer account)
eas build --platform ios
```

### Submit to Stores
```bash
eas submit --platform android
# or
eas submit --platform ios
```

### Note on Redirect URIs
The OAuth flow uses `AuthSession.makeRedirectUri`. For production store builds, make sure the redirect URI matches your app scheme (e.g., `wedflow://oauth-callback`) and that the same value is added to Supabase Google provider settings.

## Web App

### Local Dev
```bash
npm run expo:dev
```
Serves the app locally via Expo dev server.

### Production Build (Static Web)
```bash
npm run expo:static:build
```
- Produces an optimized static web build. Deploy the generated output (configured by `scripts/build.js`) to a static host like Vercel, Netlify, or GitHub Pages.

### Alternative Local Production Preview
```bash
npm run expo:start:static:build
```
Starts the optimized, minified bundle locally for a quick production-like check.

## Google OAuth Checklist
- Supabase → Auth → Providers → Google: Enabled and credentials added.
- Authorized redirect URIs include your dev and prod values (Expo dev and app scheme):
  - `exp://localhost:19000/--/oauth-callback` (Expo dev)
  - `wedflow://oauth-callback` (app scheme for store builds)
  - Your deployed domain URL variant if using web.
- The mobile app scheme in `app.json` matches the redirect URI you add in Supabase.

## Testing Scenarios

### Mobile (Dev)
```bash
npm run expo:dev
```
- Scan QR with Expo Go or run on emulator/simulator.
- Test Google login from Couple/Vendor login screens.

### Backend + Mobile Integration
1. Start backend:
```bash
npm run server:dev
```
2. Start frontend:
```bash
npm run expo:dev
```
3. Verify API calls and Supabase interactions.

## Vendor Planner API (lightweight storage)
 - Endpoints (vendor auth required):
   - `GET /api/vendor/planner/meetings|tasks|timeline`
   - `POST /api/vendor/planner/meetings|tasks|timeline` (stores full array/object payload)
 - Storage: data is saved per vendor in `app_settings` with keys `vendor_planner_{kind}_{vendorId}` (no extra migrations).
 - Shapes used in the app:
   - Meetings: `{ id, coupleName, date, time?, location?, topic?, notes?, completed }[]`
   - Tasks: `{ id, title, dueDate, priority: 'high'|'medium'|'low', category?, notes?, completed }[]`
   - Timeline: simple object flags, e.g. `{ onboardingComplete?: boolean, firstMeetingDone?: boolean, contractSigned?: boolean, depositReceived?: boolean, masterTimelineCreated?: boolean }`
 Optional next step: migrate to Drizzle tables if you need relational queries or auditing.

## Troubleshooting
- If OAuth flow cancels: Ensure redirect URIs and app scheme match across code and Supabase.
- If images fail to upload: Confirm Supabase storage bucket policies and `EXPO_PUBLIC_SUPABASE_*` envs.
- If web build fails: Check `scripts/build.js` and ensure your static host supports single-page apps.

## Quick Commands Summary
```bash
# Backend
npm run server:build && npm run server:prod

# Mobile builds (EAS)
eas build --platform android
.eas build --platform ios

eas submit --platform android
.eas submit --platform ios

# Web
npm run expo:static:build
npm run expo:start:static:build
```

If you want, I can wire up CI/CD or add Docker/PM2 configs next.