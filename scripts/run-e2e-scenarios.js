#!/usr/bin/env node

/**
 * E2E Test Runner - Quick Start Script
 * 
 * Usage:
 *   npm run test:scenarios                 # Run all scenarios
 *   npm run test:scenarios -- --headed     # Run in headed mode (watch browser)
 *   npm run test:scenarios -- --debug      # Debug mode with inspector
 *   npm run test:scenarios -- --mobile     # Test on mobile viewports
 *   npm run test:scenarios -- --scenario 1 # Run specific scenario
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const isDebug = args.includes('--debug');
const isMobile = args.includes('--mobile');
const scenario = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];
const isReport = args.includes('--report');
const isVerbose = args.includes('--verbose') || args.includes('-v');

const scenarios = [
  { id: 1, name: 'Multi-User Space Creation', grep: 'Multi-User Space Creation' },
  { id: 2, name: 'Task Lifecycle', grep: 'Task Lifecycle' },
  { id: 3, name: 'Gamification', grep: 'Gamification' },
  { id: 4, name: 'Mobile Responsiveness', grep: 'Mobile Responsiveness' },
  { id: 5, name: 'Performance', grep: 'Performance' },
  { id: 6, name: 'Authentication & Security', grep: 'Authentication & Security' },
  { id: 7, name: 'Data Validation', grep: 'Data Validation' },
  { id: 8, name: 'Real-time Updates', grep: 'Real-time Updates' },
  { id: 9, name: 'Complete User Journey', grep: 'Complete User Journey' },
  { id: 10, name: 'Admin Features', grep: 'Admin Features' },
];

function printHeader() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         HostelMate E2E Testing Suite - MCP Enabled           ║');
  console.log('║                   Real User Scenario Testing                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

function printScenarios() {
  console.log('Available Scenarios:\n');
  scenarios.forEach(s => {
    console.log(`  ${s.id}. ${s.name}`);
  });
  console.log('\n');
}

function printUsage() {
  console.log('Usage:\n');
  console.log('  Run all scenarios:');
  console.log('    npm run test:scenarios\n');
  console.log('  Run specific scenario:');
  console.log('    npm run test:scenarios -- --scenario=1');
  console.log('    npm run test:scenarios -- --scenario=2\n');
  console.log('  Run with options:');
  console.log('    --headed       Watch tests in browser (visual feedback)');
  console.log('    --debug        Debug mode with Playwright Inspector');
  console.log('    --mobile       Test on mobile viewports (375x667, 768x1024)');
  console.log('    --report       Show HTML report after tests');
  console.log('    --verbose, -v  Show detailed logging\n');
  console.log('  Examples:');
  console.log('    npm run test:scenarios -- --headed');
  console.log('    npm run test:scenarios -- --scenario=3 --headed');
  console.log('    npm run test:scenarios -- --mobile');
  console.log('    npm run test:scenarios -- --debug --scenario=2\n');
}

function buildCommand() {
  const cmd = ['npx', 'playwright', 'test', 'e2e/real-user-scenarios.spec.ts'];
  
  if (scenario) {
    const selectedScenario = scenarios.find(s => s.id == scenario);
    if (!selectedScenario) {
      console.error(`❌ Invalid scenario number: ${scenario}`);
      printScenarios();
      process.exit(1);
    }
    cmd.push('-g', selectedScenario.grep);
    console.log(`📋 Running: Scenario ${scenario} - ${selectedScenario.name}\n`);
  } else {
    console.log('📋 Running: All Scenarios\n');
  }
  
  if (isHeaded) {
    cmd.push('--headed');
    console.log('🔍 Mode: Headed (browser visible)');
  }
  
  if (isDebug) {
    cmd.push('--debug');
    console.log('🐛 Mode: Debug (Playwright Inspector)');
  }
  
  if (isMobile) {
    cmd.push('-g', 'Mobile');
    console.log('📱 Mode: Mobile Testing');
  }
  
  if (isVerbose) {
    cmd.push('--reporter=verbose');
    console.log('📝 Logging: Verbose');
  } else {
    cmd.push('--reporter=list');
  }
  
  console.log('');
  
  return cmd;
}

function runTests(cmd) {
  return new Promise((resolve) => {
    const playwright = spawn('npm', cmd, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    playwright.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Tests completed successfully!\n');
        
        if (isReport) {
          console.log('📊 Generating HTML report...\n');
          const report = spawn('npx', ['playwright', 'show-report'], {
            stdio: 'inherit',
            shell: true
          });
          
          report.on('close', () => {
            resolve(code);
          });
        } else {
          console.log('💡 Tip: Run with --report to view interactive HTML report');
          console.log('   npm run test:scenarios -- --report\n');
          resolve(code);
        }
      } else {
        console.log('\n❌ Tests failed. Check output above for details.\n');
        console.log('💡 Tips for debugging:');
        console.log('   - Run with --headed to see tests in browser');
        console.log('   - Run with --debug to use Playwright Inspector');
        console.log('   - Check playwright-report/ for screenshots/videos');
        console.log('   - Run with --verbose for detailed logs\n');
        resolve(code);
      }
    });
  });
}

function showMenu() {
  console.log('Select a scenario to run:\n');
  scenarios.forEach(s => {
    console.log(`  [${s.id}] ${s.name}`);
  });
  console.log(`  [0] Run All Scenarios`);
  console.log(`  [?] Show help\n`);
}

async function main() {
  printHeader();
  
  // Check if test file exists
  const testFile = path.join(process.cwd(), 'e2e', 'real-user-scenarios.spec.ts');
  if (!fs.existsSync(testFile)) {
    console.error('❌ Error: Test file not found at', testFile);
    console.error('   Make sure you\'re running from the hostel-management directory\n');
    process.exit(1);
  }
  
  // Check environment
  console.log('🔍 Checking environment...\n');
  
  if (!process.env.BASE_URL) {
    console.log('⚠️  BASE_URL not set, using default: http://localhost:3000');
    process.env.BASE_URL = 'http://localhost:3000';
  } else {
    console.log(`✅ BASE_URL: ${process.env.BASE_URL}`);
  }
  
  console.log('\n');
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    printScenarios();
    process.exit(0);
  }
  
  // Build and run command
  const cmd = buildCommand();
  const exitCode = await runTests(cmd);
  
  process.exit(exitCode);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
