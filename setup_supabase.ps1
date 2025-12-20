$ErrorActionPreference = "Stop"

Write-Host "Setting up Supabase..." -ForegroundColor Green

# Check if npx is available
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js and npx are required. Please install Node.js."
    exit 1
}

# Project Reference
$PROJECT_REF = "uyertzuadcneniblfzcs"

Write-Host "Linking to Supabase project: $PROJECT_REF"
Write-Host "You will be asked for your database password."

# Link project
npx supabase link --project-ref $PROJECT_REF

if ($LASTEXITCODE -eq 0) {
    Write-Host "Project linked successfully." -ForegroundColor Green
    
    Write-Host "Pushing database schema..."
    npx supabase db push

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database schema applied successfully!" -ForegroundColor Green
        Write-Host "You can now start the application with: npm run dev"
    } else {
        Write-Error "Failed to push database schema."
    }
} else {
    Write-Error "Failed to link project. Please check your password and try again."
}
