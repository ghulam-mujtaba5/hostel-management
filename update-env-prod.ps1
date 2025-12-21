# Update Vercel production environment variables with correct Supabase keys

$vars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://uyertzuadcneniblfzcs.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDYzMzgsImV4cCI6MjA4MTgyMjMzOH0.16ZA3tQW1M7fxLo8xKuB1pjYur9WgmiJ7HTqcT51NqI"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI0NjMzOCwiZXhwIjoyMDgxODIyMzM4fQ.tTfCR_L8LChfJDzYTNTWNI_Q0Ywh4C0H8MecVuQLqe8"
}

Write-Host "Adding environment variables to Vercel production..."

foreach ($key in $vars.Keys) {
    $value = $vars[$key]
    Write-Host "Adding $key..."
    
    # Use Vercel CLI to add variable - it will prompt for environment
    # We need to use the interactive mode or stdin to select production
    $output = "production" | npx vercel env add $key --value "$value" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Added $key"
    } else {
        Write-Host "✗ Failed to add $key"
        Write-Host $output
    }
}

Write-Host ""
Write-Host "Environment variables updated. Redeploying..."
npx vercel deploy --prod --yes
