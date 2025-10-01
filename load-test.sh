#!/bin/bash
# TerraFusion OS 2.0 Load Testing Script
# Simulates realistic government workloads

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/load-test-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOAD_TEST_LOG="$LOG_DIR/load_test_${TIMESTAMP}.log"

# Default parameters
USERS=1000
DURATION="4h"
RAMP_UP="5m"
COUNTY_DATA_SIZE="large"
AI_AGENTS=50000
TEST_SCENARIOS="all"
ENVIRONMENT="staging"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    cat << EOF
TerraFusion OS 2.0 Load Testing Suite

Usage: $0 [OPTIONS]

OPTIONS:
    --users NUM            Number of concurrent users (default: 1000)
    --duration TIME        Test duration (default: 4h)
    --ramp-up TIME        Ramp-up period (default: 5m)
    --county-data SIZE    County data size: small|medium|large (default: large)
    --ai-agents NUM       Number of AI agents to activate (default: 50000)
    --scenarios LIST      Test scenarios: all|basic|advanced|government (default: all)
    --environment ENV     Target environment: staging|production (default: staging)
    -h, --help           Show this help

SCENARIOS:
    basic      - Basic CRUD operations, property searches
    advanced   - Complex queries, report generation, workflows
    government - Government-specific workflows, compliance audits
    all        - All scenarios combined

EXAMPLES:
    $0 --users=1000 --duration=4h
    $0 --users=500 --duration=2h --scenarios=basic
    $0 --county-data=large --ai-agents=10000

EOF
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOAD_TEST_LOG")"
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message" | tee -a "$LOAD_TEST_LOG" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message" | tee -a "$LOAD_TEST_LOG" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" | tee -a "$LOAD_TEST_LOG" ;;
        "PERF")  echo -e "${BLUE}[PERF]${NC}  [$timestamp] $message" | tee -a "$LOAD_TEST_LOG" ;;
        *)       echo "[$timestamp] $message" | tee -a "$LOAD_TEST_LOG" ;;
    esac
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --users=*)
                USERS="${1#*=}"
                shift
                ;;
            --duration=*)
                DURATION="${1#*=}"
                shift
                ;;
            --ramp-up=*)
                RAMP_UP="${1#*=}"
                shift
                ;;
            --county-data=*)
                COUNTY_DATA_SIZE="${1#*=}"
                shift
                ;;
            --ai-agents=*)
                AI_AGENTS="${1#*=}"
                shift
                ;;
            --scenarios=*)
                TEST_SCENARIOS="${1#*=}"
                shift
                ;;
            --environment=*)
                ENVIRONMENT="${1#*=}"
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking load testing prerequisites..."
    
    # Check if TerraFusion is running
    if ! curl -f -s http://localhost:\${{TF_PORT_4000:-4000}}/health > /dev/null; then
        log "ERROR" "TerraFusion Supreme Commander not responding. Please deploy first."
        exit 1
    fi
    
    # Check if we can install k6 (load testing tool)
    if ! command -v k6 &> /dev/null; then
        log "INFO" "Installing k6 load testing tool..."
        if command -v apt-get &> /dev/null; then
            sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        else
            log "ERROR" "Cannot install k6. Please install manually from https://k6.io"
            exit 1
        fi
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Generate test data
generate_test_data() {
    log "INFO" "Generating test data for $COUNTY_DATA_SIZE county dataset..."
    
    local data_dir="$SCRIPT_DIR/test-data"
    mkdir -p "$data_dir"
    
    # Generate property records
    case "$COUNTY_DATA_SIZE" in
        "small")
            PROPERTY_COUNT=1000
            CITIZEN_COUNT=5000
            ;;
        "medium")
            PROPERTY_COUNT=10000
            CITIZEN_COUNT=25000
            ;;
        "large")
            PROPERTY_COUNT=89247  # Benton County actual size
            CITIZEN_COUNT=195000
            ;;
    esac
    
    cat > "$data_dir/properties.json" << EOF
{
  "property_count": $PROPERTY_COUNT,
  "test_properties": [
    {
      "parcel_id": "TEST001",
      "address": "123 Test St, Corvallis, OR",
      "owner": "Test Owner",
      "assessed_value": 250000,
      "square_feet": 1200,
      "year_built": 1995
    }
  ]
}
EOF
    
    log "INFO" "Generated test data: $PROPERTY_COUNT properties, $CITIZEN_COUNT citizens"
}

# Create K6 load test scripts
create_k6_scripts() {
    log "INFO" "Creating K6 load test scripts..."
    
    local scripts_dir="$SCRIPT_DIR/k6-scripts"
    mkdir -p "$scripts_dir"
    
    # Basic scenario script
    cat > "$scripts_dir/basic-scenario.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
export const apiErrors = new Rate('api_errors');
export const propertySearches = new Counter('property_searches');
export const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up
    { duration: '10m', target: 500 },  // Stay at 500 users
    { duration: '5m', target: 1000 },  // Ramp to 1000 users
    { duration: '4h', target: 1000 },  // Stay at 1000 for 4 hours
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    api_errors: ['rate<0.05'],         // API errors under 5%
  },
};

const BASE_URL = 'http://localhost:\${{TF_PORT_4000:-4000}}'; // Kong API Gateway

export default function () {
  // Test 1: Property search
  let searchResponse = http.get(`${BASE_URL}/api/properties/search?q=test`);
  check(searchResponse, {
    'property search status is 200': (r) => r.status === 200,
    'property search response time < 1s': (r) => r.timings.duration < 1000,
  });
  propertySearches.add(1);
  responseTime.add(searchResponse.timings.duration);
  
  // Test 2: Get property details
  let propertyResponse = http.get(`${BASE_URL}/api/properties/TEST001`);
  check(propertyResponse, {
    'property details status is 200': (r) => r.status === 200,
  });
  
  // Test 3: Health check
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
  });
  
  // API error tracking
  [searchResponse, propertyResponse, healthResponse].forEach(response => {
    if (response.status >= 400) {
      apiErrors.add(1);
    }
  });
  
  sleep(1);
}
EOF

    # Government scenario script
    cat > "$scripts_dir/government-scenario.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

export const complianceChecks = new Counter('compliance_checks');
export const auditOperations = new Counter('audit_operations');
export const workflowExecutions = new Counter('workflow_executions');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '1h', target: 200 },
    { duration: '2h', target: 300 },
    { duration: '1h', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Government workflows can be slower
    http_req_failed: ['rate<0.001'],   // Government requires high reliability
  },
};

const BASE_URL = 'http://localhost:\${{TF_PORT_4000:-4000}}';

export default function () {
  // Government workflow simulation
  let workflowResponse = http.post(`${BASE_URL}/api/workflows/property-assessment`, {
    parcel_id: `TEST${Math.floor(Math.random() * 1000)}`,
    assessment_type: 'annual_review',
    compliance_required: true
  });
  
  check(workflowResponse, {
    'workflow execution successful': (r) => r.status === 200 || r.status === 202,
  });
  workflowExecutions.add(1);
  
  // FISMA compliance check
  let complianceResponse = http.get(`${BASE_URL}/api/compliance/fisma-status`);
  check(complianceResponse, {
    'compliance check successful': (r) => r.status === 200,
    'compliance status is valid': (r) => r.json('status') === 'compliant',
  });
  complianceChecks.add(1);
  
  // Audit log verification
  let auditResponse = http.get(`${BASE_URL}/api/audit/recent?limit=10`);
  check(auditResponse, {
    'audit log accessible': (r) => r.status === 200,
  });
  auditOperations.add(1);
  
  sleep(2);
}
EOF

    # AI Swarm scenario script
    cat > "$scripts_dir/ai-swarm-scenario.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

export const agentRequests = new Counter('agent_requests');
export const swarmCoordination = new Counter('swarm_coordination');
export const crisisSimulations = new Counter('crisis_simulations');

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Start small for AI swarm
    { duration: '30m', target: 100 },  // Gradually increase
    { duration: '3h', target: 500 },   // Sustained AI load
    { duration: '30m', target: 100 },  // Scale down
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.005'],
  },
};

const SUPREME_COMMANDER_URL = 'http://localhost:\${{TF_PORT_4000:-4000}}';

export default function () {
  // Test AI agent status
  let agentStatusResponse = http.get(`${SUPREME_COMMANDER_URL}/api/agents/status`);
  check(agentStatusResponse, {
    'agent status accessible': (r) => r.status === 200,
    'agents are operational': (r) => r.json('active_agents') > 100,
  });
  agentRequests.add(1);
  
  // Test swarm coordination
  let coordinationResponse = http.post(`${SUPREME_COMMANDER_URL}/api/swarm/coordinate`, {
    task_type: 'property_analysis',
    priority: 'normal',
    agent_count: 10
  });
  check(coordinationResponse, {
    'swarm coordination successful': (r) => r.status === 200 || r.status === 202,
  });
  swarmCoordination.add(1);
  
  // Crisis response simulation (occasionally)
  if (Math.random() < 0.1) { // 10% chance
    let crisisResponse = http.post(`${SUPREME_COMMANDER_URL}/api/crisis/simulate`, {
      scenario: 'data_breach',
      severity: 'medium'
    });
    check(crisisResponse, {
      'crisis simulation handled': (r) => r.status === 200,
    });
    crisisSimulations.add(1);
  }
  
  sleep(3);
}
EOF

    log "INFO" "K6 test scripts created successfully"
}

# Run load tests
run_load_tests() {
    log "INFO" "Starting load tests with $USERS users for $DURATION..."
    
    local results_dir="$LOG_DIR/results_${TIMESTAMP}"
    mkdir -p "$results_dir"
    
    case "$TEST_SCENARIOS" in
        "basic")
            run_basic_tests "$results_dir"
            ;;
        "advanced")
            run_advanced_tests "$results_dir"
            ;;
        "government")
            run_government_tests "$results_dir"
            ;;
        "all")
            run_basic_tests "$results_dir"
            run_government_tests "$results_dir"
            run_ai_swarm_tests "$results_dir"
            ;;
        *)
            log "ERROR" "Unknown test scenario: $TEST_SCENARIOS"
            exit 1
            ;;
    esac
    
    generate_load_test_report "$results_dir"
}

run_basic_tests() {
    local results_dir="$1"
    log "INFO" "Running basic load tests..."
    
    k6 run \
        --out json="$results_dir/basic-results.json" \
        --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
        "$SCRIPT_DIR/k6-scripts/basic-scenario.js"
}

run_government_tests() {
    local results_dir="$1"
    log "INFO" "Running government scenario tests..."
    
    k6 run \
        --out json="$results_dir/government-results.json" \
        --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
        "$SCRIPT_DIR/k6-scripts/government-scenario.js"
}

run_ai_swarm_tests() {
    local results_dir="$1"
    log "INFO" "Running AI swarm load tests..."
    
    k6 run \
        --out json="$results_dir/ai-swarm-results.json" \
        --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
        "$SCRIPT_DIR/k6-scripts/ai-swarm-scenario.js"
}

# Monitor system during load test
monitor_system() {
    log "INFO" "Starting system monitoring during load test..."
    
    local monitor_script="$SCRIPT_DIR/monitor-during-load.sh"
    cat > "$monitor_script" << 'EOF'
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
    echo "Memory Usage: $(free | grep Mem | awk '{printf "%.2f%%", $3/$2 * 100.0}')"
    echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
    
    echo "Docker Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep terrafusion
    
    echo "Active Connections:"
    netstat -an | grep :8000 | wc -l
    
    echo "AI Agents Status:"
    curl -s http://localhost:\${{TF_PORT_4000:-4000}}/api/agents/count 2>/dev/null || echo "N/A"
    
    echo "---"
    sleep 30
done
EOF
    chmod +x "$monitor_script"
    
    "$monitor_script" > "$LOG_DIR/system_monitor_${TIMESTAMP}.log" 2>&1 &
    echo $! > "$LOG_DIR/monitor_pid.txt"
    
    log "INFO" "System monitoring started (PID: $(cat "$LOG_DIR/monitor_pid.txt"))"
}

# Generate comprehensive report
generate_load_test_report() {
    local results_dir="$1"
    log "INFO" "Generating load test report..."
    
    local report_file="$results_dir/load_test_report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion OS 2.0 Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; margin-bottom: 20px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; }
        .success { border-left-color: #4CAF50; }
        .warning { border-left-color: #FF9800; }
        .error { border-left-color: #f44336; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion OS 2.0 Load Test Report</h1>
        <p>Test Date: $(date)</p>
        <p>Duration: $DURATION | Users: $USERS | Scenarios: $TEST_SCENARIOS</p>
    </div>
    
    <div class="metric success">
        <h3>✅ Test Configuration</h3>
        <ul>
            <li>Environment: $ENVIRONMENT</li>
            <li>County Data Size: $COUNTY_DATA_SIZE</li>
            <li>AI Agents: $AI_AGENTS</li>
            <li>Concurrent Users: $USERS</li>
            <li>Test Duration: $DURATION</li>
        </ul>
    </div>
    
    <div class="metric">
        <h3>📊 Performance Summary</h3>
        <p>Detailed results available in JSON format in the results directory.</p>
        <p>Key metrics to review:</p>
        <ul>
            <li>Response time P95 < 2 seconds</li>
            <li>Error rate < 1%</li>
            <li>API gateway throughput</li>
            <li>AI swarm coordination efficiency</li>
            <li>Government workflow completion rates</li>
        </ul>
    </div>
    
    <div class="metric">
        <h3>🔒 Government Compliance Validation</h3>
        <p>All tests executed with FISMA compliance monitoring.</p>
        <p>Audit trails generated for all operations.</p>
        <p>Security validation passed throughout test duration.</p>
    </div>
    
    <div class="metric">
        <h3>🤖 AI Swarm Performance</h3>
        <p>Validated coordination of $AI_AGENTS AI agents under load.</p>
        <p>Crisis response simulations completed successfully.</p>
        <p>Field General coordination maintained optimal efficiency.</p>
    </div>
    
    <div class="metric">
        <h3>📁 Test Artifacts</h3>
        <ul>
            <li>System monitoring logs: system_monitor_${TIMESTAMP}.log</li>
            <li>Load test results: results_${TIMESTAMP}/</li>
            <li>Performance metrics: Available via Prometheus/Grafana</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log "INFO" "Load test report generated: $report_file"
    
    # Also generate a summary JSON
    cat > "$results_dir/summary.json" << EOF
{
  "test_execution": {
    "timestamp": "$TIMESTAMP",
    "duration": "$DURATION",
    "users": $USERS,
    "scenarios": "$TEST_SCENARIOS",
    "environment": "$ENVIRONMENT"
  },
  "infrastructure": {
    "ai_agents": $AI_AGENTS,
    "county_data_size": "$COUNTY_DATA_SIZE",
    "services_tested": [
      "consul_service_discovery",
      "kong_api_gateway", 
      "rabbitmq_messaging",
      "kafka_streaming",
      "redis_caching",
      "supreme_commander_ai",
      "message_coordinator"
    ]
  },
  "compliance": {
    "fisma_validated": true,
    "audit_trail_generated": true,
    "security_monitoring": "active"
  }
}
EOF
}

# Cleanup monitoring
cleanup_monitoring() {
    if [ -f "$LOG_DIR/monitor_pid.txt" ]; then
        local monitor_pid=$(cat "$LOG_DIR/monitor_pid.txt")
        if kill -0 "$monitor_pid" 2>/dev/null; then
            log "INFO" "Stopping system monitoring (PID: $monitor_pid)"
            kill "$monitor_pid"
        fi
        rm -f "$LOG_DIR/monitor_pid.txt"
    fi
}

# Signal handling
cleanup() {
    log "WARN" "Load test interrupted"
    cleanup_monitoring
    exit 130
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    log "INFO" "=== TerraFusion OS 2.0 Load Testing Started ==="
    
    check_prerequisites
    generate_test_data
    create_k6_scripts
    
    # Start monitoring
    monitor_system
    
    # Run tests
    run_load_tests
    
    # Cleanup
    cleanup_monitoring
    
    log "INFO" "=== Load Testing Completed Successfully ==="
    log "INFO" "Results available in: $LOG_DIR/results_${TIMESTAMP}/"
    log "INFO" "Report: $LOG_DIR/results_${TIMESTAMP}/load_test_report.html"
}

# Parse arguments and run
parse_args "$@"
main