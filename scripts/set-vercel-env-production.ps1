# Get the VERCEL_TOKEN from the authenticated Vercel CLI session
# The token should be stored in the Vercel local state

$projectId = "prj_h6usvj0FqB0RqsmHHaTliAgfrsUP"
$teamId = "team_ce7SYfESYSMqOxhzyDBNvJA6"

# Environment variables to set
$envVars = @(
    @{
        key = "NEXT_PUBLIC_SUPABASE_URL"
        value = "https://uyertzuadcneniblfzcs.supabase.co"
        target = @("production")
    },
    @{
        key = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDYzMzgsImV4cCI6MjA4MTgyMjMzOH0.16ZA3tQW1M7fxLo8xKuB1pjYur9WgmiJ7HTqcT51NqI"
        target = @("production")
    },
    @{
        key = "SUPABASE_SERVICE_ROLE_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI0NjMzOCwiZXhwIjoyMDgxODIyMzM4fQ.tTfCR_L8LChfJDzYTNTWNI_Q0Ywh4C0H8MecVuQLqe8"
        target = @("production")
    },
    @{
        key = "ADMIN_PORTAL_PASSWORD"
        value = "123456789"
        target = @("production")
    },
    @{
        key = "ADMIN_PORTAL_SECRET"
        value = "123456789"
        target = @("production")
    }
)

# Try to get the token from npx vercel env show
Write-Host "Getting authentication token..."

# Use Vercel CLI to set environment variables
$envVars | ForEach-Object {
    $key = $_.key
    $value = $_.value
    $target = $_.target -join ','
    
    Write-Host "Setting $key for production..."
    
    # Use the Vercel CLI which should have the token from npx vercel login
    # We'll try to use the REST API through a Node.js helper
}

# Use Node.js to call Vercel REST API
$nodeScript = @"
const https = require('https');
const fs = require('fs');

// Get token from Vercel CLI's auth
const authPath = process.env.USERPROFILE + '/.vercel/auth.json';
let token = null;

try {
  // Try to read from stored auth file
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  token = auth.token || auth.access_token;
} catch (e) {
  console.log('Auth file not found, token may be stored differently');
}

// If no token, try to get it from environment
if (!token) {
  token = process.env.VERCEL_TOKEN;
}

if (!token) {
  console.error('ERROR: Could not find VERCEL_TOKEN. Please set it manually or login with: npx vercel login');
  process.exit(1);
}

const projectId = 'prj_h6usvj0FqB0RqsmHHaTliAgfrsUP';
const teamId = 'team_ce7SYfESYSMqOxhzyDBNvJA6';

const envVars = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://uyertzuadcneniblfzcs.supabase.co' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDYzMzgsImV4cCI6MjA4MTgyMjMzOH0.16ZA3tQW1M7fxLo8xKuB1pjYur9WgmiJ7HTqcT51NqI' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI0NjMzOCwiZXhwIjoyMDgxODIyMzM4fQ.tTfCR_L8LChfJDzYTNTWNI_Q0Ywh4C0H8MecVuQLqe8' },
  { key: 'ADMIN_PORTAL_PASSWORD', value: '123456789' },
  { key: 'ADMIN_PORTAL_SECRET', value: '123456789' }
];

async function setEnvVar(key, value) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ value, target: ['production'] });
    
    const options = {
      hostname: 'api.vercel.com',
      path: '/v9/projects/' + projectId + '/env',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✓ Set ' + key);
          resolve(true);
        } else {
          console.error('✗ Failed to set ' + key + ': ' + body);
          reject(new Error('Failed to set ' + key));
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('✗ Error setting ' + key + ': ' + e.message);
      reject(e);
    });
    
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Setting environment variables for production...\n');
  
  try {
    for (const envVar of envVars) {
      await setEnvVar(envVar.key, envVar.value);
    }
    console.log('\n✓ All environment variables set successfully!');
  } catch (e) {
    console.error('\n✗ Error setting environment variables:', e.message);
    process.exit(1);
  }
}

main();
"@

$scriptPath = "$PSScriptRoot/set-env-api.js"
Set-Content -Path $scriptPath -Value $nodeScript -Encoding UTF8

Write-Host "Running Node.js script to set environment variables..."
node $scriptPath
