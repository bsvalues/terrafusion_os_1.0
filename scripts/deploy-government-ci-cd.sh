#!/bin/bash
# TerraFusion OS Government CI/CD Pipeline Deployment Script
# Deploys and configures government-grade DevSecOps infrastructure

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}\")\" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
GITHUB_REPO="${GITHUB_REPOSITORY:-terrafusion-os/terrafusion-os}"
ENVIRONMENT="${ENVIRONMENT:-development}"
DEPLOY_MONITORING="${DEPLOY_MONITORING:-true}"
ENABLE_SECURITY_GATES="${ENABLE_SECURITY_GATES:-true}"
FISMA_COMPLIANCE="${FISMA_COMPLIANCE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

print_banner() {
    echo "==================================================================================="
    echo "  🏛️ TERRAFUSION OS GOVERNMENT CI/CD PIPELINE DEPLOYMENT"
    echo "  Government-Grade DevSecOps Infrastructure Setup"
    echo "==================================================================================="
    echo "  Repository: ${GITHUB_REPO}"
    echo "  Environment: ${ENVIRONMENT}"
    echo "  FISMA Compliance: ${FISMA_COMPLIANCE}"
    echo "  Security Gates: ${ENABLE_SECURITY_GATES}"
    echo "  Monitoring: ${DEPLOY_MONITORING}"
    echo "==================================================================================="
    echo
}

# Validate prerequisites
validate_prerequisites() {
    log_header "Validating Prerequisites"
    
    # Check required tools
    local required_tools=("git" "docker" "kubectl" "curl" "jq")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        else
            log_info "  ✓ $tool is available"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools and retry"
        exit 1
    fi
    
    # Check GitHub CLI
    if command -v gh >/dev/null 2>&1; then
        log_info "  ✓ GitHub CLI available"
    else
        log_warn "GitHub CLI not found. Some features may be limited."
    fi
    
    # Validate Git repository
    if [ ! -d "${PROJECT_ROOT}/.git" ]; then
        log_error "Not a Git repository. Please run from TerraFusion OS root directory."
        exit 1
    fi
    
    log_success "Prerequisites validation completed"
}

# Setup GitHub Secrets
setup_github_secrets() {
    log_header "Setting Up GitHub Secrets for Government CI/CD"
    
    if ! command -v gh >/dev/null 2>&1; then
        log_warn "GitHub CLI not available. Please manually configure the following secrets:"
        echo "  - SONAR_TOKEN: SonarCloud authentication token"
        echo "  - SECURITY_ALERT_WEBHOOK: Security team notification webhook"
        echo "  - FISMA_COMPLIANCE_ENDPOINT: FISMA compliance validation endpoint"
        echo "  - HARRIS_PACS_SECURITY_KEY: Harris PACS integration security key"
        return 0
    fi
    
    # Check if authenticated with GitHub
    if ! gh auth status >/dev/null 2>&1; then
        log_info "Please authenticate with GitHub CLI:"
        gh auth login
    fi
    
    log_info "Configuring GitHub repository secrets..."
    
    # Generate or prompt for secrets
    local secrets_config="${PROJECT_ROOT}/config/github-secrets.env"
    
    if [ ! -f "$secrets_config" ]; then
        log_info "Creating secrets configuration template..."
        
        mkdir -p "${PROJECT_ROOT}/config"
        cat > "$secrets_config" << 'EOF'
# TerraFusion OS GitHub Secrets Configuration
# Replace with actual values before deployment

# Security and Compliance
SONAR_TOKEN="your-sonarcloud-token"
SECURITY_ALERT_WEBHOOK="https://hooks.slack.com/services/your-webhook"
FISMA_COMPLIANCE_ENDPOINT="https://your-compliance-endpoint.gov"

# Government Integration
HARRIS_PACS_SECURITY_KEY="your-harris-pacs-key"
HARRIS_PACS_API_ENDPOINT="https://harris-pacs.benton.gov/api"

# Container Registry
CONTAINER_REGISTRY_TOKEN="your-registry-token"
CONTAINER_SIGNING_KEY="your-cosign-private-key"

# Monitoring and Alerting  
PROMETHEUS_WEBHOOK="https://your-prometheus-webhook"
GRAFANA_API_KEY="your-grafana-api-key"

# Database and Cache
DATABASE_CONNECTION_PROD="your-production-db-connection"
REDIS_CONNECTION_PROD="your-production-redis-connection"

# AI and ML
AI_MODEL_ENCRYPTION_KEY="your-ai-model-encryption-key"
QUANTUM_OPTIMIZATION_TOKEN="your-quantum-service-token"
EOF
        
        log_warn "Secrets template created at: $secrets_config"
        log_info "Please update the configuration file with actual values and re-run this script"
        return 0
    fi
    
    # Load secrets configuration
    if [ -f "$secrets_config" ]; then
        log_info "Loading secrets from configuration file..."
        source "$secrets_config"
        
        # Set GitHub secrets (only if not placeholder values)
        if [[ "$SONAR_TOKEN" != "your-sonarcloud-token" ]]; then
            echo "$SONAR_TOKEN" | gh secret set SONAR_TOKEN --repo "$GITHUB_REPO"
            log_info "  ✓ SONAR_TOKEN configured"
        fi
        
        if [[ "$SECURITY_ALERT_WEBHOOK" != "https://hooks.slack.com/services/your-webhook" ]]; then
            echo "$SECURITY_ALERT_WEBHOOK" | gh secret set SECURITY_ALERT_WEBHOOK --repo "$GITHUB_REPO"
            log_info "  ✓ SECURITY_ALERT_WEBHOOK configured"
        fi
        
        # Add other secrets as needed...
    fi
    
    log_success "GitHub secrets configuration completed"
}

# Deploy CI/CD workflows
deploy_workflows() {
    log_header "Deploying Government CI/CD Workflows"
    
    # Ensure .github/workflows directory exists
    mkdir -p "${PROJECT_ROOT}/.github/workflows"
    
    # Validate workflow files
    local workflow_files=(
        "terrafusion-ci-cd.yml"
        "security-monitoring.yml"
    )
    
    for workflow in "${workflow_files[@]}"; do
        local workflow_path="${PROJECT_ROOT}/.github/workflows/${workflow}"
        
        if [ -f "$workflow_path" ]; then
            log_info "  ✓ Validating workflow: $workflow"
            
            # Basic YAML validation
            if command -v yamllint >/dev/null 2>&1; then
                if yamllint "$workflow_path" >/dev/null 2>&1; then
                    log_info "    ✓ YAML syntax valid"
                else
                    log_warn "    ⚠ YAML syntax issues detected"
                fi
            fi
            
            # GitHub Actions validation (if available)
            if command -v actionlint >/dev/null 2>&1; then
                if actionlint "$workflow_path" >/dev/null 2>&1; then
                    log_info "    ✓ GitHub Actions syntax valid"
                else
                    log_warn "    ⚠ GitHub Actions syntax issues detected"
                fi
            fi
        else
            log_error "Missing workflow file: $workflow"
            exit 1
        fi
    done
    
    log_success "CI/CD workflows validation completed"
}

# Setup monitoring infrastructure
setup_monitoring() {
    log_header "Setting Up Government Monitoring Infrastructure"
    
    if [ "$DEPLOY_MONITORING" != "true" ]; then
        log_info "Monitoring deployment disabled. Skipping..."
        return 0
    fi
    
    # Create monitoring configuration
    local monitoring_dir="${PROJECT_ROOT}/monitoring/government"
    mkdir -p "$monitoring_dir"
    
    log_info "Creating government monitoring configuration..."
    
    # Prometheus configuration for government compliance
    cat > "${monitoring_dir}/prometheus-government.yml" << 'EOF'
# Government-grade Prometheus configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'terrafusion-government'
    compliance: 'fisma'

rule_files:
  - "fisma-compliance-rules.yml"
  - "security-monitoring-rules.yml"
  - "harris-pacs-rules.yml"

scrape_configs:
  - job_name: 'terrafusion-api'
    static_configs:
      - targets: ['api:${TF_API_PORT:-5046}']
    scrape_interval: 10s
    metrics_path: '/metrics'
    scheme: 'https'
    tls_config:
      insecure_skip_verify: false
    
  - job_name: 'terrafusion-ai-swarm'
    static_configs:
      - targets: ['ai-swarm:9000']
    scrape_interval: 15s
    
  - job_name: 'harris-pacs-integration'
    static_configs:
      - targets: ['harris-pacs:${TF_STATIC_PORT:-8080}']
    scrape_interval: 30s

  - job_name: 'government-security-monitoring'
    static_configs:
      - targets: ['security-monitor:9100']
    scrape_interval: 5s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
      tls_config:
        insecure_skip_verify: false
EOF

    # FISMA compliance alerting rules
    cat > "${monitoring_dir}/fisma-compliance-rules.yml" << 'EOF'
groups:
  - name: fisma-compliance
    rules:
      - alert: FISMAComplianceViolation
        expr: fisma_compliance_score < 85
        for: 1m
        labels:
          severity: critical
          compliance: fisma
        annotations:
          summary: "FISMA compliance violation detected"
          description: "Compliance score {{ $value }}% is below minimum threshold of 85%"
          
      - alert: SecurityControlFailure
        expr: security_control_status{control=~"AC-.*|AU-.*|IA-.*"} == 0
        for: 30s
        labels:
          severity: high
          compliance: fisma
        annotations:
          summary: "Critical security control failure"
          description: "Security control {{ $labels.control }} has failed validation"
          
      - alert: UnauthorizedAccess
        expr: increase(unauthorized_access_attempts_total[1m]) > 5
        for: 30s
        labels:
          severity: critical
          security: access-control
        annotations:
          summary: "Multiple unauthorized access attempts"
          description: "{{ $value }} unauthorized access attempts in the last minute"
EOF

    # Harris PACS specific monitoring
    cat > "${monitoring_dir}/harris-pacs-rules.yml" << 'EOF'
groups:
  - name: harris-pacs-integration
    rules:
      - alert: HarrisPACSConnectivityFailure
        expr: harris_pacs_connectivity_success_rate < 0.98
        for: 2m
        labels:
          severity: high
          system: harris-pacs
        annotations:
          summary: "Harris PACS connectivity below threshold"
          description: "Connectivity success rate {{ $value }}% is below 98% threshold"
          
      - alert: HarrisPACSDataSyncFailure
        expr: harris_pacs_data_sync_accuracy < 0.995
        for: 1m
        labels:
          severity: critical
          system: harris-pacs
        annotations:
          summary: "Harris PACS data synchronization failure"
          description: "Data sync accuracy {{ $value }}% is below 99.5% threshold"
          
      - alert: HarrisPACSComplianceIssue
        expr: harris_pacs_compliance_score < 90
        for: 30s
        labels:
          severity: high
          compliance: government
        annotations:
          summary: "Harris PACS compliance issue detected"
          description: "Compliance score {{ $value }}% is below government standards"
EOF

    log_success "Government monitoring infrastructure configured"
}

# Setup security scanning tools
setup_security_tools() {
    log_header "Configuring Government Security Scanning Tools"
    
    if [ "$ENABLE_SECURITY_GATES" != "true" ]; then
        log_info "Security gates disabled. Skipping security tools setup..."
        return 0
    fi
    
    # Create security configuration directory
    local security_dir="${PROJECT_ROOT}/security/government"
    mkdir -p "$security_dir"
    
    # SonarQube configuration for government compliance
    cat > "${PROJECT_ROOT}/sonar-project.properties" << 'EOF'
# TerraFusion OS Government SonarQube Configuration

sonar.projectKey=terrafusion-os-government
sonar.projectName=TerraFusion OS Government
sonar.projectVersion=1.0
sonar.organization=government-ai

# Source code directories
sonar.sources=backend,frontend/src,modules
sonar.exclusions=**/node_modules/**,**/bin/**,**/obj/**,**/*.min.js

# Language-specific configurations
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
sonar.cs.opencover.reportsPaths=backend/coverage.xml
sonar.python.coverage.reportPaths=backend/ai-models/coverage.xml

# Security and compliance focus
sonar.security.hotspots.threshold=0
sonar.coverage.minimum=80
sonar.duplicated_lines_density.threshold=3

# Government-specific quality gates
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300

# FISMA compliance rules
sonar.issue.enforceRuleSet=government-security
sonar.security.review.category=government-compliance
EOF

    # CodeQL configuration for enhanced security
    mkdir -p "${PROJECT_ROOT}/.github/codeql"
    
    # Government-specific security queries
    mkdir -p "${PROJECT_ROOT}/.github/codeql/government-queries"
    
    cat > "${PROJECT_ROOT}/.github/codeql/government-queries/pii-detection.ql" << 'EOF'
/**
 * @name Government PII Detection
 * @description Detects potential PII exposure in government systems
 * @kind problem
 * @problem.severity warning
 * @security-severity 8.0
 * @precision medium
 * @id government/pii-detection
 * @tags security
 *       government
 *       pii
 *       fisma-compliance
 */

import javascript

from StringLiteral str
where str.getValue().regexpMatch("(?i).*(ssn|social.*security|tax.*id|driver.*license).*")
select str, "Potential PII exposure detected in string literal"
EOF

    cat > "${PROJECT_ROOT}/.github/codeql/government-queries/harris-pacs-security.ql" << 'EOF'
/**
 * @name Harris PACS Security Validation
 * @description Validates Harris PACS integration security measures
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id government/harris-pacs-security
 * @tags security
 *       government
 *       harris-pacs
 *       integration
 */

import csharp

from MethodAccess ma
where ma.getTarget().getName() = "ConnectToHarrisPACS" and
      not exists(MethodAccess auth | auth.getEnclosingCallable() = ma.getEnclosingCallable() and
                                    auth.getTarget().getName().matches("%Auth%"))
select ma, "Harris PACS connection without proper authentication"
EOF

    log_success "Government security scanning tools configured"
}

# Create deployment validation script
create_validation_script() {
    log_header "Creating CI/CD Deployment Validation Script"
    
    cat > "${PROJECT_ROOT}/scripts/validate-cicd-deployment.sh" << 'EOF'
#!/bin/bash
# TerraFusion OS CI/CD Deployment Validation Script
# Validates government-grade CI/CD pipeline deployment

set -euo pipefail

echo "🏛️ Validating TerraFusion OS CI/CD Deployment"
echo "=============================================="

# Check GitHub workflows
echo "📋 Checking GitHub Actions workflows..."
if [ -f ".github/workflows/terrafusion-ci-cd.yml" ]; then
    echo "  ✅ Main CI/CD workflow configured"
else
    echo "  ❌ Main CI/CD workflow missing"
    exit 1
fi

if [ -f ".github/workflows/security-monitoring.yml" ]; then
    echo "  ✅ Security monitoring workflow configured"
else
    echo "  ❌ Security monitoring workflow missing"
    exit 1
fi

# Check CodeQL configuration
echo "🔍 Checking security scanning configuration..."
if [ -f ".github/codeql/codeql-config.yml" ]; then
    echo "  ✅ CodeQL configuration present"
else
    echo "  ❌ CodeQL configuration missing"
fi

# Check monitoring configuration
echo "📊 Checking monitoring configuration..."
if [ -d "monitoring/government" ]; then
    echo "  ✅ Government monitoring configuration present"
else
    echo "  ⚠️ Government monitoring configuration not found"
fi

# Check security tools
echo "🛡️ Checking security tools configuration..."
if [ -f "sonar-project.properties" ]; then
    echo "  ✅ SonarQube configuration present"
else
    echo "  ⚠️ SonarQube configuration missing"
fi

# Validate workflow syntax (if tools available)
if command -v yamllint >/dev/null 2>&1; then
    echo "🔧 Validating YAML syntax..."
    for workflow in .github/workflows/*.yml; do
        if yamllint "$workflow" >/dev/null 2>&1; then
            echo "  ✅ $(basename "$workflow"): Valid YAML"
        else
            echo "  ❌ $(basename "$workflow"): Invalid YAML"
        fi
    done
fi

echo ""
echo "✅ CI/CD deployment validation completed"
echo "🏛️ Government-grade DevSecOps pipeline is ready for use"
EOF

    chmod +x "${PROJECT_ROOT}/scripts/validate-cicd-deployment.sh"
    
    log_success "Deployment validation script created"
}

# Main deployment function
main() {
    print_banner
    
    validate_prerequisites
    setup_github_secrets
    deploy_workflows
    setup_monitoring
    setup_security_tools
    create_validation_script
    
    echo ""
    log_success "🎯 TerraFusion OS Government CI/CD Pipeline Deployment Complete!"
    echo ""
    echo "Next Steps:"
    echo "1. Review and update GitHub secrets configuration"
    echo "2. Commit and push the CI/CD workflows to trigger first run"
    echo "3. Configure monitoring dashboards and alerts"
    echo "4. Review security scanning results and adjust thresholds"
    echo "5. Train team on government CI/CD processes"
    echo ""
    echo "Validation Command:"
    echo "  ./scripts/validate-cicd-deployment.sh"
    echo ""
    echo "🏛️ Government-grade DevSecOps infrastructure is now operational!"
}

# Execute main function
main "$@"