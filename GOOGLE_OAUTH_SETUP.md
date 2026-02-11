# Google OAuth Setup Guide

This guide explains how to configure Google OAuth with Supabase for Evendi.

## Step 1: Supabase Configuration (Already Done ✅)

You've already enabled Google OAuth in Supabase and added your Google credentials. Great!

## Step 2: Verify Redirect URLs in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Scroll to **Authorized redirect URIs**
3. Make sure these are added (or your specific domain):
   ```
   http://localhost:8081/oauth-callback
   https://your-github-codespaces-domain.app.github.dev/oauth-callback
   exp://YOUR_PROJECT_ID@YOUR_DOMAIN/--/oauth-callback
   ```

## Step 3: Code Implementation (Done ✅)

The OAuth flow is now implemented:

**New file created:** `/workspaces/evendi/client/lib/supabase-auth.ts`
- `signInWithGoogle()` - Opens Google login in browser
- `getSession()` - Gets current session
- `signOut()` - Logs out user

**Updated files:**
- `CoupleLoginScreen.tsx` - Added Google OAuth button
- `VendorLoginScreen.tsx` - Added Google OAuth button

## Step 4: How It Works

### For Couples:

1. User taps **"Logg inn med Google"** button
2. Browser opens Google login
3. User authenticates with Google
4. Session is created and stored in AsyncStorage
5. User is redirected to Messages screen

**Code:**
```typescript
const session = await signInWithGoogle();
if (session && session.user) {
  const coupleSession: CoupleSession = {
    sessionToken: session.access_token,
    coupleId: session.user.id,
    email: session.user.email,
    displayName: session.user.user_metadata?.full_name,
  };
  await AsyncStorage.setItem(COUPLE_STORAGE_KEY, JSON.stringify(coupleSession));
  navigation.replace("Messages");
}
```

### For Vendors:

Same flow, but vendor status still needs approval. Currently shows alert that vendor account needs to be verified.

## Step 5: Testing

1. Start the app: `npm run expo:dev`
2. Go to couple or vendor login
3. Tap **"Logg inn med Google"** button
4. Browser should open Google login
5. After authentication, should be logged in

## Dependencies

Make sure these are installed (they should be):
- `@supabase/supabase-js` ✅
- `expo-web-browser` ✅ (for opening browser)
- `expo-auth-session` ✅ (for OAuth flow)

## Environment Variables

Already set in `.env.local`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://osoeogkzyeecxxwtcwyy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Troubleshooting

**"Browser not opening for Google login"**
- Make sure `expo-web-browser` is imported
- Check browser permissions on device

**"Redirect URL mismatch"**
- Add the exact redirect URL to Supabase
- Check for https vs http

**"Session not persisting"**
- AsyncStorage key might be wrong
- Check that COUPLE_STORAGE_KEY or VENDOR_STORAGE_KEY is correct

**"User email not showing"**
- Google OAuth may not include email
- Check `session.user.user_metadata`

## Next Steps

1. ✅ Test Google login
2. ✅ Verify both couple and vendor flows work
3. ✅ Consider adding phone/email verification for new Google users
4. ✅ Add Google account linking for existing users
