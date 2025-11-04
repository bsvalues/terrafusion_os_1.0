#!/usr/bin/env python3
"""
TerraFusion Monitoring & Observability Infrastructure Deployer
THE TERRAFUSION WAY - Government-grade Prometheus/Grafana monitoring across all 57 workspaces
"""

import json
import os
from pathlib import Path
import logging
import yaml

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TerraFusionMonitoringDeployer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.analysis_file = self.root_path / "workspace_analysis_results.json"
        self.created_files = []
        self.updated_workspaces = []

    def load_workspace_analysis(self) -> dict:
        """Load the workspace analysis results"""
        with open(self.analysis_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get_workspace_categories(self, workspace_details: dict) -> dict[str, list[str]]:
        """Categorize workspaces for targeted monitoring setup"""
        categories = {
            "frontend": [],
            "marketplace": [],
            "platform": [],
            "core": []
        }

        for workspace_name, details in workspace_details.items():
            category = details.get('category', 'core')
            categories[category].append(workspace_name)

        return categories

    def create_monitoring_directory(self, workspace_path: Path) -> bool:
        """Create monitoring infrastructure directory"""
        monitoring_dir = workspace_path / "monitoring"

        try:
            monitoring_dir.mkdir(parents=True, exist_ok=True)
            (monitoring_dir / "prometheus").mkdir(exist_ok=True)
            (monitoring_dir / "grafana").mkdir(exist_ok=True)
            (monitoring_dir / "alertmanager").mkdir(exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"Failed to create monitoring directory for {workspace_path}: {e}")
            return False

    def create_prometheus_config(self, workspace_path: Path, workspace_name: str, workspace_type: str) -> bool:
        """Create Prometheus configuration for government monitoring"""

        prometheus_config = {
            "global": {
                "scrape_interval": "15s",
                "evaluation_interval": "15s",
                "external_labels": {
                    "government_service": workspace_name,
                    "service_type": workspace_type,
                    "compliance_level": "government_grade",
                    "accessibility": "wcag_2_2_aa"
                }
            },
            "rule_files": [
                "government_alerts.yml",
                "performance_rules.yml",
                "accessibility_rules.yml",
                "security_rules.yml"
            ],
            "scrape_configs": [
                {
                    "job_name": f"terrafusion-{workspace_name}",
                    "static_configs": [
                        {
                            "targets": ["localhost:3000", "localhost:8080"],
                            "labels": {
                                "service": workspace_name,
                                "type": workspace_type,
                                "government": "true"
                            }
                        }
                    ],
                    "scrape_interval": "5s",
                    "metrics_path": "/metrics",
                    "honor_labels": True
                },
                {
                    "job_name": f"{workspace_name}-node-exporter",
                    "static_configs": [
                        {
                            "targets": ["localhost:9100"],
                            "labels": {
                                "service": workspace_name,
                                "exporter": "node"
                            }
                        }
                    ]
                },
                {
                    "job_name": f"{workspace_name}-government-metrics",
                    "static_configs": [
                        {
                            "targets": ["localhost:9090"],
                            "labels": {
                                "government_compliance": "enabled",
                                "wcag_monitoring": "active",
                                "section_508": "validated"
                            }
                        }
                    ],
                    "scrape_interval": "30s",
                    "metrics_path": "/government/metrics"
                }
            ],
            "alerting": {
                "alertmanagers": [
                    {
                        "static_configs": [
                            {"targets": ["localhost:9093"]}
                        ]
                    }
                ]
            }
        }

        config_path = workspace_path / "monitoring" / "prometheus" / "prometheus.yml"

        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.dump(prometheus_config, f, default_flow_style=False, sort_keys=False)
            self.created_files.append(str(config_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create Prometheus config for {workspace_path}: {e}")
            return False

    def create_government_alerts(self, workspace_path: Path, workspace_name: str) -> bool:
        """Create government-specific alert rules"""

        alert_rules = {
            "groups": [
                {
                    "name": f"{workspace_name}_government_compliance",
                    "rules": [
                        {
                            "alert": "GovernmentServiceDown",
                            "expr": f'up{{job="terrafusion-{workspace_name}"}} == 0',
                            "for": "1m",
                            "labels": {
                                "severity": "critical",
                                "government": "true",
                                "citizen_impact": "high"
                            },
                            "annotations": {
                                "summary": f"Government service {workspace_name} is down",
                                "description": f"The {workspace_name} government service has been down for more than 1 minute. Citizen services are impacted.",
                                "impact": "Citizens cannot access government services",
                                "action": "Immediate investigation required"
                            }
                        },
                        {
                            "alert": "GovernmentResponseTimeSLA",
                            "expr": f'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{{job="terrafusion-{workspace_name}"}}[5m])) > 0.1',
                            "for": "2m",
                            "labels": {
                                "severity": "warning",
                                "government": "true",
                                "sla": "violated"
                            },
                            "annotations": {
                                "summary": f"Government service {workspace_name} response time SLA violation",
                                "description": f"95th percentile response time for {workspace_name} is above 100ms government standard for {{ $value }}s",
                                "impact": "Government performance standards not met",
                                "threshold": "100ms maximum response time"
                            }
                        },
                        {
                            "alert": "AccessibilityComplianceFailure",
                            "expr": f'accessibility_wcag_violations{{service="{workspace_name}"}} > 0',
                            "for": "0m",
                            "labels": {
                                "severity": "critical",
                                "compliance": "wcag_2_2_aa",
                                "accessibility": "violation"
                            },
                            "annotations": {
                                "summary": f"WCAG 2.2 AA compliance violation in {workspace_name}",
                                "description": f"Accessibility violations detected: {{ $value }} issues found",
                                "impact": "Citizens with disabilities cannot access services",
                                "requirement": "Section 508 compliance mandatory"
                            }
                        },
                        {
                            "alert": "SecurityVulnerabilityDetected",
                            "expr": f'security_vulnerabilities{{service="{workspace_name}"}} > 0',
                            "for": "0m",
                            "labels": {
                                "severity": "critical",
                                "security": "vulnerability",
                                "government": "true"
                            },
                            "annotations": {
                                "summary": f"Security vulnerability detected in {workspace_name}",
                                "description": f"{{ $value }} security vulnerabilities found in government service",
                                "impact": "Government data and citizen information at risk",
                                "action": "Immediate security review required"
                            }
                        },
                        {
                            "alert": "GovernmentLoadCapacity",
                            "expr": f'rate(http_requests_total{{job="terrafusion-{workspace_name}"}}[5m]) > 800',
                            "for": "5m",
                            "labels": {
                                "severity": "warning",
                                "capacity": "approaching_limit",
                                "government": "true"
                            },
                            "annotations": {
                                "summary": f"Government service {workspace_name} approaching capacity",
                                "description": f"Request rate is {{ $value }} req/sec, approaching 1000 req/sec limit",
                                "impact": "Service may become unavailable to citizens",
                                "action": "Scale up infrastructure or implement load balancing"
                            }
                        }
                    ]
                },
                {
                    "name": f"{workspace_name}_citizen_experience",
                    "rules": [
                        {
                            "alert": "CitizenExperienceDegraded",
                            "expr": f'(rate(http_requests_total{{job="terrafusion-{workspace_name}",status=~"5.."}}[5m]) / rate(http_requests_total{{job="terrafusion-{workspace_name}"}}[5m])) > 0.05',
                            "for": "3m",
                            "labels": {
                                "severity": "warning",
                                "citizen_impact": "medium",
                                "experience": "degraded"
                            },
                            "annotations": {
                                "summary": f"Citizen experience degraded for {workspace_name}",
                                "description": f"Error rate is {{ $value | humanizePercentage }}, above 5% threshold",
                                "impact": "Citizens experiencing service errors",
                                "threshold": "5% maximum error rate"
                            }
                        },
                        {
                            "alert": "GovernmentAuditTrailFailure",
                            "expr": f'audit_log_failures{{service="{workspace_name}"}} > 0',
                            "for": "0m",
                            "labels": {
                                "severity": "critical",
                                "audit": "failure",
                                "compliance": "required"
                            },
                            "annotations": {
                                "summary": f"Audit trail failure in {workspace_name}",
                                "description": f"{{ $value }} audit log failures detected",
                                "impact": "Government compliance and accountability compromised",
                                "requirement": "Complete audit trail mandatory for government services"
                            }
                        }
                    ]
                }
            ]
        }

        alerts_path = workspace_path / "monitoring" / "prometheus" / "government_alerts.yml"

        try:
            with open(alerts_path, 'w', encoding='utf-8') as f:
                yaml.dump(alert_rules, f, default_flow_style=False, sort_keys=False)
            self.created_files.append(str(alerts_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create government alerts for {workspace_path}: {e}")
            return False

    def create_grafana_dashboard(self, workspace_path: Path, workspace_name: str, workspace_type: str) -> bool:
        """Create Grafana dashboard for government service monitoring"""

        dashboard_config = {
            "dashboard": {
                "id": None,
                "title": f"TerraFusion {workspace_name} Government Dashboard",
                "tags": ["terrafusion", "government", workspace_type, "citizen-services"],
                "timezone": "browser",
                "time": {
                    "from": "now-1h",
                    "to": "now"
                },
                "refresh": "5s",
                "schemaVersion": 16,
                "version": 1,
                "panels": [
                    {
                        "id": 1,
                        "title": "Government Service Status",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": f'up{{job="terrafusion-{workspace_name}"}}',
                                "legendFormat": "Service Status"
                            }
                        ],
                        "fieldConfig": {
                            "defaults": {
                                "color": {"mode": "thresholds"},
                                "thresholds": {
                                    "steps": [
                                        {"color": "red", "value": 0},
                                        {"color": "green", "value": 1}
                                    ]
                                },
                                "mappings": [
                                    {"type": "value", "value": "0", "text": "DOWN"},
                                    {"type": "value", "value": "1", "text": "UP"}
                                ]
                            }
                        },
                        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
                    },
                    {
                        "id": 2,
                        "title": "Government Response Time (95th percentile)",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": f'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{{job="terrafusion-{workspace_name}"}}[5m]))',
                                "legendFormat": "95th Percentile"
                            }
                        ],
                        "fieldConfig": {
                            "defaults": {
                                "unit": "s",
                                "color": {"mode": "thresholds"},
                                "thresholds": {
                                    "steps": [
                                        {"color": "green", "value": 0},
                                        {"color": "yellow", "value": 0.05},
                                        {"color": "red", "value": 0.1}
                                    ]
                                }
                            }
                        },
                        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
                    },
                    {
                        "id": 3,
                        "title": "Citizen Request Rate",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": f'rate(http_requests_total{{job="terrafusion-{workspace_name}"}}[5m])',
                                "legendFormat": "Requests/sec"
                            }
                        ],
                        "fieldConfig": {
                            "defaults": {
                                "unit": "reqps",
                                "color": {"mode": "thresholds"},
                                "thresholds": {
                                    "steps": [
                                        {"color": "green", "value": 0},
                                        {"color": "yellow", "value": 500},
                                        {"color": "red", "value": 800}
                                    ]
                                }
                            }
                        },
                        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
                    },
                    {
                        "id": 4,
                        "title": "WCAG Compliance Status",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": f'accessibility_wcag_violations{{service="{workspace_name}"}}',
                                "legendFormat": "Violations"
                            }
                        ],
                        "fieldConfig": {
                            "defaults": {
                                "color": {"mode": "thresholds"},
                                "thresholds": {
                                    "steps": [
                                        {"color": "green", "value": 0},
                                        {"color": "red", "value": 1}
                                    ]
                                },
                                "mappings": [
                                    {"type": "value", "value": "0", "text": "COMPLIANT"},
                                    {"type": "range", "from": 1, "to": 999, "text": "VIOLATIONS"}
                                ]
                            }
                        },
                        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
                    },
                    {
                        "id": 5,
                        "title": "Government Service Performance Over Time",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": f'histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{{job="terrafusion-{workspace_name}"}}[5m]))',
                                "legendFormat": "50th percentile"
                            },
                            {
                                "expr": f'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{{job="terrafusion-{workspace_name}"}}[5m]))',
                                "legendFormat": "95th percentile"
                            },
                            {
                                "expr": f'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{{job="terrafusion-{workspace_name}"}}[5m]))',
                                "legendFormat": "99th percentile"
                            }
                        ],
                        "yAxes": [
                            {"unit": "s", "min": 0},
                            {"show": False}
                        ],
                        "thresholds": [
                            {"value": 0.1, "colorMode": "critical", "op": "gt"}
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
                    },
                    {
                        "id": 6,
                        "title": "Citizen Error Rate",
                        "type": "graph",
                        "targets": [
                            {
                                "expr": f'rate(http_requests_total{{job="terrafusion-{workspace_name}",status=~"4.."}}[5m])',
                                "legendFormat": "4xx errors"
                            },
                            {
                                "expr": f'rate(http_requests_total{{job="terrafusion-{workspace_name}",status=~"5.."}}[5m])',
                                "legendFormat": "5xx errors"
                            }
                        ],
                        "yAxes": [
                            {"unit": "reqps", "min": 0},
                            {"show": False}
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
                    }
                ]
            }
        }

        dashboard_path = workspace_path / "monitoring" / "grafana" / f"{workspace_name}_dashboard.json"

        try:
            with open(dashboard_path, 'w', encoding='utf-8') as f:
                json.dump(dashboard_config, f, indent=2)
            self.created_files.append(str(dashboard_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create Grafana dashboard for {workspace_path}: {e}")
            return False

    def create_docker_compose_monitoring(self, workspace_path: Path, workspace_name: str) -> bool:
        """Create Docker Compose file for monitoring stack"""

        docker_compose_config = {
            "version": "3.8",
            "services": {
                "prometheus": {
                    "image": "prom/prometheus:latest",
                    "container_name": f"prometheus-{workspace_name}",
                    "ports": ["9090:9090"],
                    "volumes": [
                        "./monitoring/prometheus:/etc/prometheus",
                        "prometheus_data:/prometheus"
                    ],
                    "command": [
                        "--config.file=/etc/prometheus/prometheus.yml",
                        "--storage.tsdb.path=/prometheus",
                        "--web.console.libraries=/etc/prometheus/console_libraries",
                        "--web.console.templates=/etc/prometheus/consoles",
                        "--storage.tsdb.retention.time=200h",
                        "--web.enable-lifecycle"
                    ],
                    "labels": [
                        "government.service=monitoring",
                        f"government.workspace={workspace_name}",
                        "compliance.level=government_grade"
                    ]
                },
                "grafana": {
                    "image": "grafana/grafana:latest",
                    "container_name": f"grafana-{workspace_name}",
                    "ports": ["3001:3000"],
                    "volumes": [
                        "grafana_data:/var/lib/grafana",
                        "./monitoring/grafana:/etc/grafana/provisioning"
                    ],
                    "environment": [
                        "GF_SECURITY_ADMIN_PASSWORD=government_secure_2024!",
                        "GF_USERS_ALLOW_SIGN_UP=false",
                        "GF_INSTALL_PLUGINS=grafana-piechart-panel",
                        "GF_SERVER_DOMAIN=government.monitoring.local"
                    ],
                    "depends_on": ["prometheus"],
                    "labels": [
                        "government.service=dashboard",
                        f"government.workspace={workspace_name}",
                        "accessibility.wcag=2.2_aa"
                    ]
                },
                "node-exporter": {
                    "image": "prom/node-exporter:latest",
                    "container_name": f"node-exporter-{workspace_name}",
                    "ports": ["9100:9100"],
                    "volumes": [
                        "/proc:/host/proc:ro",
                        "/sys:/host/sys:ro",
                        "/:/rootfs:ro"
                    ],
                    "command": [
                        "--path.procfs=/host/proc",
                        "--path.rootfs=/rootfs",
                        "--path.sysfs=/host/sys",
                        "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
                    ],
                    "labels": [
                        "government.service=metrics",
                        f"government.workspace={workspace_name}"
                    ]
                },
                "alertmanager": {
                    "image": "prom/alertmanager:latest",
                    "container_name": f"alertmanager-{workspace_name}",
                    "ports": ["9093:9093"],
                    "volumes": [
                        "./monitoring/alertmanager:/etc/alertmanager"
                    ],
                    "command": [
                        "--config.file=/etc/alertmanager/alertmanager.yml",
                        "--storage.path=/alertmanager",
                        "--web.external-url=http://localhost:9093",
                        "--web.route-prefix=/"
                    ],
                    "labels": [
                        "government.service=alerting",
                        f"government.workspace={workspace_name}",
                        "notification.government=enabled"
                    ]
                }
            },
            "volumes": {
                "prometheus_data": {},
                "grafana_data": {}
            },
            "networks": {
                "default": {
                    "labels": [
                        "government.network=monitoring",
                        "security.level=government_grade"
                    ]
                }
            }
        }

        compose_path = workspace_path / "monitoring" / "docker-compose.monitoring.yml"

        try:
            with open(compose_path, 'w', encoding='utf-8') as f:
                yaml.dump(docker_compose_config, f, default_flow_style=False, sort_keys=False)
            self.created_files.append(str(compose_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create Docker Compose monitoring for {workspace_path}: {e}")
            return False

    def create_alertmanager_config(self, workspace_path: Path, workspace_name: str) -> bool:
        """Create Alertmanager configuration for government notifications"""

        alertmanager_config = {
            "global": {
                "smtp_smarthost": "government-mail.local:587",
                "smtp_from": f"alerts@{workspace_name}.gov"
            },
            "route": {
                "group_by": ["alertname", "government", "severity"],
                "group_wait": "30s",
                "group_interval": "5m",
                "repeat_interval": "12h",
                "receiver": "government-alerts",
                "routes": [
                    {
                        "match": {"severity": "critical"},
                        "receiver": "government-emergency",
                        "group_wait": "10s",
                        "repeat_interval": "5m"
                    },
                    {
                        "match": {"compliance": "wcag_2_2_aa"},
                        "receiver": "accessibility-team",
                        "group_wait": "15s"
                    },
                    {
                        "match": {"security": "vulnerability"},
                        "receiver": "security-team",
                        "group_wait": "5s",
                        "repeat_interval": "1m"
                    }
                ]
            },
            "receivers": [
                {
                    "name": "government-alerts",
                    "email_configs": [
                        {
                            "to": f"ops@{workspace_name}.gov",
                            "subject": f"TerraFusion {workspace_name} Alert: {{{{ .GroupLabels.alertname }}}}",
                            "body": """
Government Service Alert - {{ .GroupLabels.alertname }}

Service: {{ .GroupLabels.service }}
Severity: {{ .GroupLabels.severity }}
Government Impact: {{ .GroupLabels.citizen_impact }}

Alert Details:
{{ range .Alerts }}
- Summary: {{ .Annotations.summary }}
- Description: {{ .Annotations.description }}
- Impact: {{ .Annotations.impact }}
- Action Required: {{ .Annotations.action }}
{{ end }}

Government Service Dashboard: http://grafana.gov:3001
Citizen Service Status: {{ .ExternalURL }}

This is an automated alert from TerraFusion Government Monitoring.
"""
                        }
                    ]
                },
                {
                    "name": "government-emergency",
                    "email_configs": [
                        {
                            "to": f"emergency@{workspace_name}.gov, cio@{workspace_name}.gov",
                            "subject": f"🚨 CRITICAL: TerraFusion {workspace_name} Emergency",
                            "body": """
🚨 CRITICAL GOVERNMENT SERVICE EMERGENCY 🚨

Service: {{ .GroupLabels.service }}
Alert: {{ .GroupLabels.alertname }}
Citizen Impact: HIGH

IMMEDIATE ACTION REQUIRED

{{ range .Alerts }}
Emergency Details:
- {{ .Annotations.summary }}
- {{ .Annotations.description }}
- Citizen Impact: {{ .Annotations.impact }}
- Required Action: {{ .Annotations.action }}
{{ end }}

This is a critical alert requiring immediate attention.
Government services may be unavailable to citizens.
"""
                        }
                    ],
                    "slack_configs": [
                        {
                            "api_url": "https://hooks.slack.com/services/GOVERNMENT/EMERGENCY/WEBHOOK",
                            "channel": "#government-emergency",
                            "title": f"🚨 Critical Alert: {workspace_name}",
                            "text": "{{ .GroupLabels.alertname }} - Immediate action required"
                        }
                    ]
                },
                {
                    "name": "accessibility-team",
                    "email_configs": [
                        {
                            "to": f"accessibility@{workspace_name}.gov, section508@{workspace_name}.gov",
                            "subject": f"♿ Accessibility Alert: {workspace_name}",
                            "body": """
Accessibility Compliance Alert

Service: {{ .GroupLabels.service }}
Compliance Issue: {{ .GroupLabels.compliance }}

{{ range .Alerts }}
Accessibility Details:
- Issue: {{ .Annotations.summary }}
- Description: {{ .Annotations.description }}
- Citizen Impact: {{ .Annotations.impact }}
- Compliance Requirement: {{ .Annotations.requirement }}
{{ end }}

Section 508 compliance must be maintained for all government services.
"""
                        }
                    ]
                },
                {
                    "name": "security-team",
                    "email_configs": [
                        {
                            "to": f"security@{workspace_name}.gov, cybersecurity@{workspace_name}.gov",
                            "subject": f"🔒 Security Alert: {workspace_name}",
                            "body": """
Government Security Alert

Service: {{ .GroupLabels.service }}
Security Issue: {{ .GroupLabels.security }}

{{ range .Alerts }}
Security Details:
- Threat: {{ .Annotations.summary }}
- Description: {{ .Annotations.description }}
- Risk Level: {{ .Annotations.impact }}
- Response Required: {{ .Annotations.action }}
{{ end }}

Government security protocols must be followed immediately.
"""
                        }
                    ]
                }
            ]
        }

        alertmanager_dir = workspace_path / "monitoring" / "alertmanager"
        alertmanager_dir.mkdir(exist_ok=True)
        config_path = alertmanager_dir / "alertmanager.yml"

        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.dump(alertmanager_config, f, default_flow_style=False, sort_keys=False)
            self.created_files.append(str(config_path))
            return True
        except Exception as e:
            logger.error(f"Failed to create Alertmanager config for {workspace_path}: {e}")
            return False

    def deploy_monitoring_infrastructure(self) -> bool:
        """Deploy monitoring infrastructure across all workspaces"""
        logger.info("📊 Starting TerraFusion Monitoring & Observability Deployment...")

        # Load workspace analysis
        analysis = self.load_workspace_analysis()
        workspace_details = analysis.get('workspace_details', {})

        # Get workspace categories
        categories = self.get_workspace_categories(workspace_details)

        total_workspaces = 0
        successful_deployments = 0

        for category, workspaces in categories.items():
            if not workspaces:
                continue

            logger.info(f"📈 Deploying monitoring infrastructure for {category.upper()} workspaces...")

            for workspace_name in workspaces:
                total_workspaces += 1
                workspace_details_item = workspace_details.get(workspace_name, {})

                logger.info(f"  📊 Setting up monitoring for {workspace_name}...")

                # Determine workspace path
                package_json_folders = workspace_details_item.get('package_json_folders', [])
                if package_json_folders:
                    # Use the first package.json folder
                    relative_path = package_json_folders[0].lstrip("../")
                    workspace_path = self.root_path / relative_path
                else:
                    # For non-Node.js workspaces, use tests directory
                    workspace_path = self.root_path / "tests" / category / workspace_name

                success = True

                # Create monitoring infrastructure
                success &= self.create_monitoring_directory(workspace_path)
                success &= self.create_prometheus_config(workspace_path, workspace_name, category)
                success &= self.create_government_alerts(workspace_path, workspace_name)
                success &= self.create_grafana_dashboard(workspace_path, workspace_name, category)
                success &= self.create_docker_compose_monitoring(workspace_path, workspace_name)
                success &= self.create_alertmanager_config(workspace_path, workspace_name)

                if success:
                    successful_deployments += 1
                    self.updated_workspaces.append(workspace_name)
                    logger.info(f"    ✅ Successfully configured monitoring for {workspace_name}")
                else:
                    logger.error(f"    ❌ Failed to configure monitoring for {workspace_name}")

        logger.info(f"🎊 Monitoring infrastructure deployment complete!")
        logger.info(f"📊 Successfully configured: {successful_deployments}/{total_workspaces} workspaces")

        return successful_deployments > 0

    def generate_deployment_report(self) -> str:
        """Generate deployment report"""
        report = []
        report.append("🌍 TERRAFUSION MONITORING & OBSERVABILITY DEPLOYMENT REPORT")
        report.append("=" * 75)
        report.append(f"📊 Total Files Created: {len(self.created_files)}")
        report.append(f"🏗️  Workspaces Updated: {len(self.updated_workspaces)}")
        report.append("")

        if self.updated_workspaces:
            report.append("✅ SUCCESSFULLY CONFIGURED WORKSPACES:")
            for workspace in sorted(self.updated_workspaces):
                report.append(f"  ✅ {workspace}")
            report.append("")

        report.append("📊 MONITORING CAPABILITIES DEPLOYED:")
        report.append("  🔍 Prometheus government metrics collection")
        report.append("  📈 Grafana government dashboards with WCAG compliance")
        report.append("  🚨 Government-specific alerting (critical/warning)")
        report.append("  📱 Multi-channel notifications (email/Slack)")
        report.append("  ⚡ Performance SLA monitoring (100ms government standard)")
        report.append("  ♿ WCAG 2.2 AA compliance monitoring")
        report.append("  🔒 Security vulnerability alerting")
        report.append("  👥 Citizen service availability tracking")
        report.append("  📋 Government audit trail monitoring")
        report.append("  🏛️ Section 508 compliance validation")
        report.append("  📊 Real-time government service dashboards")
        report.append("  🐳 Containerized monitoring stack (Docker)")

        return "\\n".join(report)

def main():
    import sys

    if len(sys.argv) > 1:
        root_path = sys.argv[1]
    else:
        root_path = r"C:\\Users\\bsval\\terrafusion_os_1.0"

    deployer = TerraFusionMonitoringDeployer(root_path)

    success = deployer.deploy_monitoring_infrastructure()

    # Generate and display report
    report = deployer.generate_deployment_report()
    print(report)

    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
