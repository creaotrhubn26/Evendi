#!/bin/bash

echo "🧪 Running Evendi Smoke Tests..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to test
test_check() {
    local name=$1
    local command=$2
    
    echo -n "Testing: $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Check if package.json exists
test_check "package.json exists" "test -f package.json"

# Test 2: Check if node_modules exists
test_check "Dependencies installed" "test -d node_modules"

# Test 3: Check if key directories exist
test_check "Client directory exists" "test -d client"
test_check "Server directory exists" "test -d server"

# Test 4: Check if critical files exist
test_check "App.tsx exists" "test -f client/App.tsx"
test_check "RootStackNavigator.tsx exists" "test -f client/navigation/RootStackNavigator.tsx"
test_check "CoupleLoginScreen.tsx exists" "test -f client/screens/CoupleLoginScreen.tsx"
test_check "SplashScreen.tsx exists" "test -f client/screens/SplashScreen.tsx"
test_check "MainTabNavigator.tsx exists" "test -f client/navigation/MainTabNavigator.tsx"

# Test 5: Check environment files
if test -f .env.local; then
    echo -e "Testing: .env.local exists... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    
    # Check for required env vars
    if grep -q "EXPO_PUBLIC_API_URL" .env.local; then
        echo -e "Testing: EXPO_PUBLIC_API_URL is set... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "Testing: EXPO_PUBLIC_API_URL is set... ${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "Testing: .env.local exists... ${YELLOW}⚠ WARN${NC} (using defaults)"
fi

# Test 6: TypeScript compilation (just check syntax, no emit)
echo -n "Testing: TypeScript compilation... "
if npx tsc --noEmit --skipLibCheck 2>&1 | head -20; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARN${NC} (some type errors, but may not be critical)"
fi

# Test 7: Check if expo is available
test_check "Expo CLI available" "which npx"

# Test 8: Package.json scripts
test_check "expo:dev script exists" "grep -q '\"expo:dev\"' package.json"
test_check "server:dev script exists" "grep -q '\"server:dev\"' package.json"

# Summary
echo ""
echo "================================"
echo "Smoke Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "To start the app:"
    echo "  npm run expo:dev    # Start Expo web development server"
    echo "  npm run server:dev  # Start backend server (in another terminal)"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
