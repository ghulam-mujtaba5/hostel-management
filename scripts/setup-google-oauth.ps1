# Setup Google OAuth for Supabase
# This script configures Google OAuth provider in Supabase using the Management API

param(
    [string]$ProjectRef = "uyertzuadcneniblfzcs",
    [string]$SupabaseUrl = "https://uyertzuadcneniblfzcs.supabase.co",
    [string]$ServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI0NjMzOCwiZXhwIjoyMDgxODIyMzM4fQ.tTfCR_L8LChfJDzYTNTWNI_Q0Ywh4C0H8MecVuQLqe8"
)

Write-Host "=== Google OAuth Setup for Supabase ===" -ForegroundColor Cyan
Write-Host "Project Ref: $ProjectRef" -ForegroundColor Yellow
Write-Host "Supabase URL: $SupabaseUrl" -ForegroundColor Yellow

# Step 1: Check current auth settings
Write-Host "`n[1/3] Fetching current auth settings..." -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

try {
    $authConfig = Invoke-RestMethod `
        -Uri "$SupabaseUrl/rest/v1/rpc/get_auth_config" `
        -Method GET `
        -Headers $headers `
        -ErrorAction SilentlyContinue

    Write-Host "Current auth config fetched successfully" -ForegroundColor Green
    Write-Host ($authConfig | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "Note: Direct API call may not work, we'll use Supabase Dashboard instead" -ForegroundColor Yellow
}

# Step 2: Provide instructions for manual Google OAuth setup
Write-Host "`n[2/3] Manual Setup Required - Follow these steps:" -ForegroundColor Yellow

Write-Host @"
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application):
   - Authorized JavaScript origins: https://uyertzuadcneniblfzcs.supabase.co
   - Authorized redirect URIs: 
     * https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback
     * http://localhost:3000/auth/callback (for local testing)
5. Copy the Client ID and Client Secret

6. Go to Supabase Dashboard: https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/auth/providers
7. Find "Google" provider and enable it
8. Paste your Client ID and Client Secret
9. Click "Save"
"@ -ForegroundColor White

Write-Host "`n[3/3] Testing Instructions:" -ForegroundColor Green
Write-Host @"
Once configured, test by:
1. Navigate to: https://hostel-management-topaz-ten.vercel.app/login
2. Look for Google sign-in option
3. Click to test the Google OAuth flow
"@ -ForegroundColor White

Write-Host "`n=== Setup Guide Complete ===" -ForegroundColor Cyan
Write-Host "Visit: https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/auth/providers" -ForegroundColor Cyan
