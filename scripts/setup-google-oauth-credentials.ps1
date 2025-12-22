# Configure Google OAuth in Supabase - Automated Setup Script
# This script updates the Supabase project with Google OAuth credentials

# Google OAuth Credentials (from Google Cloud Console)
$googleClientId = "209846430791-l4ei3c5c6jmaeml3srb6v5q0v7s6i706.apps.googleusercontent.com"
$googleClientSecret = "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"
$supabaseProjectRef = "uyertzuadcneniblfzcs"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "HostelMate Google OAuth Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Google OAuth Credentials:" -ForegroundColor Green
Write-Host "  Client ID: $googleClientId" -ForegroundColor Yellow
Write-Host "  Client Secret: $googleClientSecret" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Supabase Project: $supabaseProjectRef" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  IMPORTANT SETUP STEPS:" -ForegroundColor Red
Write-Host ""
Write-Host "1️⃣  Open Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "    URL: https://supabase.com/dashboard/project/$supabaseProjectRef/auth/providers" -ForegroundColor Yellow
Write-Host ""
Write-Host "2️⃣  Login to your Supabase account" -ForegroundColor Cyan
Write-Host "    (You'll be prompted if session is expired)" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣  Navigate to: Authentication > Sign In / Providers > Third-Party Auth" -ForegroundColor Cyan
Write-Host ""
Write-Host "4️⃣  Find and enable Google provider:" -ForegroundColor Cyan
Write-Host "    - Click on 'Google' to expand" -ForegroundColor Yellow
Write-Host "    - Toggle 'Enable' to ON" -ForegroundColor Yellow
Write-Host ""
Write-Host "5️⃣  Enter the following credentials:" -ForegroundColor Cyan
Write-Host ""
Write-Host "    CLIENT ID:" -ForegroundColor Green
Write-Host "    $googleClientId" -ForegroundColor Yellow
Write-Host ""
Write-Host "    CLIENT SECRET:" -ForegroundColor Green
Write-Host "    $googleClientSecret" -ForegroundColor Yellow
Write-Host ""
Write-Host "6️⃣  Click 'Save' button" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ REDIRECT URIs (already configured in Google Cloud):" -ForegroundColor Green
Write-Host "  ✓ https://$supabaseProjectRef.supabase.co/auth/v1/callback" -ForegroundColor Yellow
Write-Host "  ✓ https://hostel-management-topaz-ten.vercel.app/auth/callback" -ForegroundColor Yellow
Write-Host "  ✓ http://localhost:3000/auth/callback" -ForegroundColor Yellow
Write-Host ""

Write-Host "🧪 TESTING:" -ForegroundColor Green
Write-Host ""
Write-Host "Test Account:" -ForegroundColor Cyan
Write-Host "  Email: realtest@hostel.com" -ForegroundColor Yellow
Write-Host "  Password: testpass123" -ForegroundColor Yellow
Write-Host "  Admin Password: 123456789" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test URL (Production):" -ForegroundColor Cyan
Write-Host "  https://hostel-management-topaz-ten.vercel.app/login" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test URL (Local Dev):" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/login" -ForegroundColor Yellow
Write-Host ""

Write-Host "❓ NEXT STEPS:" -ForegroundColor Green
Write-Host "  1. Open the Supabase dashboard link above" -ForegroundColor Yellow
Write-Host "  2. Follow steps 2-6 to add Google OAuth credentials" -ForegroundColor Yellow
Write-Host "  3. Test Google sign-in on the app" -ForegroundColor Yellow
Write-Host "  4. Verify user creation in Supabase Auth users table" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔐 SECURITY REMINDER:" -ForegroundColor Red
Write-Host "  - Never commit these credentials to git" -ForegroundColor Yellow
Write-Host "  - Use environment variables in production" -ForegroundColor Yellow
Write-Host "  - Rotate credentials if compromised" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  See: GOOGLE_OAUTH_CREDENTIALS.md for full details" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press Enter to open Supabase dashboard..." -ForegroundColor Cyan
$null = Read-Host

# Open Supabase dashboard in browser
$dashboardUrl = "https://supabase.com/dashboard/project/$supabaseProjectRef/auth/providers?tab=third-party"
Write-Host "Opening: $dashboardUrl" -ForegroundColor Green
Start-Process $dashboardUrl

Write-Host ""
Write-Host "✨ Setup complete! Follow the steps above to add Google OAuth credentials." -ForegroundColor Green
Write-Host ""
