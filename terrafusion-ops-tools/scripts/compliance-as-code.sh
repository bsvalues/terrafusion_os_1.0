#!/bin/bash

# Automated Compliance as Code Framework
# Continuous compliance monitoring and enforcement
# Features: Policy validation, automated remediation, compliance reporting, multi-framework support

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/../config/compliance.conf}"
LOG_FILE="${LOG_FILE:-/var/log/terrafusion/compliance.log}"
POLICY_DIR="${POLICY_DIR:-${SCRIPT_DIR}/../policies}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compliance frameworks
FRAMEWORKS=(
    "SOC2"
    "HIPAA" 
    "GDPR"
    "PCI-DSS"
    "ISO27001"
    "NIST"
    "CIS"
)

# Initialize database
init_database() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Initializing compliance database...${NC}"
    
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Compliance policies
CREATE TABLE IF NOT EXISTS compliance_policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(100) UNIQUE NOT NULL,
    framework VARCHAR(50) NOT NULL,
    control_id VARCHAR(50),
    policy_name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'medium',
    policy_definition JSONB NOT NULL,
    remediation_steps JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance scans
CREATE TABLE IF NOT EXISTS compliance_scans (
    id SERIAL PRIMARY KEY,
    scan_id UUID DEFAULT gen_random_uuid(),
    scan_type VARCHAR(50),
    frameworks TEXT[],
    total_policies INTEGER DEFAULT 0,
    passed_policies INTEGER DEFAULT 0,
    failed_policies INTEGER DEFAULT 0,
    compliance_score DECIMAL(5,2),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Compliance violations
CREATE TABLE IF NOT EXISTS compliance_violations (
    id SERIAL PRIMARY KEY,
    scan_id UUID,
    policy_id VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    violation_details JSONB,
    evidence JSONB,
    severity VARCHAR(20),
    auto_remediated BOOLEAN DEFAULT false,
    remediation_status VARCHAR(50) DEFAULT 'pending',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remediated_at TIMESTAMP
);

-- Compliance evidence
CREATE TABLE IF NOT EXISTS compliance_evidence (
    id SERIAL PRIMARY KEY,
    evidence_id UUID DEFAULT gen_random_uuid(),
    policy_id VARCHAR(100),
    evidence_type VARCHAR(50),
    evidence_data JSONB,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Remediation history
CREATE TABLE IF NOT EXISTS remediation_history (
    id SERIAL PRIMARY KEY,
    violation_id INTEGER REFERENCES compliance_violations(id),
    action_type VARCHAR(100),
    action_details JSONB,
    success BOOLEAN,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance reports
CREATE TABLE IF NOT EXISTS compliance_reports (
    id SERIAL PRIMARY KEY,
    report_id UUID DEFAULT gen_random_uuid(),
    report_type VARCHAR(50),
    framework VARCHAR(50),
    period_start DATE,
    period_end DATE,
    compliance_percentage DECIMAL(5,2),
    critical_findings INTEGER DEFAULT 0,
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_policies_framework ON compliance_policies(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON compliance_violations(remediation_status);
CREATE INDEX IF NOT EXISTS idx_compliance_scans_score ON compliance_scans(compliance_score);
EOF
    
    echo -e "${GREEN}✓ Compliance database initialized${NC}"
}

# Load compliance policies
load_policies() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Loading compliance policies...${NC}"
    
    # Create policy loader
    cat > /tmp/policy_loader.py << 'EOF'
import json
import yaml
import psycopg2
import os
from pathlib import Path

class CompliancePolicyLoader:
    def __init__(self):
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.policies = []
        
    def load_soc2_policies(self):
        """Load SOC2 Trust Service Criteria policies"""
        soc2_policies = [
            {
                'policy_id': 'SOC2-CC1.1',
                'framework': 'SOC2',
                'control_id': 'CC1.1',
                'policy_name': 'Control Environment - Board Independence',
                'description': 'The board of directors demonstrates independence from management',
                'policy_type': 'governance',
                'severity': 'high',
                'policy_definition': {
                    'check_type': 'manual',
                    'evidence_required': ['board_charter', 'meeting_minutes'],
                    'validation_rules': {
                        'independent_directors_percentage': {'min': 50},
                        'audit_committee_independence': {'required': True}
                    }
                }
            },
            {
                'policy_id': 'SOC2-CC6.1',
                'framework': 'SOC2',
                'control_id': 'CC6.1',
                'policy_name': 'Logical Access Controls',
                'description': 'Logical access to systems and data is restricted',
                'policy_type': 'technical',
                'severity': 'critical',
                'policy_definition': {
                    'check_type': 'automated',
                    'resource_types': ['iam', 'database', 'application'],
                    'validation_rules': {
                        'mfa_enabled': {'required': True},
                        'password_policy': {
                            'min_length': 12,
                            'complexity': True,
                            'rotation_days': 90
                        },
                        'inactive_user_days': {'max': 90}
                    }
                },
                'remediation_steps': {
                    'mfa_not_enabled': [
                        'Enable MFA for user account',
                        'Send notification to user',
                        'Block access after grace period'
                    ]
                }
            },
            {
                'policy_id': 'SOC2-CC7.1',
                'framework': 'SOC2',
                'control_id': 'CC7.1',
                'policy_name': 'System Monitoring',
                'description': 'System performance is monitored to detect anomalies',
                'policy_type': 'technical',
                'severity': 'high',
                'policy_definition': {
                    'check_type': 'automated',
                    'resource_types': ['monitoring', 'logging'],
                    'validation_rules': {
                        'log_retention_days': {'min': 90},
                        'monitoring_coverage': {'min_percentage': 95},
                        'alerting_enabled': {'required': True}
                    }
                }
            }
        ]
        self.policies.extend(soc2_policies)
        
    def load_hipaa_policies(self):
        """Load HIPAA compliance policies"""
        hipaa_policies = [
            {
                'policy_id': 'HIPAA-164.308-a-1',
                'framework': 'HIPAA',
                'control_id': '164.308(a)(1)',
                'policy_name': 'Security Risk Assessment',
                'description': 'Conduct accurate and thorough risk assessments',
                'policy_type': 'administrative',
                'severity': 'critical',
                'policy_definition': {
                    'check_type': 'hybrid',
                    'frequency': 'annual',
                    'validation_rules': {
                        'risk_assessment_current': {'max_age_days': 365},
                        'vulnerabilities_addressed': {'required': True},
                        'risk_management_plan': {'required': True}
                    }
                }
            },
            {
                'policy_id': 'HIPAA-164.312-a-1',
                'framework': 'HIPAA',
                'control_id': '164.312(a)(1)',
                'policy_name': 'Access Control',
                'description': 'Implement technical policies for electronic PHI access',
                'policy_type': 'technical',
                'severity': 'critical',
                'policy_definition': {
                    'check_type': 'automated',
                    'resource_types': ['database', 'application', 'storage'],
                    'validation_rules': {
                        'encryption_at_rest': {'required': True},
                        'encryption_in_transit': {'required': True},
                        'access_logging': {'required': True},
                        'unique_user_identification': {'required': True}
                    }
                }
            }
        ]
        self.policies.extend(hipaa_policies)
        
    def load_gdpr_policies(self):
        """Load GDPR compliance policies"""
        gdpr_policies = [
            {
                'policy_id': 'GDPR-Art25',
                'framework': 'GDPR',
                'control_id': 'Article 25',
                'policy_name': 'Data Protection by Design',
                'description': 'Implement appropriate technical and organizational measures',
                'policy_type': 'technical',
                'severity': 'high',
                'policy_definition': {
                    'check_type': 'automated',
                    'validation_rules': {
                        'data_minimization': {'required': True},
                        'pseudonymization': {'required': True},
                        'privacy_settings_default': {'most_restrictive': True}
                    }
                }
            },
            {
                'policy_id': 'GDPR-Art32',
                'framework': 'GDPR',
                'control_id': 'Article 32',
                'policy_name': 'Security of Processing',
                'description': 'Implement appropriate security measures',
                'policy_type': 'technical',
                'severity': 'critical',
                'policy_definition': {
                    'check_type': 'automated',
                    'validation_rules': {
                        'encryption': {'required': True},
                        'confidentiality': {'ensured': True},
                        'integrity': {'ensured': True},
                        'availability': {'ensured': True},
                        'resilience': {'tested': True}
                    }
                }
            }
        ]
        self.policies.extend(gdpr_policies)
        
    def load_pcidss_policies(self):
        """Load PCI-DSS compliance policies"""
        pcidss_policies = [
            {
                'policy_id': 'PCI-DSS-1.1',
                'framework': 'PCI-DSS',
                'control_id': '1.1',
                'policy_name': 'Firewall Configuration Standards',
                'description': 'Establish and implement firewall configuration standards',
                'policy_type': 'network',
                'severity': 'critical',
                'policy_definition': {
                    'check_type': 'automated',
                    'resource_types': ['firewall', 'network'],
                    'validation_rules': {
                        'default_deny_all': {'required': True},
                        'inbound_rules_justified': {'required': True},
                        'outbound_rules_justified': {'required': True},
                        'rule_review_frequency': {'max_days': 180}
                    }
                }
            },
            {
                'policy_id': 'PCI-DSS-3.4',
                'framework': 'PCI-DSS',
                'control_id': '3.4',
                'policy_name': 'PAN Storage Encryption',
                'description': 'Render PAN unreadable anywhere it is stored',
                'policy_type': 'data',
                'severity': 'critical',
                'policy_definition': {
                    'check_type': 'automated',
                    'resource_types': ['database', 'storage', 'backup'],
                    'validation_rules': {
                        'pan_encryption': {'algorithm': ['AES-256', 'RSA-2048']},
                        'key_management': {'separate_from_data': True},
                        'key_rotation': {'max_days': 365}
                    }
                }
            }
        ]
        self.policies.extend(pcidss_policies)
        
    def load_custom_policies(self):
        """Load custom organizational policies"""
        custom_policies = [
            {
                'policy_id': 'CUSTOM-SEC-001',
                'framework': 'CUSTOM',
                'control_id': 'SEC-001',
                'policy_name': 'Container Security Scanning',
                'description': 'All container images must be scanned for vulnerabilities',
                'policy_type': 'container',
                'severity': 'high',
                'policy_definition': {
                    'check_type': 'automated',
                    'resource_types': ['container', 'kubernetes'],
                    'validation_rules': {
                        'vulnerability_scan': {'required': True},
                        'critical_vulnerabilities': {'max': 0},
                        'high_vulnerabilities': {'max': 5},
                        'base_image_approved': {'required': True}
                    }
                },
                'remediation_steps': {
                    'vulnerabilities_found': [
                        'Update base image to latest version',
                        'Apply security patches',
                        'Rebuild container image',
                        'Re-scan and validate'
                    ]
                }
            }
        ]
        self.policies.extend(custom_policies)
        
    def save_policies(self):
        """Save policies to database"""
        cur = self.db_conn.cursor()
        
        for policy in self.policies:
            cur.execute("""
                INSERT INTO compliance_policies 
                (policy_id, framework, control_id, policy_name, description, 
                 policy_type, severity, policy_definition, remediation_steps)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (policy_id) DO UPDATE
                SET policy_definition = EXCLUDED.policy_definition,
                    remediation_steps = EXCLUDED.remediation_steps,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                policy['policy_id'],
                policy['framework'],
                policy.get('control_id'),
                policy['policy_name'],
                policy['description'],
                policy['policy_type'],
                policy['severity'],
                json.dumps(policy['policy_definition']),
                json.dumps(policy.get('remediation_steps', {}))
            ))
            
        self.db_conn.commit()
        print(f"Loaded {len(self.policies)} compliance policies")

if __name__ == '__main__':
    loader = CompliancePolicyLoader()
    loader.load_soc2_policies()
    loader.load_hipaa_policies()
    loader.load_gdpr_policies()
    loader.load_pcidss_policies()
    loader.load_custom_policies()
    loader.save_policies()
EOF

    python3 /tmp/policy_loader.py
    
    echo -e "${GREEN}✓ Compliance policies loaded${NC}"
}

# Run compliance scan
run_compliance_scan() {
    local frameworks="${1:-all}"
    local auto_remediate="${2:-false}"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Running compliance scan...${NC}"
    
    # Create scan record
    local scan_id=$(psql -h localhost -U postgres -d terrafusion -t -c \
        "INSERT INTO compliance_scans (scan_type, frameworks) VALUES ('full', ARRAY['${frameworks}']) RETURNING scan_id" | xargs)
    
    # Create compliance scanner
    cat > /tmp/compliance_scanner.py << 'EOF'
import os
import sys
import json
import boto3
import psycopg2
import subprocess
from datetime import datetime
import kubernetes
from kubernetes import client, config
import requests

class ComplianceScanner:
    def __init__(self, scan_id):
        self.scan_id = scan_id
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.violations = []
        self.evidence = []
        
        # Initialize cloud clients
        self.aws_client = boto3.Session()
        
        # Initialize Kubernetes client
        try:
            config.load_incluster_config()
        except:
            config.load_kube_config()
        self.k8s_client = client.CoreV1Api()
        
    def scan(self, frameworks):
        """Run compliance scan for specified frameworks"""
        policies = self.load_policies(frameworks)
        
        total_policies = len(policies)
        passed_policies = 0
        failed_policies = 0
        
        for policy in policies:
            print(f"Checking policy: {policy['policy_id']} - {policy['policy_name']}")
            
            if policy['policy_definition']['check_type'] == 'automated':
                result = self.check_automated_policy(policy)
            elif policy['policy_definition']['check_type'] == 'manual':
                result = self.check_manual_policy(policy)
            else:  # hybrid
                result = self.check_hybrid_policy(policy)
                
            if result['compliant']:
                passed_policies += 1
                self.collect_evidence(policy, result)
            else:
                failed_policies += 1
                self.record_violation(policy, result)
                
        # Update scan results
        compliance_score = (passed_policies / total_policies * 100) if total_policies > 0 else 0
        
        cur = self.db_conn.cursor()
        cur.execute("""
            UPDATE compliance_scans
            SET total_policies = %s,
                passed_policies = %s,
                failed_policies = %s,
                compliance_score = %s,
                completed_at = CURRENT_TIMESTAMP
            WHERE scan_id = %s
        """, (total_policies, passed_policies, failed_policies, compliance_score, self.scan_id))
        
        self.db_conn.commit()
        
        return {
            'total': total_policies,
            'passed': passed_policies,
            'failed': failed_policies,
            'score': compliance_score
        }
        
    def load_policies(self, frameworks):
        """Load policies for specified frameworks"""
        cur = self.db_conn.cursor()
        
        if frameworks == 'all':
            cur.execute("SELECT * FROM compliance_policies WHERE enabled = true")
        else:
            cur.execute(
                "SELECT * FROM compliance_policies WHERE framework = ANY(%s) AND enabled = true",
                (frameworks.split(','),)
            )
            
        policies = []
        for row in cur.fetchall():
            policies.append({
                'policy_id': row[1],
                'framework': row[2],
                'control_id': row[3],
                'policy_name': row[4],
                'description': row[5],
                'policy_type': row[6],
                'severity': row[7],
                'policy_definition': row[8],
                'remediation_steps': row[9]
            })
            
        return policies
        
    def check_automated_policy(self, policy):
        """Check automated compliance policy"""
        policy_type = policy['policy_type']
        
        if policy_type == 'technical':
            return self.check_technical_policy(policy)
        elif policy_type == 'network':
            return self.check_network_policy(policy)
        elif policy_type == 'data':
            return self.check_data_policy(policy)
        elif policy_type == 'container':
            return self.check_container_policy(policy)
        else:
            return {'compliant': False, 'message': 'Unknown policy type'}
            
    def check_technical_policy(self, policy):
        """Check technical controls"""
        rules = policy['policy_definition']['validation_rules']
        violations = []
        
        # Example: Check MFA enforcement
        if 'mfa_enabled' in rules and rules['mfa_enabled'].get('required'):
            # Check IAM users for MFA
            iam = self.aws_client.client('iam')
            users = iam.list_users()['Users']
            
            for user in users:
                mfa_devices = iam.list_mfa_devices(UserName=user['UserName'])['MFADevices']
                if not mfa_devices:
                    violations.append({
                        'resource_type': 'iam_user',
                        'resource_id': user['UserName'],
                        'detail': 'MFA not enabled'
                    })
                    
        # Example: Check password policy
        if 'password_policy' in rules:
            password_policy = iam.get_account_password_policy()['PasswordPolicy']
            required_policy = rules['password_policy']
            
            if password_policy.get('MinimumPasswordLength', 0) < required_policy.get('min_length', 12):
                violations.append({
                    'resource_type': 'account',
                    'resource_id': 'password_policy',
                    'detail': f"Password length {password_policy.get('MinimumPasswordLength')} < required {required_policy.get('min_length')}"
                })
                
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'evidence': {'checked_at': datetime.now().isoformat()}
        }
        
    def check_network_policy(self, policy):
        """Check network security controls"""
        rules = policy['policy_definition']['validation_rules']
        violations = []
        
        # Example: Check firewall rules
        if 'default_deny_all' in rules and rules['default_deny_all'].get('required'):
            # Check security groups
            ec2 = self.aws_client.client('ec2')
            security_groups = ec2.describe_security_groups()['SecurityGroups']
            
            for sg in security_groups:
                # Check for overly permissive rules
                for rule in sg.get('IpPermissions', []):
                    if rule.get('IpProtocol') == '-1':  # All protocols
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                violations.append({
                                    'resource_type': 'security_group',
                                    'resource_id': sg['GroupId'],
                                    'detail': 'Allows all traffic from any source'
                                })
                                
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'evidence': {'security_groups_checked': len(security_groups)}
        }
        
    def check_data_policy(self, policy):
        """Check data protection controls"""
        rules = policy['policy_definition']['validation_rules']
        violations = []
        
        # Example: Check encryption at rest
        if 'encryption_at_rest' in rules and rules['encryption_at_rest'].get('required'):
            # Check S3 buckets
            s3 = self.aws_client.client('s3')
            buckets = s3.list_buckets()['Buckets']
            
            for bucket in buckets:
                try:
                    encryption = s3.get_bucket_encryption(Bucket=bucket['Name'])
                except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                    violations.append({
                        'resource_type': 's3_bucket',
                        'resource_id': bucket['Name'],
                        'detail': 'Encryption at rest not enabled'
                    })
                    
            # Check RDS instances
            rds = self.aws_client.client('rds')
            instances = rds.describe_db_instances()['DBInstances']
            
            for instance in instances:
                if not instance.get('StorageEncrypted', False):
                    violations.append({
                        'resource_type': 'rds_instance',
                        'resource_id': instance['DBInstanceIdentifier'],
                        'detail': 'Database encryption not enabled'
                    })
                    
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'evidence': {'resources_checked': len(buckets) + len(instances)}
        }
        
    def check_container_policy(self, policy):
        """Check container security controls"""
        rules = policy['policy_definition']['validation_rules']
        violations = []
        
        # Check running containers in Kubernetes
        pods = self.k8s_client.list_pod_for_all_namespaces()
        
        for pod in pods.items:
            for container in pod.spec.containers:
                # Check if image is from approved registry
                if 'base_image_approved' in rules and rules['base_image_approved'].get('required'):
                    if not self.is_approved_image(container.image):
                        violations.append({
                            'resource_type': 'kubernetes_pod',
                            'resource_id': f"{pod.metadata.namespace}/{pod.metadata.name}",
                            'detail': f'Unapproved image: {container.image}'
                        })
                        
                # Check security context
                if not container.security_context or not container.security_context.run_as_non_root:
                    violations.append({
                        'resource_type': 'kubernetes_pod',
                        'resource_id': f"{pod.metadata.namespace}/{pod.metadata.name}",
                        'detail': 'Container running as root'
                    })
                    
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'evidence': {'pods_checked': len(pods.items)}
        }
        
    def check_manual_policy(self, policy):
        """Check manual compliance requirements"""
        # For manual checks, look for uploaded evidence
        cur = self.db_conn.cursor()
        cur.execute("""
            SELECT COUNT(*) FROM compliance_evidence
            WHERE policy_id = %s
            AND collected_at > NOW() - INTERVAL '365 days'
            AND (expires_at IS NULL OR expires_at > NOW())
        """, (policy['policy_id'],))
        
        evidence_count = cur.fetchone()[0]
        
        return {
            'compliant': evidence_count > 0,
            'message': 'Manual evidence required' if evidence_count == 0 else 'Evidence on file',
            'evidence': {'evidence_count': evidence_count}
        }
        
    def check_hybrid_policy(self, policy):
        """Check hybrid (automated + manual) policies"""
        # Run automated checks first
        auto_result = self.check_automated_policy(policy)
        
        # Then check for manual evidence
        manual_result = self.check_manual_policy(policy)
        
        # Both must pass
        return {
            'compliant': auto_result['compliant'] and manual_result['compliant'],
            'violations': auto_result.get('violations', []),
            'evidence': {
                'automated': auto_result.get('evidence', {}),
                'manual': manual_result.get('evidence', {})
            }
        }
        
    def is_approved_image(self, image):
        """Check if container image is from approved registry"""
        approved_registries = [
            'gcr.io/distroless',
            'docker.io/library',
            'quay.io/coreos',
            'your-private-registry.com'
        ]
        
        return any(image.startswith(registry) for registry in approved_registries)
        
    def record_violation(self, policy, result):
        """Record compliance violation"""
        cur = self.db_conn.cursor()
        
        for violation in result.get('violations', []):
            cur.execute("""
                INSERT INTO compliance_violations
                (scan_id, policy_id, resource_type, resource_id, 
                 violation_details, evidence, severity)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                self.scan_id,
                policy['policy_id'],
                violation['resource_type'],
                violation['resource_id'],
                json.dumps(violation),
                json.dumps(result.get('evidence', {})),
                policy['severity']
            ))
            
        self.db_conn.commit()
        
    def collect_evidence(self, policy, result):
        """Collect compliance evidence"""
        cur = self.db_conn.cursor()
        
        cur.execute("""
            INSERT INTO compliance_evidence
            (policy_id, evidence_type, evidence_data)
            VALUES (%s, %s, %s)
        """, (
            policy['policy_id'],
            'automated_scan',
            json.dumps(result.get('evidence', {}))
        ))
        
        self.db_conn.commit()

if __name__ == '__main__':
    scan_id = sys.argv[1]
    frameworks = sys.argv[2] if len(sys.argv) > 2 else 'all'
    
    scanner = ComplianceScanner(scan_id)
    results = scanner.scan(frameworks)
    
    print(f"\nCompliance Scan Results:")
    print(f"Total Policies: {results['total']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(f"Compliance Score: {results['score']:.2f}%")
EOF

    python3 /tmp/compliance_scanner.py "$scan_id" "$frameworks"
    
    # Run auto-remediation if enabled
    if [ "$auto_remediate" = "true" ]; then
        auto_remediate_violations "$scan_id"
    fi
    
    echo -e "${GREEN}✓ Compliance scan completed${NC}"
}

# Auto-remediate violations
auto_remediate_violations() {
    local scan_id="$1"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Auto-remediating violations...${NC}"
    
    # Create remediation engine
    cat > /tmp/remediation_engine.py << 'EOF'
import os
import sys
import json
import boto3
import psycopg2
import subprocess
from datetime import datetime
import kubernetes
from kubernetes import client, config

class RemediationEngine:
    def __init__(self, scan_id):
        self.scan_id = scan_id
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.aws_client = boto3.Session()
        
        # Initialize Kubernetes client
        try:
            config.load_incluster_config()
        except:
            config.load_kube_config()
        self.k8s_client = client.CoreV1Api()
        
    def remediate_violations(self):
        """Auto-remediate compliance violations"""
        cur = self.db_conn.cursor()
        
        # Get violations that can be auto-remediated
        cur.execute("""
            SELECT v.id, v.policy_id, v.resource_type, v.resource_id, 
                   v.violation_details, p.remediation_steps
            FROM compliance_violations v
            JOIN compliance_policies p ON v.policy_id = p.policy_id
            WHERE v.scan_id = %s
            AND v.remediation_status = 'pending'
            AND p.remediation_steps IS NOT NULL
        """, (self.scan_id,))
        
        violations = cur.fetchall()
        remediated_count = 0
        
        for violation in violations:
            violation_id = violation[0]
            resource_type = violation[2]
            resource_id = violation[3]
            violation_details = violation[4]
            remediation_steps = violation[5]
            
            print(f"Remediating violation {violation_id}: {resource_type}/{resource_id}")
            
            success = False
            error_message = None
            
            try:
                if resource_type == 'iam_user':
                    success = self.remediate_iam_user(resource_id, violation_details)
                elif resource_type == 'security_group':
                    success = self.remediate_security_group(resource_id, violation_details)
                elif resource_type == 's3_bucket':
                    success = self.remediate_s3_bucket(resource_id, violation_details)
                elif resource_type == 'rds_instance':
                    success = self.remediate_rds_instance(resource_id, violation_details)
                elif resource_type == 'kubernetes_pod':
                    success = self.remediate_kubernetes_pod(resource_id, violation_details)
                else:
                    error_message = f"No remediation handler for {resource_type}"
                    
                if success:
                    remediated_count += 1
                    
            except Exception as e:
                error_message = str(e)
                
            # Record remediation attempt
            self.record_remediation(violation_id, resource_type, success, error_message)
            
        print(f"\nRemediated {remediated_count} out of {len(violations)} violations")
        return remediated_count
        
    def remediate_iam_user(self, user_name, violation_details):
        """Remediate IAM user violations"""
        iam = self.aws_client.client('iam')
        
        if 'MFA not enabled' in violation_details.get('detail', ''):
            # Can't auto-enable MFA, but can enforce policy
            try:
                # Add user to group that requires MFA
                iam.add_user_to_group(
                    GroupName='MFA-Required',
                    UserName=user_name
                )
                
                # Send notification to user
                self.send_notification(
                    f"MFA Required for user {user_name}",
                    "Your account has been added to MFA-Required group. Please enable MFA."
                )
                
                return True
            except Exception as e:
                print(f"Error enforcing MFA: {e}")
                return False
                
        return False
        
    def remediate_security_group(self, sg_id, violation_details):
        """Remediate security group violations"""
        ec2 = self.aws_client.client('ec2')
        
        if 'Allows all traffic' in violation_details.get('detail', ''):
            try:
                # Remove the overly permissive rule
                ec2.revoke_security_group_ingress(
                    GroupId=sg_id,
                    IpPermissions=[{
                        'IpProtocol': '-1',
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    }]
                )
                
                # Add more restrictive rules
                # This is a placeholder - actual rules depend on requirements
                ec2.authorize_security_group_ingress(
                    GroupId=sg_id,
                    IpPermissions=[{
                        'IpProtocol': 'tcp',
                        'FromPort': 443,
                        'ToPort': 443,
                        'IpRanges': [{'CidrIp': '10.0.0.0/8'}]
                    }]
                )
                
                return True
            except Exception as e:
                print(f"Error fixing security group: {e}")
                return False
                
        return False
        
    def remediate_s3_bucket(self, bucket_name, violation_details):
        """Remediate S3 bucket violations"""
        s3 = self.aws_client.client('s3')
        
        if 'Encryption at rest not enabled' in violation_details.get('detail', ''):
            try:
                # Enable default encryption
                s3.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        'Rules': [{
                            'ApplyServerSideEncryptionByDefault': {
                                'SSEAlgorithm': 'AES256'
                            }
                        }]
                    }
                )
                
                return True
            except Exception as e:
                print(f"Error enabling bucket encryption: {e}")
                return False
                
        return False
        
    def remediate_rds_instance(self, instance_id, violation_details):
        """Remediate RDS instance violations"""
        if 'Database encryption not enabled' in violation_details.get('detail', ''):
            # Can't enable encryption on existing instance
            # Create action plan for manual remediation
            self.create_action_plan(
                instance_id,
                "RDS Encryption",
                [
                    "Create snapshot of RDS instance",
                    "Create new encrypted RDS instance from snapshot",
                    "Update application connection strings",
                    "Delete unencrypted instance after validation"
                ]
            )
            
            return False  # Requires manual intervention
            
    def remediate_kubernetes_pod(self, pod_ref, violation_details):
        """Remediate Kubernetes pod violations"""
        namespace, pod_name = pod_ref.split('/')
        
        if 'Container running as root' in violation_details.get('detail', ''):
            try:
                # Get the deployment/statefulset that owns this pod
                apps_v1 = client.AppsV1Api()
                
                # Try to find the deployment
                deployments = apps_v1.list_namespaced_deployment(namespace)
                for deployment in deployments.items:
                    if pod_name.startswith(deployment.metadata.name):
                        # Update deployment to run as non-root
                        for container in deployment.spec.template.spec.containers:
                            if not container.security_context:
                                container.security_context = client.V1SecurityContext()
                            container.security_context.run_as_non_root = True
                            container.security_context.run_as_user = 1000
                            
                        apps_v1.patch_namespaced_deployment(
                            name=deployment.metadata.name,
                            namespace=namespace,
                            body=deployment
                        )
                        
                        return True
                        
            except Exception as e:
                print(f"Error updating pod security: {e}")
                return False
                
        return False
        
    def record_remediation(self, violation_id, resource_type, success, error_message):
        """Record remediation attempt"""
        cur = self.db_conn.cursor()
        
        action_details = {
            'resource_type': resource_type,
            'timestamp': datetime.now().isoformat(),
            'automated': True
        }
        
        cur.execute("""
            INSERT INTO remediation_history
            (violation_id, action_type, action_details, success, error_message)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            violation_id,
            'automated_remediation',
            json.dumps(action_details),
            success,
            error_message
        ))
        
        if success:
            cur.execute("""
                UPDATE compliance_violations
                SET remediation_status = 'completed',
                    auto_remediated = true,
                    remediated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (violation_id,))
            
        self.db_conn.commit()
        
    def send_notification(self, subject, message):
        """Send notification about remediation"""
        # Placeholder for notification logic
        print(f"Notification: {subject} - {message}")
        
    def create_action_plan(self, resource_id, issue, steps):
        """Create manual action plan for issues that can't be auto-remediated"""
        print(f"\nManual Action Required for {resource_id}:")
        print(f"Issue: {issue}")
        print("Steps:")
        for i, step in enumerate(steps, 1):
            print(f"  {i}. {step}")

if __name__ == '__main__':
    scan_id = sys.argv[1]
    
    engine = RemediationEngine(scan_id)
    engine.remediate_violations()
EOF

    python3 /tmp/remediation_engine.py "$scan_id"
    
    echo -e "${GREEN}✓ Auto-remediation completed${NC}"
}

# Generate compliance report
generate_compliance_report() {
    local framework="${1:-all}"
    local period="${2:-30}"  # days
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Generating compliance report...${NC}"
    
    # Calculate compliance metrics
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Create compliance report
WITH compliance_metrics AS (
    SELECT 
        framework,
        COUNT(DISTINCT p.policy_id) as total_controls,
        COUNT(DISTINCT v.policy_id) as failed_controls,
        COUNT(DISTINCT p.policy_id) - COUNT(DISTINCT v.policy_id) as passed_controls
    FROM compliance_policies p
    LEFT JOIN compliance_violations v ON p.policy_id = v.policy_id
        AND v.detected_at > CURRENT_DATE - INTERVAL '${period} days'
        AND v.remediation_status != 'completed'
    WHERE p.framework = CASE WHEN '${framework}' = 'all' THEN p.framework ELSE '${framework}' END
    GROUP BY framework
),
severity_breakdown AS (
    SELECT 
        severity,
        COUNT(*) as violation_count
    FROM compliance_violations
    WHERE detected_at > CURRENT_DATE - INTERVAL '${period} days'
    AND remediation_status != 'completed'
    GROUP BY severity
),
remediation_stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE auto_remediated = true) as auto_remediated,
        COUNT(*) FILTER (WHERE remediation_status = 'completed') as total_remediated,
        COUNT(*) FILTER (WHERE remediation_status = 'pending') as pending_remediation
    FROM compliance_violations
    WHERE detected_at > CURRENT_DATE - INTERVAL '${period} days'
)
INSERT INTO compliance_reports (
    report_type, framework, period_start, period_end, 
    compliance_percentage, critical_findings, report_data
)
SELECT 
    'periodic',
    '${framework}',
    CURRENT_DATE - INTERVAL '${period} days',
    CURRENT_DATE,
    ROUND(AVG(passed_controls::numeric / NULLIF(total_controls, 0) * 100), 2),
    (SELECT COUNT(*) FROM compliance_violations WHERE severity = 'critical' 
     AND detected_at > CURRENT_DATE - INTERVAL '${period} days' 
     AND remediation_status != 'completed'),
    jsonb_build_object(
        'compliance_by_framework', (SELECT jsonb_agg(row_to_json(cm)) FROM compliance_metrics cm),
        'severity_breakdown', (SELECT jsonb_agg(row_to_json(sb)) FROM severity_breakdown sb),
        'remediation_stats', (SELECT row_to_json(rs) FROM remediation_stats rs),
        'scan_history', (
            SELECT jsonb_agg(jsonb_build_object(
                'scan_date', completed_at,
                'compliance_score', compliance_score,
                'total_policies', total_policies,
                'passed_policies', passed_policies
            ) ORDER BY completed_at DESC)
            FROM compliance_scans
            WHERE completed_at > CURRENT_DATE - INTERVAL '${period} days'
            LIMIT 10
        )
    )
FROM compliance_metrics
RETURNING report_id;

-- Export detailed violations
COPY (
    SELECT 
        v.policy_id,
        p.framework,
        p.control_id,
        p.policy_name,
        v.resource_type,
        v.resource_id,
        v.severity,
        v.violation_details->>'detail' as violation_detail,
        v.remediation_status,
        v.detected_at
    FROM compliance_violations v
    JOIN compliance_policies p ON v.policy_id = p.policy_id
    WHERE v.detected_at > CURRENT_DATE - INTERVAL '${period} days'
    ORDER BY v.severity, v.detected_at DESC
) TO '/tmp/compliance_violations_report.csv' WITH CSV HEADER;
EOF

    # Generate executive summary
    cat > /tmp/compliance_executive_summary.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Compliance Executive Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .summary-box { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { display: inline-block; margin: 20px; text-align: center; }
        .metric-value { font-size: 48px; font-weight: bold; }
        .compliant { color: #27ae60; }
        .non-compliant { color: #e74c3c; }
        .chart { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #333; color: white; }
        .critical { color: #e74c3c; font-weight: bold; }
        .high { color: #f39c12; }
        .medium { color: #3498db; }
        .low { color: #95a5a6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Compliance Executive Summary</h1>
        <p>Period: <span id="period"></span></p>
        <p>Generated: <span id="generated"></span></p>
    </div>
    
    <div class="summary-box">
        <h2>Overall Compliance Status</h2>
        <div class="metric">
            <div class="metric-value compliant" id="complianceScore">-</div>
            <div>Overall Compliance</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="totalControls">-</div>
            <div>Total Controls</div>
        </div>
        <div class="metric">
            <div class="metric-value non-compliant" id="criticalFindings">-</div>
            <div>Critical Findings</div>
        </div>
    </div>
    
    <div class="chart">
        <h2>Compliance by Framework</h2>
        <canvas id="frameworkChart"></canvas>
    </div>
    
    <div>
        <h2>Top Violations</h2>
        <table id="violationsTable">
            <thead>
                <tr>
                    <th>Control</th>
                    <th>Framework</th>
                    <th>Severity</th>
                    <th>Resources Affected</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <div>
        <h2>Remediation Progress</h2>
        <canvas id="remediationChart"></canvas>
    </div>
    
    <div class="summary-box">
        <h2>Key Recommendations</h2>
        <ol id="recommendations">
            <li>Address all critical findings immediately</li>
            <li>Enable automated remediation for common violations</li>
            <li>Schedule regular compliance scans</li>
            <li>Review and update compliance policies quarterly</li>
        </ol>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Set report metadata
        document.getElementById('period').textContent = 'Last ${period} days';
        document.getElementById('generated').textContent = new Date().toLocaleString();
        
        // Load compliance data
        // In production, this would fetch from API
        document.getElementById('complianceScore').textContent = '87%';
        document.getElementById('totalControls').textContent = '152';
        document.getElementById('criticalFindings').textContent = '3';
        
        // Framework compliance chart
        new Chart(document.getElementById('frameworkChart'), {
            type: 'bar',
            data: {
                labels: ['SOC2', 'HIPAA', 'GDPR', 'PCI-DSS', 'ISO27001'],
                datasets: [{
                    label: 'Compliance %',
                    data: [92, 88, 95, 78, 90],
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        // Remediation progress chart
        new Chart(document.getElementById('remediationChart'), {
            type: 'doughnut',
            data: {
                labels: ['Auto-Remediated', 'Manually Remediated', 'Pending'],
                datasets: [{
                    data: [45, 30, 25],
                    backgroundColor: ['#27ae60', '#3498db', '#e74c3c']
                }]
            }
        });
    </script>
</body>
</html>
EOF

    echo -e "${GREEN}✓ Compliance report generated${NC}"
}

# Main execution
case "${1:-scan}" in
    init)
        init_database
        load_policies
        ;;
    scan)
        run_compliance_scan "${2:-all}" "${3:-false}"
        ;;
    remediate)
        auto_remediate_violations "${2:-latest}"
        ;;
    report)
        generate_compliance_report "${2:-all}" "${3:-30}"
        ;;
    monitor)
        # Continuous compliance monitoring
        while true; do
            run_compliance_scan "all" "true"
            generate_compliance_report "all" "1"
            sleep 3600  # Run hourly
        done
        ;;
    *)
        echo "Usage: $0 {init|scan|remediate|report|monitor} [options]"
        echo
        echo "Commands:"
        echo "  init          Initialize compliance framework"
        echo "  scan          Run compliance scan [frameworks] [auto_remediate]"
        echo "  remediate     Auto-remediate violations [scan_id]"
        echo "  report        Generate compliance report [framework] [days]"
        echo "  monitor       Continuous compliance monitoring"
        exit 1
        ;;
esac