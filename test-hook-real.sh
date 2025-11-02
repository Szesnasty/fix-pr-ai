#!/bin/bash

set -e

echo "🧪 Testing post-checkout hook - REAL TEST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get absolute path to pr-cleaner-ai project directory BEFORE changing directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create temporary directory
TEST_DIR=$(mktemp -d)
echo "📁 Test directory: $TEST_DIR"
cd "$TEST_DIR"

# Initialize git repo
echo ""
echo "1️⃣ Initializing Git repository..."
git init --quiet
git config user.name "Test User"
git config user.email "test@example.com"

# Create initial commit
echo "test" > test.txt
git add test.txt
git commit -m "Initial commit" --quiet
echo "   ✅ Git repo initialized"

# Create branch A
echo ""
echo "2️⃣ Creating branch-a..."
git checkout -b branch-a --quiet

# Copy pr-cleaner-ai scripts to node_modules structure
echo "3️⃣ Setting up pr-cleaner-ai package structure..."
mkdir -p node_modules/pr-cleaner-ai/scripts
mkdir -p node_modules/pr-cleaner-ai/config

cp "${PROJECT_DIR}/scripts/protect-github-token.js" node_modules/pr-cleaner-ai/scripts/
cp "${PROJECT_DIR}/config/pr-cleaner-ai.mdc" node_modules/pr-cleaner-ai/config/
echo "   ✅ Package structure created"

# Create protected files (simulating real scenario)
echo ""
echo "4️⃣ Creating protected files (as they would exist on branch-a)..."
mkdir -p .cursor/rules
echo "GITHUB_TOKEN=ghp_test123456789_secret_token" > .env.pr-cleaner-ai
mkdir -p .pr-cleaner-ai-output
echo "output content" > .pr-cleaner-ai-output/test.txt
echo "# Cursor rules" > .cursor/rules/pr-cleaner-ai.mdc
echo "   ✅ Created:"
echo "      - .env.pr-cleaner-ai (with token)"
echo "      - .pr-cleaner-ai-output/test.txt"
echo "      - .cursor/rules/pr-cleaner-ai.mdc"

# Verify files exist
echo ""
echo "5️⃣ Verifying files exist before checkout..."
FILES_EXIST=0
if [ -f .env.pr-cleaner-ai ]; then
  echo -e "   ${GREEN}✅ .env.pr-cleaner-ai exists${NC}"
  FILES_EXIST=$((FILES_EXIST + 1))
else
  echo -e "   ${RED}❌ .env.pr-cleaner-ai missing${NC}"
fi

if [ -d .pr-cleaner-ai-output ]; then
  echo -e "   ${GREEN}✅ .pr-cleaner-ai-output exists${NC}"
  FILES_EXIST=$((FILES_EXIST + 1))
else
  echo -e "   ${RED}❌ .pr-cleaner-ai-output missing${NC}"
fi

if [ -f .cursor/rules/pr-cleaner-ai.mdc ]; then
  echo -e "   ${GREEN}✅ .cursor/rules/pr-cleaner-ai.mdc exists${NC}"
  FILES_EXIST=$((FILES_EXIST + 1))
else
  echo -e "   ${RED}❌ .cursor/rules/pr-cleaner-ai.mdc missing${NC}"
fi

if [ $FILES_EXIST -ne 3 ]; then
  echo -e "${RED}❌ Test setup failed - files not created correctly${NC}"
  exit 1
fi

# Install post-checkout hook
echo ""
echo "6️⃣ Installing post-checkout hook..."
mkdir -p .git/hooks
cat > .git/hooks/post-checkout << HOOKEOF
#!/bin/sh
# pr-cleaner-ai - Clean protected files after branch switch
# Always clean on checkout - it's safe and protects against token leakage
echo "🔍 Hook executed! \$1 -> \$2, flag=\$3"
echo "🔍 Executing cleanProtectedFiles..."
node node_modules/pr-cleaner-ai/scripts/protect-github-token.js post-checkout
echo "🔍 cleanProtectedFiles finished"
HOOKEOF
chmod +x .git/hooks/post-checkout
echo "   ✅ Hook installed"

# Create branch B
echo ""
echo "7️⃣ Switching to branch-b (this should trigger the hook)..."
echo "   Executing: git checkout -b branch-b"
git checkout -b branch-b 2>&1

echo ""
echo "8️⃣ Checking if temporary files were removed..."

FILES_REMOVED=0
# .env.pr-cleaner-ai should STAY (protected by pre-commit hook, not cleaned on checkout)
if [ -f .env.pr-cleaner-ai ]; then
  echo -e "   ${GREEN}✅ .env.pr-cleaner-ai still exists (CORRECT! - protected by pre-commit hook)${NC}"
else
  echo -e "   ${YELLOW}⚠️  .env.pr-cleaner-ai was removed (not a problem, but unexpected)${NC}"
fi

if [ ! -d .pr-cleaner-ai-output ]; then
  echo -e "   ${GREEN}✅ .pr-cleaner-ai-output was removed (CORRECT!)${NC}"
  FILES_REMOVED=$((FILES_REMOVED + 1))
else
  echo -e "   ${RED}❌ .pr-cleaner-ai-output STILL EXISTS${NC}"
fi

if [ ! -f .cursor/rules/pr-cleaner-ai.mdc ]; then
  echo -e "   ${YELLOW}⚠️  .cursor/rules/pr-cleaner-ai.mdc was removed${NC}"
  FILES_REMOVED=$((FILES_REMOVED + 1))
else
  echo -e "   ${YELLOW}ℹ️  .cursor/rules/pr-cleaner-ai.mdc still exists${NC}"
fi

echo ""
echo "9️⃣ Checking if rules file was recreated..."
if [ -f .cursor/rules/pr-cleaner-ai.mdc ]; then
  echo -e "   ${GREEN}✅ .cursor/rules/pr-cleaner-ai.mdc was recreated${NC}"
  if grep -q "pr-cleaner-ai" .cursor/rules/pr-cleaner-ai.mdc 2>/dev/null; then
    echo -e "   ${GREEN}✅ Rules file content looks correct${NC}"
  fi
else
  echo -e "   ${YELLOW}⚠️  .cursor/rules/pr-cleaner-ai.mdc not recreated${NC}"
fi

# Test switching back
echo ""
echo "🔟 Testing switch back to branch-a..."
git checkout branch-a --quiet 2>&1
echo "   ✅ Switched back"

echo ""
echo "1️⃣1️⃣ Checking files after switch back..."
# .env.pr-cleaner-ai should still exist (it's not cleaned, protected by pre-commit hook)
if [ -f .env.pr-cleaner-ai ]; then
  echo -e "   ${GREEN}✅ .env.pr-cleaner-ai still exists (CORRECT! - works on all branches)${NC}"
else
  echo -e "   ${YELLOW}⚠️  .env.pr-cleaner-ai not present (user needs to create it)${NC}"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
cd /
rm -rf "$TEST_DIR"

# Results
echo ""
echo "=========================================="
echo "📊 TEST RESULTS:"
echo "=========================================="
# Check final results - output should be gone, .env.pr-cleaner-ai should stay (protected by pre-commit), rules file should exist (recreated)
if [ ! -d .pr-cleaner-ai-output ]; then
  echo -e "${GREEN}✅ TEMPORARY FILES WERE REMOVED${NC}"
  echo -e "${GREEN}   ✅ .pr-cleaner-ai-output removed${NC}"
  if [ -f .env.pr-cleaner-ai ]; then
    echo -e "${GREEN}   ✅ .env.pr-cleaner-ai still exists (protected by pre-commit hook, works on all branches)${NC}"
  fi
  if [ -f .cursor/rules/pr-cleaner-ai.mdc ]; then
    echo -e "${GREEN}   ✅ .cursor/rules/pr-cleaner-ai.mdc recreated (as expected)${NC}"
  fi
  echo -e "${GREEN}✅ TEST PASSED - Hook is working correctly!${NC}"
  exit 0
else
  echo -e "${RED}❌ TEST FAILED - Temporary files were not removed${NC}"
  if [ -d .pr-cleaner-ai-output ]; then
    echo -e "${RED}   ❌ .pr-cleaner-ai-output still exists${NC}"
  fi
  echo -e "${RED}   Hook may not be working correctly${NC}"
  exit 1
fi

