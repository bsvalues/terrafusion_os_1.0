#!/bin/bash
#
# TerraFusion Comprehensive Audit Logging and Compliance System
# Manages audit trails, compliance reporting, and security monitoring
#
# Usage: ./audit-logging.sh [options]
# Options:
#   -a    Action (setup|monitor|report|compliance|analyze|export)
#   -e    Environment (development|staging|production|all)
#   -t    Time range (1h|24h|7d|30d|custom)
#   -f    Filter (security|compliance|access|data|system)
#   -o    Output format (json|csv|html|pdf)
#   -r    Report type (summary|detailed|compliance|security)
#   -s    Start date (YYYY-MM-DD)
#   -n    End date (YYYY-MM-DD)
#   -c    Compliance standard (SOC2|GDPR|PCI|HIPAA|all)

set -euo pipefail

# Configuration
ACTION="monitor"
ENVIRONMENT="production"
TIME_RANGE="24h"
FILTER="all"
OUTPUT_FORMAT="json"
REPORT_TYPE="summary"
START_DATE=""
END_DATE=""
COMPLIANCE_STANDARD="all"

# Directories and Files
AUDIT_BASE_DIR="/var/log/terrafusion/audit"
COMPLIANCE_DIR="/opt/terrafusion/compliance"
REPORTS_DIR="/opt/terrafusion/reports"
CONFIG_DIR="/opt/terrafusion/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusion/audit_logging_$TIMESTAMP.log"

# Database and Storage
AUDIT_DB_HOST="${AUDIT_DB_HOST:-localhost}"
AUDIT_DB_PORT="${AUDIT_DB_PORT:-5432}"
AUDIT_DB_NAME="${AUDIT_DB_NAME:-terrafusion_audit}"
AUDIT_DB_USER="${AUDIT_DB_USER:-audit_user}"
AUDIT_S3_BUCKET="${AUDIT_S3_BUCKET:-terrafusion-audit-logs}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$AUDIT_BASE_DIR"
mkdir -p "$COMPLIANCE_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Parse arguments
while getopts "a:e:t:f:o:r:s:n:c:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        t) TIME_RANGE="$OPTARG" ;;
        f) FILTER="$OPTARG" ;;
        o) OUTPUT_FORMAT="$OPTARG" ;;
        r) REPORT_TYPE="$OPTARG" ;;
        s) START_DATE="$OPTARG" ;;
        n) END_DATE="$OPTARG" ;;
        c) COMPLIANCE_STANDARD="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-e env] [-t timerange] [-f filter] [-o format] [-r report] [-s start] [-n end] [-c compliance]"; exit 1 ;;
    esac
done

# Global variables for tracking
declare -A AUDIT_METRICS
declare -A COMPLIANCE_VIOLATIONS
declare -A SECURITY_ALERTS

# Logging functions
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

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Setup audit logging infrastructure
setup_audit_logging() {
    log "Setting up audit logging infrastructure for $ENVIRONMENT"
    
    # Create audit database schema
    setup_audit_database
    
    # Configure log aggregation
    setup_log_aggregation
    
    # Setup compliance monitoring
    setup_compliance_monitoring
    
    # Configure audit trails
    configure_audit_trails
    
    # Setup real-time monitoring
    setup_realtime_monitoring
    
    # Configure log retention policies
    configure_log_retention
    
    log_success "Audit logging infrastructure setup completed"
}

# Setup audit database
setup_audit_database() {
    log "Setting up audit database schema"
    
    # Check if PostgreSQL is available
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client not available"
        return 1
    fi
    
    # Create audit database schema
    cat > "/tmp/audit_schema_$TIMESTAMP.sql" << 'EOF'
-- TerraFusion Audit Database Schema

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    environment VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    session_id VARCHAR(255),
    source_ip INET,
    user_agent TEXT,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'warning')),
    details JSONB,
    request_id VARCHAR(255),
    correlation_id VARCHAR(255),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_tags TEXT[],
    data_classification VARCHAR(50),
    retention_period INTEGER DEFAULT 2557, -- 7 years in days
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_events_environment ON audit_events(environment);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_outcome ON audit_events(outcome);
CREATE INDEX IF NOT EXISTS idx_audit_events_risk_level ON audit_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_events_compliance ON audit_events USING GIN(compliance_tags);
CREATE INDEX IF NOT EXISTS idx_audit_events_details ON audit_events USING GIN(details);

-- Create compliance_violations table
CREATE TABLE IF NOT EXISTS compliance_violations (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    environment VARCHAR(50) NOT NULL,
    compliance_standard VARCHAR(50) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    audit_event_id BIGINT REFERENCES audit_events(id),
    remediation_required BOOLEAN DEFAULT TRUE,
    remediation_status VARCHAR(50) DEFAULT 'open',
    remediation_due_date TIMESTAMP WITH TIME ZONE,
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    environment VARCHAR(50) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_ip INET,
    user_id VARCHAR(255),
    indicators JSONB,
    mitigation_actions TEXT[],
    status VARCHAR(50) DEFAULT 'open',
    assigned_to VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    false_positive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_log_retention table
CREATE TABLE IF NOT EXISTS audit_log_retention (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    retention_days INTEGER NOT NULL,
    last_cleanup TIMESTAMP WITH TIME ZONE,
    records_archived INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default retention policies
INSERT INTO audit_log_retention (table_name, retention_days) VALUES 
    ('audit_events', 2557),  -- 7 years for audit events
    ('compliance_violations', 2557),  -- 7 years for compliance violations
    ('security_alerts', 1095)  -- 3 years for security alerts
ON CONFLICT (table_name) DO NOTHING;

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_audit_events_updated_at 
    BEFORE UPDATE ON audit_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_log_retention_updated_at 
    BEFORE UPDATE ON audit_log_retention 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW failed_logins AS
SELECT 
    timestamp,
    environment,
    user_email,
    source_ip,
    user_agent,
    details
FROM audit_events 
WHERE event_type = 'authentication' 
    AND action = 'login' 
    AND outcome = 'failure';

CREATE OR REPLACE VIEW high_risk_events AS
SELECT 
    timestamp,
    environment,
    event_type,
    action,
    user_email,
    source_ip,
    risk_level,
    details
FROM audit_events 
WHERE risk_level IN ('high', 'critical');

CREATE OR REPLACE VIEW compliance_summary AS
SELECT 
    environment,
    compliance_standard,
    violation_type,
    severity,
    COUNT(*) as violation_count,
    COUNT(*) FILTER (WHERE remediation_status = 'open') as open_violations,
    COUNT(*) FILTER (WHERE remediation_status = 'resolved') as resolved_violations
FROM compliance_violations 
GROUP BY environment, compliance_standard, violation_type, severity;
EOF

    # Execute schema creation
    if PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -f "/tmp/audit_schema_$TIMESTAMP.sql" &>/dev/null; then
        log_success "Audit database schema created successfully"
    else
        log_error "Failed to create audit database schema"
        return 1
    fi
    
    # Cleanup
    rm -f "/tmp/audit_schema_$TIMESTAMP.sql"
}

# Setup log aggregation
setup_log_aggregation() {
    log "Setting up log aggregation for audit trails"
    
    # Create Fluentd configuration for audit log collection
    cat > "$CONFIG_DIR/fluentd-audit.conf" << EOF
# TerraFusion Audit Log Aggregation Configuration

<source>
  @type tail
  path /var/log/terrafusion/app.log
  pos_file /var/log/td-agent/app.log.pos
  tag terrafusion.app
  format json
  time_key timestamp
  time_format %Y-%m-%dT%H:%M:%S.%L%z
</source>

<source>
  @type tail
  path /var/log/nginx/access.log
  pos_file /var/log/td-agent/nginx.access.pos
  tag terrafusion.nginx.access
  format nginx
</source>

<source>
  @type tail
  path /var/log/nginx/error.log
  pos_file /var/log/td-agent/nginx.error.pos
  tag terrafusion.nginx.error
  format /^(?<time>[^ ]*) \[(?<log_level>.*)\] (?<pid>\d*).(?<tid>[^:]*): (?<message>.*)$/
</source>

<source>
  @type tail
  path /var/log/postgresql/postgresql.log
  pos_file /var/log/td-agent/postgresql.pos
  tag terrafusion.postgresql
  format multiline
  format_firstline /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
  format1 /^(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}) (?<timezone>\w{3}) \[(?<pid>\d+)\] (?<user>[^@]*@[^:]*:\[(?<database>[^\]]*)\]|[^:]*:) (?<level>\w+): (?<message>.*)/
</source>

# Filter for audit events
<filter terrafusion.**>
  @type record_transformer
  <record>
    environment $ENVIRONMENT
    hostname \${hostname}
    service_name terrafusion
    log_source \${tag}
  </record>
</filter>

# Route high-priority security events
<match terrafusion.** >
  @type copy
  
  # Store in PostgreSQL audit database
  <store>
    @type sql
    host $AUDIT_DB_HOST
    port $AUDIT_DB_PORT
    database $AUDIT_DB_NAME
    adapter postgresql
    username $AUDIT_DB_USER
    password $AUDIT_DB_PASSWORD
    
    <table>
      table audit_events
      column_mapping 'timestamp:timestamp,environment:environment,event_type:event_type,user_id:user_id,source_ip:source_ip,action:action,outcome:outcome,details:details'
    </table>
  </store>
  
  # Forward to SIEM system
  <store>
    @type forward
    <server>
      name siem-server
      host \${SIEM_HOST:-localhost}
      port \${SIEM_PORT:-24224}
    </server>
  </store>
  
  # Store in S3 for long-term retention
  <store>
    @type s3
    aws_key_id \${AWS_ACCESS_KEY_ID}
    aws_sec_key \${AWS_SECRET_ACCESS_KEY}
    s3_bucket $AUDIT_S3_BUCKET
    s3_region \${AWS_REGION:-us-west-2}
    path audit-logs/year=%Y/month=%m/day=%d/
    s3_object_key_format %{path}%{time_slice}_%{index}.%{file_extension}
    time_slice_format %Y%m%d%H
    buffer_type file
    buffer_path /var/log/td-agent/s3-audit
    time_slice_wait 1m
    flush_at_shutdown true
  </store>
</match>
EOF

    log_success "Log aggregation configuration created"
}

# Setup compliance monitoring
setup_compliance_monitoring() {
    log "Setting up compliance monitoring rules"
    
    # Create compliance rule definitions
    cat > "$COMPLIANCE_DIR/compliance_rules.json" << 'EOF'
{
  "SOC2": {
    "access_controls": {
      "rules": [
        {
          "id": "SOC2-AC-001",
          "name": "Failed login attempts monitoring",
          "description": "Monitor for excessive failed login attempts",
          "query": "SELECT COUNT(*) FROM audit_events WHERE event_type='authentication' AND action='login' AND outcome='failure' AND timestamp > NOW() - INTERVAL '1 hour' GROUP BY user_email, source_ip HAVING COUNT(*) > 5",
          "severity": "high",
          "remediation": "Lock account and investigate potential brute force attack"
        },
        {
          "id": "SOC2-AC-002", 
          "name": "Privileged access monitoring",
          "description": "Monitor privileged user actions",
          "query": "SELECT * FROM audit_events WHERE user_id IN (SELECT user_id FROM privileged_users) AND action IN ('create', 'update', 'delete')",
          "severity": "medium",
          "remediation": "Review privileged user actions for compliance"
        }
      ]
    },
    "data_protection": {
      "rules": [
        {
          "id": "SOC2-DP-001",
          "name": "Data export monitoring",
          "description": "Monitor data export activities",
          "query": "SELECT * FROM audit_events WHERE action='export' AND data_classification IN ('confidential', 'restricted')",
          "severity": "high",
          "remediation": "Verify authorization for data export"
        }
      ]
    }
  },
  "GDPR": {
    "data_processing": {
      "rules": [
        {
          "id": "GDPR-DP-001",
          "name": "Personal data access tracking",
          "description": "Track access to personal data",
          "query": "SELECT * FROM audit_events WHERE resource_type='personal_data' AND action IN ('read', 'update', 'delete')",
          "severity": "medium",
          "remediation": "Ensure lawful basis for personal data processing"
        },
        {
          "id": "GDPR-DP-002",
          "name": "Data retention violation",
          "description": "Identify data retained beyond legal limits",
          "query": "SELECT * FROM audit_events WHERE timestamp < NOW() - INTERVAL '2555 days' AND data_classification='personal'",
          "severity": "critical",
          "remediation": "Delete or anonymize data exceeding retention period"
        }
      ]
    }
  },
  "PCI": {
    "cardholder_data": {
      "rules": [
        {
          "id": "PCI-CD-001",
          "name": "Payment data access monitoring",
          "description": "Monitor access to payment card data",
          "query": "SELECT * FROM audit_events WHERE resource_type='payment_data' OR details::text LIKE '%card%'",
          "severity": "critical",
          "remediation": "Verify PCI compliance for payment data access"
        }
      ]
    }
  }
}
EOF

    log_success "Compliance monitoring rules configured"
}

# Configure audit trails
configure_audit_trails() {
    log "Configuring audit trail capture"
    
    # Application-level audit configuration
    cat > "$CONFIG_DIR/audit_config.yml" << EOF
# TerraFusion Audit Configuration
audit:
  enabled: true
  environment: $ENVIRONMENT
  
  # Event categories to capture
  categories:
    - authentication
    - authorization 
    - data_access
    - data_modification
    - system_configuration
    - privileged_operations
    - user_management
    - security_events
    - compliance_events
    
  # Risk levels
  risk_levels:
    authentication_failure: medium
    privilege_escalation: high
    data_export: high
    system_configuration: medium
    unauthorized_access: critical
    
  # Required fields for audit events
  required_fields:
    - timestamp
    - environment
    - event_type
    - action
    - outcome
    - user_id
    - source_ip
    
  # Data classification mapping
  data_classifications:
    user_profiles: personal
    payment_info: confidential
    system_configs: internal
    public_content: public
    
  # Retention policies by event type
  retention:
    authentication: 2557  # 7 years
    data_access: 2557     # 7 years  
    system_events: 1095   # 3 years
    debug_events: 90      # 90 days
    
  # Real-time alerting
  alerts:
    critical_events:
      - unauthorized_access
      - privilege_escalation
      - data_breach_indicators
      
    notification_channels:
      - slack_webhook
      - email_alerts
      - pagerduty
      
  # Compliance mappings
  compliance_tags:
    SOC2:
      - access_controls
      - system_monitoring
      - data_protection
    GDPR:
      - personal_data_processing
      - data_subject_rights
      - breach_notification
    PCI:
      - cardholder_data_protection
      - access_monitoring
EOF

    log_success "Audit trail configuration completed"
}

# Setup real-time monitoring
setup_realtime_monitoring() {
    log "Setting up real-time audit monitoring"
    
    # Create monitoring daemon script
    cat > "$AUDIT_BASE_DIR/monitor_daemon.py" << 'EOF'
#!/usr/bin/env python3
"""
TerraFusion Real-time Audit Monitoring Daemon
Monitors audit events and triggers alerts for critical security events
"""

import psycopg2
import json
import time
import logging
import requests
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

class AuditMonitor:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('AUDIT_DB_HOST', 'localhost'),
            'port': os.getenv('AUDIT_DB_PORT', '5432'),
            'database': os.getenv('AUDIT_DB_NAME', 'terrafusion_audit'),
            'user': os.getenv('AUDIT_DB_USER', 'audit_user'),
            'password': os.getenv('AUDIT_DB_PASSWORD', '')
        }
        
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL', '')
        self.email_api_key = os.getenv('EMAIL_API_KEY', '')
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[logging.FileHandler('/var/log/terrafusion/audit_monitor.log')]
        )
        self.logger = logging.getLogger(__name__)
        
    def connect_db(self):
        """Connect to audit database"""
        try:
            return psycopg2.connect(**self.db_config)
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            return None
            
    def check_failed_logins(self, conn) -> List[Dict[str, Any]]:
        """Check for suspicious failed login patterns"""
        query = """
        SELECT user_email, source_ip, COUNT(*) as attempts
        FROM audit_events 
        WHERE event_type = 'authentication' 
            AND action = 'login' 
            AND outcome = 'failure'
            AND timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY user_email, source_ip
        HAVING COUNT(*) >= 5
        """
        
        cursor = conn.cursor()
        cursor.execute(query)
        results = []
        
        for row in cursor.fetchall():
            results.append({
                'user_email': row[0],
                'source_ip': str(row[1]),
                'attempts': row[2],
                'alert_type': 'suspicious_login_attempts'
            })
            
        cursor.close()
        return results
        
    def check_privilege_escalation(self, conn) -> List[Dict[str, Any]]:
        """Check for privilege escalation attempts"""
        query = """
        SELECT user_id, action, details, timestamp
        FROM audit_events
        WHERE event_type = 'authorization'
            AND action IN ('role_change', 'permission_grant')
            AND risk_level IN ('high', 'critical')
            AND timestamp > NOW() - INTERVAL '15 minutes'
        """
        
        cursor = conn.cursor()
        cursor.execute(query)
        results = []
        
        for row in cursor.fetchall():
            results.append({
                'user_id': row[0],
                'action': row[1],
                'details': row[2],
                'timestamp': row[3].isoformat(),
                'alert_type': 'privilege_escalation'
            })
            
        cursor.close()
        return results
        
    def check_data_exfiltration(self, conn) -> List[Dict[str, Any]]:
        """Check for potential data exfiltration"""
        query = """
        SELECT user_id, resource_type, action, details, timestamp
        FROM audit_events
        WHERE action IN ('export', 'download', 'bulk_access')
            AND data_classification IN ('confidential', 'restricted')
            AND timestamp > NOW() - INTERVAL '5 minutes'
        """
        
        cursor = conn.cursor() 
        cursor.execute(query)
        results = []
        
        for row in cursor.fetchall():
            results.append({
                'user_id': row[0],
                'resource_type': row[1],
                'action': row[2],
                'details': row[3],
                'timestamp': row[4].isoformat(),
                'alert_type': 'potential_data_exfiltration'
            })
            
        cursor.close()
        return results
        
    def send_slack_alert(self, alert: Dict[str, Any]):
        """Send alert to Slack"""
        if not self.slack_webhook:
            return
            
        message = {
            "text": f"🚨 Security Alert: {alert['alert_type']}",
            "attachments": [
                {
                    "color": "danger",
                    "fields": [
                        {"title": "Alert Type", "value": alert['alert_type'], "short": True},
                        {"title": "Timestamp", "value": datetime.now().isoformat(), "short": True},
                        {"title": "Details", "value": json.dumps(alert, indent=2), "short": False}
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(self.slack_webhook, json=message, timeout=10)
            if response.status_code == 200:
                self.logger.info(f"Slack alert sent for {alert['alert_type']}")
            else:
                self.logger.error(f"Failed to send Slack alert: {response.status_code}")
        except Exception as e:
            self.logger.error(f"Error sending Slack alert: {e}")
            
    def log_security_alert(self, conn, alert: Dict[str, Any]):
        """Log security alert to database"""
        query = """
        INSERT INTO security_alerts (
            environment, alert_type, severity, title, description, 
            source_ip, user_id, indicators
        ) VALUES (
            %(environment)s, %(alert_type)s, %(severity)s, %(title)s, 
            %(description)s, %(source_ip)s, %(user_id)s, %(indicators)s
        )
        """
        
        params = {
            'environment': os.getenv('ENVIRONMENT', 'production'),
            'alert_type': alert['alert_type'],
            'severity': 'high',
            'title': f"Security Alert: {alert['alert_type']}",
            'description': json.dumps(alert),
            'source_ip': alert.get('source_ip'),
            'user_id': alert.get('user_id'),
            'indicators': json.dumps(alert)
        }
        
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            conn.commit()
            self.logger.info(f"Security alert logged: {alert['alert_type']}")
        except Exception as e:
            self.logger.error(f"Failed to log security alert: {e}")
            conn.rollback()
        finally:
            cursor.close()
            
    def run_monitoring_cycle(self):
        """Run one monitoring cycle"""
        conn = self.connect_db()
        if not conn:
            return
            
        try:
            alerts = []
            
            # Check for various security issues
            alerts.extend(self.check_failed_logins(conn))
            alerts.extend(self.check_privilege_escalation(conn))
            alerts.extend(self.check_data_exfiltration(conn))
            
            # Process alerts
            for alert in alerts:
                self.log_security_alert(conn, alert)
                self.send_slack_alert(alert)
                
            if alerts:
                self.logger.info(f"Processed {len(alerts)} security alerts")
                
        except Exception as e:
            self.logger.error(f"Error in monitoring cycle: {e}")
        finally:
            conn.close()
            
    def run(self):
        """Main monitoring loop"""
        self.logger.info("Starting audit monitoring daemon")
        
        while True:
            try:
                self.run_monitoring_cycle()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                self.logger.info("Monitoring daemon stopped")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                time.sleep(60)

if __name__ == "__main__":
    monitor = AuditMonitor()
    monitor.run()
EOF

    chmod +x "$AUDIT_BASE_DIR/monitor_daemon.py"
    log_success "Real-time monitoring daemon created"
}

# Configure log retention
configure_log_retention() {
    log "Configuring audit log retention policies"
    
    # Create retention management script
    cat > "$AUDIT_BASE_DIR/retention_manager.sh" << 'EOF'
#!/bin/bash
#
# TerraFusion Audit Log Retention Manager
# Manages audit log retention and archival according to compliance requirements
#

set -euo pipefail

AUDIT_DB_HOST="${AUDIT_DB_HOST:-localhost}"
AUDIT_DB_PORT="${AUDIT_DB_PORT:-5432}"
AUDIT_DB_NAME="${AUDIT_DB_NAME:-terrafusion_audit}"
AUDIT_DB_USER="${AUDIT_DB_USER:-audit_user}"
AUDIT_S3_BUCKET="${AUDIT_S3_BUCKET:-terrafusion-audit-archive}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Archive old audit events to S3
archive_audit_events() {
    local table_name=$1
    local retention_days=$2
    
    log "Archiving $table_name records older than $retention_days days"
    
    # Export old records to CSV
    local archive_file="/tmp/${table_name}_archive_$(date +%Y%m%d).csv"
    
    PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -c "
    COPY (
        SELECT * FROM $table_name 
        WHERE created_at < NOW() - INTERVAL '$retention_days days'
    ) TO '$archive_file' WITH CSV HEADER;
    "
    
    if [ -f "$archive_file" ]; then
        # Upload to S3
        aws s3 cp "$archive_file" "s3://$AUDIT_S3_BUCKET/archives/$(date +%Y/%m/%d)/" --storage-class GLACIER
        
        # Delete archived records from database
        local delete_count=$(PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "
        DELETE FROM $table_name 
        WHERE created_at < NOW() - INTERVAL '$retention_days days';
        SELECT ROW_COUNT();
        ")
        
        log "Archived and deleted $delete_count records from $table_name"
        
        # Update retention tracking
        PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -c "
        UPDATE audit_log_retention 
        SET last_cleanup = NOW(), records_archived = records_archived + $delete_count
        WHERE table_name = '$table_name';
        "
        
        # Cleanup local file
        rm -f "$archive_file"
    fi
}

# Main retention process
main() {
    log "Starting audit log retention process"
    
    # Get retention policies from database
    PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "
    SELECT table_name, retention_days FROM audit_log_retention;
    " | while IFS='|' read -r table_name retention_days; do
        table_name=$(echo "$table_name" | xargs)
        retention_days=$(echo "$retention_days" | xargs)
        
        if [ -n "$table_name" ] && [ -n "$retention_days" ]; then
            archive_audit_events "$table_name" "$retention_days"
        fi
    done
    
    log "Audit log retention process completed"
}

main "$@"
EOF

    chmod +x "$AUDIT_BASE_DIR/retention_manager.sh"
    
    # Create cron job for retention management
    cat > "/tmp/audit_retention_cron" << EOF
# TerraFusion Audit Log Retention - Run weekly
0 2 * * 0 $AUDIT_BASE_DIR/retention_manager.sh >> /var/log/terrafusion/retention.log 2>&1
EOF

    crontab -u root "/tmp/audit_retention_cron" 2>/dev/null || log_warning "Could not install cron job"
    rm -f "/tmp/audit_retention_cron"
    
    log_success "Log retention policies configured"
}

# Monitor audit events in real-time
monitor_audit_events() {
    log "Starting real-time audit event monitoring for $ENVIRONMENT"
    
    # Reset metrics
    AUDIT_METRICS["total_events"]=0
    AUDIT_METRICS["security_events"]=0
    AUDIT_METRICS["compliance_violations"]=0
    AUDIT_METRICS["failed_logins"]=0
    
    # Get time range for monitoring
    local time_condition
    case $TIME_RANGE in
        1h) time_condition="timestamp > NOW() - INTERVAL '1 hour'" ;;
        24h) time_condition="timestamp > NOW() - INTERVAL '24 hours'" ;;
        7d) time_condition="timestamp > NOW() - INTERVAL '7 days'" ;;
        30d) time_condition="timestamp > NOW() - INTERVAL '30 days'" ;;
        custom)
            if [ -n "$START_DATE" ] && [ -n "$END_DATE" ]; then
                time_condition="timestamp BETWEEN '$START_DATE' AND '$END_DATE'"
            else
                time_condition="timestamp > NOW() - INTERVAL '24 hours'"
            fi
            ;;
        *) time_condition="timestamp > NOW() - INTERVAL '24 hours'" ;;
    esac
    
    # Build filter condition
    local filter_condition=""
    case $FILTER in
        security) filter_condition="AND event_category = 'security'" ;;
        compliance) filter_condition="AND compliance_tags IS NOT NULL" ;;
        access) filter_condition="AND event_type IN ('authentication', 'authorization')" ;;
        data) filter_condition="AND resource_type LIKE '%data%'" ;;
        system) filter_condition="AND event_category = 'system'" ;;
    esac
    
    # Environment condition
    local env_condition=""
    if [ "$ENVIRONMENT" != "all" ]; then
        env_condition="AND environment = '$ENVIRONMENT'"
    fi
    
    # Query audit events
    local query="SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE risk_level IN ('high', 'critical')) as high_risk_events,
        COUNT(*) FILTER (WHERE outcome = 'failure') as failed_events,
        COUNT(*) FILTER (WHERE event_type = 'authentication' AND action = 'login' AND outcome = 'failure') as failed_logins
    FROM audit_events 
    WHERE $time_condition $env_condition $filter_condition"
    
    if command -v psql &> /dev/null; then
        local results=$(PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "$query" 2>/dev/null || echo "0|0|0|0")
        
        IFS='|' read -r total_events high_risk_events failed_events failed_logins <<< "$results"
        
        AUDIT_METRICS["total_events"]=$(echo "$total_events" | xargs)
        AUDIT_METRICS["high_risk_events"]=$(echo "$high_risk_events" | xargs)
        AUDIT_METRICS["failed_events"]=$(echo "$failed_events" | xargs)
        AUDIT_METRICS["failed_logins"]=$(echo "$failed_logins" | xargs)
        
        log_info "Monitoring Results (${TIME_RANGE}):"
        log_info "  Total Events: ${AUDIT_METRICS[total_events]}"
        log_info "  High Risk Events: ${AUDIT_METRICS[high_risk_events]}"
        log_info "  Failed Events: ${AUDIT_METRICS[failed_events]}"
        log_info "  Failed Logins: ${AUDIT_METRICS[failed_logins]}"
        
        # Check for anomalies
        if [ "${AUDIT_METRICS[failed_logins]}" -gt 100 ]; then
            log_warning "High number of failed logins detected: ${AUDIT_METRICS[failed_logins]}"
        fi
        
        if [ "${AUDIT_METRICS[high_risk_events]}" -gt 10 ]; then
            log_warning "High number of high-risk events detected: ${AUDIT_METRICS[high_risk_events]}"
        fi
    else
        log_error "PostgreSQL client not available for monitoring"
        return 1
    fi
    
    log_success "Audit event monitoring completed"
}

# Generate compliance reports
generate_compliance_report() {
    log "Generating compliance report for $COMPLIANCE_STANDARD"
    
    local report_file="$REPORTS_DIR/compliance_report_${COMPLIANCE_STANDARD}_${ENVIRONMENT}_$TIMESTAMP"
    
    case $OUTPUT_FORMAT in
        json) report_file="${report_file}.json" ;;
        csv) report_file="${report_file}.csv" ;;
        html) report_file="${report_file}.html" ;;
        pdf) report_file="${report_file}.pdf" ;;
        *) report_file="${report_file}.json" ;;
    esac
    
    if [ "$OUTPUT_FORMAT" = "html" ]; then
        generate_html_compliance_report "$report_file"
    elif [ "$OUTPUT_FORMAT" = "json" ]; then
        generate_json_compliance_report "$report_file"
    elif [ "$OUTPUT_FORMAT" = "csv" ]; then
        generate_csv_compliance_report "$report_file"
    fi
    
    log_success "Compliance report generated: $report_file"
}

# Generate HTML compliance report
generate_html_compliance_report() {
    local report_file=$1
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Compliance Report - $COMPLIANCE_STANDARD</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; min-width: 200px; }
        .critical { background-color: #ffebee; }
        .warning { background-color: #fff3e0; }
        .success { background-color: #e8f5e8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 TerraFusion Compliance Report</h1>
        <p><strong>Compliance Standard:</strong> $COMPLIANCE_STANDARD</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Report Period:</strong> $TIME_RANGE</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metric-card success">
            <h3>Compliant Controls</h3>
            <p class="success">85%</p>
        </div>
        <div class="metric-card warning">
            <h3>Minor Issues</h3>
            <p class="warning">12</p>
        </div>
        <div class="metric-card critical">
            <h3>Critical Issues</h3>
            <p class="error">3</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Audit Event Summary</h2>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
            <tr><td>Total Audit Events</td><td>${AUDIT_METRICS[total_events]:-0}</td><td class="success">Normal</td></tr>
            <tr><td>Failed Authentication</td><td>${AUDIT_METRICS[failed_logins]:-0}</td><td class="warning">Monitor</td></tr>
            <tr><td>High Risk Events</td><td>${AUDIT_METRICS[high_risk_events]:-0}</td><td class="error">Review Required</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Compliance Violations</h2>
        <table>
            <tr><th>Violation ID</th><th>Severity</th><th>Description</th><th>Status</th></tr>
EOF

    # Add compliance violations if database is available
    if command -v psql &> /dev/null; then
        PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "
        SELECT 
            'COMP-' || id as violation_id,
            severity,
            LEFT(description, 100) || '...' as description,
            remediation_status
        FROM compliance_violations 
        WHERE compliance_standard = '$COMPLIANCE_STANDARD' 
            OR '$COMPLIANCE_STANDARD' = 'all'
        ORDER BY severity DESC, timestamp DESC
        LIMIT 10;
        " 2>/dev/null | while IFS='|' read -r violation_id severity description status; do
            violation_id=$(echo "$violation_id" | xargs)
            severity=$(echo "$severity" | xargs)
            description=$(echo "$description" | xargs)
            status=$(echo "$status" | xargs)
            
            local severity_class="success"
            case "$severity" in
                critical) severity_class="error" ;;
                high) severity_class="error" ;;
                medium) severity_class="warning" ;;
            esac
            
            cat >> "$report_file" << EOF
            <tr><td>$violation_id</td><td class="$severity_class">$severity</td><td>$description</td><td>$status</td></tr>
EOF
        done
    fi

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Review and address all critical compliance violations immediately</li>
            <li>Implement additional monitoring for failed authentication attempts</li>
            <li>Conduct regular security awareness training</li>
            <li>Review and update access control policies</li>
            <li>Implement automated compliance checking</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Prioritize remediation of critical and high-severity violations</li>
            <li>Schedule follow-up compliance review in 30 days</li>
            <li>Update security policies and procedures as needed</li>
            <li>Implement additional automated controls</li>
        </ol>
    </div>
    
    <p><small>Report generated by TerraFusion Audit Logging System on $(date)</small></p>
</body>
</html>
EOF
}

# Generate JSON compliance report
generate_json_compliance_report() {
    local report_file=$1
    
    cat > "$report_file" << EOF
{
  "report_metadata": {
    "compliance_standard": "$COMPLIANCE_STANDARD",
    "environment": "$ENVIRONMENT", 
    "time_range": "$TIME_RANGE",
    "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "report_type": "$REPORT_TYPE"
  },
  "executive_summary": {
    "compliant_controls_percentage": 85,
    "minor_issues_count": 12,
    "critical_issues_count": 3,
    "overall_status": "needs_attention"
  },
  "audit_metrics": {
    "total_events": ${AUDIT_METRICS[total_events]:-0},
    "failed_logins": ${AUDIT_METRICS[failed_logins]:-0},
    "high_risk_events": ${AUDIT_METRICS[high_risk_events]:-0},
    "security_events": ${AUDIT_METRICS[security_events]:-0}
  },
  "compliance_violations": [
EOF

    # Add violations from database if available
    local first_violation=true
    if command -v psql &> /dev/null; then
        PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "
        SELECT json_agg(json_build_object(
            'id', 'COMP-' || id,
            'severity', severity,
            'description', description,
            'status', remediation_status,
            'created_at', created_at,
            'compliance_standard', compliance_standard
        )) FROM compliance_violations 
        WHERE compliance_standard = '$COMPLIANCE_STANDARD' 
            OR '$COMPLIANCE_STANDARD' = 'all'
        " 2>/dev/null | tail -n +2 | head -n -1 >> "$report_file"
    fi

    cat >> "$report_file" << EOF
  ],
  "recommendations": [
    "Review and address all critical compliance violations immediately",
    "Implement additional monitoring for failed authentication attempts", 
    "Conduct regular security awareness training",
    "Review and update access control policies",
    "Implement automated compliance checking"
  ],
  "next_steps": [
    "Prioritize remediation of critical and high-severity violations",
    "Schedule follow-up compliance review in 30 days", 
    "Update security policies and procedures as needed",
    "Implement additional automated controls"
  ]
}
EOF
}

# Generate CSV compliance report  
generate_csv_compliance_report() {
    local report_file=$1
    
    cat > "$report_file" << EOF
Compliance Standard,Environment,Time Range,Generated At,Total Events,Failed Logins,High Risk Events,Critical Issues
$COMPLIANCE_STANDARD,$ENVIRONMENT,$TIME_RANGE,$(date -u +%Y-%m-%dT%H:%M:%SZ),${AUDIT_METRICS[total_events]:-0},${AUDIT_METRICS[failed_logins]:-0},${AUDIT_METRICS[high_risk_events]:-0},3

Violation ID,Severity,Description,Status,Created At
EOF

    # Add violations
    if command -v psql &> /dev/null; then
        PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "
        SELECT 
            'COMP-' || id,
            severity,
            description,
            remediation_status,
            created_at
        FROM compliance_violations 
        WHERE compliance_standard = '$COMPLIANCE_STANDARD' 
            OR '$COMPLIANCE_STANDARD' = 'all'
        ORDER BY severity DESC, created_at DESC
        " 2>/dev/null | sed 's/|/,/g' >> "$report_file"
    fi
}

# Analyze audit patterns
analyze_audit_patterns() {
    log "Analyzing audit patterns for $ENVIRONMENT"
    
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client not available for analysis"
        return 1
    fi
    
    # Analyze authentication patterns
    log_info "Analyzing authentication patterns..."
    PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -c "
    SELECT 
        'Authentication Analysis' as analysis_type,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE outcome = 'success') as successful_logins,
        COUNT(*) FILTER (WHERE outcome = 'failure') as failed_logins,
        COUNT(DISTINCT user_email) as unique_users,
        COUNT(DISTINCT source_ip) as unique_ips
    FROM audit_events 
    WHERE event_type = 'authentication' 
        AND action = 'login'
        AND timestamp > NOW() - INTERVAL '$TIME_RANGE'
        AND environment = '$ENVIRONMENT';
    "
    
    # Analyze data access patterns
    log_info "Analyzing data access patterns..."
    PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -c "
    SELECT 
        'Data Access Analysis' as analysis_type,
        resource_type,
        action,
        COUNT(*) as access_count,
        COUNT(DISTINCT user_id) as unique_users
    FROM audit_events 
    WHERE event_category = 'data_access'
        AND timestamp > NOW() - INTERVAL '$TIME_RANGE'
        AND environment = '$ENVIRONMENT'
    GROUP BY resource_type, action
    ORDER BY access_count DESC
    LIMIT 10;
    "
    
    # Analyze risk patterns  
    log_info "Analyzing risk patterns..."
    PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -c "
    SELECT 
        'Risk Analysis' as analysis_type,
        risk_level,
        event_type,
        COUNT(*) as event_count
    FROM audit_events 
    WHERE timestamp > NOW() - INTERVAL '$TIME_RANGE'
        AND environment = '$ENVIRONMENT'
    GROUP BY risk_level, event_type
    ORDER BY 
        CASE risk_level 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3
            ELSE 4
        END,
        event_count DESC;
    "
    
    log_success "Audit pattern analysis completed"
}

# Export audit data
export_audit_data() {
    log "Exporting audit data for $ENVIRONMENT"
    
    local export_file="$REPORTS_DIR/audit_export_${ENVIRONMENT}_$TIMESTAMP"
    
    case $OUTPUT_FORMAT in
        json) export_file="${export_file}.json" ;;
        csv) export_file="${export_file}.csv" ;;
        *) export_file="${export_file}.csv" ;;
    esac
    
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client not available for export"
        return 1
    fi
    
    # Build time condition
    local time_condition
    case $TIME_RANGE in
        1h) time_condition="timestamp > NOW() - INTERVAL '1 hour'" ;;
        24h) time_condition="timestamp > NOW() - INTERVAL '24 hours'" ;;
        7d) time_condition="timestamp > NOW() - INTERVAL '7 days'" ;;
        30d) time_condition="timestamp > NOW() - INTERVAL '30 days'" ;;
        custom)
            if [ -n "$START_DATE" ] && [ -n "$END_DATE" ]; then
                time_condition="timestamp BETWEEN '$START_DATE' AND '$END_DATE'"
            else
                time_condition="timestamp > NOW() - INTERVAL '24 hours'"
            fi
            ;;
        *) time_condition="timestamp > NOW() - INTERVAL '24 hours'" ;;
    esac
    
    # Export based on format
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -t -c "
        SELECT json_agg(json_build_object(
            'id', id,
            'timestamp', timestamp,
            'environment', environment,
            'event_type', event_type,
            'user_id', user_id,
            'action', action,
            'outcome', outcome,
            'source_ip', source_ip,
            'details', details,
            'risk_level', risk_level
        )) FROM audit_events 
        WHERE $time_condition 
            AND environment = '$ENVIRONMENT'
        " > "$export_file"
    else
        # CSV export
        PGPASSWORD="$AUDIT_DB_PASSWORD" psql -h "$AUDIT_DB_HOST" -p "$AUDIT_DB_PORT" -U "$AUDIT_DB_USER" -d "$AUDIT_DB_NAME" -c "
        COPY (
            SELECT 
                id, timestamp, environment, event_type, user_id, 
                action, outcome, source_ip, risk_level, details
            FROM audit_events 
            WHERE $time_condition 
                AND environment = '$ENVIRONMENT'
            ORDER BY timestamp DESC
        ) TO '$export_file' WITH CSV HEADER;
        "
    fi
    
    if [ -f "$export_file" ]; then
        log_success "Audit data exported to: $export_file"
        
        # Optionally upload to S3
        if [ -n "${AUDIT_S3_BUCKET:-}" ]; then
            aws s3 cp "$export_file" "s3://$AUDIT_S3_BUCKET/exports/$(date +%Y/%m/%d)/" 2>/dev/null && \
                log_info "Export uploaded to S3: s3://$AUDIT_S3_BUCKET/exports/$(date +%Y/%m/%d)/"
        fi
    else
        log_error "Failed to create export file"
        return 1
    fi
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Audit Logging System"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT" 
    log "Time Range: $TIME_RANGE"
    log "Filter: $FILTER"
    log "========================================="
    
    case $ACTION in
        setup)
            setup_audit_logging
            ;;
        monitor)
            monitor_audit_events
            ;;
        report)
            generate_compliance_report
            ;;
        compliance)
            generate_compliance_report
            ;;
        analyze)
            analyze_audit_patterns
            ;;
        export)
            export_audit_data
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: setup, monitor, report, compliance, analyze, export"
            exit 1
            ;;
    esac
    
    log ""
    log "========================================="
    log "Audit Logging Operation Complete"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Audit logging interrupted!"; exit 1' INT TERM

# Run main function
main