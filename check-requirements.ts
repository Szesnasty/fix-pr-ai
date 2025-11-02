#!/usr/bin/env node

/// <reference types="node" />

/* eslint-disable no-console */
/**
 * Script to check requirements for running fetch-comments.ts
 * Checks availability: git, Node.js, GitHub CLI (gh), tsx
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Requirement {
  name: string;
  required: boolean;
  installed: boolean;
  check: () => boolean;
  installInstructions: string;
  description: string;
}

const requirements: Requirement[] = [
  {
    name: 'Node.js',
    required: true,
    installed: false,
    check: () => {
      try {
        const version = execSync('node --version', { encoding: 'utf-8' }).trim();
        console.log(`   ✅ Node.js: ${version}`);
        return true;
      } catch {
        console.log('   ❌ Node.js: NOT INSTALLED');
        return false;
      }
    },
    installInstructions: 'Install Node.js: https://nodejs.org/',
    description: 'Required to run TypeScript scripts'
  },
  {
    name: 'Git',
    required: true,
    installed: false,
    check: () => {
      try {
        const version = execSync('git --version', { encoding: 'utf-8' }).trim();
        console.log(`   ✅ Git: ${version}`);
        return true;
      } catch {
        console.log('   ❌ Git: NOT INSTALLED');
        return false;
      }
    },
    installInstructions: 'Install Git: https://git-scm.com/downloads',
    description: 'Required to determine repository and branch'
  },
  {
    name: 'GitHub CLI (gh)',
    required: true,
    installed: false,
    check: () => {
      try {
        const version = execSync('gh --version', { encoding: 'utf-8' }).trim();
        const firstLine = version.split('\n')[0];
        console.log(`   ✅ GitHub CLI: ${firstLine}`);
        
        // Check if authenticated
        try {
          execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });
          console.log(`   ✅ GitHub CLI: Authenticated`);
          return true;
        } catch {
          console.log('   ⚠️  GitHub CLI: Installed but NOT AUTHENTICATED');
          console.log(`      Run: gh auth login`);
          return false;
        }
      } catch {
        console.log('   ❌ GitHub CLI: NOT INSTALLED');
        return false;
      }
    },
    installInstructions: `
   Install GitHub CLI:
   
   macOS:
     brew install gh
   
   Windows:
     winget install --id GitHub.cli
     # or download from: https://cli.github.com/
   
   Linux:
     # See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   
   After installation, authenticate:
     gh auth login
`,
    description: 'Required to fetch PR comments from GitHub'
  },
  {
    name: 'tsx',
    required: true,
    installed: false,
    check: () => {
      try {
        // Check in local node_modules
        const tsxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
        if (fs.existsSync(tsxPath)) {
          console.log('   ✅ tsx: Installed locally (node_modules)');
          return true;
        }

        // Check globally
        execSync('tsx --version', { encoding: 'utf-8' });
        console.log('   ✅ tsx: Installed globally');
        return true;
      } catch {
        console.log('   ❌ tsx: NOT INSTALLED');
        return false;
      }
    },
    installInstructions: `
   Locally (recommended):
     yarn add -D tsx
     # or
     npm install -D tsx
   
   Globally:
     npm install -g tsx
     # or
     yarn global add tsx
`,
    description: 'Used to run TypeScript files directly'
  }
];

function checkRequirements(): boolean {
  console.log('\n🔍 Checking requirements for pr-cleaner-ai...\n');

  let allRequiredInstalled = true;
  const missingRequired: Requirement[] = [];
  const missingOptional: Requirement[] = [];

  for (const req of requirements) {
    req.installed = req.check();

    if (!req.installed) {
      if (req.required) {
        allRequiredInstalled = false;
        missingRequired.push(req);
      } else {
        missingOptional.push(req);
      }
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (allRequiredInstalled && missingOptional.length === 0) {
    console.log('✅ All requirements met! You can use the tool.\n');
    return true;
  }

  if (missingRequired.length > 0) {
    console.log('❌ Missing required tools:\n');
    for (const req of missingRequired) {
      console.log(`📦 ${req.name}`);
      console.log(`   ${req.description}`);
      console.log(`   💡 Installation:`);
      console.log(req.installInstructions);
      console.log('');
    }
  }

  if (missingOptional.length > 0) {
    console.log('⚠️  Optional tools (useful, but not required):\n');
    for (const req of missingOptional) {
      console.log(`📦 ${req.name}`);
      console.log(`   ${req.description}`);
      console.log(`   💡 Installation:`);
      console.log(req.installInstructions);
      console.log('');
    }
  }

  if (!allRequiredInstalled) {
    console.log('❌ You cannot run the tool until you install required dependencies.\n');
    return false;
  }

  return true;
}

// If script is run directly
if (require.main === module) {
  const success = checkRequirements();
  process.exit(success ? 0 : 1);
}

export { checkRequirements };
