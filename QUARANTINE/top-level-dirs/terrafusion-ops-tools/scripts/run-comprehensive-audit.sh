#!/bin/bash

# TerraFusion Comprehensive Audit Orchestrator
# Runs all audit agents in sequence and generates unified report
# Features: Multi-agent coordination, consolidated reporting, performance tracking

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/../config/audit-system.conf}"
LOG_FILE="${LOG_FILE:-/var/log/terrafusion/comprehensive-audit.log}"
REPORT_DIR="${REPORT_DIR:-${SCRIPT_DIR}/../reports/audit}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Generate unique session ID
SESSION_ID="${SESSION_ID:-comprehensive_audit_$(date +%Y%m%d_%H%M%S)}"

# Audit agents configuration
declare -A AUDIT_AGENTS=(
    ["feature_implementation"]="feature-implementation-audit-agent.py"
    ["data_workflow"]="data-workflow-audit-agent.py"
    ["user_experience"]="ux_audit_agent.py"
    ["security_compliance"]="security-scan.sh"
    ["performance_testing"]="performance-test.sh"
)

# Progress tracking
TOTAL_AGENTS=${#AUDIT_AGENTS[@]}
COMPLETED_AGENTS=0
FAILED_AGENTS=0

log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    TerraFusion Comprehensive Audit              ║"
    echo "║                         Multi-Agent System                      ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo -e "${CYAN}Session ID: ${SESSION_ID}${NC}"
    echo -e "${CYAN}Timestamp: $(date +'%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}Total Agents: ${TOTAL_AGENTS}${NC}"
    echo
}

initialize_audit_environment() {
    log_message "INFO" "Initializing comprehensive audit environment..."
    
    # Create necessary directories
    mkdir -p "$REPORT_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Initialize database tables (from comprehensive-audit-system.sh)
    log_message "INFO" "Setting up audit database schema..."
    
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Ensure audit tables exist
CREATE TABLE IF NOT EXISTS audit_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT gen_random_uuid(),
    audit_type VARCHAR(50) NOT NULL,
    audit_scope VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_checks INTEGER DEFAULT 0,
    passed_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    audit_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS audit_findings (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    agent_name VARCHAR(100),
    category VARCHAR(50),
    check_name VARCHAR(255),
    severity VARCHAR(20),
    status VARCHAR(20),
    description TEXT,
    evidence JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_coverage (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    feature_name VARCHAR(255),
    component VARCHAR(100),
    implementation_status VARCHAR(20),
    test_coverage_percent DECIMAL(5,2),
    documentation_status VARCHAR(20),
    api_endpoints JSONB,
    ui_components JSONB,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_workflow_validation (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    workflow_name VARCHAR(255),
    stage VARCHAR(100),
    validation_type VARCHAR(50),
    input_data JSONB,
    expected_output JSONB,
    actual_output JSONB,
    validation_passed BOOLEAN,
    execution_time_ms INTEGER,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    component VARCHAR(100),
    metric VARCHAR(50),
    measured_value DECIMAL(10,2),
    baseline_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    unit VARCHAR(20),
    status VARCHAR(20),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_findings_session ON audit_findings(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_feature_coverage_status ON feature_coverage(implementation_status);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_session ON performance_benchmarks(session_id);

-- Initialize master audit session
INSERT INTO audit_sessions (session_id, audit_type, audit_scope, started_at, status)
VALUES ('${SESSION_ID}', 'comprehensive', 'full_platform_audit', CURRENT_TIMESTAMP, 'running')
ON CONFLICT DO NOTHING;
EOF

    log_message "INFO" "Audit environment initialized successfully"
}

run_feature_implementation_audit() {
    local agent_name="Feature Implementation Audit"
    local start_time=$(date +%s)
    
    log_message "INFO" "Starting ${agent_name}..."
    echo -e "${PURPLE}[1/${TOTAL_AGENTS}] 🔍 ${agent_name}${NC}"
    
    if [ -f "${SCRIPT_DIR}/feature-implementation-audit-agent.py" ]; then
        if python3 "${SCRIPT_DIR}/feature-implementation-audit-agent.py" "$SESSION_ID"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            ((COMPLETED_AGENTS++))
            log_message "INFO" "${agent_name} completed successfully in ${duration}s"
            echo -e "${GREEN}✅ ${agent_name} - Completed (${duration}s)${NC}"
            return 0
        else
            ((FAILED_AGENTS++))
            log_message "ERROR" "${agent_name} failed"
            echo -e "${RED}❌ ${agent_name} - Failed${NC}"
            return 1
        fi
    else
        log_message "WARNING" "${agent_name} script not found"
        echo -e "${YELLOW}⚠️  ${agent_name} - Script not found${NC}"
        return 1
    fi
}

run_data_workflow_audit() {
    local agent_name="Data Workflow Audit"
    local start_time=$(date +%s)
    
    log_message "INFO" "Starting ${agent_name}..."
    echo -e "${CYAN}[2/${TOTAL_AGENTS}] 📊 ${agent_name}${NC}"
    
    if [ -f "${SCRIPT_DIR}/data-workflow-audit-agent.py" ]; then
        if python3 "${SCRIPT_DIR}/data-workflow-audit-agent.py" "$SESSION_ID"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            ((COMPLETED_AGENTS++))
            log_message "INFO" "${agent_name} completed successfully in ${duration}s"
            echo -e "${GREEN}✅ ${agent_name} - Completed (${duration}s)${NC}"
            return 0
        else
            ((FAILED_AGENTS++))
            log_message "ERROR" "${agent_name} failed"
            echo -e "${RED}❌ ${agent_name} - Failed${NC}"
            return 1
        fi
    else
        log_message "WARNING" "${agent_name} script not found"
        echo -e "${YELLOW}⚠️  ${agent_name} - Script not found${NC}"
        return 1
    fi
}

run_security_compliance_audit() {
    local agent_name="Security Compliance Audit"
    local start_time=$(date +%s)
    
    log_message "INFO" "Starting ${agent_name}..."
    echo -e "${RED}[3/${TOTAL_AGENTS}] 🔒 ${agent_name}${NC}"
    
    if [ -f "${SCRIPT_DIR}/security-scan.sh" ]; then
        if bash "${SCRIPT_DIR}/security-scan.sh" --session-id "$SESSION_ID"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            ((COMPLETED_AGENTS++))
            log_message "INFO" "${agent_name} completed successfully in ${duration}s"
            echo -e "${GREEN}✅ ${agent_name} - Completed (${duration}s)${NC}"
            return 0
        else
            ((FAILED_AGENTS++))
            log_message "ERROR" "${agent_name} failed"
            echo -e "${RED}❌ ${agent_name} - Failed${NC}"
            return 1
        fi
    else
        log_message "WARNING" "${agent_name} script not found"
        echo -e "${YELLOW}⚠️  ${agent_name} - Script not found${NC}"
        return 1
    fi
}

run_performance_testing_audit() {
    local agent_name="Performance Testing Audit"
    local start_time=$(date +%s)
    
    log_message "INFO" "Starting ${agent_name}..."
    echo -e "${YELLOW}[4/${TOTAL_AGENTS}] ⚡ ${agent_name}${NC}"
    
    if [ -f "${SCRIPT_DIR}/performance-test.sh" ]; then
        if bash "${SCRIPT_DIR}/performance-test.sh" --session-id "$SESSION_ID"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            ((COMPLETED_AGENTS++))
            log_message "INFO" "${agent_name} completed successfully in ${duration}s"
            echo -e "${GREEN}✅ ${agent_name} - Completed (${duration}s)${NC}"
            return 0
        else
            ((FAILED_AGENTS++))
            log_message "ERROR" "${agent_name} failed"
            echo -e "${RED}❌ ${agent_name} - Failed${NC}"
            return 1
        fi
    else
        log_message "WARNING" "${agent_name} script not found"
        echo -e "${YELLOW}⚠️  ${agent_name} - Script not found${NC}"
        return 1
    fi
}

run_integration_testing_audit() {
    local agent_name="Integration Testing Audit"
    local start_time=$(date +%s)
    
    log_message "INFO" "Starting ${agent_name}..."
    echo -e "${BLUE}[5/${TOTAL_AGENTS}] 🔗 ${agent_name}${NC}"
    
    # Run integration tests
    if [ -f "${SCRIPT_DIR}/smoke-tests.sh" ]; then
        if bash "${SCRIPT_DIR}/smoke-tests.sh" --session-id "$SESSION_ID"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            ((COMPLETED_AGENTS++))
            log_message "INFO" "${agent_name} completed successfully in ${duration}s"
            echo -e "${GREEN}✅ ${agent_name} - Completed (${duration}s)${NC}"
            return 0
        else
            ((FAILED_AGENTS++))
            log_message "ERROR" "${agent_name} failed"
            echo -e "${RED}❌ ${agent_name} - Failed${NC}"
            return 1
        fi
    else
        log_message "WARNING" "${agent_name} script not found"
        echo -e "${YELLOW}⚠️  ${agent_name} - Script not found${NC}"
        return 1
    fi
}

generate_consolidated_report() {
    local report_file="${REPORT_DIR}/comprehensive_audit_report_${SESSION_ID}.md"
    local json_report="${REPORT_DIR}/comprehensive_audit_report_${SESSION_ID}.json"
    
    log_message "INFO" "Generating consolidated audit report..."
    echo -e "${PURPLE}📋 Generating comprehensive report...${NC}"
    
    # Query database for all audit results
    local audit_data=$(psql -h localhost -U postgres -d terrafusion -t -A -F'|' <<EOF
SELECT 
    af.agent_name,
    af.category,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN af.status = 'passed' THEN 1 END) as passed_checks,
    COUNT(CASE WHEN af.status = 'failed' THEN 1 END) as failed_checks,
    COUNT(CASE WHEN af.status = 'error' THEN 1 END) as error_checks,
    ROUND(AVG(CASE 
        WHEN af.status = 'passed' THEN 100 
        WHEN af.status = 'failed' THEN 0 
        ELSE 50 
    END), 2) as success_rate
FROM audit_findings af 
WHERE af.session_id = '${SESSION_ID}'
GROUP BY af.agent_name, af.category
ORDER BY af.agent_name, af.category;
EOF
)

    # Get overall session stats
    local session_stats=$(psql -h localhost -U postgres -d terrafusion -t -A -F'|' <<EOF
SELECT 
    total_checks,
    passed_checks,
    failed_checks,
    audit_score,
    started_at,
    completed_at
FROM audit_sessions 
WHERE session_id = '${SESSION_ID}';
EOF
)

    # Generate Markdown report
    cat > "$report_file" <<EOF
# TerraFusion Comprehensive Audit Report

## Executive Summary

**Session ID**: ${SESSION_ID}
**Audit Date**: $(date +'%Y-%m-%d %H:%M:%S')
**Agents Executed**: ${COMPLETED_AGENTS}/${TOTAL_AGENTS}
**Failed Agents**: ${FAILED_AGENTS}

### Overall Results

EOF

    # Add session statistics if available
    if [ -n "$session_stats" ]; then
        IFS='|' read -r total_checks passed_checks failed_checks audit_score started_at completed_at <<< "$session_stats"
        cat >> "$report_file" <<EOF
- **Total Checks**: ${total_checks:-0}
- **Passed Checks**: ${passed_checks:-0}
- **Failed Checks**: ${failed_checks:-0}
- **Success Rate**: $(( passed_checks * 100 / (total_checks == 0 ? 1 : total_checks) ))%
- **Audit Score**: ${audit_score:-0}/100

EOF
    fi

    cat >> "$report_file" <<EOF
## Agent Results

EOF

    # Add detailed results per agent
    if [ -n "$audit_data" ]; then
        echo "$audit_data" | while IFS='|' read -r agent_name category total_checks passed_checks failed_checks error_checks success_rate; do
            cat >> "$report_file" <<EOF
### ${agent_name} - ${category}

- **Total Checks**: ${total_checks}
- **Passed**: ${passed_checks}
- **Failed**: ${failed_checks}
- **Errors**: ${error_checks}
- **Success Rate**: ${success_rate}%

EOF
        done
    fi

    # Add recommendations section
    cat >> "$report_file" <<EOF
## Critical Findings

EOF

    # Query for critical/high severity findings
    local critical_findings=$(psql -h localhost -U postgres -d terrafusion -t -A -F'|' <<EOF
SELECT 
    af.agent_name,
    af.check_name,
    af.severity,
    af.description
FROM audit_findings af 
WHERE af.session_id = '${SESSION_ID}' 
  AND af.severity IN ('critical', 'high')
  AND af.status IN ('failed', 'error')
ORDER BY 
    CASE af.severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        ELSE 3 
    END,
    af.agent_name;
EOF
)

    if [ -n "$critical_findings" ]; then
        echo "$critical_findings" | while IFS='|' read -r agent_name check_name severity description; do
            local severity_icon=""
            case "$severity" in
                "critical") severity_icon="🚨" ;;
                "high") severity_icon="⚠️" ;;
                *) severity_icon="ℹ️" ;;
            esac
            
            cat >> "$report_file" <<EOF
${severity_icon} **${agent_name}** - ${check_name}
> ${description}

EOF
        done
    else
        echo "No critical findings identified." >> "$report_file"
    fi

    cat >> "$report_file" <<EOF

## Next Steps

### Immediate Actions (< 1 week)
- [ ] Address all critical severity findings
- [ ] Fix agent failures: ${FAILED_AGENTS} agents failed
- [ ] Review and validate failed test cases

### Short-term Actions (1-4 weeks)
- [ ] Improve overall test coverage
- [ ] Enhance documentation coverage
- [ ] Implement missing security controls

### Long-term Actions (1-3 months)
- [ ] Establish continuous audit processes
- [ ] Implement automated quality gates
- [ ] Create audit dashboards and monitoring

## Quality Gates

Before production deployment:
- [ ] All agents execute successfully (${COMPLETED_AGENTS}/${TOTAL_AGENTS} ✅)
- [ ] Critical findings resolved (0 critical issues)
- [ ] Overall audit score > 85% (Current: ${audit_score:-0}%)
- [ ] Feature implementation > 95% complete
- [ ] Security compliance > 90%

---

*Report generated by TerraFusion Comprehensive Audit System*
*Generated at: $(date +'%Y-%m-%d %H:%M:%S')*

EOF

    # Generate JSON report for programmatic access
    cat > "$json_report" <<EOF
{
    "session_id": "${SESSION_ID}",
    "timestamp": "$(date -Iseconds)",
    "agents_executed": ${COMPLETED_AGENTS},
    "total_agents": ${TOTAL_AGENTS},
    "failed_agents": ${FAILED_AGENTS},
    "overall_stats": {
        "total_checks": ${total_checks:-0},
        "passed_checks": ${passed_checks:-0},
        "failed_checks": ${failed_checks:-0},
        "audit_score": ${audit_score:-0}
    },
    "report_files": {
        "markdown": "$report_file",
        "json": "$json_report"
    }
}
EOF

    log_message "INFO" "Consolidated reports generated:"
    log_message "INFO" "  Markdown: $report_file"
    log_message "INFO" "  JSON: $json_report"
    
    echo -e "${GREEN}📋 Reports generated:${NC}"
    echo -e "   📄 Markdown: $report_file"
    echo -e "   📊 JSON: $json_report"
}

finalize_audit_session() {
    log_message "INFO" "Finalizing audit session..."
    
    # Update audit session status
    psql -h localhost -U postgres -d terrafusion <<EOF
UPDATE audit_sessions 
SET 
    completed_at = CURRENT_TIMESTAMP,
    status = 'completed'
WHERE session_id = '${SESSION_ID}';
EOF

    local total_duration=$(($(date +%s) - START_TIME))
    
    echo
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                        Audit Summary                             ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${GREEN}✅ Completed Agents: ${COMPLETED_AGENTS}/${TOTAL_AGENTS}${NC}"
    if [ $FAILED_AGENTS -gt 0 ]; then
        echo -e "${RED}❌ Failed Agents: ${FAILED_AGENTS}${NC}"
    fi
    echo -e "${CYAN}⏱️  Total Duration: ${total_duration}s${NC}"
    echo -e "${PURPLE}📋 Session ID: ${SESSION_ID}${NC}"
    echo
    
    if [ $FAILED_AGENTS -eq 0 ]; then
        echo -e "${GREEN}🎉 All audit agents completed successfully!${NC}"
        log_message "INFO" "Comprehensive audit completed successfully"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some audit agents failed. Check logs for details.${NC}"
        log_message "WARNING" "Comprehensive audit completed with failures"
        return 1
    fi
}

# Main execution
main() {
    local START_TIME=$(date +%s)
    
    print_banner
    
    # Initialize environment
    initialize_audit_environment
    
    echo -e "${BLUE}🚀 Starting comprehensive audit execution...${NC}"
    echo
    
    # Execute audit agents in sequence
    run_feature_implementation_audit
    echo
    
    run_data_workflow_audit
    echo
    
    run_security_compliance_audit
    echo
    
    run_performance_testing_audit
    echo
    
    run_integration_testing_audit
    echo
    
    # Generate consolidated report
    generate_consolidated_report
    echo
    
    # Finalize session
    finalize_audit_session
}

# Handle script interruption
trap 'log_message "ERROR" "Audit interrupted by user"; exit 130' INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --session-id)
            SESSION_ID="$2"
            shift 2
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --log-file)
            LOG_FILE="$2"
            shift 2
            ;;
        --report-dir)
            REPORT_DIR="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --session-id ID     Custom session ID"
            echo "  --config FILE       Configuration file path"
            echo "  --log-file FILE     Log file path"
            echo "  --report-dir DIR    Report output directory"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Execute main function
main "$@"