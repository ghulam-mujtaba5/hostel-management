#!/usr/bin/env node

/**
 * CLI for Hostel Management System
 * Provides commands for development, testing, and deployment workflows
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const commands = {
  // Development commands
  'dev': {
    description: 'Start development server with hot reload',
    exec: () => execSync('npm run dev', { stdio: 'inherit' })
  },
  
  'build': {
    description: 'Build for production',
    exec: () => execSync('npm run build', { stdio: 'inherit' })
  },
  
  'start': {
    description: 'Start production server',
    exec: () => execSync('npm run start', { stdio: 'inherit' })
  },

  // Testing commands
  'test': {
    description: 'Run all Playwright E2E tests',
    exec: (args) => {
      const specFile = args[0] || '';
      const cmd = specFile 
        ? `npm run test:e2e -- e2e/${specFile}.spec.ts`
        : 'npm run test:e2e';
      execSync(cmd, { stdio: 'inherit' });
    },
    usage: 'cli test [spec-name]'
  },

  'test:debug': {
    description: 'Run tests in debug mode with headed browser',
    exec: (args) => {
      const specFile = args[0] || '';
      const cmd = specFile
        ? `npx playwright test --debug e2e/${specFile}.spec.ts`
        : 'npx playwright test --debug';
      execSync(cmd, { stdio: 'inherit' });
    },
    usage: 'cli test:debug [spec-name]'
  },

  'test:headed': {
    description: 'Run tests with headed browser (visible)',
    exec: (args) => {
      const specFile = args[0] || '';
      const cmd = specFile
        ? `npx playwright test --headed e2e/${specFile}.spec.ts`
        : 'npx playwright test --headed';
      execSync(cmd, { stdio: 'inherit' });
    },
    usage: 'cli test:headed [spec-name]'
  },

  'test:report': {
    description: 'Open HTML report from latest test run',
    exec: () => execSync('npx playwright show-report', { stdio: 'inherit' })
  },

  // Linting and type checking
  'lint': {
    description: 'Run ESLint on project',
    exec: () => execSync('npm run lint', { stdio: 'inherit' })
  },

  'lint:fix': {
    description: 'Run ESLint and auto-fix issues',
    exec: () => execSync('npm run lint -- --fix', { stdio: 'inherit' })
  },

  'type-check': {
    description: 'Run TypeScript type checking',
    exec: () => execSync('npx tsc --noEmit', { stdio: 'inherit' })
  },

  // Database commands
  'db:push': {
    description: 'Push pending migrations to Supabase',
    exec: () => execSync('npx supabase db push', { stdio: 'inherit' })
  },

  'db:pull': {
    description: 'Pull latest schema from Supabase',
    exec: () => execSync('npx supabase db pull', { stdio: 'inherit' })
  },

  'db:list': {
    description: 'List all migrations',
    exec: () => execSync('npx supabase migration list', { stdio: 'inherit' })
  },

  'migration:create': {
    description: 'Create new database migration',
    exec: (args) => {
      const name = args[0];
      if (!name) {
        console.error('Usage: cli migration:create <migration-name>');
        process.exit(1);
      }
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const filename = `supabase/migrations/${timestamp}_${name}.sql`;
      fs.writeFileSync(filename, `-- Migration: ${name}\n-- Created: ${new Date().toISOString()}\n\n`);
      console.log(`✓ Created migration: ${filename}`);
    },
    usage: 'cli migration:create <name>'
  },

  // Code generation
  'gen:types': {
    description: 'Generate TypeScript types from Supabase schema',
    exec: () => {
      console.log('Generating types from Supabase...');
      execSync('npx supabase gen types typescript --local > src/types/database.ts', { stdio: 'inherit' });
      console.log('✓ Types generated to src/types/database.ts');
    }
  },

  // Deployment
  'deploy:preview': {
    description: 'Deploy preview to Vercel',
    exec: () => execSync('vercel --prod', { stdio: 'inherit' })
  },

  'env:setup': {
    description: 'Setup environment variables',
    exec: () => {
      const envExample = `NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000`;
      
      if (!fs.existsSync('.env.local')) {
        fs.writeFileSync('.env.local', envExample + '\n');
        console.log('✓ Created .env.local template. Please update with your credentials.');
      } else {
        console.log('✓ .env.local already exists');
      }
    }
  },

  // Utility commands
  'clean': {
    description: 'Clean build artifacts and cache',
    exec: () => {
      ['node_modules/.cache', '.next', '.playwright', 'dist'].forEach(dir => {
        if (fs.existsSync(dir)) {
          execSync(`rm -rf ${dir}`, { stdio: 'inherit' });
        }
      });
      console.log('✓ Cleaned build artifacts');
    }
  },

  'info': {
    description: 'Display project information and status',
    exec: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      console.log(`\nProject: ${pkg.name} v${pkg.version}`);
      console.log(`Description: ${pkg.description}`);
      console.log('\nAvailable commands:');
      Object.entries(commands).forEach(([cmd, config]) => {
        console.log(`  ${cmd.padEnd(20)} - ${config.description}`);
      });
    }
  },

  'help': {
    description: 'Show this help message',
    exec: () => {
      console.log('\nHostel Management System CLI\n');
      Object.entries(commands).forEach(([cmd, config]) => {
        const usage = config.usage || `cli ${cmd}`;
        console.log(`${usage}`);
        console.log(`  ${config.description}\n`);
      });
    }
  }
};

// Main CLI handler
const [, , ...args] = process.argv;
const command = args[0] || 'help';

if (commands[command]) {
  try {
    commands[command].exec(args.slice(1));
  } catch (error) {
    console.error(`\n✗ Command failed: ${command}`);
    process.exit(1);
  }
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "cli help" for available commands');
  process.exit(1);
}
