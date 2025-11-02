#!/usr/bin/env node

/* eslint-disable no-console */
/**
 * Postinstall hook for pr-cleaner-ai
 * 
 * - Shows welcome message
 * - Auto-updates .cursor/rules/pr-cleaner-ai.mdc if it exists (matches installed version)
 * - User must run `npx pr-cleaner-ai init` for first-time setup
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
  
  // Try to find source file in npm package
  const possibleSourcePaths = [
    path.join(projectRoot, 'node_modules', 'pr-cleaner-ai', 'config', 'pr-cleaner-ai.mdc'),
    path.join(__dirname, '../config/pr-cleaner-ai.mdc'),
    path.join(__dirname, '../../config/pr-cleaner-ai.mdc')
  ];
  
  let sourcePath = null;
  for (const possiblePath of possibleSourcePaths) {
    if (fs.existsSync(possiblePath)) {
      sourcePath = possiblePath;
      break;
    }
  }
  
  // Always ensure rules file exists and is up-to-date
  if (sourcePath) {
    try {
      // Create .cursor/rules directory if it doesn't exist
      const rulesDir = path.dirname(rulesFile);
      if (!fs.existsSync(rulesDir)) {
        fs.mkdirSync(rulesDir, { recursive: true });
      }
      
      // Copy rules file (creates if doesn't exist, updates if exists)
      fs.copyFileSync(sourcePath, rulesFile);
      
      console.log('\n🎉 pr-cleaner-ai installed successfully!\n');
      
      if (hasRulesFile) {
        console.log('✅ Auto-updated .cursor/rules/pr-cleaner-ai.mdc to match installed version');
        console.log('   (No action needed - rules are up-to-date)\n');
      } else {
        console.log('✅ Created .cursor/rules/pr-cleaner-ai.mdc');
        console.log('   (Rules file auto-created from npm package)\n');
      }
    } catch (error) {
      // Silent fail - just show normal message
      console.log('\n🎉 pr-cleaner-ai installed successfully!\n');
      if (hasRulesFile) {
        console.log('ℹ️  Cursor rules file detected');
        console.log('   Run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m to update\n');
      } else {
        console.log('📝 Next step: Initialize the package');
        console.log('   Run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m\n');
      }
    }
  } else {
    // Source not found - package might not be fully installed
    console.log('\n🎉 pr-cleaner-ai installed successfully!\n');
    
    if (hasRulesFile) {
      console.log('💡 Cursor rules file detected.');
      console.log('   Run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m to update\n');
    } else {
      console.log('📝 Next step: Initialize the package');
      console.log('');
      console.log('   Run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m');
      console.log('');
      console.log('This will:');
      console.log('  • Copy .cursor/rules/pr-cleaner-ai.mdc from npm package');
      console.log('  • Add entries to .gitignore');
      console.log('  • Optionally add scripts to package.json');
      console.log('');
      console.log('💡 Note: Rules are auto-created/updated on every npm install!');
      console.log('   (.cursor/rules/pr-cleaner-ai.mdc is gitignored - no need to commit)');
      console.log('');
    }
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
