# Google OAuth 2.0 Credentials - HostelMate

## ✅ Credentials Successfully Created!

### Google Cloud Console Credentials

**Project Name:** HostelMate Web Client  
**Project ID:** magnetic-blade-477119-d0  
**Created Date:** December 21, 2025, 2:50:04 PM GMT+5

#### OAuth 2.0 Client ID
```
209846430791-l4ei3c5c6jmaeml3srb6v5q0v7s6i706.apps.googleusercontent.com
```

#### OAuth 2.0 Client Secret
```
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
```

---

## Authorized Redirect URIs

The following redirect URIs have been configured in Google Cloud Console:

1. **Supabase Callback:**
   ```
   https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback
   ```

2. **Production (Vercel):**
   ```
   https://hostel-management-topaz-ten.vercel.app/auth/callback
   ```

3. **Local Development:**
   ```
   http://localhost:3000/auth/callback
   ```

---

## Next Steps: Configure in Supabase

### Step 1: Navigate to Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Log in with your Supabase account
3. Select project: **uyertzuadcneniblfzcs**

### Step 2: Access Auth Providers
1. Click on **Authentication** in the left sidebar
2. Click on **Sign In / Providers** (or **Providers**)
3. Click on the **Third-Party Auth** tab

### Step 3: Enable Google Provider
1. Find **Google** in the list of providers
2. Click on **Google** to expand the configuration
3. Toggle **Enable** to turn on Google OAuth

### Step 4: Add Credentials
1. In the **Client ID** field, paste:
   ```
   209846430791-l4ei3c5c6jmaeml3srb6v5q0v7s6i706.apps.googleusercontent.com
   ```

2. In the **Client Secret** field, paste:
   ```
   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
   ```

3. Click **Save** button

### Step 5: Verify Configuration
After saving, you should see:
- ✅ Google provider status: **Enabled**
- ✅ Green checkmark next to Google OAuth

---

## Testing the Integration

### Test Account Details
- **Email:** realtest@hostel.com
- **Password:** testpass123
- **Admin Password:** 123456789

### Test Google OAuth in App
1. Navigate to: https://hostel-management-topaz-ten.vercel.app/login
2. Look for "Sign in with Google" button
3. Click the button
4. You'll be redirected to Google's login
5. Sign in with your Google account
6. You'll be redirected back to the app
7. User account should be created/logged in

### Local Testing (if running locally)
1. Run the dev server: `npm run dev`
2. Navigate to: http://localhost:3000/login
3. Follow the same sign-in process

---

## Database Integration

### Supabase Auth Table
When a user signs in with Google, a new user record is automatically created in:
- **Table:** `auth.users`
- **Provider:** `google`
- **Email:** User's Google email

### User Profile Creation
A corresponding entry is created in:
- **Table:** `profiles`
- **Fields Populated:**
  - `id` (UUID from auth.users)
  - `email` (from Google)
  - `created_at` (timestamp)
  - Other fields can be updated after signup

---

## Environment Variables

These credentials are already configured in:
- **Production (Vercel):** Add via Vercel Dashboard → Settings → Environment Variables
- **Local Development:** Add to `.env.local` file (optional - Supabase handles this)

### Suggested `.env.local` entries (optional):
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=209846430791-l4ei3c5c6jmaeml3srb6v5q0v7s6i706.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

---

## Important Security Notes

⚠️ **CRITICAL:** Never commit these credentials to version control:
- ❌ Don't add to `.env.local` in git
- ❌ Don't hardcode in JavaScript files
- ✅ Use environment variables via Vercel/hosting platform
- ✅ Supabase handles credentials securely after configuration

### Credential Rotation
If credentials are compromised:
1. Delete the OAuth client from Google Cloud Console
2. Create a new OAuth client ID
3. Update credentials in Supabase
4. Update environment variables in deployment platform

---

## Troubleshooting

### Issue: "Redirect URI mismatch" error
**Solution:** Ensure the redirect URI exactly matches one of the three configured URIs (case-sensitive, including protocol and path)

### Issue: "Client not found" error
**Solution:** Verify Client ID is correct in Supabase - no extra spaces or characters

### Issue: Google button not appearing on login page
**Solution:** 
1. Verify Google provider is enabled in Supabase
2. Check that credentials are saved (refresh page)
3. Clear browser cache
4. Restart dev server if testing locally

### Issue: User not created after Google login
**Solution:**
1. Check Supabase RLS policies on profiles table
2. Verify profiles table has triggers for auth.users
3. Check Supabase audit logs for errors

---

## Reference Information

- **Supabase Project:** uyertzuadcneniblfzcs (South Asia/Mumbai region)
- **Google Cloud Project:** magnetic-blade-477119-d0 (My First Project)
- **Google Account Email:** ghulammujtaba4045@gmail.com
- **App Domain:** hostel-management-topaz-ten.vercel.app
- **App URL:** https://hostel-management-topaz-ten.vercel.app

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Providers Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Supabase Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

**Status:** ✅ Google OAuth 2.0 credentials successfully created and documented  
**Last Updated:** December 21, 2025  
**Next Action:** Add these credentials to Supabase dashboard

