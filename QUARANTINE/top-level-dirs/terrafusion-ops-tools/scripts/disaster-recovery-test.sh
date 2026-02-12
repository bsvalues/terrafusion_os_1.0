#!/bin/bash
#
# TerraFusion Disaster Recovery Test Script
# Tests backup, restore, and failover procedures
#
# Usage: ./disaster-recovery-test.sh [options]
# Options:
#   -t    Test type (backup|restore|failover|full)
#   -e    Environment (staging|production)
#   -s    Simulate disaster scenario
#   -r    Generate detailed report

set -euo pipefail

# Configuration
TEST_TYPE="full"
ENVIRONMENT="staging"
SIMULATE_DISASTER=false
GENERATE_REPORT=false
DR_TEST_DIR="/var/tests/disaster-recovery"
LOG_FILE="/var/log/terrafusion/dr_test_$(date +%Y%m%d_%H%M%S).log"
REPORT_FILE="/var/reports/dr/dr_test_report_$(date +%Y%m%d_%H%M%S).html"

# Test configuration
PRIMARY_DB_HOST="localhost"
BACKUP_DB_HOST="backup-db.terrafusion.com"
S3_BACKUP_BUCKET="terrafusion-backups"
REPLICATION_CHECK_TIMEOUT=300
RECOVERY_TIME_OBJECTIVE=300  # 5 minutes
RECOVERY_POINT_OBJECTIVE=3600  # 1 hour

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create directories
mkdir -p "$DR_TEST_DIR"
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$REPORT_FILE")"

# Parse arguments
while getopts "t:e:sr" opt; do
    case $opt in
        t) TEST_TYPE="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        s) SIMULATE_DISASTER=true ;;
        r) GENERATE_REPORT=true ;;
        *) echo "Usage: $0 [-t type] [-e env] [-s] [-r]"; exit 1 ;;
    esac
done

# Test results tracking
declare -A TEST_RESULTS
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

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

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Test result tracking
record_test_result() {
    local test_name=$1
    local result=$2
    local duration=$3
    local notes=${4:-""}
    
    TEST_RESULTS["$test_name"]="$result|$duration|$notes"
    ((TOTAL_TESTS++))
    
    if [ "$result" = "PASS" ]; then
        ((TESTS_PASSED++))
        log_success "✓ $test_name completed in ${duration}s"
    else
        ((TESTS_FAILED++))
        log_error "✗ $test_name failed in ${duration}s: $notes"
    fi
}

# Execute test with timing
run_test() {
    local test_name=$1
    local test_function=$2
    
    log "Running test: $test_name"
    local start_time=$(date +%s)
    
    if $test_function; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        record_test_result "$test_name" "PASS" "$duration"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        record_test_result "$test_name" "FAIL" "$duration" "Test function returned non-zero exit code"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking disaster recovery prerequisites..."
    
    # Check required tools
    local required_tools=("psql" "aws" "docker" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            return 1
        fi
    done
    
    # Check database connectivity
    if ! psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d terrafusion_production -c "SELECT 1" &>/dev/null; then
        log_error "Cannot connect to primary database"
        return 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log_error "AWS credentials not configured"
        return 1
    fi
    
    # Check backup bucket access
    if ! aws s3 ls "$S3_BACKUP_BUCKET" &>/dev/null; then
        log_error "Cannot access S3 backup bucket: $S3_BACKUP_BUCKET"
        return 1
    fi
    
    log_success "Prerequisites check passed"
    return 0
}

# Test database backup creation
test_database_backup() {
    log "Testing database backup creation..."
    
    # Create test backup
    local backup_file="$DR_TEST_DIR/dr_test_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    if PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "$PRIMARY_DB_HOST" \
        -U terrafusion_user \
        -d terrafusion_production \
        --no-owner --no-privileges \
        | gzip > "$backup_file"; then
        
        # Verify backup file
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            # Test gzip integrity
            if gzip -t "$backup_file"; then
                log_success "Database backup created and verified: $backup_file"
                
                # Upload to S3
                if aws s3 cp "$backup_file" "$S3_BACKUP_BUCKET/dr-tests/"; then
                    log_success "Backup uploaded to S3"
                    rm -f "$backup_file"
                    return 0
                else
                    log_error "Failed to upload backup to S3"
                    return 1
                fi
            else
                log_error "Backup file is corrupted"
                return 1
            fi
        else
            log_error "Backup file is empty or doesn't exist"
            return 1
        fi
    else
        log_error "Database backup creation failed"
        return 1
    fi
}

# Test backup restoration
test_backup_restore() {
    log "Testing backup restoration..."
    
    # Download latest backup from S3
    local latest_backup=$(aws s3 ls "$S3_BACKUP_BUCKET/daily/" | sort | tail -n 1 | awk '{print $4}')
    
    if [ -z "$latest_backup" ]; then
        log_error "No backup files found in S3"
        return 1
    fi
    
    local backup_file="$DR_TEST_DIR/$latest_backup"
    
    if aws s3 cp "$S3_BACKUP_BUCKET/daily/$latest_backup" "$backup_file"; then
        log_success "Downloaded backup: $latest_backup"
        
        # Create test database
        local test_db="terrafusion_dr_test_$(date +%s)"
        
        if PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U postgres -c "CREATE DATABASE $test_db;"; then
            log_success "Created test database: $test_db"
            
            # Restore backup
            if zcat "$backup_file" | PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d "$test_db" &>/dev/null; then
                
                # Verify restoration
                local table_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
                
                if [ "$table_count" -gt 0 ]; then
                    log_success "Backup restored successfully. Tables: $table_count"
                    
                    # Cleanup
                    PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U postgres -c "DROP DATABASE $test_db;" &>/dev/null || true
                    rm -f "$backup_file"
                    return 0
                else
                    log_error "Restored database has no tables"
                    PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U postgres -c "DROP DATABASE $test_db;" &>/dev/null || true
                    return 1
                fi
            else
                log_error "Failed to restore backup"
                PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U postgres -c "DROP DATABASE $test_db;" &>/dev/null || true
                return 1
            fi
        else
            log_error "Failed to create test database"
            return 1
        fi
    else
        log_error "Failed to download backup from S3"
        return 1
    fi
}

# Test replication lag
test_replication_lag() {
    log "Testing database replication lag..."
    
    # Check if replication is configured
    local replication_slots=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d terrafusion_production -t -c "SELECT COUNT(*) FROM pg_replication_slots;" | xargs)
    
    if [ "$replication_slots" -eq 0 ]; then
        log_warning "No replication slots configured, skipping replication test"
        return 0
    fi
    
    # Insert test data and measure lag
    local test_table="dr_test_$(date +%s)"
    local test_value="dr_test_$(date +%s%N)"
    
    # Create test table and insert data
    PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d terrafusion_production -c "
    CREATE TEMP TABLE $test_table (id SERIAL PRIMARY KEY, value TEXT, created_at TIMESTAMP DEFAULT NOW());
    INSERT INTO $test_table (value) VALUES ('$test_value');
    "
    
    local start_time=$(date +%s)
    
    # Check replica for the data (assuming backup host is replica)
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $REPLICATION_CHECK_TIMEOUT ]; then
            log_error "Replication check timed out after ${REPLICATION_CHECK_TIMEOUT}s"
            return 1
        fi
        
        # Check if data exists on replica (this would need to be adapted to your setup)
        if PGPASSWORD="${PGPASSWORD:-}" psql -h "$BACKUP_DB_HOST" -U terrafusion_user -d terrafusion_production -t -c "SELECT COUNT(*) FROM $test_table WHERE value = '$test_value';" 2>/dev/null | grep -q "1"; then
            log_success "Replication completed in ${elapsed}s"
            return 0
        fi
        
        sleep 5
    done
}

# Test application failover
test_application_failover() {
    log "Testing application failover..."
    
    # Check current application health
    if ! curl -sf http://localhost:8080/health &>/dev/null; then
        log_error "Application is not healthy before failover test"
        return 1
    fi
    
    if [ "$SIMULATE_DISASTER" = true ]; then
        # Simulate failure by stopping services
        log "Simulating disaster by stopping services..."
        docker-compose -f docker/docker-compose.yml stop backend ai-engine
        sleep 10
        
        # Try to access application (should fail)
        if curl -sf http://localhost:8080/health &>/dev/null; then
            log_error "Application still responding after simulated failure"
            return 1
        fi
        
        log_success "Disaster simulation successful - services are down"
        
        # Perform failover (restart services)
        log "Performing failover by restarting services..."
        docker-compose -f docker/docker-compose.yml up -d backend ai-engine
        
        # Wait for services to be ready
        local max_wait=180
        local wait_time=0
        
        while [ $wait_time -lt $max_wait ]; do
            if curl -sf http://localhost:8080/health &>/dev/null; then
                log_success "Failover completed successfully in ${wait_time}s"
                return 0
            fi
            sleep 5
            wait_time=$((wait_time + 5))
        done
        
        log_error "Failover failed - services not responding after $max_wait seconds"
        return 1
    else
        log "Skipping disaster simulation (use -s flag to enable)"
        return 0
    fi
}

# Test data consistency
test_data_consistency() {
    log "Testing data consistency..."
    
    # Check for orphaned records
    local orphaned_costs=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d terrafusion_production -t -c "SELECT COUNT(*) FROM costs c LEFT JOIN projects p ON c.project_id = p.id WHERE p.id IS NULL;" | xargs)
    
    if [ "$orphaned_costs" -gt 0 ]; then
        log_error "Found $orphaned_costs orphaned cost records"
        return 1
    fi
    
    # Check for inconsistent project totals
    local inconsistent_projects=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$PRIMARY_DB_HOST" -U terrafusion_user -d terrafusion_production -t -c "
    SELECT COUNT(*) FROM projects p 
    WHERE ABS(p.total_cost - COALESCE((SELECT SUM(c.total_cost) FROM costs c WHERE c.project_id = p.id), 0)) > 0.01;
    " | xargs)
    
    if [ "$inconsistent_projects" -gt 0 ]; then
        log_error "Found $inconsistent_projects projects with inconsistent totals"
        return 1
    fi
    
    log_success "Data consistency check passed"
    return 0
}

# Test recovery time objective (RTO)
test_recovery_time_objective() {
    log "Testing Recovery Time Objective (RTO)..."
    
    local start_time=$(date +%s)
    
    # Simulate a full recovery process
    if [ "$SIMULATE_DISASTER" = true ]; then
        # Stop all services
        docker-compose -f docker/docker-compose.yml down
        
        # Start recovery
        docker-compose -f docker/docker-compose.yml up -d
        
        # Wait for full system recovery
        while true; do
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            
            if [ $elapsed -gt $RECOVERY_TIME_OBJECTIVE ]; then
                log_error "RTO exceeded: ${elapsed}s > ${RECOVERY_TIME_OBJECTIVE}s"
                return 1
            fi
            
            # Check if all services are healthy
            if curl -sf http://localhost:8080/health &>/dev/null && \
               curl -sf http://localhost:8001/health &>/dev/null && \
               curl -sf http://localhost:3003/health &>/dev/null; then
                log_success "RTO met: Full recovery in ${elapsed}s (target: ${RECOVERY_TIME_OBJECTIVE}s)"
                return 0
            fi
            
            sleep 5
        done
    else
        log "Skipping RTO test (use -s flag to enable disaster simulation)"
        return 0
    fi
}

# Test monitoring and alerting during DR
test_monitoring_during_dr() {
    log "Testing monitoring and alerting during DR..."
    
    # Check if monitoring stack is running
    if ! curl -sf http://localhost:9090/api/v1/query?query=up &>/dev/null; then
        log_error "Prometheus is not accessible"
        return 1
    fi
    
    # Check critical alerts
    local alerts=$(curl -sf http://localhost:9090/api/v1/alerts | jq -r '.data.alerts[] | select(.state=="firing") | .labels.alertname' 2>/dev/null | wc -l)
    
    if [ "$alerts" -gt 0 ]; then
        log_warning "Found $alerts active alerts during DR test"
    else
        log_success "No active alerts during DR test"
    fi
    
    # Test alert manager
    if curl -sf http://localhost:9093/api/v1/status &>/dev/null; then
        log_success "AlertManager is operational"
    else
        log_error "AlertManager is not accessible"
        return 1
    fi
    
    return 0
}

# Generate DR test report
generate_dr_report() {
    log "Generating disaster recovery test report..."
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Disaster Recovery Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; padding: 15px; border-left: 4px solid #5cb85c; background-color: #f9f9f9; }
        .summary.warning { border-left-color: #f0ad4e; }
        .summary.error { border-left-color: #d9534f; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion Disaster Recovery Test Report</h1>
        <p><strong>Test Date:</strong> $(date)</p>
        <p><strong>Test Type:</strong> $TEST_TYPE</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Disaster Simulation:</strong> $([ "$SIMULATE_DISASTER" = true ] && echo "Enabled" || echo "Disabled")</p>
    </div>
    
    <div class="summary $([ $TESTS_FAILED -eq 0 ] && echo "" || ([ $TESTS_FAILED -le 2 ] && echo "warning" || echo "error"))">
        <h2>Test Summary</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">$TESTS_PASSED</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$TESTS_FAILED</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$TOTAL_TESTS</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$([ $TOTAL_TESTS -gt 0 ] && echo $((TESTS_PASSED * 100 / TOTAL_TESTS)) || echo 0)%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>
    </div>
    
    <div class="summary">
        <h2>Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Result</th>
                    <th>Duration (seconds)</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
EOF
    
    # Add test results
    for test_name in "${!TEST_RESULTS[@]}"; do
        IFS='|' read -r result duration notes <<< "${TEST_RESULTS[$test_name]}"
        cat >> "$REPORT_FILE" << EOF
                <tr>
                    <td>$test_name</td>
                    <td><span class="$(echo "$result" | tr '[:upper:]' '[:lower:]')">$result</span></td>
                    <td>$duration</td>
                    <td>$notes</td>
                </tr>
EOF
    done
    
    cat >> "$REPORT_FILE" << EOF
            </tbody>
        </table>
    </div>
    
    <div class="summary">
        <h2>Recovery Objectives</h2>
        <table>
            <thead>
                <tr>
                    <th>Objective</th>
                    <th>Target</th>
                    <th>Actual</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Recovery Time Objective (RTO)</td>
                    <td>$RECOVERY_TIME_OBJECTIVE seconds</td>
                    <td>See test results</td>
                    <td>$([ "${TEST_RESULTS[RTO_Test]:-}" ] && echo "Tested" || echo "Not Tested")</td>
                </tr>
                <tr>
                    <td>Recovery Point Objective (RPO)</td>
                    <td>$RECOVERY_POINT_OBJECTIVE seconds</td>
                    <td>See backup frequency</td>
                    <td>Configured</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div class="summary">
        <h2>Recommendations</h2>
        <ul>
            $([ $TESTS_FAILED -gt 0 ] && echo "<li style='color: red;'>Address all failed tests before production deployment.</li>")
            <li>Review backup retention policies and test restore procedures regularly.</li>
            <li>Ensure monitoring and alerting systems are functioning during DR scenarios.</li>
            <li>Conduct DR tests quarterly and update procedures as needed.</li>
            <li>Train operations team on DR procedures and ensure 24/7 coverage.</li>
            $([ "$SIMULATE_DISASTER" = false ] && echo "<li>Run full disaster simulation tests to validate RTO/RPO objectives.</li>")
        </ul>
    </div>
    
    <div class="summary">
        <h2>Next Steps</h2>
        <ol>
            <li>Review and address any failed tests</li>
            <li>Update DR documentation based on test results</li>
            <li>Schedule next DR test (recommended: quarterly)</li>
            <li>Verify backup and monitoring configurations</li>
            <li>Conduct team training on DR procedures</li>
        </ol>
    </div>
    
    <div class="footer">
        <p><small>Full test log available at: $LOG_FILE</small></p>
        <p><small>Generated by TerraFusion DR Test Suite</small></p>
    </div>
</body>
</html>
EOF
    
    log_success "DR test report generated: $REPORT_FILE"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Disaster Recovery Test"
    log "Test Type: $TEST_TYPE"
    log "Environment: $ENVIRONMENT"
    log "Simulate Disaster: $SIMULATE_DISASTER"
    log "========================================="
    
    # Check prerequisites
    if ! run_test "Prerequisites Check" check_prerequisites; then
        log_error "Prerequisites check failed. Aborting DR test."
        exit 1
    fi
    
    # Run tests based on type
    case $TEST_TYPE in
        backup)
            run_test "Database Backup" test_database_backup
            ;;
        restore)
            run_test "Backup Restore" test_backup_restore
            ;;
        failover)
            run_test "Application Failover" test_application_failover
            ;;
        full)
            run_test "Database Backup" test_database_backup
            run_test "Backup Restore" test_backup_restore
            run_test "Data Consistency" test_data_consistency
            run_test "Replication Lag" test_replication_lag
            run_test "Application Failover" test_application_failover
            run_test "RTO Test" test_recovery_time_objective
            run_test "Monitoring During DR" test_monitoring_during_dr
            ;;
        *)
            log_error "Invalid test type: $TEST_TYPE"
            exit 1
            ;;
    esac
    
    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_dr_report
    fi
    
    # Summary
    log ""
    log "========================================="
    log "Disaster Recovery Test Summary"
    log "========================================="
    log "Total Tests: $TOTAL_TESTS"
    log "Passed: $TESTS_PASSED"
    log "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All DR tests passed!"
        log "Report: $REPORT_FILE"
        log "Log: $LOG_FILE"
        exit 0
    else
        log_error "Some DR tests failed. Review results and take corrective action."
        log "Report: $REPORT_FILE"
        log "Log: $LOG_FILE"
        exit 1
    fi
}

# Handle interrupts
trap 'log_error "DR test interrupted!"; exit 1' INT TERM

# Run main function
main