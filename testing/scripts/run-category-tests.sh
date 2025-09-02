#!/bin/bash

# TerraFusion OS - Category-Specific Test Runner
# Executes tests for specific categories
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
CATEGORY=$1

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 <category>"
    echo
    echo "Available categories:"
    echo "  core          - Core application tests (unit, integration, e2e)"
    echo "  government    - Government-specific tests (compliance, harris-pacs)"
    echo "  ai            - AI and machine learning tests"
    echo "  performance   - Performance and scalability tests"
    echo "  security      - Security and compliance tests"
    echo "  infrastructure- Infrastructure and deployment tests"
    echo "  modules       - Module-specific tests"
    echo "  compliance    - FISMA, NIST, SOC2 compliance tests"
    echo "  harris-pacs   - Harris PACS integration tests"
    echo "  revenue       - Revenue discovery tests"
    echo "  benton        - Benton County specific tests"
    echo "  claude-flow   - Claude-Flow integration tests"
    echo "  quantum       - Quantum computing tests"
    echo "  auth          - Authentication and authorization tests"
    echo "  ai-swarm      - AI Swarm tests (1,008 agents, quantum optimization)"
    echo "  quantum       - Quantum computing performance tests"
    echo "  revenue       - Revenue discovery and optimization tests"
    echo "  harris-pacs   - Harris PACS v12.4.7 integration tests"
    echo "  claude-flow   - Claude-Flow v2.0.0 Alpha integration tests"
    echo "  benton        - Benton County specific implementation tests"
    echo
    exit 1
}

# Check if category is provided
if [ -z "$CATEGORY" ]; then
    usage
fi

cd "$TERRAFUSION_ROOT"

# Execute tests based on category
case "$CATEGORY" in
    "core")
        print_status "Running core application tests..."
        npm run test:unit
        npm run test:integration
        npm run test:e2e
        ;;
    
    "government")
        print_status "Running government-specific tests..."
        ./testing/scripts/run-category-tests.sh compliance
        ./testing/scripts/run-category-tests.sh harris-pacs
        ./testing/scripts/run-category-tests.sh revenue
        ./testing/scripts/run-category-tests.sh benton
        ;;
    
    "ai")
        print_status "Running AI and machine learning tests..."
        node championship-test-runner.ts
        python -m pytest backend/ai-models/ -v
        ./.ai/claude-flow/scripts/test-benton-county.sh
        node execute-championship-tests.ts
        ./testing/scripts/run-category-tests.sh ai-swarm
        ;;
    
    "ai-swarm")
        print_status "Running AI Swarm tests (1,008 agents, 92.5% success rate)..."
        npx vitest run testing/ai/swarm/swarm-coordination.test.ts
        npx vitest run testing/ai/swarm/agent-performance.test.ts
        npx vitest run testing/ai/swarm/quantum-optimization.test.ts
        npx vitest run testing/ai/swarm/swarm-intelligence.test.ts
        ;;
    
    "performance")
        print_status "Running performance and scalability tests..."
        npm run test:performance
        node tests/scalability/ScalabilityTests.ts
        python backend/quantum-performance/quantum_test.py
        ;;
    
    "security")
        print_status "Running security and compliance tests..."
        node tests/security/SecurityHardeningTests.ts
        npm run test:security
        ;;
    
    "infrastructure")
        print_status "Running infrastructure tests..."
        ./scripts/production-validation-runner.sh
        python infrastructure/monitoring/test_monitoring_pipeline.py
        ;;
    
    "modules")
        print_status "Running module-specific tests..."
        cd modules/testing-suite && npm test
        cd ../terra-agent && npm test
        cd ../terra-flow && npm test
        cd ../property-workbench && npm test
        ;;
    
    "compliance")
        print_status "Running compliance tests (FISMA, NIST, SOC2)..."
        node tests/government/basic-compliance.spec.ts
        npm run test:compliance
        ;;
    
    "harris-pacs")
        print_status "Running Harris PACS integration tests..."
        python backend/ai-models/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK/harris_pacs_integration_test.py
        node tests/integration/harris-pacs-sync.test.ts
        ;;
    
    "revenue")
        print_status "Running revenue discovery tests..."
        node tests/integration/revenue-discovery.test.ts
        python backend/ai-models/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK/revenue_discovery_test.py
        ;;
    
    "benton")
        print_status "Running Benton County specific tests..."
        ./.ai/claude-flow/scripts/test-benton-county.sh
        ./scripts/test-claude-flow-benton-county.sh
        ;;
    
    "claude-flow")
        print_status "Running Claude-Flow integration tests..."
        ./.ai/claude-flow/scripts/test-benton-county.sh
        npx claude-flow@alpha hive-mind status
        npx claude-flow@alpha memory stats
        ;;
    
    "quantum")
        print_status "Running quantum computing tests..."
        python backend/quantum-performance/quantum_test.py
        python backend/quantum-performance/quantum_roi_calculator.py
        npx vitest run testing/ai/quantum/quantum-performance.test.ts
        ;;
    
    "revenue")
        print_status "Running revenue discovery and optimization tests..."
        node tests/integration/revenue-discovery.test.ts
        python backend/ai-models/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK/revenue_discovery_test.py
        npx vitest run testing/revenue/revenue-hunter.test.ts
        ;;
    
    "harris-pacs")
        print_status "Running Harris PACS v12.4.7 integration tests..."
        python backend/ai-models/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK/harris_pacs_integration_test.py
        node tests/integration/harris-pacs-sync.test.ts
        npx vitest run testing/harris-pacs/integration.test.ts
        ;;
    
    "claude-flow")
        print_status "Running Claude-Flow v2.0.0 Alpha integration tests..."
        ./.ai/claude-flow/scripts/test-benton-county.sh
        npx claude-flow@alpha hive-mind status
        npx claude-flow@alpha memory stats
        npx vitest run testing/claude-flow/integration.test.ts
        ;;
    
    "benton")
        print_status "Running Benton County specific implementation tests..."
        ./.ai/claude-flow/scripts/test-benton-county.sh
        ./scripts/test-claude-flow-benton-county.sh
        npx vitest run testing/benton-county/benton-specific.test.ts
        ;;
    
    "auth")
        print_status "Running authentication and authorization tests..."
        npm run test:auth
        node tests/security/auth-tests.ts
        ;;
    
    *)
        print_error "Unknown category: $CATEGORY"
        usage
        ;;
esac

print_success "Category '$CATEGORY' tests completed successfully!"
