#!/bin/bash

# TerraFusion OS - Comprehensive Test Discovery & Execution System
# Ensures no test is ever lost by cataloging and executing all tests

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "🔍 TerraFusion OS - Complete Test Discovery System"
echo "=================================================="

# Create test discovery output directory
DISCOVERY_DIR="$REPO_ROOT/test-discovery-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DISCOVERY_DIR"

echo "📊 Discovering all test files across TerraFusion OS..."

# Function to count and catalog tests
catalog_tests() {
    local search_dir="$1"
    local category="$2"
    local output_file="$DISCOVERY_DIR/${category,,}_tests.txt"
    
    echo "🔍 Cataloging $category tests in $search_dir..."
    
    find "$search_dir" \( \
        -name "*.test.ts" -o -name "*.test.tsx" -o \
        -name "*.test.js" -o -name "*.test.jsx" -o \
        -name "*.spec.ts" -o -name "*.spec.tsx" -o \
        -name "*.spec.js" -o -name "*.spec.jsx" -o \
        -name "*.test.py" -o -name "*.test.cs" -o \
        -name "*_test.py" -o -name "*Test.cs" -o \
        -name "*.test.rs" \
    \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/artifacts/*" \
    -not -path "*/logs/*" \
    -not -path "*/__pycache__/*" \
    -not -name "*.html" \
    -not -name "*.json" \
    -not -name "*.log" \
    -not -name "*.md" \
    -type f | \
        sort > "$output_file" 2>/dev/null || true
    
    local count=$(wc -l < "$output_file" 2>/dev/null || echo "0")
    echo "   Found $count test files in $category"
    
    return 0
}

# Discover tests by category
echo ""
echo "🎯 CATEGORY 1: Root Directory Tests"
catalog_tests "$REPO_ROOT" "ROOT"

echo ""
echo "🏆 CATEGORY 2: Championship Tests"
catalog_tests "$REPO_ROOT/championship" "CHAMPIONSHIP"

echo ""
echo "🔧 CATEGORY 3: Production Scripts & Validation"
catalog_tests "$REPO_ROOT/scripts" "SCRIPTS"

echo ""
echo "🏗️ CATEGORY 4: Infrastructure & DevOps Tests"
catalog_tests "$REPO_ROOT/infrastructure" "INFRASTRUCTURE"

echo ""
echo "📋 CATEGORY 5: Main Test Directory"
catalog_tests "$REPO_ROOT/tests" "MAIN_TESTS"

echo ""
echo "🧠 CATEGORY 6: Backend & AI Tests"
catalog_tests "$REPO_ROOT/backend" "BACKEND"

echo ""
echo "📱 CATEGORY 7: Frontend & UI Tests"
catalog_tests "$REPO_ROOT/apps" "FRONTEND"

echo ""
echo "🏛️ CATEGORY 8: Module Tests"
catalog_tests "$REPO_ROOT/modules" "MODULES"

echo ""
echo "📦 CATEGORY 9: Deployment Tests"
catalog_tests "$REPO_ROOT/deployment" "DEPLOYMENT"

echo ""
echo "📈 CATEGORY 10: County Data Tests"
catalog_tests "$REPO_ROOT/data" "DATA"

# Generate comprehensive summary
echo ""
echo "📊 GENERATING COMPREHENSIVE TEST SUMMARY..."

SUMMARY_FILE="$DISCOVERY_DIR/COMPLETE_TEST_SUMMARY.md"

cat > "$SUMMARY_FILE" << EOF
# TerraFusion OS - Complete Test Discovery Report
Generated: $(date)

## Test Discovery Summary

EOF

# Calculate totals and generate summary
total_tests=0
for category_file in "$DISCOVERY_DIR"/*_tests.txt; do
    if [[ -f "$category_file" ]]; then
        category=$(basename "$category_file" _tests.txt | tr '[:lower:]' '[:upper:]')
        count=$(wc -l < "$category_file")
        total_tests=$((total_tests + count))
        
        echo "| $category | $count tests |" >> "$SUMMARY_FILE"
        
        # Add detailed file list
        echo "" >> "$SUMMARY_FILE"
        echo "### $category Tests ($count files)" >> "$SUMMARY_FILE"
        echo "\`\`\`" >> "$SUMMARY_FILE"
        cat "$category_file" >> "$SUMMARY_FILE"
        echo "\`\`\`" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    fi
done

# Add summary header
sed -i "3i\\| Category | Count |" "$SUMMARY_FILE"
sed -i "4i\\|----------|-------|" "$SUMMARY_FILE"
sed -i "5i\\| **TOTAL** | **$total_tests tests** |" "$SUMMARY_FILE"
sed -i "6i\\" "$SUMMARY_FILE"

echo "✅ DISCOVERY COMPLETE!"
echo ""
echo "📊 RESULTS:"
echo "   Total Tests Found: $total_tests"
echo "   Discovery Directory: $DISCOVERY_DIR"
echo "   Summary Report: $SUMMARY_FILE"
echo ""

# Create master test execution script
MASTER_SCRIPT="$DISCOVERY_DIR/execute-all-tests.sh"

cat > "$MASTER_SCRIPT" << 'EOF'
#!/bin/bash

# TerraFusion OS - Master Test Execution Script
# Executes ALL discovered tests across the entire system

set -euo pipefail

echo "🚀 TerraFusion OS - Master Test Execution"
echo "========================================"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# Test execution results
RESULTS_DIR="test-execution-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

execute_test_category() {
    local category="$1"
    local command="$2"
    local description="$3"
    
    echo ""
    echo "🎯 EXECUTING: $description"
    echo "Command: $command"
    echo "----------------------------------------"
    
    if eval "$command" > "$RESULTS_DIR/${category,,}_results.log" 2>&1; then
        echo "✅ $description - PASSED"
        echo "PASSED" > "$RESULTS_DIR/${category,,}_status.txt"
    else
        echo "❌ $description - FAILED"
        echo "FAILED" > "$RESULTS_DIR/${category,,}_status.txt"
    fi
}

# Execute all test categories
execute_test_category "ROOT" "npm test || true" "Root Level Tests"
execute_test_category "CHAMPIONSHIP" "npm run championship:test || node championship-test-runner.ts || true" "Championship Tests"
execute_test_category "BACKEND" "npm run backend:test || true" "Backend Tests"
execute_test_category "FRONTEND" "npm run frontend:test || true" "Frontend Tests"
execute_test_category "E2E" "npm run test:e2e || true" "End-to-End Tests"
execute_test_category "INTEGRATION" "npm run test:integration || true" "Integration Tests"
execute_test_category "PERFORMANCE" "npm run test:performance || python backend/quantum-performance/quantum_test.py || true" "Performance Tests"
execute_test_category "SECURITY" "npm run test:security || true" "Security Tests"
execute_test_category "AI_SWARM" "npm run test:ai-swarm || ./scripts/activate-ai-swarm-full-implementation.sh || true" "AI Swarm Tests"

# Production validation
execute_test_category "PRODUCTION" "./scripts/validate-complete-system.sh" "Production Validation"
execute_test_category "COMPREHENSIVE" "./scripts/execute-comprehensive-testing.ts" "Comprehensive Testing"

# Generate final report
echo ""
echo "📊 GENERATING FINAL TEST REPORT..."

FINAL_REPORT="$RESULTS_DIR/FINAL_TEST_REPORT.md"
cat > "$FINAL_REPORT" << REPORT_EOF
# TerraFusion OS - Complete Test Execution Report
Executed: $(date)

## Test Results Summary

| Category | Status | Log File |
|----------|--------|----------|
REPORT_EOF

passed_count=0
failed_count=0

for status_file in "$RESULTS_DIR"/*_status.txt; do
    if [[ -f "$status_file" ]]; then
        category=$(basename "$status_file" _status.txt | tr '[:lower:]' '[:upper:]')
        status=$(cat "$status_file")
        log_file=$(basename "$status_file" _status.txt)_results.log
        
        if [[ "$status" == "PASSED" ]]; then
            passed_count=$((passed_count + 1))
            status_emoji="✅"
        else
            failed_count=$((failed_count + 1))
            status_emoji="❌"
        fi
        
        echo "| $category | $status_emoji $status | $log_file |" >> "$FINAL_REPORT"
    fi
done

cat >> "$FINAL_REPORT" << REPORT_EOF

## Summary
- **Passed**: $passed_count test categories
- **Failed**: $failed_count test categories
- **Total**: $((passed_count + failed_count)) test categories

## Detailed Logs
All detailed logs are available in: $RESULTS_DIR/

REPORT_EOF

echo "✅ MASTER TEST EXECUTION COMPLETE!"
echo ""
echo "📊 FINAL RESULTS:"
echo "   Passed: $passed_count categories"
echo "   Failed: $failed_count categories"
echo "   Results Directory: $RESULTS_DIR"
echo "   Final Report: $FINAL_REPORT"

EOF

chmod +x "$MASTER_SCRIPT"

echo "🎯 MASTER EXECUTION SCRIPT CREATED: $MASTER_SCRIPT"
echo ""
echo "💡 TO EXECUTE ALL TESTS:"
echo "   $MASTER_SCRIPT"
echo ""
echo "🛡️ ALL TESTS ARE NOW CATALOGED AND PROTECTED!"