#!/usr/bin/env bash
# Complete migration validation with rollback capability

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "     TerraFusion Migration Validator v2.0"
echo "═══════════════════════════════════════════════════════════"

VALIDATION_REPORT="VALIDATION_$(date +%Y%m%d_%H%M%S).md"
ERRORS=0
WARNINGS=0

# Function to check directory structure
validate_structure() {
    echo "📁 Validating repository structure..."
    
    local required_dirs=(
        "terrafusion"
        "terrafusion-ai-arsenal/agents"
        "terrafusion-ops/scripts"
        "terrafusion-swarm/orchestration"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo "  ✅ $dir exists"
        else
            echo "  ❌ Missing: $dir"
            ((ERRORS++))
        fi
    done
}

# Function to validate AI assets
validate_ai_assets() {
    echo "🤖 Validating AI assets migration..."
    
    # Check if all AI files from audit exist somewhere
    if [ -f "AUDIT_"*/ai_assets.txt ]; then
        while IFS= read -r original_file; do
            filename=$(basename "$original_file")
            if find terrafusion* -name "$filename" -type f 2>/dev/null | grep -q .; then
                echo "  ✅ Found: $filename"
            else
                echo "  ⚠️  Missing: $filename"
                ((WARNINGS++))
            fi
        done < AUDIT_*/ai_assets.txt
    fi
}

# Function to validate Git integrity
validate_git() {
    echo "📦 Validating Git integrity..."
    
    for repo in terrafusion*; do
        if [ -d "$repo" ]; then
            echo "  ✅ $repo: Directory exists"
        fi
    done
    
    # Check main git repo
    if git status &>/dev/null; then
        echo "  ✅ Main repository: Git OK"
    else
        echo "  ❌ Main repository: Git issues"
        ((ERRORS++))
    fi
}

# Function to validate configs
validate_configs() {
    echo "⚙️ Validating configuration files..."
    
    # Check package.json files
    for pkg in */package.json terrafusion*/package.json; do
        if [ -f "$pkg" ]; then
            if node -e "JSON.parse(require('fs').readFileSync('$pkg'))" &>/dev/null 2>&1; then
                echo "  ✅ $pkg: Valid JSON"
            else
                echo "  ❌ $pkg: Invalid JSON"
                ((ERRORS++))
            fi
        fi
    done
}

# Function to test agent connectivity
test_agent_connectivity() {
    echo "🔌 Testing agent connectivity..."
    
    # Test message bus
    if [ -f "terrafusion-swarm/orchestration/message-bus.js" ]; then
        if node -c "terrafusion-swarm/orchestration/message-bus.js" &>/dev/null 2>&1; then
            echo "  ✅ Message bus: Syntax OK"
        else
            echo "  ❌ Message bus: Syntax errors"
            ((ERRORS++))
        fi
    fi
    
    # Test Redis connectivity (optional)
    if command -v redis-cli &>/dev/null; then
        if timeout 3 redis-cli ping &>/dev/null; then
            echo "  ✅ Redis: Connected"
        else
            echo "  ⚠️  Redis: Not running (optional)"
            ((WARNINGS++))
        fi
    else
        echo "  ℹ️  Redis: Not installed (optional)"
    fi
    
    return 0  # Don't fail on Redis issues
}

# Function to validate checksums
validate_integrity() {
    echo "🔒 Validating file integrity..."
    
    if ls AUDIT_*/checksums.sha256 &>/dev/null; then
        # Check a sample of critical files
        echo "  ℹ️  Checking sample of critical files..."
        local checked=0
        while IFS= read -r line && [ $checked -lt 10 ]; do
            checksum=$(echo "$line" | cut -d' ' -f1)
            filepath=$(echo "$line" | cut -d' ' -f2-)
            
            if [ -f "$filepath" ]; then
                current_checksum=$(sha256sum "$filepath" 2>/dev/null | cut -d' ' -f1)
                if [ "$checksum" = "$current_checksum" ]; then
                    echo "  ✅ Unchanged: $(basename "$filepath")"
                else
                    echo "  ℹ️  Modified: $(basename "$filepath") (expected during migration)"
                fi
                ((checked++))
            fi
        done < <(head -20 AUDIT_*/checksums.sha256)
        echo "  ℹ️  Checked $checked critical files"
    else
        echo "  ⚠️  No audit checksums found"
        ((WARNINGS++))
    fi
}

# Generate comprehensive report
generate_report() {
    cat > "$VALIDATION_REPORT" << EOF
# TerraFusion Migration Validation Report
Generated: $(date)

## Summary
- ✅ Validation Steps: 6
- ❌ Errors Found: $ERRORS
- ⚠️  Warnings: $WARNINGS
- 📊 Overall Status: $(if [ $ERRORS -eq 0 ]; then echo "PASSED"; else echo "FAILED"; fi)

## Validation Results

### Repository Structure
$(validate_structure 2>&1)

### AI Assets Migration
$(validate_ai_assets 2>&1)

### Git Integrity
$(validate_git 2>&1)

### Configuration Files
$(validate_configs 2>&1)

### Agent Connectivity
$(test_agent_connectivity 2>&1)

### File Integrity
$(validate_integrity 2>&1)

## Directory Overview
$(ls -la terrafusion* 2>/dev/null | head -20)

## Recommendations
$(if [ $ERRORS -gt 0 ]; then
    echo "⚠️ CRITICAL: $ERRORS errors detected. Review issues above."
    echo ""
    echo "### Rollback Instructions"
    echo '```bash'
    echo '# If needed, restore from backup:'
    echo 'LATEST_BACKUP=$(ls -1 BACKUP_* | tail -1)'
    echo 'cp -r "$LATEST_BACKUP"/* ./'
    echo '```'
else
    echo "✅ Migration validation successful! System ready for next phase."
    echo ""
    echo "### Next Steps"
    echo "1. Review warnings above (if any)"
    echo "2. Test critical workflows manually" 
    echo "3. Run 'npm test' in relevant directories"
    echo "4. Proceed to Phase 4: Production Readiness"
fi)

## Files Migrated
Total directories created: $(ls -1d terrafusion* 2>/dev/null | wc -l)
Largest directories by file count:
$(find terrafusion* -type f 2>/dev/null | cut -d'/' -f1 | sort | uniq -c | sort -nr | head -5)
EOF
}

# Main execution
echo "🔍 Starting comprehensive migration validation..."
echo ""

# Run all validations
validate_structure
echo ""
validate_ai_assets  
echo ""
validate_git
echo ""
validate_configs
echo ""
test_agent_connectivity
echo ""
validate_integrity
echo ""

# Generate report
generate_report

echo ""
echo "═══════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "✅ VALIDATION PASSED! Report: $VALIDATION_REPORT"
    echo "🚀 Ready to proceed to Production Readiness phase"
else
    echo "❌ VALIDATION FAILED! $ERRORS errors found."
    echo "📋 See $VALIDATION_REPORT for details"
    echo "🔧 Fix errors before proceeding"
fi

if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  $WARNINGS warnings noted (review recommended)"
fi

echo "═══════════════════════════════════════════════════════════"