#!/bin/bash
# debug-validation.sh - Debug validation script issues

echo "=== DEBUGGING VALIDATION SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Script exists: $(ls -la validate-complete-system.sh 2>/dev/null || echo 'NOT FOUND')"

echo ""
echo "=== TESTING GEOGRAPHIC VALIDATION ==="

# Test the problematic grep command
echo "Testing Richland county seat search..."
RICHLAND_REFS=$(grep -r "CountySeat.*Richland\|county.*seat.*Richland\|Richland.*is.*county.*seat" ../. --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || true)

if [ -n "$RICHLAND_REFS" ]; then
    echo "FOUND Richland county seat references:"
    echo "$RICHLAND_REFS"
else
    echo "NO Richland county seat references found"
fi

echo ""
echo "Testing Prosser county seat search..."
PROSSER_REFS=$(grep -r "Prosser.*county.*seat" ../. --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || true)

if [ -n "$PROSSER_REFS" ]; then
    echo "FOUND Prosser county seat references:"
    echo "$PROSSER_REFS"
else
    echo "NO Prosser county seat references found"
fi

echo ""
echo "=== TESTING FILE EXISTENCE ==="
echo "docker-compose.dev.yml: $([ -f ../docker-compose.dev.yml ] && echo 'EXISTS' || echo 'MISSING')"
echo "dev-environment.sh: $([ -f dev-environment.sh ] && echo 'EXISTS' || echo 'MISSING')"
echo ".env.template: $([ -f ../.env.template ] && echo 'EXISTS' || echo 'MISSING')"
echo "setup-environment.sh: $([ -f setup-environment.sh ] && echo 'EXISTS' || echo 'MISSING')"

echo ""
echo "=== TESTING SIMPLE VALIDATION EXECUTION ==="
echo "Running first 50 lines of validation script..."
head -50 validate-complete-system.sh | bash -x
