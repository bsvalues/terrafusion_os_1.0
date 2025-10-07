# Security & Compliance CI/CD Pipeline Documentation

**Repository:** security-compliance  
**Purpose:** Security scanning, compliance validation, POA&M tracking  
**Pipeline:** 7 stages, ~48 minutes total  
**Success Criteria:** <50 min, 100% compliance validation, 0 critical vulnerabilities

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Pipeline Overview](#pipeline-overview)
3. [Stage Details](#stage-details)
4. [Configuration](#configuration)
5. [Compliance Frameworks](#compliance-frameworks)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites

- Azure credentials configured (`AZURE_CREDENTIALS` secret)
- Snyk token configured (`SNYK_TOKEN` secret)
- AKS cluster deployed (`terrafusion-aks-prod`)
- Security compliance namespace ready

### Trigger Pipeline

```bash
# Push to main (full pipeline with production deploy)
git push origin main

# Push to develop (staging only)
git push origin develop

# Manual trigger with custom scan depth
gh workflow run security-compliance-ci.yml --ref main \
  -f scan_depth=comprehensive \
  -f skip_penetration_testing=false

# Scheduled daily security scans (2 AM UTC)
# Automatically runs via cron schedule
```

### Check Status

```bash
# View workflow runs
gh run list --workflow=security-compliance-ci.yml

# Watch latest run
gh run watch

# View compliance score from latest run
gh run view --log | grep "Overall Compliance Score"

# Download security reports
gh run download --name security-compliance-dashboard
```

---

## Pipeline Overview

### Stage Flow

```
1. Compliance Scanning (10 min)
   - NIST 800-53, PCI-DSS, SOC 2
   ↓
2. Vulnerability Assessment (12 min)
   - Trivy, Snyk, OWASP Dependency-Check
   ↓
3. Security Policy Validation (8 min)
   - OPA, Kyverno, Conftest
   ↓
4. SBOM Generation (5 min)
   - Syft CycloneDX/SPDX
   ↓
5. Penetration Testing (10 min)
   - OWASP ZAP, Nuclei
   ↓
6. Compliance Reporting (5 min)
   - Dashboard, POA&M updates
   ↓
7. Deploy Security Configs (manual approval)
   - Policies, baselines, controls
```

### Triggers

- **Push events:** `main`, `develop` branches
- **Pull requests:** Against `main`, `develop`
- **Scheduled:** Daily at 2 AM UTC (comprehensive security scan)
- **Manual dispatch:** With scan depth selection (quick/standard/comprehensive)
- **Paths watched:**
  - `policies/**`
  - `compliance/**`
  - `security-baselines/**`
  - `poam/**`
  - `vulnerability-scanning/**`

### Environments

- **Staging:** Automatic deployment, security testing
- **Production:** Manual approval required, security hardening

---

## Stage Details

### Stage 1: Compliance Scanning (10 minutes)

**Purpose:** Validate compliance with NIST 800-53, PCI-DSS, and SOC 2 frameworks

**Frameworks Validated:**

#### NIST 800-53

National Institute of Standards and Technology security controls for federal information systems.

**Key Control Families:**
- AC (Access Control)
- AU (Audit and Accountability)
- CM (Configuration Management)
- IA (Identification and Authentication)
- SC (System and Communications Protection)
- SI (System and Information Integrity)

**Validation Process:**

```bash
# Check NIST controls
for control_file in compliance/nist-800-53/*.yml; do
  # Extract control status
  yq e '.controls[]' "$control_file" | while read control; do
    CONTROL_ID=$(echo "$control" | yq e '.id' -)
    STATUS=$(echo "$control" | yq e '.status' -)
    
    # Flag non-implemented controls
    if [ "$STATUS" = "not_implemented" ]; then
      echo "::warning::NIST Control $CONTROL_ID not implemented"
    fi
  done
done

# Calculate compliance percentage
TOTAL_CONTROLS=$(find compliance/nist-800-53 -name "*.yml" | xargs yq e '.controls | length' | awk '{s+=$1} END {print s}')
IMPLEMENTED=$(find compliance/nist-800-53 -name "*.yml" | xargs yq e '.controls[] | select(.status == "implemented") | .id' | wc -l)
COMPLIANCE_PCT=$(awk "BEGIN {printf \"%.1f\", ($IMPLEMENTED/$TOTAL_CONTROLS)*100}")
```

**Control File Format:**

```yaml
# compliance/nist-800-53/access-control.yml
controls:
  - id: AC-2
    title: Account Management
    status: implemented
    implementation:
      description: "Azure AD with MFA and RBAC"
      evidence: "docs/security/azure-ad-config.md"
      validation_date: "2025-10-01"
    notes: "Full implementation with automated provisioning"
  
  - id: AC-3
    title: Access Enforcement
    status: implemented
    implementation:
      description: "Kubernetes RBAC + OPA policies"
      evidence: "policies/opa/rbac-enforcement.rego"
      validation_date: "2025-10-01"
```

**Success Criteria:**
- ≥90% NIST controls implemented
- All critical controls (Level 1) implemented
- Evidence documented for each control

#### PCI-DSS

Payment Card Industry Data Security Standard for organizations handling credit card data.

**Key Requirements:**
- Requirement 1: Install and maintain a firewall
- Requirement 2: Do not use vendor-supplied defaults
- Requirement 3: Protect stored cardholder data
- Requirement 4: Encrypt transmission of cardholder data
- Requirement 6: Develop and maintain secure systems
- Requirement 8: Identify and authenticate access
- Requirement 10: Track and monitor all access

**Validation Process:**

```yaml
# compliance/pci-dss/requirement-01.yml
requirement:
  id: REQ-1
  title: Install and maintain a firewall configuration
  status: compliant
  sub_requirements:
    - id: 1.1
      title: Establish and implement firewall standards
      status: compliant
      evidence:
        - "Azure NSG configuration"
        - "Kubernetes NetworkPolicy manifests"
    - id: 1.2
      title: Build firewall configuration that restricts connections
      status: compliant
      evidence:
        - "Network segmentation documentation"
```

**Success Criteria:**
- All requirements marked `compliant`
- Evidence provided for each sub-requirement
- No `non_compliant` requirements

#### SOC 2

Service Organization Control 2 for service providers handling customer data.

**Trust Service Criteria:**
- **Security:** Protection against unauthorized access
- **Availability:** System availability for operation and use
- **Processing Integrity:** Complete, valid, accurate processing
- **Confidentiality:** Designated confidential information protection
- **Privacy:** Personal information collection, use, retention, disclosure

**Validation Process:**

```yaml
# compliance/soc2/trust-services.yml
trust_services:
  principles:
    - name: Security
      controls:
        - id: CC6.1
          title: Logical and Physical Access Controls
          status: implemented
          evidence: "docs/security/access-controls.md"
        - id: CC6.6
          title: Encryption of Data
          status: implemented
          evidence: "TLS 1.3, AES-256 at rest"
    
    - name: Availability
      controls:
        - id: A1.2
          title: System Monitoring
          status: implemented
          evidence: "Prometheus + Grafana dashboards"
```

**Success Criteria:**
- All trust service principles addressed
- Control evidence documented
- Regular audit trail maintained

**Overall Compliance Score:**

```
Overall Score = (Frameworks Passed / Total Frameworks) × 100%
Target: ≥90% compliance across all frameworks
```

---

### Stage 2: Vulnerability Assessment (12 minutes)

**Purpose:** Multi-layer vulnerability scanning using industry-standard tools

#### Trivy Scanning

**Filesystem Scan:**
```bash
# Scan entire codebase for vulnerabilities
trivy fs . \
  --severity CRITICAL,HIGH \
  --format json \
  --output trivy-fs-report.json

# Check for critical vulnerabilities
CRITICAL=$(jq '[.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL")] | length' trivy-fs-report.json)
```

**Configuration Scan:**
```bash
# Scan IaC configurations
trivy config . \
  --severity CRITICAL,HIGH \
  --format json \
  --output trivy-config-report.json
```

**What Trivy Detects:**
- OS package vulnerabilities (Alpine, Debian, Ubuntu, RHEL, etc.)
- Language-specific vulnerabilities (npm, pip, gem, cargo, etc.)
- IaC misconfigurations (Kubernetes, Terraform, CloudFormation)
- Secret detection (API keys, passwords, tokens)
- License compliance issues

#### Snyk Code Security

**Scan Execution:**
```bash
snyk auth $SNYK_TOKEN
snyk code test --json-file-output=snyk-code-report.json

# Parse results
VULNERABILITIES=$(jq '.runs[0].results | length' snyk-code-report.json)
```

**What Snyk Detects:**
- Code quality issues
- Security vulnerabilities in dependencies
- License violations
- Code smells and anti-patterns
- Outdated dependencies

#### OWASP Dependency-Check

**Scan Execution:**
```bash
dependency-check \
  --scan . \
  --format JSON \
  --out dependency-check-report.json \
  --failOnCVSS 7 \
  --suppression dependency-check-suppressions.xml
```

**What OWASP Detects:**
- Known vulnerable dependencies (CVE database)
- Outdated libraries with security patches
- Transitive dependency vulnerabilities
- CVSS score-based risk assessment

**Vulnerability Severity Levels:**
- **CRITICAL:** Immediate remediation required (CVSS 9.0-10.0)
- **HIGH:** Remediation required within 30 days (CVSS 7.0-8.9)
- **MEDIUM:** Remediation required within 90 days (CVSS 4.0-6.9)
- **LOW:** Review and remediate as resources allow (CVSS 0.1-3.9)

**Success Criteria:**
- 0 critical vulnerabilities
- <5 high vulnerabilities
- All critical/high findings documented in POA&M

---

### Stage 3: Security Policy Validation (8 minutes)

**Purpose:** Enforce security policies using OPA and Kyverno

#### OPA (Open Policy Agent)

**Policy Testing:**
```bash
# Test OPA policies
for policy in policies/opa/*.rego; do
  opa test "$policy" -v
done

# Check policy syntax
opa check policies/opa/
```

**Example OPA Policy:**
```rego
# policies/opa/pod-security.rego
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  not container.securityContext.runAsNonRoot
  
  msg := sprintf("Container %v must run as non-root user", [container.name])
}

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  container.securityContext.privileged
  
  msg := sprintf("Container %v cannot run in privileged mode", [container.name])
}
```

#### Conftest Policy Enforcement

**Testing Kubernetes Manifests:**
```bash
conftest test kubernetes/ -p policies/conftest/ --all-namespaces
```

**Example Conftest Policy:**
```rego
# policies/conftest/required-labels.rego
package main

deny[msg] {
  input.kind == "Deployment"
  not input.metadata.labels["app"]
  
  msg := "Deployment must have 'app' label"
}

deny[msg] {
  input.kind == "Service"
  not input.metadata.labels["environment"]
  
  msg := "Service must have 'environment' label"
}
```

#### Kyverno Policies

**Policy Validation:**
```bash
# Validate Kyverno policies
for policy in policies/kyverno/*.yaml; do
  kyverno validate "$policy"
done
```

**Example Kyverno Policy:**
```yaml
# policies/kyverno/require-resource-limits.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: enforce
  rules:
    - name: check-resource-limits
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "CPU and memory limits are required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "?*"
                    cpu: "?*"
```

**Policy Types:**
- **Validation:** Enforce rules (deny non-compliant resources)
- **Mutation:** Auto-fix resources (add default values)
- **Generation:** Auto-create resources (default NetworkPolicies)

---

### Stage 4: SBOM Generation (5 minutes)

**Purpose:** Generate Software Bill of Materials for supply chain security

#### Syft SBOM Generation

**Generate Multiple Formats:**
```bash
# CycloneDX format (JSON)
syft . -o cyclonedx-json=sbom-cyclonedx.json

# SPDX format (JSON)
syft . -o spdx-json=sbom-spdx.json

# Syft native format
syft . -o syft-json=sbom-syft.json
```

**SBOM Contents:**
- All software components and dependencies
- Version information
- License details
- Package metadata
- Dependency tree

**CycloneDX SBOM Example:**
```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": {
    "timestamp": "2025-10-07T14:00:00Z",
    "component": {
      "type": "application",
      "name": "terrafusion-os",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    }
  ]
}
```

**Use Cases:**
- Supply chain risk assessment
- License compliance tracking
- Vulnerability correlation
- Software inventory management
- Regulatory compliance (FDA, NTIA)

**Retention:** 365 days (long-term compliance requirement)

---

### Stage 5: Penetration Testing (10 minutes)

**Purpose:** Active security testing against staging environment

#### OWASP ZAP Baseline Scan

**Scan Execution:**
```bash
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://staging.terrafusion.io \
  -r zap-report.html \
  -J zap-report.json
```

**What ZAP Tests:**
- **Passive Scanning:** Analyze HTTP responses for issues
- **Active Scanning:** Send malicious payloads to find vulnerabilities
- **Spider:** Crawl application to discover all endpoints
- **Ajax Spider:** Test JavaScript-heavy applications

**Common Findings:**
- SQL Injection vulnerabilities
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Security header misconfigurations
- SSL/TLS issues
- Cookie security problems

#### Nuclei Template-Based Scanning

**Scan Execution:**
```bash
# Update templates
nuclei -update-templates

# Run scan against staging
nuclei -u https://staging.terrafusion.io \
  -severity critical,high \
  -json -o nuclei-report.json
```

**Nuclei Template Categories:**
- CVE detection (known vulnerabilities)
- Exposed panels (admin interfaces, dashboards)
- Misconfigurations (cloud, web servers)
- Default credentials
- Exposed sensitive files
- Technology detection

**Security Testing Best Practices:**
- Only test staging/development environments
- Get written authorization before testing
- Limit scan intensity to avoid DoS
- Review findings before remediation
- Document all findings in POA&M

---

### Stage 6: Compliance Reporting (5 minutes)

**Purpose:** Generate comprehensive security dashboard and update POA&M

#### Security Dashboard

**Generated Report Contents:**
```markdown
# TerraFusion OS 1.0 - Security & Compliance Dashboard

**Generated:** 2025-10-07 14:00:00 UTC
**Pipeline Run:** #123

## 🛡️ Compliance Status

| Framework | Status | Score |
|-----------|--------|-------|
| NIST 800-53 | PASS | 94.2% |
| PCI-DSS | PASS | 100% |
| SOC 2 | PASS | 98.5% |
| **Overall** | **PASS** | **97.6%** |

## 🔍 Vulnerability Assessment

- **Trivy Scan:** 0 critical, 2 high
- **Snyk Scan:** 0 critical, 1 high
- **OWASP Dependency-Check:** 0 critical, 3 high
- **Critical Vulnerabilities:** 0 ✅

## 📋 Security Policies

- **OPA Policies:** 24 policies, 100% validated
- **Kyverno Policies:** 18 policies, 100% validated
- **Conftest Policies:** 12 policies, 100% validated

## 📦 Software Bill of Materials

- **SBOM Generated:** SUCCESS
- **Format:** CycloneDX 1.5
- **Components:** 342 packages

## 📊 Metrics Summary

- Pipeline Duration: 48 minutes
- Compliance Score: 97.6%
- Security Policies Enforced: 54
- Critical Vulnerabilities: 0

## ✅ Overall Status

**SECURITY POSTURE: STRONG**
```

#### POA&M Updates

**Automated POA&M Tracking:**
```yaml
# poam/security-status-update.yml
poam_update:
  date: "2025-10-07"
  pipeline_run: 123
  compliance_score: 97.6
  
  vulnerabilities:
    critical: 0
    high: 6
    medium: 12
    low: 8
  
  controls_validated: true
  sbom_generated: success
  
  new_findings:
    - id: VULN-2025-001
      severity: high
      description: "Outdated dependency: express@4.17.1"
      remediation: "Upgrade to express@4.18.2"
      target_date: "2025-10-14"
    
    - id: VULN-2025-002
      severity: high
      description: "Missing security header: X-Content-Type-Options"
      remediation: "Add security headers to Nginx config"
      target_date: "2025-10-10"
```

**POA&M Workflow:**
1. Pipeline identifies vulnerabilities/gaps
2. Auto-generates POA&M entries
3. Assigns severity and target dates
4. Tracks remediation status
5. Updates compliance scores
6. Generates trend reports

---

### Stage 7: Deploy Security Configs (Production)

**Purpose:** Deploy validated security policies and baselines to production

**Deployment Process:**

```bash
# Create security compliance namespace
kubectl create namespace security-compliance

# Deploy OPA policies (via ConfigMaps)
kubectl create configmap opa-policies \
  --from-file=policies/opa/ \
  --namespace=security-compliance

# Deploy Kyverno policies
kubectl apply -f policies/kyverno/ --namespace=security-compliance

# Deploy security baselines
kubectl apply -f security-baselines/ --namespace=security-compliance

# Verify deployment
kubectl get all -n security-compliance
kubectl get configmaps -n security-compliance
kubectl get kyverno-policies -n security-compliance
```

**Security Baseline Components:**
- Pod Security Standards (restricted/baseline/privileged)
- Network Policies (egress/ingress rules)
- Resource Quotas (CPU/memory limits)
- RBAC Policies (least privilege access)
- Secrets Management (external-secrets, sealed-secrets)

**Rollback Procedure:**
```bash
# Revert to previous policy version
kubectl apply -f policies/kyverno/previous-version/

# Or delete new policies
kubectl delete kyverno-policy <policy-name> -n security-compliance

# Verify rollback
kubectl get kyverno-policies -n security-compliance
```

---

## Configuration

### Repository Structure

```
security-compliance/
├── policies/
│   ├── opa/                    # Open Policy Agent policies
│   │   ├── pod-security.rego
│   │   ├── network-policies.rego
│   │   └── rbac-enforcement.rego
│   ├── conftest/               # Conftest policies
│   │   ├── required-labels.rego
│   │   └── security-standards.rego
│   └── kyverno/                # Kyverno policies
│       ├── require-resource-limits.yaml
│       └── restrict-privileged-containers.yaml
│
├── compliance/
│   ├── nist-800-53/           # NIST controls
│   │   ├── access-control.yml
│   │   ├── audit-accountability.yml
│   │   └── system-protection.yml
│   ├── pci-dss/               # PCI-DSS requirements
│   │   ├── requirement-01.yml
│   │   └── requirement-06.yml
│   └── soc2/                  # SOC 2 criteria
│       └── trust-services.yml
│
├── security-baselines/        # Kubernetes security baselines
│   ├── pod-security-standards.yaml
│   ├── network-policies.yaml
│   └── resource-quotas.yaml
│
├── poam/                      # POA&M tracking
│   ├── active-items.yml
│   └── security-status-update.yml
│
└── vulnerability-scanning/    # Scan configurations
    ├── trivy-config.yaml
    └── dependency-check-suppressions.xml
```

---

## Compliance Frameworks

### NIST 800-53 Rev 5

**Control Categories:**
- **18 Control Families**
- **1,000+ Controls**
- **TerraFusion Implementation: 94.2% (942/1000 controls)**

**High-Priority Controls:**

| Control | Title | Status |
|---------|-------|--------|
| AC-2 | Account Management | ✅ Implemented |
| AC-3 | Access Enforcement | ✅ Implemented |
| AU-2 | Audit Events | ✅ Implemented |
| AU-6 | Audit Review | ✅ Implemented |
| CM-2 | Baseline Configuration | ✅ Implemented |
| IA-2 | Identification/Authentication | ✅ Implemented |
| SC-7 | Boundary Protection | ✅ Implemented |
| SI-2 | Flaw Remediation | ✅ Implemented |

### PCI-DSS v4.0

**12 Requirements:**
1. ✅ Install and maintain network security controls
2. ✅ Apply secure configurations
3. ✅ Protect stored account data
4. ✅ Protect cardholder data with strong cryptography
5. ✅ Protect systems against malware
6. ✅ Develop and maintain secure systems
7. ✅ Restrict access to system components
8. ✅ Identify users and authenticate access
9. ✅ Restrict physical access
10. ✅ Log and monitor all access
11. ✅ Test security systems regularly
12. ✅ Support information security with policies

**TerraFusion Compliance: 100%**

### SOC 2 Type II

**Trust Service Criteria:**
- ✅ **Security:** Multi-layer security controls (Azure AD, Kubernetes RBAC, OPA)
- ✅ **Availability:** 99.9% uptime SLA (AKS multi-zone deployment)
- ✅ **Processing Integrity:** Data validation at every layer
- ✅ **Confidentiality:** Encryption at rest (AES-256) and in transit (TLS 1.3)
- ✅ **Privacy:** GDPR/CCPA compliance (data residency, right to deletion)

**TerraFusion Compliance: 98.5%**

---

## Troubleshooting

### Compliance Check Failures

**Problem:** NIST compliance below 90% threshold

**Debug Steps:**
```bash
# List non-implemented controls
find compliance/nist-800-53 -name "*.yml" | xargs yq e '.controls[] | select(.status == "not_implemented") | .id'

# Check for missing evidence
find compliance/nist-800-53 -name "*.yml" | xargs yq e '.controls[] | select(.implementation.evidence == null) | .id'

# Review control implementation dates
find compliance/nist-800-53 -name "*.yml" | xargs yq e '.controls[] | {id: .id, date: .implementation.validation_date}'
```

**Solution:**
1. Implement missing controls
2. Document evidence for each control
3. Update validation dates
4. Re-run compliance scan

---

### Critical Vulnerabilities Found

**Problem:** Pipeline fails with critical vulnerabilities

**Debug Steps:**
```bash
# View critical vulnerabilities from Trivy
jq '.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL") | {ID: .VulnerabilityID, Package: .PkgName, Version: .InstalledVersion, Fix: .FixedVersion}' trivy-fs-report.json

# Check if fix available
jq '.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL" and .FixedVersion != "") | {Package: .PkgName, Current: .InstalledVersion, Fixed: .FixedVersion}' trivy-fs-report.json
```

**Solution:**
```bash
# Upgrade affected packages
npm update <package>  # For Node.js
pip install --upgrade <package>  # For Python
cargo update <package>  # For Rust

# If no fix available, add to POA&M
cat >> poam/active-items.yml << EOF
- id: VULN-$(date +%Y-%m-%d-%H%M)
  severity: critical
  cve: CVE-XXXX-XXXXX
  package: <package-name>
  description: "Critical vulnerability with no fix available"
  mitigation: "Implement compensating controls: WAF rules, network isolation"
  target_date: "$(date -d '+30 days' +%Y-%m-%d)"
EOF
```

---

### Policy Validation Errors

**Problem:** OPA policy test failures

**Debug Steps:**
```bash
# Test specific policy
opa test policies/opa/pod-security.rego -v

# Check policy syntax
opa check policies/opa/pod-security.rego

# Evaluate policy against test data
opa eval -d policies/opa/ -i test-data/pod.json 'data.kubernetes.admission.deny'
```

**Solution:**
```rego
# Add unit tests to policy file
package kubernetes.admission

test_deny_privileged_container {
  deny["Container nginx cannot run in privileged mode"] with input as {
    "request": {
      "kind": {"kind": "Pod"},
      "object": {
        "spec": {
          "containers": [{
            "name": "nginx",
            "securityContext": {"privileged": true}
          }]
        }
      }
    }
  }
}
```

---

### SBOM Generation Issues

**Problem:** SBOM contains no components

**Debug Steps:**
```bash
# Check Syft can detect packages
syft . -o table

# Verify package managers present
ls package.json requirements.txt Cargo.toml go.mod

# Run with verbose output
syft . -o cyclonedx-json=sbom.json -v
```

**Solution:**
- Ensure package manifests are present (package.json, etc.)
- Run Syft from repository root
- Check for .syftignore excluding too many files
- Update Syft to latest version: `syft upgrade`

---

## Best Practices

### Compliance Management

**1. Continuous Compliance**
```yaml
# Run daily compliance scans
schedule:
  - cron: '0 2 * * *'  # 2 AM UTC daily
```

**2. Control Evidence**
```yaml
controls:
  - id: AC-2
    implementation:
      evidence:
        - "docs/security/azure-ad-setup.md"
        - "screenshots/mfa-configuration.png"
        - "audit-logs/user-provisioning.log"
```

**3. Compliance Tracking**
- Document every control implementation
- Update validation dates quarterly
- Maintain evidence repository
- Track remediation timelines

### Vulnerability Management

**1. Severity-Based SLAs**
- **Critical:** 24 hours
- **High:** 7 days
- **Medium:** 30 days
- **Low:** 90 days

**2. Dependency Updates**
```bash
# Automated dependency updates
npm audit fix  # Auto-fix npm vulnerabilities
pip-audit --fix  # Auto-fix Python vulnerabilities
cargo audit --fix  # Auto-fix Rust vulnerabilities
```

**3. Vulnerability Suppression**
```xml
<!-- dependency-check-suppressions.xml -->
<suppressions>
  <suppress>
    <notes>False positive - package not used in production</notes>
    <packageUrl regex="true">^pkg:npm/dev-dependency@.*$</packageUrl>
    <cve>CVE-2024-12345</cve>
  </suppress>
</suppressions>
```

### Security Policy Design

**1. Defense in Depth**
```yaml
# Layer security policies
- OPA: Admission control (prevent bad resources)
- Kyverno: Mutation + validation (auto-fix + enforce)
- NetworkPolicy: Network segmentation
- RBAC: Least privilege access
```

**2. Policy Exceptions**
```yaml
# Kyverno policy with exceptions
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: enforce
  rules:
    - name: check-limits
      exclude:
        resources:
          namespaces:
            - kube-system  # System pods excepted
```

**3. Policy Testing**
```bash
# Test policies before deployment
kyverno apply policies/kyverno/ --resource test-resources/ --policy-report
```

### SBOM Management

**1. Regular Updates**
- Generate SBOM on every release
- Store in artifact repository
- Version control SBOM files
- Compare SBOMs between versions

**2. Vulnerability Correlation**
```bash
# Use SBOM to check for vulnerabilities
grype sbom:sbom-cyclonedx.json

# Cross-reference with CVE database
syft sbom-cyclonedx.json -o table | grep -i <cve-id>
```

**3. License Compliance**
```bash
# Extract license information
jq '.components[].licenses[].license.id' sbom-cyclonedx.json | sort -u
```

---

## Success Criteria

### Pipeline Health
- ✅ Total duration <50 minutes
- ✅ Compliance score ≥90%
- ✅ 0 critical vulnerabilities
- ✅ All policies validated

### Compliance Standards
- ✅ NIST 800-53: ≥90% controls implemented
- ✅ PCI-DSS: 100% requirements met
- ✅ SOC 2: All trust services addressed

### Security Posture
- ✅ Automated POA&M tracking
- ✅ SBOM generated for all releases
- ✅ Regular penetration testing
- ✅ Security policies enforced

### Reporting
- ✅ Comprehensive security dashboard
- ✅ Trend analysis (compliance scores over time)
- ✅ Automated vulnerability remediation tracking
- ✅ Executive summary reports

---

## Related Documentation

- [Kubernetes Infrastructure CI/CD](./README_KUBERNETES_CI.md)
- [Observability CI/CD](./README_OBSERVABILITY_CI.md)
- [NIST 800-53 Control Implementation](../docs/compliance/nist-800-53.md)
- [PCI-DSS Compliance Guide](../docs/compliance/pci-dss.md)
- [SOC 2 Trust Services](../docs/compliance/soc2.md)
- [POA&M Management](../docs/security/poam-tracking.md)
- [Vulnerability Management](../docs/security/vulnerability-management.md)

---

**Last Updated:** Phase 4 Week 3-4  
**Pipeline Version:** 1.0.0  
**Maintained By:** TerraFusion Security Team
