#!/bin/bash
#
# TerraFusion Performance Testing Script
# Load testing and performance benchmarking for all services
#
# Usage: ./performance-test.sh [options]
# Options:
#   -t    Test type (smoke|load|stress|spike)
#   -u    Number of virtual users (default: 100)
#   -d    Duration in seconds (default: 300)
#   -r    Generate HTML report
#   -c    Component to test (api|frontend|ai-engine|all)

set -euo pipefail

# Configuration
TEST_TYPE=${TEST_TYPE:-load}
VIRTUAL_USERS=${VIRTUAL_USERS:-100}
DURATION=${DURATION:-300}
RAMP_UP=${RAMP_UP:-60}
GENERATE_REPORT=false
COMPONENT="all"
BASE_URL=${BASE_URL:-"http://localhost:8080"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3003"}
AI_ENGINE_URL=${AI_ENGINE_URL:-"http://localhost:8001"}
RESULTS_DIR="/var/reports/performance"
LOG_FILE="/var/log/terrafusion/perf_test_$(date +%Y%m%d_%H%M%S).log"

# Test credentials
TEST_USER="perf_test@terrafusion.com"
TEST_PASSWORD="PerfTest123!"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$RESULTS_DIR"

# Parse arguments
while getopts "t:u:d:rc:" opt; do
    case $opt in
        t) TEST_TYPE="$OPTARG" ;;
        u) VIRTUAL_USERS="$OPTARG" ;;
        d) DURATION="$OPTARG" ;;
        r) GENERATE_REPORT=true ;;
        c) COMPONENT="$OPTARG" ;;
        *) echo "Usage: $0 [-t type] [-u users] [-d duration] [-r] [-c component]"; exit 1 ;;
    esac
done

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed. Installing..."
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        sudo apt-get install -y jq
    fi
    
    log_success "Prerequisites check passed"
}

# Create k6 test scripts
create_api_test_script() {
    cat > "$RESULTS_DIR/api_test.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
    stages: [
        { duration: '__RAMP_UP__s', target: __USERS__ },
        { duration: '__DURATION__s', target: __USERS__ },
        { duration: '60s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
        errors: ['rate<0.05'], // Error rate must be below 5%
    },
};

const BASE_URL = '__BASE_URL__';
let authToken = null;

export function setup() {
    // Login and get auth token
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: '__TEST_USER__',
        password: '__TEST_PASSWORD__'
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginRes.status === 200) {
        authToken = JSON.parse(loginRes.body).token;
    }
    
    return { authToken };
}

export default function(data) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.authToken}`
    };
    
    // Test 1: Get projects list
    let res = http.get(`${BASE_URL}/api/projects`, { headers });
    check(res, {
        'projects list status is 200': (r) => r.status === 200,
        'projects list response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    
    sleep(1);
    
    // Test 2: Create project
    const projectData = {
        name: `Perf Test Project ${__VU}-${__ITER}`,
        description: 'Performance test project',
        type: 'construction',
        location: 'Test Location'
    };
    
    res = http.post(`${BASE_URL}/api/projects`, JSON.stringify(projectData), { headers });
    check(res, {
        'create project status is 201': (r) => r.status === 201,
        'create project response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(res.status !== 201);
    
    let projectId = null;
    if (res.status === 201) {
        projectId = JSON.parse(res.body).id;
    }
    
    sleep(1);
    
    // Test 3: Cost calculation
    const costData = {
        project_type: 'construction',
        area_sqft: 10000,
        materials: ['concrete', 'steel'],
        location: 'urban'
    };
    
    res = http.post(`${BASE_URL}/api/costs/calculate`, JSON.stringify(costData), { headers });
    check(res, {
        'cost calculation status is 200': (r) => r.status === 200,
        'cost calculation response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    errorRate.add(res.status !== 200);
    
    sleep(1);
    
    // Test 4: Get project details
    if (projectId) {
        res = http.get(`${BASE_URL}/api/projects/${projectId}`, { headers });
        check(res, {
            'get project status is 200': (r) => r.status === 200,
            'get project response time < 500ms': (r) => r.timings.duration < 500,
        });
        errorRate.add(res.status !== 200);
    }
    
    sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

export function teardown(data) {
    // Cleanup can be done here if needed
}
EOF

    # Replace placeholders
    sed -i "s|__RAMP_UP__|$RAMP_UP|g" "$RESULTS_DIR/api_test.js"
    sed -i "s|__DURATION__|$DURATION|g" "$RESULTS_DIR/api_test.js"
    sed -i "s|__USERS__|$VIRTUAL_USERS|g" "$RESULTS_DIR/api_test.js"
    sed -i "s|__BASE_URL__|$BASE_URL|g" "$RESULTS_DIR/api_test.js"
    sed -i "s|__TEST_USER__|$TEST_USER|g" "$RESULTS_DIR/api_test.js"
    sed -i "s|__TEST_PASSWORD__|$TEST_PASSWORD|g" "$RESULTS_DIR/api_test.js"
}

create_frontend_test_script() {
    cat > "$RESULTS_DIR/frontend_test.js" << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '__RAMP_UP__s', target: __USERS__ },
        { duration: '__DURATION__s', target: __USERS__ },
        { duration: '60s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    },
};

const FRONTEND_URL = '__FRONTEND_URL__';

export default function() {
    // Test 1: Load homepage
    let res = http.get(`${FRONTEND_URL}/`);
    check(res, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage loads < 2s': (r) => r.timings.duration < 2000,
        'homepage has content': (r) => r.body.includes('TerraFusion'),
    });
    
    // Test 2: Load static assets
    const staticAssets = [
        '/static/css/main.css',
        '/static/js/main.js',
        '/favicon.ico'
    ];
    
    staticAssets.forEach(asset => {
        res = http.get(`${FRONTEND_URL}${asset}`);
        check(res, {
            [`${asset} loads successfully`]: (r) => r.status === 200 || r.status === 304,
            [`${asset} loads < 500ms`]: (r) => r.timings.duration < 500,
        });
    });
}
EOF

    # Replace placeholders
    sed -i "s|__RAMP_UP__|$RAMP_UP|g" "$RESULTS_DIR/frontend_test.js"
    sed -i "s|__DURATION__|$DURATION|g" "$RESULTS_DIR/frontend_test.js"
    sed -i "s|__USERS__|$VIRTUAL_USERS|g" "$RESULTS_DIR/frontend_test.js"
    sed -i "s|__FRONTEND_URL__|$FRONTEND_URL|g" "$RESULTS_DIR/frontend_test.js"
}

create_ai_engine_test_script() {
    cat > "$RESULTS_DIR/ai_engine_test.js" << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '__RAMP_UP__s', target: __USERS__ },
        { duration: '__DURATION__s', target: __USERS__ },
        { duration: '60s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000'], // AI predictions can take longer
    },
};

const AI_ENGINE_URL = '__AI_ENGINE_URL__';

export default function() {
    const predictionData = {
        project_type: 'construction',
        features: {
            area: Math.floor(Math.random() * 50000) + 5000,
            floors: Math.floor(Math.random() * 10) + 1,
            location_type: ['urban', 'suburban', 'rural'][Math.floor(Math.random() * 3)]
        }
    };
    
    const params = {
        headers: { 'Content-Type': 'application/json' },
    };
    
    let res = http.post(`${AI_ENGINE_URL}/api/predict`, JSON.stringify(predictionData), params);
    
    check(res, {
        'prediction status is 200': (r) => r.status === 200,
        'prediction has result': (r) => JSON.parse(r.body).prediction !== undefined,
        'prediction time < 5s': (r) => r.timings.duration < 5000,
    });
}
EOF

    # Replace placeholders
    sed -i "s|__RAMP_UP__|$RAMP_UP|g" "$RESULTS_DIR/ai_engine_test.js"
    sed -i "s|__DURATION__|$DURATION|g" "$RESULTS_DIR/ai_engine_test.js"
    sed -i "s|__USERS__|$VIRTUAL_USERS|g" "$RESULTS_DIR/ai_engine_test.js"
    sed -i "s|__AI_ENGINE_URL__|$AI_ENGINE_URL|g" "$RESULTS_DIR/ai_engine_test.js"
}

# Run performance test
run_performance_test() {
    local test_script=$1
    local test_name=$2
    local output_file="$RESULTS_DIR/${test_name}_$(date +%Y%m%d_%H%M%S).json"
    
    log "Running $test_name test..."
    log "Test type: $TEST_TYPE"
    log "Virtual users: $VIRTUAL_USERS"
    log "Duration: $DURATION seconds"
    
    # Adjust options based on test type
    case $TEST_TYPE in
        smoke)
            VIRTUAL_USERS=5
            DURATION=60
            ;;
        stress)
            VIRTUAL_USERS=$((VIRTUAL_USERS * 2))
            ;;
        spike)
            # Modify the test script for spike testing
            sed -i "s/{ duration: '[0-9]*s', target: $VIRTUAL_USERS }/{ duration: '10s', target: $((VIRTUAL_USERS * 3)) }/" "$test_script"
            ;;
    esac
    
    # Run k6 test
    k6 run --out json="$output_file" "$test_script" 2>&1 | tee -a "$LOG_FILE"
    
    # Parse results
    if [ -f "$output_file" ]; then
        log "Analyzing results..."
        
        # Extract key metrics
        local avg_response_time=$(jq -s 'map(select(.type=="Point" and .metric=="http_req_duration" and .data.tags.status=="200")) | map(.data.value) | add/length' "$output_file" 2>/dev/null || echo "N/A")
        local p95_response_time=$(jq -s 'map(select(.type=="Point" and .metric=="http_req_duration")) | map(.data.value) | sort | .[length * 0.95 | floor]' "$output_file" 2>/dev/null || echo "N/A")
        local error_rate=$(jq -s 'map(select(.type=="Point" and .metric=="errors")) | map(.data.value) | add/length * 100' "$output_file" 2>/dev/null || echo "0")
        local requests_per_sec=$(jq -s 'map(select(.type=="Point" and .metric=="http_reqs")) | length / '"$DURATION" "$output_file" 2>/dev/null || echo "N/A")
        
        log "Average response time: ${avg_response_time}ms"
        log "95th percentile response time: ${p95_response_time}ms"
        log "Error rate: ${error_rate}%"
        log "Requests per second: $requests_per_sec"
        
        # Store results for report
        echo "{
            \"test_name\": \"$test_name\",
            \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
            \"test_type\": \"$TEST_TYPE\",
            \"virtual_users\": $VIRTUAL_USERS,
            \"duration\": $DURATION,
            \"avg_response_time\": $avg_response_time,
            \"p95_response_time\": $p95_response_time,
            \"error_rate\": $error_rate,
            \"requests_per_sec\": $requests_per_sec
        }" > "$RESULTS_DIR/${test_name}_summary.json"
    fi
}

# Monitor system resources during test
monitor_resources() {
    local pid=$1
    local monitor_file="$RESULTS_DIR/resource_monitor.csv"
    
    echo "timestamp,cpu_usage,memory_usage,disk_io,network_io" > "$monitor_file"
    
    while kill -0 $pid 2>/dev/null; do
        local timestamp=$(date +%s)
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        local memory_usage=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
        local disk_io=$(iostat -d 1 1 | tail -n +4 | awk '{sum += $3 + $4} END {print sum}')
        local network_io=$(cat /proc/net/dev | grep -E 'eth0|ens' | awk '{print $2+$10}')
        
        echo "$timestamp,$cpu_usage,$memory_usage,$disk_io,$network_io" >> "$monitor_file"
        sleep 5
    done
}

# Generate HTML report
generate_html_report() {
    local report_file="$RESULTS_DIR/performance_report_$(date +%Y%m%d_%H%M%S).html"
    
    log "Generating performance report: $report_file"
    
    # Collect all test summaries
    local summaries=""
    for summary in "$RESULTS_DIR"/*_summary.json; do
        if [ -f "$summary" ]; then
            summaries="$summaries$(cat "$summary"),"
        fi
    done
    summaries="[${summaries%,}]"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Performance Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .test-result { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #5cb85c; }
        .test-result.warning { border-left-color: #f0ad4e; }
        .test-result.error { border-left-color: #d9534f; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #666; }
        .chart-container { width: 100%; height: 400px; margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion Performance Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Test Type: $TEST_TYPE | Virtual Users: $VIRTUAL_USERS | Duration: ${DURATION}s</p>
    </div>
    
    <h2>Test Results Summary</h2>
    <div id="results"></div>
    
    <h2>Performance Metrics</h2>
    <canvas id="performanceChart"></canvas>
    
    <h2>Detailed Results</h2>
    <table id="resultsTable">
        <thead>
            <tr>
                <th>Test</th>
                <th>Avg Response Time (ms)</th>
                <th>P95 Response Time (ms)</th>
                <th>Error Rate (%)</th>
                <th>Requests/sec</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="tableBody"></tbody>
    </table>
    
    <h2>Recommendations</h2>
    <ul id="recommendations"></ul>
    
    <script>
        const testResults = $summaries;
        
        // Populate results
        const resultsDiv = document.getElementById('results');
        const tableBody = document.getElementById('tableBody');
        const recommendations = document.getElementById('recommendations');
        
        testResults.forEach(result => {
            // Determine status
            let status = 'Pass';
            let statusClass = '';
            
            if (result.error_rate > 5) {
                status = 'Fail';
                statusClass = 'error';
            } else if (result.p95_response_time > 2000 || result.error_rate > 1) {
                status = 'Warning';
                statusClass = 'warning';
            }
            
            // Add to results div
            const resultDiv = document.createElement('div');
            resultDiv.className = 'test-result ' + statusClass;
            resultDiv.innerHTML = \`
                <h3>\${result.test_name}</h3>
                <div class="metric">
                    <div class="metric-value">\${result.avg_response_time.toFixed(0)}ms</div>
                    <div class="metric-label">Avg Response Time</div>
                </div>
                <div class="metric">
                    <div class="metric-value">\${result.p95_response_time.toFixed(0)}ms</div>
                    <div class="metric-label">P95 Response Time</div>
                </div>
                <div class="metric">
                    <div class="metric-value">\${result.error_rate.toFixed(2)}%</div>
                    <div class="metric-label">Error Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value">\${result.requests_per_sec.toFixed(1)}</div>
                    <div class="metric-label">Requests/sec</div>
                </div>
            \`;
            resultsDiv.appendChild(resultDiv);
            
            // Add to table
            const row = tableBody.insertRow();
            row.innerHTML = \`
                <td>\${result.test_name}</td>
                <td>\${result.avg_response_time.toFixed(0)}</td>
                <td>\${result.p95_response_time.toFixed(0)}</td>
                <td>\${result.error_rate.toFixed(2)}</td>
                <td>\${result.requests_per_sec.toFixed(1)}</td>
                <td>\${status}</td>
            \`;
            
            // Generate recommendations
            if (result.p95_response_time > 3000) {
                const li = document.createElement('li');
                li.textContent = \`\${result.test_name}: Response times are high. Consider optimizing database queries and caching.\`;
                recommendations.appendChild(li);
            }
            if (result.error_rate > 1) {
                const li = document.createElement('li');
                li.textContent = \`\${result.test_name}: Error rate is above threshold. Check application logs for errors.\`;
                recommendations.appendChild(li);
            }
        });
        
        // Create performance chart
        const ctx = document.getElementById('performanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: testResults.map(r => r.test_name),
                datasets: [{
                    label: 'Avg Response Time (ms)',
                    data: testResults.map(r => r.avg_response_time),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'P95 Response Time (ms)',
                    data: testResults.map(r => r.p95_response_time),
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>
EOF
    
    log_success "Report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Performance Test Started"
    log "========================================="
    
    check_prerequisites
    
    # Create test user if needed
    log "Setting up test user..."
    curl -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Performance Test User\"}" \
        2>/dev/null || true
    
    # Determine which components to test
    local components=()
    case $COMPONENT in
        all)
            components=("api" "frontend" "ai-engine")
            ;;
        api|frontend|ai-engine)
            components=("$COMPONENT")
            ;;
        *)
            log_error "Invalid component: $COMPONENT"
            exit 1
            ;;
    esac
    
    # Start resource monitoring
    monitor_resources $$ &
    MONITOR_PID=$!
    
    # Run tests for each component
    for comp in "${components[@]}"; do
        case $comp in
            api)
                create_api_test_script
                run_performance_test "$RESULTS_DIR/api_test.js" "API"
                ;;
            frontend)
                create_frontend_test_script
                run_performance_test "$RESULTS_DIR/frontend_test.js" "Frontend"
                ;;
            ai-engine)
                create_ai_engine_test_script
                run_performance_test "$RESULTS_DIR/ai_engine_test.js" "AI_Engine"
                ;;
        esac
    done
    
    # Stop resource monitoring
    kill $MONITOR_PID 2>/dev/null || true
    
    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_html_report
    fi
    
    log "========================================="
    log "Performance Test Completed"
    log "Results stored in: $RESULTS_DIR"
    log "========================================="
}

# Run main function
main