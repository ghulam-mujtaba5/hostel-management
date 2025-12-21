#!/usr/bin/env node

/**
 * Verification script for AI Agent & MCP setup
 * Run: node scripts/verify-agent-setup.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, condition, details = '') {
  checks.push({ name, condition, details });
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${name}${details ? ' - ' + details : ''}`);
}

function dirExists(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function fileExists(p) {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

console.log('\n🤖 AI Agent & MCP Setup Verification\n');
console.log('=' .repeat(50));

// Check .agent directory
console.log('\n📁 Agent Configuration Files:');
check('`.agent/` directory', dirExists('.agent'));
check('`.agent/agent.json`', fileExists('.agent/agent.json'));
check('`.agent/README.md`', fileExists('.agent/README.md'));
check('`.agent/QUICKREF.md`', fileExists('.agent/QUICKREF.md'));
check('`.agent/CAPABILITY_MAP.md`', fileExists('.agent/CAPABILITY_MAP.md'));
check('`.agent/SETUP_COMPLETE.md`', fileExists('.agent/SETUP_COMPLETE.md'));

// Check .mcp directory
console.log('\n🔌 MCP Configuration Files:');
check('`.mcp/` directory', dirExists('.mcp'));
check('`.mcp/mcp.json`', fileExists('.mcp/mcp.json'));
check('`.mcp/README.md`', fileExists('.mcp/README.md'));

// Check CLI scripts
console.log('\n⚙️  CLI System:');
check('`scripts/cli.mjs`', fileExists('scripts/cli.mjs'));
check('`scripts/mcp-supabase.js`', fileExists('scripts/mcp-supabase.js'));

// Check documentation
console.log('\n📖 Documentation:');
check('`.github/copilot-instructions.md`', fileExists('.github/copilot-instructions.md'));
check('Root `AGENT_SETUP_COMPLETE.md`', fileExists('AGENT_SETUP_COMPLETE.md'));

// Check package.json updates
console.log('\n📦 NPM Configuration:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  check('npm script: `cli`', pkg.scripts?.cli === 'node scripts/cli.mjs');
  check('npm script: `test:headed`', pkg.scripts?.['test:headed'] !== undefined);
  check('npm script: `test:debug`', pkg.scripts?.['test:debug'] !== undefined);
  check('npm script: `type-check`', pkg.scripts?.['type-check'] !== undefined);
  check('npm script: `db:push`', pkg.scripts?.['db:push'] !== undefined);
  check('npm script: `db:pull`', pkg.scripts?.['db:pull'] !== undefined);
} catch (e) {
  check('package.json valid', false, e.message);
}

// Summary
console.log('\n' + '='.repeat(50));
const passed = checks.filter(c => c.condition).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`\n✨ Verification Results: ${passed}/${total} checks passed (${percentage}%)\n`);

if (percentage === 100) {
  console.log('🎉 Setup complete! All systems ready for AI agents.\n');
  console.log('Quick start:');
  console.log('  npm run cli help       # See all commands');
  console.log('  npm run cli info       # Project information');
  console.log('  npm run dev            # Start development\n');
} else {
  console.log(`⚠️  ${total - passed} items need attention.\n`);
  const failed = checks.filter(c => !c.condition);
  console.log('Failed checks:');
  failed.forEach(c => console.log(`  - ${c.name}`));
  console.log();
}

process.exit(percentage === 100 ? 0 : 1);
