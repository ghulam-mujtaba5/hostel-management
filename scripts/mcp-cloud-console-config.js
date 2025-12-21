#!/usr/bin/env node

/**
 * MCP Cloud Console Configuration for HostelMate
 * 
 * Manages Google Cloud Console, Supabase, and Vercel settings
 * using MCP (Model Context Protocol) for automated setup and testing
 * 
 * Version: 2.0.0
 * Last Updated: 2025-12-21
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 1. MAIN CONFIGURATION OBJECT
// ==========================================

const mcpCloudConsoleSettings = {
  version: "2.0.0",
  timestamp: new Date().toISOString(),

  // ==========================================
  // GOOGLE CLOUD CONSOLE SETTINGS
  // ==========================================
  googleCloud: {
    project: {
      id: "hostel-management-oauth",
      name: "HostelMate OAuth Setup",
      createdAt: "2025-12-20",
      region: "global"
    },

    apis: [
      {
        name: 'Google+ API',
        serviceId: 'plus.googleapis.com',
        description: 'Used for user authentication and profile data',
        status: 'required',
      },
      {
        name: 'Cloud Resource Manager API',
        serviceId: 'cloudresourcemanager.googleapis.com',
        description: 'Required for project management',
        status: 'required',
      },
      {
        name: 'Cloud Identity API',
      serviceId: 'cloudidentity.googleapis.com',
      description: 'Optional: For advanced identity management',
      status: 'optional',
    },
  ],
  oauthScopes: {
    userinfo_email: 'https://www.googleapis.com/auth/userinfo.email',
    userinfo_profile: 'https://www.googleapis.com/auth/userinfo.profile',
    openid: 'openid',
  },
  authorizedOrigins: [
    'https://uyertzuadcneniblfzcs.supabase.co',
    'https://hostel-management-topaz-ten.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  redirectUris: [
    'https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback',
    'https://hostel-management-topaz-ten.vercel.app/auth/callback',
    'http://localhost:3000/auth/callback',
  ],
};

// Supabase Configuration
const SUPABASE_CONFIG = {
  auth: {
    externalOAuthProviders: ['google', 'github'],
    emailVerification: 'auto', // auto-confirm for OAuth
    sessionDuration: 3600, // 1 hour
    refreshTokenExpiry: 604800, // 7 days
  },
  settings: {
    siteName: 'HostelMate',
    siteUrl: 'https://hostel-management-topaz-ten.vercel.app',
    jwtSecret: 'your-jwt-secret-here',
    corsAllowedOrigins: [
      'https://hostel-management-topaz-ten.vercel.app',
      'http://localhost:3000',
      'https://uyertzuadcneniblfzcs.supabase.co',
    ],
  },
};

// Helper functions
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function printStep(number, title, description = '') {
  console.log(`\n[${number}] ${title}`);
  if (description) {
    console.log(`    ${description}`);
  }
}

function printCode(code, language = 'text') {
  console.log('\n```' + language);
  console.log(code);
  console.log('```\n');
}

function printChecklist(items) {
  console.log('\nChecklist:');
  items.forEach((item, i) => {
    console.log(`  [ ] ${item}`);
  });
}

function printTable(headers, rows) {
  const colWidths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => String(r[i]).length))
  );

  console.log('\n');
  // Header
  console.log(headers.map((h, i) => h.padEnd(colWidths[i])).join(' | '));
  console.log(colWidths.map(w => '-'.repeat(w)).join('-+-'));

  // Rows
  rows.forEach(row => {
    console.log(row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' | '));
  });
  console.log('');
}

// Main configuration steps
function configureGoogleCloud() {
  printSection('Google Cloud Console Setup');

  printStep(1, 'Create Google Cloud Project');
  console.log('Steps:');
  console.log('  1. Go to: https://console.cloud.google.com/');
  console.log('  2. Click "Select a project" → "New Project"');
  console.log('  3. Enter Project Name: "HostelMate"');
  console.log('  4. Click "Create"');
  console.log('  5. Wait for project creation (1-2 minutes)');

  printStep(2, 'Enable Required APIs');
  console.log('Required APIs to enable:');
  printTable(
    ['API Name', 'Service ID', 'Status'],
    CLOUD_CONSOLE_CONFIG.apis.map(api => [api.name, api.serviceId, api.status])
  );

  console.log('\nTo enable APIs:');
  console.log('  1. Go to: APIs & Services > Library');
  console.log('  2. Search for each API name above');
  console.log('  3. Click "Enable" for each');

  printStep(3, 'Create OAuth 2.0 Credentials');
  console.log('Steps:');
  console.log('  1. Go to: APIs & Services > Credentials');
  console.log('  2. Click "Create Credentials" > "OAuth 2.0 Client ID"');
  console.log('  3. Choose "Web application"');
  console.log('  4. Configure:');
  console.log('     Name: HostelMate OAuth');
  console.log('     Authorized JavaScript origins:');
  CLOUD_CONSOLE_CONFIG.authorizedOrigins.forEach(origin => {
    console.log(`       - ${origin}`);
  });
  console.log('     Authorized redirect URIs:');
  CLOUD_CONSOLE_CONFIG.redirectUris.forEach(uri => {
    console.log(`       - ${uri}`);
  });
  console.log('  5. Click "Create"');
  console.log('  6. Copy the Client ID and Client Secret');

  printStep(4, 'Create OAuth 2.0 Credential File');
  console.log('After creating credentials, download the JSON file:');
  console.log('  1. In Credentials page, click the OAuth credential you created');
  console.log('  2. Click the download icon (↓)');
  console.log('  3. Save as: client_secret.json');
  console.log('  4. Keep this file secure - never commit to git!');
}

function configureSupabase() {
  printSection('Supabase Configuration');

  printStep(1, 'Add Google Provider to Supabase');
  console.log('Steps:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/uyertzuadcneniblfzcs');
  console.log('  2. Navigate: Authentication > Providers > Sign In / Providers');
  console.log('  3. Find "Google" provider');
  console.log('  4. Click to enable/expand');
  console.log('  5. Paste your Google OAuth credentials:');
  console.log('     - Client ID: (from Google Cloud Console)');
  console.log('     - Client Secret: (from Google Cloud Console)');
  console.log('  6. Click "Save"');
  console.log('  7. Verify status shows "Active" with green checkmark');

  printStep(2, 'Verify URL Configuration');
  console.log('Ensure these are configured:');
  console.log('  Site URL: https://hostel-management-topaz-ten.vercel.app');
  console.log('  Redirect URLs:');
  SUPABASE_CONFIG.settings.corsAllowedOrigins.forEach(origin => {
    console.log(`    - ${origin}`);
  });
  console.log('  CORS Allowed Origins:');
  SUPABASE_CONFIG.settings.corsAllowedOrigins.forEach(origin => {
    console.log(`    - ${origin}`);
  });

  printStep(3, 'Configure Email Settings');
  console.log('For Google OAuth (auto-verified emails):');
  console.log('  Authentication > Email > Auto-confirm enabled');
  console.log('  This ensures Google OAuth users bypass email verification');
}

function testOAuthFlow() {
  printSection('OAuth Flow Testing with Playwright MCP');

  printStep(1, 'Test URLs');
  console.log('Test the login page on:');
  console.log(`  Local:      ${CONFIG.deployment.local}/login`);
  console.log(`  Production: ${CONFIG.deployment.vercel}/login`);

  printStep(2, 'Expected UI Elements');
  console.log('After configuration, login page should show:');
  console.log('  ✓ "Sign in with Google" button');
  console.log('  ✓ Google logo/branding');
  console.log('  ✓ Click redirects to Google login');

  printStep(3, 'Test Scenarios');
  const testScenarios = [
    'Click "Sign in with Google" button',
    'Redirected to Google login page',
    'Enter Google credentials',
    'Grant permission to app',
    'Redirected back to HostelMate',
    'User logged in and dashboard visible',
    'User profile created in Supabase',
    'Email auto-verified',
  ];
  printChecklist(testScenarios);

  printStep(4, 'Test Account Creation');
  console.log('Steps:');
  console.log('  1. Sign in with a new Google account');
  console.log('  2. Verify new profile is created in Supabase > Users');
  console.log('  3. Check email is automatically verified');
  console.log('  4. Verify user appears in profiles table');
}

function createTestCertificate() {
  printSection('Optional: Create Self-Signed Certificate for Local HTTPS');

  console.log('For testing OAuth locally with HTTPS:');
  printCode(`
# Generate private key
openssl genrsa -out localhost.key 2048

# Generate certificate
openssl req -new -x509 -key localhost.key -out localhost.crt -days 365

# Run Next.js with HTTPS
PORT=3001 npm run dev -- --experimental-https
`, 'bash');

  console.log('Then update authorized origins to include https://localhost:3001');
}

function generateEnvironmentTemplate() {
  printSection('Environment Variables Template');

  console.log('For .env.local (development):');
  printCode(`
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${CONFIG.supabase.url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Admin Portal
ADMIN_PORTAL_PASSWORD=123456789
ADMIN_PORTAL_SECRET=123456789

# Optional: Google OAuth (if not using Supabase provider)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
`, 'bash');

  console.log('\nFor Vercel production environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('  SUPABASE_SERVICE_ROLE_KEY');
  console.log('  ADMIN_PORTAL_PASSWORD');
  console.log('  ADMIN_PORTAL_SECRET');

  console.log('\nNote: Google OAuth credentials are stored in Supabase, no need for env vars');
}

function generateMCPTestScript() {
  printSection('MCP Test Script for Google OAuth');

  const testScript = `import { test, expect } from '@playwright/test';

const baseURL = 'https://hostel-management-topaz-ten.vercel.app';

test.describe('Google OAuth', () => {
  test('should show Google sign-in button on login page', async ({ page }) => {
    await page.goto(\`\${baseURL}/login\`);
    
    // Look for Google sign-in button
    const googleButton = page.locator('text=Sign in with Google, button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test('should redirect to Google login when clicking Google button', async ({ page }) => {
    await page.goto(\`\${baseURL}/login\`);
    
    const googleButton = page.locator('button:has-text("Google")');
    const [popup] = await Promise.all([
      page.context().waitForEvent('page'),
      googleButton.click()
    ]);
    
    // Verify we're on Google's login page
    await expect(popup).toHaveURL(/accounts.google.com/);
  });

  test('should complete Google OAuth flow', async ({ page, context }) => {
    // This test requires actual Google credentials
    // Skipped for automated testing
    
    test.skip(true, 'Manual test - requires actual Google account');
  });
});`;

  printCode(testScript, 'typescript');
}

function printSummary() {
  printSection('Configuration Summary');

  console.log('Project Information:');
  printTable(
    ['Key', 'Value'],
    [
      ['Project Name', CONFIG.project.name],
      ['Supabase Ref', CONFIG.supabase.projectRef],
      ['Supabase URL', CONFIG.supabase.url],
      ['Production URL', CONFIG.deployment.vercel],
      ['Development URL', CONFIG.deployment.local],
    ]
  );

  console.log('\nOAuth Providers:');
  CONFIG.oauth.providers.forEach(provider => {
    console.log(`  ✓ ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
  });

  console.log('\nAPIs to Enable:');
  CLOUD_CONSOLE_CONFIG.apis.forEach(api => {
    const status = api.status === 'required' ? '✓ REQUIRED' : '○ Optional';
    console.log(`  ${status}: ${api.name}`);
  });
}

// Run all configurations
function main() {
  console.clear();
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      HostelMate - Cloud Console & OAuth Configuration     ║');
  console.log('║                    MCP Test Suite                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  configureGoogleCloud();
  configureSupabase();
  testOAuthFlow();
  createTestCertificate();
  generateEnvironmentTemplate();
  generateMCPTestScript();
  printSummary();

  printSection('Next Steps');
  console.log('1. Configure Google Cloud Console (follow steps above)');
  console.log('2. Configure Supabase with Google OAuth credentials');
  console.log('3. Update authorized URIs in Google Cloud Console');
  console.log('4. Test the login page with "Sign in with Google" button');
  console.log('5. Run Playwright tests to verify OAuth flow');
  console.log('6. Deploy to production when ready');

  printSection('Support & Resources');
  console.log('Google OAuth Docs:   https://developers.google.com/identity/protocols/oauth2');
  console.log('Supabase Auth Docs:  https://supabase.com/docs/guides/auth/social-oauth');
  console.log('Cloud Console:       https://console.cloud.google.com/');
  console.log('Supabase Dashboard:  https://supabase.com/dashboard/project/uyertzuadcneniblfzcs');
  console.log('HostelMate App:      https://hostel-management-topaz-ten.vercel.app');

  console.log('\n✓ Configuration guide generated successfully!\n');
}

// Export for use as module
module.exports = {
  CONFIG,
  CLOUD_CONSOLE_CONFIG,
  SUPABASE_CONFIG,
};

// Run if executed directly
if (require.main === module) {
  main();
}
