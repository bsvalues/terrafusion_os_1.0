package terrafusion.security

import rego.v1

# TerraFusion Build-Time Security Policies
# Enforces security requirements during CI/CD pipeline stages

default allow_build := false

# Allow build if all security requirements are met
allow_build if {
    valid_code_scan
    valid_dependency_scan
    valid_container_scan
    valid_secret_scan
    compliance_requirements_met
}

# Code scanning requirements
valid_code_scan if {
    input.security_scans.code_scan.status == "passed"
    input.security_scans.code_scan.critical_issues == 0
    input.security_scans.code_scan.high_issues <= 2
}

# Dependency scanning requirements  
valid_dependency_scan if {
    input.security_scans.dependency_scan.status == "passed"
    input.security_scans.dependency_scan.vulnerable_packages == 0
    input.security_scans.dependency_scan.license_violations == 0
}

# Container scanning requirements
valid_container_scan if {
    input.security_scans.container_scan.status == "passed"
    input.security_scans.container_scan.critical_vulnerabilities == 0
    input.security_scans.container_scan.high_vulnerabilities <= 1
    input.security_scans.container_scan.base_image_verified == true
}

# Secret scanning requirements
valid_secret_scan if {
    input.security_scans.secret_scan.status == "passed"
    input.security_scans.secret_scan.exposed_secrets == 0
    input.security_scans.secret_scan.api_keys_detected == 0
}

# Compliance requirements for government deployment
compliance_requirements_met if {
    input.compliance.fedramp_moderate == true
    input.compliance.fips_140_2 == true
    input.compliance.ada_compliance == true
    input.compliance.section_508 == true
}

# Build stage authorization
authorized_build_stage if {
    input.build.stage in ["development", "staging", "production"]
    input.build.branch in allowed_branches
    input.build.actor in authorized_developers
}

allowed_branches := {
    "main",
    "develop", 
    "release/*",
    "hotfix/*"
}

authorized_developers := {
    "terrafusion-ci",
    "senior-developer",
    "security-team",
    "devops-team"
}

# Deployment environment validation
valid_deployment_environment if {
    environment := input.deployment.environment
    environment in ["development", "staging", "production"]
    
    # Environment-specific requirements
    environment_requirements_met(environment)
}

environment_requirements_met(env) if {
    env == "development"
    input.deployment.network_isolation == false
    input.deployment.logging_level == "debug"
}

environment_requirements_met(env) if {
    env == "staging"  
    input.deployment.network_isolation == true
    input.deployment.logging_level == "info"
    input.deployment.monitoring_enabled == true
}

environment_requirements_met(env) if {
    env == "production"
    input.deployment.network_isolation == true
    input.deployment.logging_level == "warn"
    input.deployment.monitoring_enabled == true
    input.deployment.backup_enabled == true
    input.deployment.encryption_at_rest == true
}

# Container security requirements
secure_container_config if {
    input.container.runs_as_root == false
    input.container.read_only_filesystem == true
    input.container.privileged == false
    input.container.capabilities == []
    input.container.security_context.allow_privilege_escalation == false
}

# Network security requirements
secure_network_config if {
    input.network.ingress_encryption == true
    input.network.egress_restrictions == true
    input.network.service_mesh_enabled == true
    count(input.network.allowed_ports) <= 10
}

# Data classification and handling
data_classification_valid if {
    classification := input.data.classification
    classification in ["public", "internal", "confidential", "restricted"]
    
    # Ensure appropriate handling based on classification
    data_handling_appropriate(classification)
}

data_handling_appropriate("public") if {
    input.data.encryption_required == false
    input.data.access_logging == true
}

data_handling_appropriate("internal") if {
    input.data.encryption_required == true
    input.data.access_logging == true
    input.data.retention_policy != ""
}

data_handling_appropriate("confidential") if {
    input.data.encryption_required == true
    input.data.access_logging == true
    input.data.retention_policy != ""
    input.data.access_controls_enabled == true
}

data_handling_appropriate("restricted") if {
    input.data.encryption_required == true
    input.data.access_logging == true
    input.data.retention_policy != ""
    input.data.access_controls_enabled == true
    input.data.multi_factor_auth_required == true
}

# Build artifact integrity
build_integrity_verified if {
    input.build.signed_artifacts == true
    input.build.checksum_verified == true
    input.build.provenance_recorded == true
    input.build.supply_chain_verified == true
}

# Generate security recommendations
security_recommendations := recommendations if {
    recommendations := [rec |
        some issue in security_issues
        rec := generate_recommendation(issue)
    ]
}

security_issues := issues if {
    issues := array.concat(
        code_issues,
        array.concat(
            dependency_issues,
            array.concat(
                container_issues,
                compliance_issues
            )
        )
    )
}

code_issues := issues if {
    not valid_code_scan
    issues := [{
        "type": "code_security",
        "severity": "high",
        "message": "Code security scan failed or has critical/high issues",
        "remediation": "Review and fix security vulnerabilities in source code"
    }]
}

code_issues := [] if valid_code_scan

dependency_issues := issues if {
    not valid_dependency_scan
    issues := [{
        "type": "dependency_security", 
        "severity": "high",
        "message": "Dependency scan found vulnerable packages or license violations",
        "remediation": "Update vulnerable dependencies and resolve license issues"
    }]
}

dependency_issues := [] if valid_dependency_scan

container_issues := issues if {
    not valid_container_scan
    issues := [{
        "type": "container_security",
        "severity": "critical",
        "message": "Container scan found critical or high vulnerabilities",
        "remediation": "Update base image and fix container vulnerabilities"
    }]
}

container_issues := [] if valid_container_scan

compliance_issues := issues if {
    not compliance_requirements_met
    issues := [{
        "type": "compliance",
        "severity": "critical", 
        "message": "Government compliance requirements not met",
        "remediation": "Ensure FedRAMP, FIPS 140-2, ADA, and Section 508 compliance"
    }]
}

compliance_issues := [] if compliance_requirements_met

generate_recommendation(issue) := recommendation if {
    recommendation := {
        "category": issue.type,
        "priority": priority_from_severity(issue.severity),
        "title": issue.message,
        "description": issue.remediation,
        "estimated_effort": "2-4 hours",
        "resources": []
    }
}

priority_from_severity("critical") := 1
priority_from_severity("high") := 2  
priority_from_severity("medium") := 3
priority_from_severity("low") := 4

# Approval workflow requirements
approval_required if {
    input.deployment.environment == "production"
    not bypass_approval_granted
}

bypass_approval_granted if {
    input.deployment.emergency_deployment == true
    input.deployment.approved_by in emergency_approvers
}

emergency_approvers := {
    "security-lead",
    "platform-lead", 
    "cto"
}

# Risk assessment
risk_level := level if {
    score := calculate_risk_score
    level := risk_category(score)
}

calculate_risk_score := score if {
    code_risk := code_risk_points
    dependency_risk := dependency_risk_points
    container_risk := container_risk_points
    compliance_risk := compliance_risk_points
    
    score := code_risk + dependency_risk + container_risk + compliance_risk
}

code_risk_points := points if {
    valid_code_scan
    points := 0
}

code_risk_points := points if {
    not valid_code_scan
    points := 25
}

dependency_risk_points := points if {
    valid_dependency_scan
    points := 0
}

dependency_risk_points := points if {
    not valid_dependency_scan  
    points := 20
}

container_risk_points := points if {
    valid_container_scan
    points := 0
}

container_risk_points := points if {
    not valid_container_scan
    points := 30
}

compliance_risk_points := points if {
    compliance_requirements_met
    points := 0
}

compliance_risk_points := points if {
    not compliance_requirements_met
    points := 50
}

risk_category(score) := "low" if score <= 10
risk_category(score) := "medium" if { score > 10; score <= 30 }
risk_category(score) := "high" if { score > 30; score <= 60 }
risk_category(score) := "critical" if score > 60

# Final build decision with detailed reasoning
build_decision := decision if {
    decision := {
        "allowed": allow_build,
        "risk_level": risk_level,
        "risk_score": calculate_risk_score,
        "security_issues": security_issues,
        "recommendations": security_recommendations,
        "approval_required": approval_required,
        "compliance_status": {
            "fedramp": input.compliance.fedramp_moderate,
            "fips": input.compliance.fips_140_2,
            "ada": input.compliance.ada_compliance,
            "section508": input.compliance.section_508
        },
        "scan_results": {
            "code": valid_code_scan,
            "dependencies": valid_dependency_scan,
            "container": valid_container_scan,
            "secrets": valid_secret_scan
        }
    }
}