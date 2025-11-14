#!/bin/bash
# TerraFusion OS 1.0 - Deployment Readiness Validation
# Validates system readiness for production deployment

# Don't exit on first error - we want to run all validation checks
set +e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$BACKEND_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  TerraFusion OS 1.0 - Deployment Readiness Validation"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    local test_name=$1
    local result=$2
    local message=$3

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        ((PASSED++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        echo -e "   ${RED}Error: $message${NC}"
        ((FAILED++))
    elif [ "$result" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $test_name"
        echo -e "   ${YELLOW}Warning: $message${NC}"
        ((WARNINGS++))
    fi
}

# Test 1: Backend Build
echo -e "${BLUE}[1/10]${NC} Testing backend build..."
cd "$BACKEND_DIR"

# Use a clean OutDir to bypass any locked project bins and ensure consistent results
OUTDIR="$BACKEND_DIR/tmp/ValidationBuild"
mkdir -p "$OUTDIR"

# Ensure restore runs before build (avoids missing assets if obj was cleaned)
if ! dotnet restore TerraFusion.sln > /dev/null 2>&1; then
    print_result "Backend Build" "FAIL" "NuGet restore failed"
else
    if BUILD_OUTPUT=$(dotnet build TerraFusion.sln -v minimal -p:OutDir="$OUTDIR" 2>&1); then
        if echo "$BUILD_OUTPUT" | grep -q "Build succeeded"; then
            ERROR_COUNT=$(echo "$BUILD_OUTPUT" | grep -oP '\\d+(?= Error\(s\))' || echo "0")
            WARNING_COUNT=$(echo "$BUILD_OUTPUT" | grep -oP '\\d+(?= Warning\(s\))' || echo "0")

            if [ "$ERROR_COUNT" -eq 0 ]; then
                print_result "Backend Build" "PASS" "0 errors, $WARNING_COUNT warnings"
            else
                print_result "Backend Build" "FAIL" "$ERROR_COUNT compilation errors"
            fi
        else
            print_result "Backend Build" "FAIL" "Build failed"
        fi
    else
        print_result "Backend Build" "FAIL" "Build command failed"
    fi
fi

# Test 2: Integration Tests
echo -e "${BLUE}[2/10]${NC} Running integration tests..."
# Prefer specific integration tests project if present, else fall back to tests root
if [ -d "$BACKEND_DIR/tests/TerraFusion.Integration.Tests" ]; then
    cd "$BACKEND_DIR/tests/TerraFusion.Integration.Tests"
else
    cd "$BACKEND_DIR/tests"
fi

if dotnet test --no-build --verbosity quiet > /tmp/test_output.txt 2>&1; then
    TEST_OUTPUT=$(cat /tmp/test_output.txt)
    PASSED_TESTS=$(echo "$TEST_OUTPUT" | grep -oP 'Passed:\s+\K\d+' || echo "0")
    FAILED_TESTS=$(echo "$TEST_OUTPUT" | grep -oP 'Failed:\s+\K\d+' || echo "0")
    TOTAL_TESTS=$(echo "$TEST_OUTPUT" | grep -oP 'Total:\s+\K\d+' || echo "0")

    if [ "$FAILED_TESTS" -eq 0 ] && [ "$TOTAL_TESTS" -gt 0 ]; then
        print_result "Integration Tests" "PASS" "$PASSED_TESTS/$TOTAL_TESTS tests passing"
    elif [ "$TOTAL_TESTS" -eq 0 ]; then
        print_result "Integration Tests" "WARN" "No tests executed"
    else
        print_result "Integration Tests" "FAIL" "$FAILED_TESTS/$TOTAL_TESTS tests failing"
    fi
else
    print_result "Integration Tests" "FAIL" "Test execution failed"
fi

# Test 3: EF Core Migrations
echo -e "${BLUE}[3/10]${NC} Checking EF Core migrations..."
cd "$BACKEND_DIR/TerraFusion.Data"
MIGRATION_OUTPUT=$(dotnet ef migrations list --context TerraFusionDbContext 2>&1 || echo "")
if echo "$MIGRATION_OUTPUT" | grep -q "20251105062912_GuidMigration_UserIdCountyId"; then
    print_result "EF Core Migrations" "PASS" "Guid migration present"
else
    print_result "EF Core Migrations" "FAIL" "Guid migration not found"
fi

# Test 4: Migration File Exists
echo -e "${BLUE}[4/10]${NC} Verifying migration files..."
MIGRATION_FILE="$BACKEND_DIR/TerraFusion.Data/Migrations/20251105062912_GuidMigration_UserIdCountyId.cs"
if [ -f "$MIGRATION_FILE" ]; then
    LINE_COUNT=$(wc -l < "$MIGRATION_FILE")
    if [ "$LINE_COUNT" -gt 500 ]; then
        print_result "Migration Files" "PASS" "Migration file present ($LINE_COUNT lines)"
    else
        print_result "Migration Files" "WARN" "Migration file seems incomplete ($LINE_COUNT lines)"
    fi
else
    print_result "Migration Files" "FAIL" "Migration file not found"
fi

# Test 5: Configuration Files
echo -e "${BLUE}[5/10]${NC} Validating configuration files..."
CONFIG_DIR="$ROOT_DIR/config"
COUNTY_CONFIGS=$(find "$CONFIG_DIR" -name "tenant.*.yaml" 2>/dev/null | wc -l)
if [ "$COUNTY_CONFIGS" -gt 0 ]; then
    print_result "Configuration Files" "PASS" "$COUNTY_CONFIGS county configs found"
else
    print_result "Configuration Files" "FAIL" "No county configuration files found"
fi

# Test 6: API Entry Point
echo -e "${BLUE}[6/10]${NC} Checking API entry point..."
API_PROGRAM="$BACKEND_DIR/TerraFusion.API/Program.cs"
if [ -f "$API_PROGRAM" ]; then
    if grep -q "WebApplication.CreateBuilder" "$API_PROGRAM"; then
        print_result "API Entry Point" "PASS" "Program.cs valid"
    else
        print_result "API Entry Point" "WARN" "Program.cs may need review"
    fi
else
    print_result "API Entry Point" "FAIL" "Program.cs not found"
fi

# Test 7: Consciousness Engine
echo -e "${BLUE}[7/10]${NC} Checking Consciousness Engine..."
CONSCIOUSNESS_PROGRAM="$BACKEND_DIR/TerraFusion.Consciousness/Program.cs"
if [ -f "$CONSCIOUSNESS_PROGRAM" ]; then
    print_result "Consciousness Engine" "PASS" "Consciousness service present"
else
    print_result "Consciousness Engine" "FAIL" "Consciousness service not found"
fi

# Test 8: Documentation
echo -e "${BLUE}[8/10]${NC} Verifying deployment documentation..."
DEPLOYMENT_GUIDE="$ROOT_DIR/PRODUCTION_DEPLOYMENT_GUIDE.md"
if [ -f "$DEPLOYMENT_GUIDE" ]; then
    DOC_LINES=$(wc -l < "$DEPLOYMENT_GUIDE")
    if [ "$DOC_LINES" -gt 500 ]; then
        print_result "Deployment Documentation" "PASS" "Comprehensive guide present ($DOC_LINES lines)"
    else
        print_result "Deployment Documentation" "WARN" "Documentation may be incomplete"
    fi
else
    print_result "Deployment Documentation" "FAIL" "Deployment guide not found"
fi

# Test 9: Session Reports
echo -e "${BLUE}[9/10]${NC} Checking session completion reports..."
SESSION_REPORT="$ROOT_DIR/SESSION_COMPLETION_SUMMARY.md"
CHAMPIONSHIP_REPORT="$ROOT_DIR/CHAMPIONSHIP_STATUS_REPORT.md"
FINAL_REPORT="$ROOT_DIR/FINAL_SESSION_ACHIEVEMENT_REPORT.md"

REPORTS_FOUND=0
[ -f "$SESSION_REPORT" ] && ((REPORTS_FOUND++))
[ -f "$CHAMPIONSHIP_REPORT" ] && ((REPORTS_FOUND++))
[ -f "$FINAL_REPORT" ] && ((REPORTS_FOUND++))

if [ "$REPORTS_FOUND" -eq 3 ]; then
    print_result "Session Reports" "PASS" "All 3 reports present"
elif [ "$REPORTS_FOUND" -gt 0 ]; then
    print_result "Session Reports" "WARN" "Only $REPORTS_FOUND/3 reports found"
else
    print_result "Session Reports" "FAIL" "No session reports found"
fi

# Test 10: Git Repository Status
echo -e "${BLUE}[10/10]${NC} Checking git repository status..."
cd "$ROOT_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -eq 0 ]; then
        print_result "Git Repository" "PASS" "No uncommitted changes"
    else
        print_result "Git Repository" "WARN" "$UNCOMMITTED uncommitted changes"
    fi
else
    print_result "Git Repository" "WARN" "Not a git repository"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Validation Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Passed:${NC}   $PASSED tests"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS tests"
echo -e "${RED}❌ Failed:${NC}   $FAILED tests"
echo ""

# Final verdict
if [ "$FAILED" -eq 0 ]; then
    if [ "$WARNINGS" -eq 0 ]; then
        echo -e "${GREEN}🏆 DEPLOYMENT READINESS: EXCELLENT${NC}"
        echo "   System is ready for production deployment."
        exit 0
    else
        echo -e "${YELLOW}✅ DEPLOYMENT READINESS: READY WITH WARNINGS${NC}"
        echo "   System is ready, but review warnings before deployment."
        exit 0
    fi
else
    echo -e "${RED}❌ DEPLOYMENT READINESS: NOT READY${NC}"
    echo "   Fix failed tests before proceeding with deployment."
    exit 1
fi
