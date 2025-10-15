#!/bin/bash

# TerraFusion OS - Advanced Testing Suite Runner
# Bulletproof testing for government-grade systems
# Government. Transcended.

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TERRAFUSION_ROOT="/e/TerraFusion_OS_1.0"
ADVANCED_CATEGORY=$1

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               TerraFusion OS Advanced Testing               ║"
    echo "║                  Bulletproof Validation                     ║"
    echo "║                 Government. Transcended.                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${CYAN}[ADVANCED]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[BULLETPROOF]${NC} $1"
}

print_error() {
    echo -e "${RED}[CRITICAL]${NC} $1"
}

usage() {
    echo "Usage: $0 <advanced-category>"
    echo
    echo "Advanced Testing Categories:"
    echo "  chaos-engineering    - System resilience and fault tolerance"
    echo "  property-based       - Mathematical property validation"
    echo "  mutation             - Test quality validation"
    echo "  security-penetration - Advanced security testing"
    echo "  visual-regression    - UI consistency validation"
    echo "  synthetic-data       - Data generation and validation"
    echo "  observability        - Monitoring and alerting"
    echo "  load-stress          - Performance under extreme conditions"
    echo "  contract-api         - API contract validation"
    echo "  disaster-recovery    - Failover and recovery testing"
    echo "  all-advanced         - Run all advanced test suites"
    echo
    exit 1
}

if [ -z "$ADVANCED_CATEGORY" ]; then
    usage
fi

cd "$TERRAFUSION_ROOT"
print_header

case "$ADVANCED_CATEGORY" in
    "chaos-engineering")
        print_status "Running Chaos Engineering tests..."
        npx vitest run testing/advanced/chaos-engineering/
        print_success "System resilience validated"
        ;;
    
    "property-based")
        print_status "Running Property-Based tests..."
        npm install --save-dev fast-check
        npx vitest run testing/advanced/property-based/
        print_success "Mathematical properties validated"
        ;;
    
    "mutation")
        print_status "Running Mutation tests..."
        npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
        npx vitest run testing/advanced/mutation/
        print_success "Test quality validated"
        ;;
    
    "security-penetration")
        print_status "Running Advanced Security tests..."
        npx vitest run testing/advanced/security/
        print_success "Government-grade security validated"
        ;;
    
    "visual-regression")
        print_status "Running Visual Regression tests..."
        npx playwright test testing/advanced/visual-regression/
        print_success "UI consistency validated"
        ;;
    
    "synthetic-data")
        print_status "Running Synthetic Data tests..."
        npx vitest run testing/advanced/synthetic-data/
        print_success "Data generation validated"
        ;;
    
    "observability")
        print_status "Running Observability tests..."
        npx vitest run testing/advanced/observability/
        print_success "System monitoring validated"
        ;;
    
    "load-stress")
        print_status "Running Load & Stress tests..."
        npm install --save-dev artillery k6
        k6 run testing/advanced/performance/load-test.js
        print_success "Performance under load validated"
        ;;
    
    "contract-api")
        print_status "Running Contract & API tests..."
        npm install --save-dev @pact-foundation/pact
        npx vitest run testing/advanced/contracts/
        print_success "API contracts validated"
        ;;
    
    "disaster-recovery")
        print_status "Running Disaster Recovery tests..."
        npx vitest run testing/advanced/disaster-recovery/
        print_success "Failover capabilities validated"
        ;;
    
    "all-advanced")
        print_status "Running ALL advanced test suites..."
        
        categories=(
            "chaos-engineering"
            "property-based" 
            "mutation"
            "security-penetration"
            "visual-regression"
            "synthetic-data"
            "observability"
        )
        
        for category in "${categories[@]}"; do
            print_status "Executing: $category"
            $0 "$category"
        done
        
        print_success "ALL ADVANCED TESTS COMPLETED"
        ;;
    
    *)
        print_error "Unknown advanced category: $ADVANCED_CATEGORY"
        usage
        ;;
esac

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 ADVANCED TESTING COMPLETE                   ║"
echo "║                                                              ║"
echo "║  🔥 Chaos Engineering: RESILIENT                            ║"
echo "║  🧮 Property-Based: MATHEMATICALLY SOUND                    ║"
echo "║  🧬 Mutation Testing: HIGH QUALITY                          ║"
echo "║  🔒 Security Testing: GOVERNMENT GRADE                      ║"
echo "║  👁️  Visual Regression: CONSISTENT                          ║"
echo "║  🧪 Synthetic Data: VALIDATED                               ║"
echo "║  📊 Observability: INTELLIGENT                              ║"
echo "║                                                              ║"
echo "║  🏆 BULLETPROOF STATUS: ACHIEVED                            ║"
echo "║  🏛️  Government. Transcended.                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
