#!/bin/bash
# TerraFusion OS - Frontend Architecture Validation
# Prevents AI agents from working on wrong frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🛡️ TerraFusion OS - Frontend Architecture Validation"
echo "=================================================="

# Check if we're in the correct frontend directory
check_frontend_location() {
    local current_dir="$(pwd)"
    
    if [[ "$current_dir" == *"/frontend/"* ]] && [[ "$current_dir" != *"/frontend-v2/"* ]]; then
        echo "❌ CRITICAL ERROR: Working in LEGACY frontend directory!"
        echo "   Current: $current_dir"
        echo "   This is FORBIDDEN - contains 97+ TypeScript errors"
        echo ""
        echo "✅ CORRECT PATH: /workspaces/terrafusion_os_1.0/frontend-v2/"
        echo ""
        echo "🔧 IMMEDIATE ACTION REQUIRED:"
        echo "   cd /workspaces/terrafusion_os_1.0/frontend-v2/shell"
        echo "   npm run dev:os"
        exit 1
    fi
    
    if [[ "$current_dir" == *"/frontend-v2/"* ]]; then
        echo "✅ Correct frontend architecture detected: frontend-v2"
        return 0
    fi
    
    echo "⚠️  WARNING: Not in any frontend directory"
    echo "   Recommended: cd /workspaces/terrafusion_os_1.0/frontend-v2/shell"
    return 0
}

# Validate package.json for enterprise architecture
validate_package_json() {
    if [[ -f "package.json" ]]; then
        local version=$(grep '"version"' package.json | grep -o '"[^"]*"' | sed 's/"//g' | tail -1)
        local name=$(grep '"name"' package.json | grep -o '"[^"]*"' | sed 's/"//g' | tail -1)
        
        if [[ "$version" == "2.0.0" ]] && [[ "$name" == *"frontend-shell"* ]]; then
            echo "✅ Enterprise frontend architecture validated"
            echo "   Name: $name"
            echo "   Version: $version"
            return 0
        else
            echo "❌ WRONG FRONTEND: Legacy architecture detected"
            echo "   Name: $name"
            echo "   Version: $version"
            echo "   Expected: @terrafusion/frontend-shell v2.0.0"
            exit 1
        fi
    fi
}

# Check for modern dependencies
validate_dependencies() {
    if [[ -f "package.json" ]]; then
        local has_styled_components=$(grep -c "styled-components" package.json || true)
        local has_framer_motion=$(grep -c "framer-motion" package.json || true)
        local has_redux_toolkit=$(grep -c "@reduxjs/toolkit" package.json || true)
        
        if [[ $has_styled_components -gt 0 ]] && [[ $has_framer_motion -gt 0 ]] && [[ $has_redux_toolkit -gt 0 ]]; then
            echo "✅ Modern enterprise dependencies confirmed"
            return 0
        else
            echo "❌ LEGACY DEPENDENCIES: Missing enterprise architecture components"
            echo "   Missing styled-components, framer-motion, or @reduxjs/toolkit"
            exit 1
        fi
    fi
}

# Validate TypeScript compilation
validate_typescript() {
    if [[ -f "tsconfig.json" ]] && command -v npx &> /dev/null; then
        echo "🔍 Checking TypeScript compilation..."
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            echo "✅ TypeScript compilation successful (0 errors)"
            return 0
        else
            echo "❌ TYPESCRIPT ERRORS DETECTED"
            echo "   This indicates legacy frontend architecture"
            echo "   Enterprise frontend-v2 has ZERO TypeScript errors"
            exit 1
        fi
    fi
}

# Main validation
main() {
    echo "🎯 Starting frontend architecture validation..."
    echo ""
    
    check_frontend_location
    
    if [[ -f "package.json" ]]; then
        validate_package_json
        validate_dependencies
        validate_typescript
    fi
    
    echo ""
    echo "🎉 SUCCESS: Frontend architecture validation passed!"
    echo "✅ Safe to proceed with frontend-v2 development"
    echo ""
    echo "🚀 Recommended development commands:"
    echo "   npm run os:dev       # Backend API + Frontend-v2 Shell"
    echo "   npm run shell:dev    # Frontend-v2 Shell only"
    echo ""
    echo "📍 Current frontend-v2 ports:"
    echo "   Frontend Shell: \${TF_LOKI_PORT:-3100}"
    echo "   Backend API: \${TF_API_PORT:-5046}"
}

main "$@"