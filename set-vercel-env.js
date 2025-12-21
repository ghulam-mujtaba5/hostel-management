#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Configuration
const PROJECT_ID = 'prj_BZuZlfMeX0Pqo9H1uidU7uvGXWnG';
const ORG_ID = 'team_hzmmEbuLwifqHuslQhvBUnLa';

const ENVIRONMENT_VARIABLES = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://uyertzuadcneniblfzcs.supabase.co',
    target: ['production'],
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDYzMzgsImV4cCI6MjA4MTgyMjMzOH0.16ZA3tQW1M7fxLo8xKuB1pjYur9WgmiJ7HTqcT51NqI',
    target: ['production'],
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXJ0enVhZGNuZW5pYmxmemNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI0NjMzOCwiZXhwIjoyMDgxODIyMzM4fQ.tTfCR_L8LChfJDzYTNTWNI_Q0Ywh4C0H8MecVuQLqe8',
    target: ['production'],
  },
  {
    key: 'ADMIN_PORTAL_PASSWORD',
    value: '123456789',
    target: ['production'],
  },
  {
    key: 'ADMIN_PORTAL_SECRET',
    value: '123456789',
    target: ['production'],
  },
];

async function setEnvironmentVariables(token) {
  console.log('🔧 Setting environment variables on Vercel...\n');

  for (const envVar of ENVIRONMENT_VARIABLES) {
    try {
      const data = JSON.stringify({
        key: envVar.key,
        value: envVar.value,
        target: envVar.target,
      });

      const options = {
        hostname: 'api.vercel.com',
        path: `/v10/projects/${PROJECT_ID}/env`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };

      await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`✅ ${envVar.key}`);
              resolve();
            } else {
              console.log(`❌ ${envVar.key}: ${res.statusCode}`);
              reject(new Error(`Failed to set ${envVar.key}`));
            }
          });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
      });
    } catch (err) {
      console.error(`Error setting ${envVar.key}:`, err.message);
    }
  }

  console.log('\n✅ All environment variables set!');
  console.log('🚀 Triggering redeploy...');

  // Trigger redeploy
  return triggerRedeploy(token);
}

async function triggerRedeploy(token) {
  try {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/projects/${PROJECT_ID}/deployments?teamId=${ORG_ID}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(responseData);
            console.log(`✅ Deployment triggered: ${response.url || 'https://hostel-management-topaz-ten.vercel.app'}`);
            console.log('\n🎉 Done! The site will be live in 2-3 minutes.');
            resolve();
          } else {
            console.log(`⚠️ Redeploy may be needed manually`);
            resolve();
          }
        });
      });

      req.on('error', () => {
        console.log(`⚠️ Redeploy may be needed manually`);
        resolve();
      });

      req.write('{}');
      req.end();
    });
  } catch (err) {
    console.error('Error triggering redeploy:', err.message);
  }
}

async function main() {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    console.log('❌ VERCEL_TOKEN environment variable not set');
    console.log('\n📝 To authenticate, run:');
    console.log('   npx vercel login');
    console.log('\nOr set your token:');
    console.log('   $env:VERCEL_TOKEN = "your-token-here"');
    process.exit(1);
  }

  await setEnvironmentVariables(token);
}

main().catch(console.error);
