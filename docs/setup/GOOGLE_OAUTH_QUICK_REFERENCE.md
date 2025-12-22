# 🎯 Google OAuth Setup - Quick Reference Card

## 📋 Credentials (Save This!)

```
CLIENT ID:
209846430791-l4ei3c5c6jmaeml3srb6v5q0v7s6i706.apps.googleusercontent.com

CLIENT SECRET:
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
```

---

## ⚡ 3-Step Setup Process

### STEP 1: Open Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/auth/providers

### STEP 2: Add Google Credentials
**Location:** Authentication → Third-Party Auth → Google

1. Toggle **Enable** to ON
2. Paste **Client ID** (above)
3. Paste **Client Secret** (above)
4. Click **Save**

### STEP 3: Test & Verify
**Production:** https://hostel-management-topaz-ten.vercel.app/login  
**Local Dev:** http://localhost:3000/login

---

## 🔗 Redirect URIs (Already Configured)

✓ https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback  
✓ https://hostel-management-topaz-ten.vercel.app/auth/callback  
✓ http://localhost:3000/auth/callback  

---

## 🧪 Test Account

```
Email: realtest@hostel.com
Password: testpass123
```

---

## ✅ Verification Checklist

After configuration:

- [ ] Google button appears on login page
- [ ] Can click "Sign in with Google"
- [ ] Redirected to Google consent screen
- [ ] Can sign in with Google account
- [ ] Redirected back to app
- [ ] User is logged in
- [ ] Profile created in Supabase auth users
- [ ] No error messages in console

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Redirect URI mismatch" | Check URL matches exactly (case-sensitive) |
| "Invalid client" | Verify Client ID is complete and correct |
| No Google button | May need to add UI component to login page |
| User not created | Check Supabase RLS policies |
| Session issues | Clear cookies, check redirect URI domain |

---

## 📁 Related Files

- `GOOGLE_OAUTH_CREDENTIALS.md` - Full reference guide
- `setup-google-oauth-credentials.ps1` - Automated setup
- `GOOGLE_OAUTH_IMPLEMENTATION_GUIDE.md` - Complete implementation guide

---

## 🔐 Security

⚠️ **NEVER:**
- Commit credentials to git
- Share Secret publicly
- Hardcode in JavaScript

✅ **DO:**
- Use environment variables
- Store in Supabase securely
- Rotate if compromised

---

## 📞 Quick Links

- Supabase: https://supabase.com/dashboard
- Google Cloud: https://console.cloud.google.com
- HostelMate App: https://hostel-management-topaz-ten.vercel.app
- Docs: See `GOOGLE_OAUTH_CREDENTIALS.md`

---

**Status:** ✅ Credentials Created - Ready to Configure  
**Time to Complete:** ~5 minutes  
**Difficulty:** Easy

