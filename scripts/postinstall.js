#!/usr/bin/env node

/* eslint-disable no-console */
/**
 * Postinstall hook for pr-cleaner-ai
 * 
 * - Shows welcome message
 * - Reminds user to run `npx pr-cleaner-ai init` for first-time setup
 * - Does NOT modify any files automatically (user must run init explicitly)
 */

function main() {
  // Skip in CI environments
  if (process.env.CI) {
    return;
  }

  const fs = require('fs');
  const path = require('path');
  
  const projectRoot = process.cwd();
  const rulesFile = path.join(projectRoot, '.cursor', 'rules', 'pr-cleaner-ai.mdc');
  const hasRulesFile = fs.existsSync(rulesFile);
  
  console.log('\n🎉 pr-cleaner-ai installed successfully!\n');
  
  if (hasRulesFile) {
    console.log('✅ Cursor rules file detected (already initialized)');
    console.log('   If you want to update it, run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m\n');
  } else {
    console.log('📝 Next step: Initialize the package');
    console.log('   Run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m');
    console.log('');
    console.log('This will:');
    console.log('  • Copy .cursor/rules/pr-cleaner-ai.mdc from npm package');
    console.log('  • Add .pr-cleaner-ai-output/ and .cursor/rules/pr-cleaner-ai.mdc to .gitignore');
    console.log('  • Optionally add scripts to package.json');
    console.log('');
  }
  
  console.log('After init, you can use:');
  console.log('  • In Cursor: \x1b[36mfix PR 2146\x1b[0m (or "PR 2146")');
  console.log('  • In terminal: \x1b[36mnpx pr-cleaner-ai fetch --pr=2146\x1b[0m');
  console.log('');
  console.log('💡 Requirement: GitHub CLI must be installed and authenticated');
  console.log('   Install: \x1b[36mbrew install gh\x1b[0m (macOS) or https://cli.github.com/');
  console.log('   Authenticate: \x1b[36mgh auth login\x1b[0m');
  console.log('');
  console.log('📚 Documentation: https://github.com/Szesnasty/pr-cleaner-ai#readme\n');
}

if (require.main === module) {
  main();
}

module.exports = { main };
