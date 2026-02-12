#!/bin/bash
#
# TerraFusion Security Scanning Script
# Comprehensive security scanning for vulnerabilities and compliance
#
# Usage: ./security-scan.sh [options]
# Options:
#   -f    Full scan (includes dependency audit)
#   -q    Quick scan (critical issues only)
#   -r    Generate HTML report
#   -s    Specific component (backend|frontend|ai-engine|all)

set -euo pipefail

# Configuration
SCAN_DIR="/opt/terrafusion"
REPORT_DIR="/var/reports/security"
LOG_FILE="/var/log/terrafusion/security_scan_$(date +%Y%m%d_%H%M%S).log"
FULL_SCAN=false
QUICK_SCAN=false
GENERATE_REPORT=false
COMPONENT="all"
SEVERITY_THRESHOLD="MEDIUM"

# Vulnerability database update
VULN_DB_URL="https://nvd.nist.gov/feeds/json/cve/1.1/nvdcve-1.1-recent.json.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

# Parse arguments
while getopts "fqrs:" opt; do
    case $opt in
        f) FULL_SCAN=true ;;
        q) QUICK_SCAN=true; SEVERITY_THRESHOLD="HIGH" ;;
        r) GENERATE_REPORT=true ;;
        s) COMPONENT="$OPTARG" ;;
        *) echo "Usage: $0 [-f] [-q] [-r] [-s component]"; exit 1 ;;
    esac
done

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

# Results tracking
declare -A VULNERABILITIES
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
LOW_COUNT=0

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v python3 &> /dev/null || missing_tools+=("python3")
    command -v npm &> /dev/null || missing_tools+=("npm")
    command -v git &> /dev/null || missing_tools+=("git")
    
    # Check Python security tools
    python3 -m pip show safety &> /dev/null || missing_tools+=("safety (pip install safety)")
    python3 -m pip show bandit &> /dev/null || missing_tools+=("bandit (pip install bandit)")
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Scan Python dependencies
scan_python_dependencies() {
    local component=$1
    local requirements_file="$SCAN_DIR/$component/requirements.txt"
    
    if [ ! -f "$requirements_file" ]; then
        log_warning "No requirements.txt found for $component"
        return
    fi
    
    log "Scanning Python dependencies for $component..."
    
    # Safety check for known vulnerabilities
    cd "$SCAN_DIR/$component"
    
    # Create virtual environment for scanning
    python3 -m venv .scan_venv
    source .scan_venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt 2>/dev/null
    
    # Run safety check
    local safety_output=$(safety check --json 2>/dev/null || echo '[]')
    
    # Parse results
    local vuln_count=$(echo "$safety_output" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")
    
    if [ "$vuln_count" -gt 0 ]; then
        log_warning "Found $vuln_count vulnerable dependencies in $component"
        
        # Extract vulnerability details
        echo "$safety_output" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for vuln in data:
    severity = 'HIGH' if 'high' in vuln.get('vulnerability', '').lower() else 'MEDIUM'
    print(f\"{severity}: {vuln.get('package', 'Unknown')} - {vuln.get('vulnerability', 'Unknown vulnerability')}\")
" >> "$LOG_FILE"
        
        ((HIGH_COUNT += vuln_count))
    else
        log_success "No vulnerable dependencies found in $component"
    fi
    
    deactivate
    rm -rf .scan_venv
}

# Scan Node.js dependencies
scan_node_dependencies() {
    local component=$1
    local package_file="$SCAN_DIR/$component/package.json"
    
    if [ ! -f "$package_file" ]; then
        log_warning "No package.json found for $component"
        return
    fi
    
    log "Scanning Node.js dependencies for $component..."
    
    cd "$SCAN_DIR/$component"
    
    # Run npm audit
    local audit_output=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities": {}}')
    
    # Parse vulnerability counts
    local critical=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
    local high=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
    local moderate=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.moderate // 0' 2>/dev/null || echo "0")
    local low=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.low // 0' 2>/dev/null || echo "0")
    
    ((CRITICAL_COUNT += critical))
    ((HIGH_COUNT += high))
    ((MEDIUM_COUNT += moderate))
    ((LOW_COUNT += low))
    
    if [ "$critical" -gt 0 ] || [ "$high" -gt 0 ]; then
        log_error "Found $critical critical and $high high vulnerabilities in $component"
        
        # Extract details for critical and high vulnerabilities
        echo "$audit_output" | jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | "\(.value.severity | ascii_upcase): \(.key) - \(.value.title)"' >> "$LOG_FILE" 2>/dev/null || true
    else
        log_success "No critical vulnerabilities found in $component"
    fi
}

# Scan source code for security issues
scan_source_code() {
    local component=$1
    
    log "Scanning source code for $component..."
    
    if [ -d "$SCAN_DIR/$component" ]; then
        # Python code scanning with Bandit
        if find "$SCAN_DIR/$component" -name "*.py" -type f | head -1 | grep -q .; then
            log "Running Bandit security scan..."
            
            local bandit_output=$(bandit -r "$SCAN_DIR/$component" -f json 2>/dev/null || echo '{"results": []}')
            local issue_count=$(echo "$bandit_output" | jq '.results | length' 2>/dev/null || echo "0")
            
            if [ "$issue_count" -gt 0 ]; then
                log_warning "Found $issue_count potential security issues in Python code"
                
                # Extract high severity issues
                echo "$bandit_output" | jq -r '.results[] | select(.issue_severity == "HIGH") | "HIGH: \(.filename):\(.line_number) - \(.issue_text)"' >> "$LOG_FILE" 2>/dev/null || true
                
                ((HIGH_COUNT += issue_count))
            fi
        fi
        
        # Check for hardcoded secrets
        log "Checking for hardcoded secrets..."
        
        # Common patterns for secrets
        local secret_patterns=(
            "password.*=.*['\"].*['\"]"
            "api_key.*=.*['\"].*['\"]"
            "secret.*=.*['\"].*['\"]"
            "token.*=.*['\"].*['\"]"
            "AWS.*=.*['\"].*['\"]"
            "private.*key.*=.*['\"].*['\"]"
        )
        
        for pattern in "${secret_patterns[@]}"; do
            if grep -r -i -E "$pattern" "$SCAN_DIR/$component" --include="*.py" --include="*.js" --include="*.ts" --exclude-dir=node_modules --exclude-dir=venv 2>/dev/null | grep -v -E "(example|sample|test|spec)" | head -5; then
                log_error "Potential hardcoded secrets found!"
                ((CRITICAL_COUNT++))
            fi
        done
    fi
}

# Check SSL/TLS configuration
check_ssl_configuration() {
    log "Checking SSL/TLS configuration..."
    
    # Check Nginx SSL configuration
    if [ -f "/etc/nginx/sites-available/terrafusion" ]; then
        # Check for weak ciphers
        if grep -q "SSLv2\|SSLv3" /etc/nginx/sites-available/terrafusion; then
            log_error "Weak SSL protocols detected in Nginx configuration"
            ((HIGH_COUNT++))
        fi
        
        # Check for HSTS
        if ! grep -q "Strict-Transport-Security" /etc/nginx/sites-available/terrafusion; then
            log_warning "HSTS header not configured"
            ((MEDIUM_COUNT++))
        fi
    fi
    
    # Test SSL configuration (if site is running)
    if command -v testssl &> /dev/null; then
        log "Running SSL/TLS test..."
        testssl --quiet --severity HIGH https://localhost:443 >> "$LOG_FILE" 2>&1 || true
    fi
}

# Check authentication and authorization
check_auth_security() {
    log "Checking authentication security..."
    
    # Check for weak password policies
    if [ -f "$SCAN_DIR/backend/config/auth.py" ]; then
        if ! grep -q "min.*length.*[8-9]" "$SCAN_DIR/backend/config/auth.py"; then
            log_warning "Weak password policy detected"
            ((MEDIUM_COUNT++))
        fi
    fi
    
    # Check for JWT configuration
    if grep -r "SECRET_KEY.*=.*['\"].*['\"]" "$SCAN_DIR/backend" --include="*.py" | grep -v -E "os\.environ|getenv"; then
        log_error "Hardcoded JWT secret key found!"
        ((CRITICAL_COUNT++))
    fi
    
    # Check session configuration
    if [ -f "$SCAN_DIR/backend/config/session.py" ]; then
        if ! grep -q "secure.*=.*True" "$SCAN_DIR/backend/config/session.py"; then
            log_warning "Insecure session configuration (missing secure flag)"
            ((MEDIUM_COUNT++))
        fi
    fi
}

# Check for OWASP Top 10 vulnerabilities
check_owasp_top10() {
    log "Checking for OWASP Top 10 vulnerabilities..."
    
    # SQL Injection
    if grep -r -E "(SELECT|INSERT|UPDATE|DELETE).*\+.*%|format\(|f['\"].*{" "$SCAN_DIR" --include="*.py" --exclude-dir=venv | grep -v -E "prepare|parameterized|?" | head -5; then
        log_error "Potential SQL injection vulnerability detected"
        ((CRITICAL_COUNT++))
    fi
    
    # XSS
    if grep -r -E "innerHTML.*=|dangerouslySetInnerHTML" "$SCAN_DIR/frontend" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | grep -v "sanitize" | head -5; then
        log_warning "Potential XSS vulnerability detected"
        ((HIGH_COUNT++))
    fi
    
    # Insecure Direct Object References
    if grep -r -E "request\.(args|form|json)\.get.*id|params\[:id\]" "$SCAN_DIR/backend" --include="*.py" | grep -v -E "authorize|permission|check" | head -5; then
        log_warning "Potential IDOR vulnerability detected"
        ((HIGH_COUNT++))
    fi
    
    # Security Misconfiguration
    if grep -r "DEBUG.*=.*True" "$SCAN_DIR" --include="*.py" --include=".env" | grep -v -E "development|example"; then
        log_error "Debug mode enabled in production configuration"
        ((HIGH_COUNT++))
    fi
}

# Container security scan
scan_containers() {
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not installed, skipping container scan"
        return
    fi
    
    log "Scanning Docker containers..."
    
    # List running containers
    local containers=$(docker ps --format "{{.Names}}" | grep terrafusion || true)
    
    for container in $containers; do
        log "Scanning container: $container"
        
        # Check for running as root
        local user=$(docker exec "$container" whoami 2>/dev/null || echo "unknown")
        if [ "$user" = "root" ]; then
            log_warning "Container $container running as root user"
            ((MEDIUM_COUNT++))
        fi
        
        # Check for exposed ports
        local ports=$(docker port "$container" 2>/dev/null | grep -c "0.0.0.0" || echo "0")
        if [ "$ports" -gt 1 ]; then
            log_warning "Container $container has $ports publicly exposed ports"
            ((MEDIUM_COUNT++))
        fi
    done
    
    # Scan Docker images with trivy if available
    if command -v trivy &> /dev/null; then
        local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep terrafusion || true)
        
        for image in $images; do
            log "Scanning image: $image"
            trivy image --severity HIGH,CRITICAL --quiet "$image" >> "$LOG_FILE" 2>&1 || true
        done
    fi
}

# Generate security report
generate_report() {
    local report_file="$REPORT_DIR/security_report_$(date +%Y%m%d_%H%M%S).html"
    
    log "Generating security report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Security Scan Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .critical { color: #d9534f; font-weight: bold; }
        .high { color: #f0ad4e; font-weight: bold; }
        .medium { color: #5bc0de; }
        .low { color: #5cb85c; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #5cb85c; }
        .summary.has-critical { border-left-color: #d9534f; }
        .summary.has-high { border-left-color: #f0ad4e; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion Security Scan Report</h1>
        <p>Generated: $(date)</p>
        <p>Scan Type: $([ "$FULL_SCAN" = true ] && echo "Full Scan" || echo "Quick Scan")</p>
    </div>
    
    <div class="summary $([ $CRITICAL_COUNT -gt 0 ] && echo "has-critical" || ([ $HIGH_COUNT -gt 0 ] && echo "has-high"))">
        <h2>Summary</h2>
        <p><span class="critical">Critical: $CRITICAL_COUNT</span></p>
        <p><span class="high">High: $HIGH_COUNT</span></p>
        <p><span class="medium">Medium: $MEDIUM_COUNT</span></p>
        <p><span class="low">Low: $LOW_COUNT</span></p>
        <p><strong>Total: $((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))</strong></p>
    </div>
    
    <h2>Scan Results</h2>
    <pre>$(cat "$LOG_FILE" | grep -E "ERROR|WARNING|SUCCESS" | tail -100)</pre>
    
    <h2>Recommendations</h2>
    <ul>
        $([ $CRITICAL_COUNT -gt 0 ] && echo "<li class='critical'>Address all critical vulnerabilities immediately</li>")
        $([ $HIGH_COUNT -gt 0 ] && echo "<li class='high'>Fix high severity issues before deployment</li>")
        <li>Update all dependencies to latest secure versions</li>
        <li>Enable security headers in web server configuration</li>
        <li>Implement proper authentication and authorization checks</li>
        <li>Regular security scanning should be part of CI/CD pipeline</li>
    </ul>
    
    <div class="footer">
        <p><small>Full log available at: $LOG_FILE</small></p>
    </div>
</body>
</html>
EOF
    
    log_success "Report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Security Scan Started"
    log "Component: $COMPONENT"
    log "========================================="
    
    check_prerequisites
    
    # Determine which components to scan
    local components=()
    if [ "$COMPONENT" = "all" ]; then
        components=("backend" "frontend" "ai_engine")
    else
        components=("$COMPONENT")
    fi
    
    # Run scans for each component
    for comp in "${components[@]}"; do
        log ""
        log "Scanning component: $comp"
        log "-----------------------------------------"
        
        if [ "$QUICK_SCAN" = false ]; then
            scan_python_dependencies "$comp"
            scan_node_dependencies "$comp"
        fi
        
        scan_source_code "$comp"
    done
    
    # System-wide security checks
    log ""
    log "Running system security checks..."
    log "-----------------------------------------"
    
    check_ssl_configuration
    check_auth_security
    check_owasp_top10
    
    if [ "$FULL_SCAN" = true ]; then
        scan_containers
    fi
    
    # Summary
    log ""
    log "========================================="
    log "Security Scan Summary"
    log "========================================="
    log "Critical: $CRITICAL_COUNT"
    log "High: $HIGH_COUNT"
    log "Medium: $MEDIUM_COUNT"
    log "Low: $LOW_COUNT"
    log "Total: $((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))"
    log "========================================="
    
    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_report
    fi
    
    # Exit with appropriate code
    if [ $CRITICAL_COUNT -gt 0 ]; then
        log_error "Critical vulnerabilities found!"
        exit 2
    elif [ $HIGH_COUNT -gt 0 ] && [ "$QUICK_SCAN" = true ]; then
        log_error "High severity vulnerabilities found!"
        exit 1
    else
        log_success "Security scan completed"
        exit 0
    fi
}

# Run main function
main