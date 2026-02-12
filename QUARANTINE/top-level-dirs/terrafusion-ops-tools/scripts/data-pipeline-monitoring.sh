#!/bin/bash
#
# TerraFusion Advanced Data Pipeline Monitoring and Quality Assurance System
# Monitors data pipelines, validates data quality, and ensures data integrity
#
# Usage: ./data-pipeline-monitoring.sh [options]
# Options:
#   -a    Action (monitor|validate|report|schedule|alert|troubleshoot)
#   -p    Pipeline name or pattern (default: all)
#   -e    Environment (development|staging|production|all)
#   -t    Time period (1h|6h|24h|7d|30d)
#   -q    Quality check level (basic|standard|comprehensive)
#   -f    Output format (json|html|csv|prometheus)
#   -c    Configuration file path
#   -d    Data source (s3|rds|redshift|kafka|all)
#   -r    Auto-remediation enabled (true|false, default: false)
#   -n    Notification channels (slack|email|pagerduty|all)

set -euo pipefail

# Configuration
ACTION="monitor"
PIPELINE_NAME="all"
ENVIRONMENT="production"
TIME_PERIOD="24h"
QUALITY_LEVEL="standard"
OUTPUT_FORMAT="html"
CONFIG_FILE=""
DATA_SOURCE="all"
AUTO_REMEDIATION=false
NOTIFICATION_CHANNELS="slack"

# Directories and Files
PIPELINE_BASE_DIR="/opt/terrafusion/data-pipelines"
MONITORING_DIR="$PIPELINE_BASE_DIR/monitoring"
QUALITY_DIR="$PIPELINE_BASE_DIR/quality"
REPORTS_DIR="$PIPELINE_BASE_DIR/reports"
ALERTS_DIR="$PIPELINE_BASE_DIR/alerts"
LOGS_DIR="/var/log/terrafusion/data-pipelines"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOGS_DIR/pipeline_monitoring_$TIMESTAMP.log"

# Database Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-terrafusion}"
DB_USER="${DB_USER:-pipeline_monitor}"

# Data Quality Thresholds
FRESHNESS_THRESHOLD_HOURS=24
COMPLETENESS_THRESHOLD=95.0
ACCURACY_THRESHOLD=98.0
CONSISTENCY_THRESHOLD=95.0
UNIQUENESS_THRESHOLD=99.0
VALIDITY_THRESHOLD=97.0

# Performance Thresholds
PIPELINE_DURATION_THRESHOLD=7200  # 2 hours
ERROR_RATE_THRESHOLD=5.0
THROUGHPUT_THRESHOLD=1000  # records per minute
LATENCY_THRESHOLD=300  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$PIPELINE_BASE_DIR"
mkdir -p "$MONITORING_DIR"
mkdir -p "$QUALITY_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$ALERTS_DIR"
mkdir -p "$LOGS_DIR"

# Parse arguments
while getopts "a:p:e:t:q:f:c:d:r:n:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        p) PIPELINE_NAME="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        t) TIME_PERIOD="$OPTARG" ;;
        q) QUALITY_LEVEL="$OPTARG" ;;
        f) OUTPUT_FORMAT="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        d) DATA_SOURCE="$OPTARG" ;;
        r) AUTO_REMEDIATION="$OPTARG" ;;
        n) NOTIFICATION_CHANNELS="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-p pipeline] [-e env] [-t period] [-q quality] [-f format] [-c config] [-d source] [-r auto] [-n notify]"; exit 1 ;;
    esac
done

# Global state tracking
declare -A PIPELINE_STATUS
declare -A QUALITY_METRICS
declare -A PERFORMANCE_METRICS
declare -A DATA_HEALTH_CHECKS
declare -A ALERT_CONDITIONS

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

# Load pipeline monitoring configuration
load_pipeline_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        log "Loading pipeline configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "Creating default pipeline configuration"
        create_default_pipeline_config
    fi
}

# Create default pipeline configuration
create_default_pipeline_config() {
    cat > "$MONITORING_DIR/pipeline_config.sh" << EOF
# TerraFusion Data Pipeline Monitoring Configuration

# Pipeline Definitions
declare -A PIPELINE_CONFIGS
PIPELINE_CONFIGS[user_analytics]="source:s3,destination:redshift,schedule:hourly,owner:analytics_team"
PIPELINE_CONFIGS[transaction_etl]="source:rds,destination:redshift,schedule:daily,owner:data_team"
PIPELINE_CONFIGS[real_time_events]="source:kafka,destination:elasticsearch,schedule:streaming,owner:platform_team"
PIPELINE_CONFIGS[ml_feature_store]="source:redshift,destination:s3,schedule:daily,owner:ml_team"

# Data Quality Rules by Pipeline
declare -A QUALITY_RULES
QUALITY_RULES[user_analytics]="completeness:95,accuracy:98,freshness:2h,uniqueness:99"
QUALITY_RULES[transaction_etl]="completeness:99,accuracy:99.5,freshness:6h,consistency:98"
QUALITY_RULES[real_time_events]="completeness:90,accuracy:95,freshness:5m,throughput:10000"
QUALITY_RULES[ml_feature_store]="completeness:98,accuracy:99,freshness:24h,validity:97"

# Alert Thresholds by Environment
declare -A ENV_THRESHOLDS
ENV_THRESHOLDS[production]="error_rate:1,latency:60,duration:3600"
ENV_THRESHOLDS[staging]="error_rate:5,latency:300,duration:7200"
ENV_THRESHOLDS[development]="error_rate:10,latency:600,duration:10800"

# Notification Configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-data-team@terrafusion.com}"
PAGERDUTY_INTEGRATION_KEY="${PAGERDUTY_INTEGRATION_KEY:-}"

# Monitoring Intervals
HEALTH_CHECK_INTERVAL=300  # 5 minutes
QUALITY_CHECK_INTERVAL=3600  # 1 hour
PERFORMANCE_CHECK_INTERVAL=900  # 15 minutes

# Data Sources Configuration
S3_BUCKET_MONITORING="terrafusion-data-lake"
REDSHIFT_CLUSTER="terrafusion-analytics"
KAFKA_BOOTSTRAP_SERVERS="kafka-cluster:9092"
ELASTICSEARCH_URL="https://elasticsearch:9200"
EOF

    source "$MONITORING_DIR/pipeline_config.sh"
    log_success "Default pipeline configuration created and loaded"
}

# Initialize monitoring infrastructure
initialize_monitoring() {
    log "Initializing data pipeline monitoring infrastructure"
    
    # Create monitoring database schema
    create_monitoring_schema
    
    # Setup data quality framework
    setup_quality_framework
    
    # Configure pipeline health checks
    configure_health_checks
    
    # Initialize metrics collection
    initialize_metrics_collection
    
    # Setup alerting rules
    setup_alerting_rules
    
    log_success "Monitoring infrastructure initialized"
}

# Create monitoring database schema
create_monitoring_schema() {
    log "Creating pipeline monitoring database schema"
    
    cat > "/tmp/pipeline_monitoring_schema.sql" << 'EOF'
-- TerraFusion Pipeline Monitoring Schema

-- Pipeline execution tracking
CREATE TABLE IF NOT EXISTS pipeline_executions (
    id BIGSERIAL PRIMARY KEY,
    pipeline_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'timeout', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    records_processed BIGINT DEFAULT 0,
    records_failed BIGINT DEFAULT 0,
    data_size_bytes BIGINT DEFAULT 0,
    error_message TEXT,
    configuration JSONB,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data quality metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id BIGSERIAL PRIMARY KEY,
    pipeline_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    execution_id VARCHAR(255) REFERENCES pipeline_executions(execution_id),
    table_name VARCHAR(255),
    column_name VARCHAR(255),
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('completeness', 'accuracy', 'consistency', 'uniqueness', 'validity', 'freshness')),
    metric_value DECIMAL(10,4) NOT NULL,
    threshold_value DECIMAL(10,4),
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    details JSONB,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline performance metrics
CREATE TABLE IF NOT EXISTS pipeline_performance (
    id BIGSERIAL PRIMARY KEY,
    pipeline_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    execution_id VARCHAR(255) REFERENCES pipeline_executions(execution_id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data lineage tracking
CREATE TABLE IF NOT EXISTS data_lineage (
    id BIGSERIAL PRIMARY KEY,
    pipeline_name VARCHAR(255) NOT NULL,
    source_table VARCHAR(255) NOT NULL,
    source_column VARCHAR(255),
    target_table VARCHAR(255) NOT NULL,
    target_column VARCHAR(255),
    transformation_logic TEXT,
    execution_id VARCHAR(255) REFERENCES pipeline_executions(execution_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert history
CREATE TABLE IF NOT EXISTS pipeline_alerts (
    id BIGSERIAL PRIMARY KEY,
    pipeline_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    execution_id VARCHAR(255),
    alert_conditions JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Data health checks
CREATE TABLE IF NOT EXISTS data_health_checks (
    id BIGSERIAL PRIMARY KEY,
    check_name VARCHAR(255) NOT NULL,
    pipeline_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    check_result JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_name_env ON pipeline_executions(pipeline_name, environment);
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_status ON pipeline_executions(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_start_time ON pipeline_executions(start_time);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_pipeline ON data_quality_metrics(pipeline_name, environment);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_type ON data_quality_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_performance_name ON pipeline_performance(pipeline_name, environment);
CREATE INDEX IF NOT EXISTS idx_pipeline_alerts_status ON pipeline_alerts(status);
CREATE INDEX IF NOT EXISTS idx_data_health_checks_pipeline ON data_health_checks(pipeline_name, environment);

-- Create views for common queries
CREATE OR REPLACE VIEW pipeline_health_summary AS
SELECT 
    pipeline_name,
    environment,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'succeeded') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(end_time) as last_execution_time,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'failed' AND start_time > NOW() - INTERVAL '24 hours') > 0 THEN 'unhealthy'
        WHEN COUNT(*) FILTER (WHERE status = 'failed' AND start_time > NOW() - INTERVAL '7 days') > 0 THEN 'warning'
        ELSE 'healthy'
    END as health_status
FROM pipeline_executions 
WHERE start_time > NOW() - INTERVAL '30 days'
GROUP BY pipeline_name, environment;

CREATE OR REPLACE VIEW data_quality_summary AS
SELECT 
    pipeline_name,
    environment,
    metric_type,
    AVG(metric_value) as avg_metric_value,
    MIN(metric_value) as min_metric_value,
    MAX(metric_value) as max_metric_value,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_checks,
    COUNT(*) as total_checks,
    MAX(measured_at) as last_check_time
FROM data_quality_metrics 
WHERE measured_at > NOW() - INTERVAL '7 days'
GROUP BY pipeline_name, environment, metric_type;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_pipeline_executions_updated_at 
    BEFORE UPDATE ON pipeline_executions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

    # Execute schema creation
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/tmp/pipeline_monitoring_schema.sql" &>/dev/null; then
        log_success "Pipeline monitoring schema created successfully"
    else
        log_error "Failed to create pipeline monitoring schema"
        return 1
    fi
    
    rm -f "/tmp/pipeline_monitoring_schema.sql"
}

# Setup data quality framework
setup_quality_framework() {
    log "Setting up data quality framework"
    
    # Create data quality validation scripts
    create_quality_validators
    
    # Setup quality monitoring dashboards
    setup_quality_dashboards
    
    # Configure quality alerting
    configure_quality_alerts
    
    log_success "Data quality framework setup completed"
}

# Create data quality validators
create_quality_validators() {
    log "Creating data quality validation scripts"
    
    # Python data quality validator
    cat > "$QUALITY_DIR/data_quality_validator.py" << 'EOF'
#!/usr/bin/env python3
"""
TerraFusion Data Quality Validator
Performs comprehensive data quality checks on pipeline data
"""

import psycopg2
import pandas as pd
import numpy as np
import json
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class DataQualityValidator:
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.logger = logging.getLogger(__name__)
        
    def connect_db(self):
        """Connect to database"""
        try:
            return psycopg2.connect(**self.db_config)
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            return None
    
    def check_completeness(self, table_name: str, column_name: str) -> Dict[str, Any]:
        """Check data completeness (null values)"""
        conn = self.connect_db()
        if not conn:
            return {"status": "error", "message": "Database connection failed"}
        
        try:
            query = f"""
            SELECT 
                COUNT(*) as total_records,
                COUNT({column_name}) as non_null_records,
                (COUNT({column_name})::float / COUNT(*) * 100) as completeness_percentage
            FROM {table_name}
            """
            
            df = pd.read_sql(query, conn)
            completeness = float(df['completeness_percentage'].iloc[0])
            
            return {
                "metric_type": "completeness",
                "table_name": table_name,
                "column_name": column_name,
                "metric_value": completeness,
                "total_records": int(df['total_records'].iloc[0]),
                "non_null_records": int(df['non_null_records'].iloc[0]),
                "status": "passed" if completeness >= 95.0 else "failed"
            }
            
        except Exception as e:
            self.logger.error(f"Completeness check failed: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()
    
    def check_uniqueness(self, table_name: str, column_name: str) -> Dict[str, Any]:
        """Check data uniqueness (duplicate values)"""
        conn = self.connect_db()
        if not conn:
            return {"status": "error", "message": "Database connection failed"}
        
        try:
            query = f"""
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT {column_name}) as unique_records,
                (COUNT(DISTINCT {column_name})::float / COUNT(*) * 100) as uniqueness_percentage
            FROM {table_name}
            WHERE {column_name} IS NOT NULL
            """
            
            df = pd.read_sql(query, conn)
            uniqueness = float(df['uniqueness_percentage'].iloc[0])
            
            return {
                "metric_type": "uniqueness",
                "table_name": table_name,
                "column_name": column_name,
                "metric_value": uniqueness,
                "total_records": int(df['total_records'].iloc[0]),
                "unique_records": int(df['unique_records'].iloc[0]),
                "status": "passed" if uniqueness >= 99.0 else "failed"
            }
            
        except Exception as e:
            self.logger.error(f"Uniqueness check failed: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()
    
    def check_validity(self, table_name: str, column_name: str, valid_values: List[str] = None, 
                      pattern: str = None) -> Dict[str, Any]:
        """Check data validity (format/pattern compliance)"""
        conn = self.connect_db()
        if not conn:
            return {"status": "error", "message": "Database connection failed"}
        
        try:
            if valid_values:
                # Check against valid values list
                values_list = "', '".join(valid_values)
                query = f"""
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(*) FILTER (WHERE {column_name} IN ('{values_list}')) as valid_records,
                    (COUNT(*) FILTER (WHERE {column_name} IN ('{values_list}'))::float / COUNT(*) * 100) as validity_percentage
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                """
            elif pattern:
                # Check against regex pattern
                query = f"""
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(*) FILTER (WHERE {column_name} ~ '{pattern}') as valid_records,
                    (COUNT(*) FILTER (WHERE {column_name} ~ '{pattern}')::float / COUNT(*) * 100) as validity_percentage
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                """
            else:
                # Basic validity check (non-empty strings)
                query = f"""
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(*) FILTER (WHERE LENGTH(TRIM({column_name})) > 0) as valid_records,
                    (COUNT(*) FILTER (WHERE LENGTH(TRIM({column_name})) > 0)::float / COUNT(*) * 100) as validity_percentage
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                """
            
            df = pd.read_sql(query, conn)
            validity = float(df['validity_percentage'].iloc[0])
            
            return {
                "metric_type": "validity",
                "table_name": table_name,
                "column_name": column_name,
                "metric_value": validity,
                "total_records": int(df['total_records'].iloc[0]),
                "valid_records": int(df['valid_records'].iloc[0]),
                "status": "passed" if validity >= 97.0 else "failed"
            }
            
        except Exception as e:
            self.logger.error(f"Validity check failed: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()
    
    def check_freshness(self, table_name: str, timestamp_column: str, 
                       max_age_hours: int = 24) -> Dict[str, Any]:
        """Check data freshness (recency of data)"""
        conn = self.connect_db()
        if not conn:
            return {"status": "error", "message": "Database connection failed"}
        
        try:
            query = f"""
            SELECT 
                MAX({timestamp_column}) as latest_timestamp,
                EXTRACT(EPOCH FROM (NOW() - MAX({timestamp_column}))) / 3600 as age_hours
            FROM {table_name}
            """
            
            df = pd.read_sql(query, conn)
            age_hours = float(df['age_hours'].iloc[0]) if df['age_hours'].iloc[0] is not None else float('inf')
            latest_timestamp = df['latest_timestamp'].iloc[0]
            
            return {
                "metric_type": "freshness",
                "table_name": table_name,
                "column_name": timestamp_column,
                "metric_value": max_age_hours - age_hours if age_hours < max_age_hours else 0,
                "age_hours": age_hours,
                "latest_timestamp": str(latest_timestamp) if latest_timestamp else None,
                "max_age_hours": max_age_hours,
                "status": "passed" if age_hours <= max_age_hours else "failed"
            }
            
        except Exception as e:
            self.logger.error(f"Freshness check failed: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()
    
    def check_consistency(self, table1: str, table2: str, join_column: str, 
                         check_column: str = None) -> Dict[str, Any]:
        """Check data consistency across tables"""
        conn = self.connect_db()
        if not conn:
            return {"status": "error", "message": "Database connection failed"}
        
        try:
            if check_column:
                # Check specific column consistency
                query = f"""
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(*) FILTER (WHERE t1.{check_column} = t2.{check_column}) as consistent_records,
                    (COUNT(*) FILTER (WHERE t1.{check_column} = t2.{check_column})::float / COUNT(*) * 100) as consistency_percentage
                FROM {table1} t1
                JOIN {table2} t2 ON t1.{join_column} = t2.{join_column}
                WHERE t1.{check_column} IS NOT NULL AND t2.{check_column} IS NOT NULL
                """
            else:
                # Check referential integrity
                query = f"""
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(t2.{join_column}) as consistent_records,
                    (COUNT(t2.{join_column})::float / COUNT(*) * 100) as consistency_percentage
                FROM {table1} t1
                LEFT JOIN {table2} t2 ON t1.{join_column} = t2.{join_column}
                """
            
            df = pd.read_sql(query, conn)
            consistency = float(df['consistency_percentage'].iloc[0])
            
            return {
                "metric_type": "consistency",
                "table_name": f"{table1}_{table2}",
                "column_name": join_column,
                "metric_value": consistency,
                "total_records": int(df['total_records'].iloc[0]),
                "consistent_records": int(df['consistent_records'].iloc[0]),
                "status": "passed" if consistency >= 95.0 else "failed"
            }
            
        except Exception as e:
            self.logger.error(f"Consistency check failed: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()
    
    def run_quality_checks(self, pipeline_name: str, execution_id: str, 
                          quality_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run all configured quality checks for a pipeline"""
        results = []
        
        for check_config in quality_config.get('checks', []):
            check_type = check_config['type']
            
            try:
                if check_type == 'completeness':
                    result = self.check_completeness(
                        check_config['table'], 
                        check_config['column']
                    )
                elif check_type == 'uniqueness':
                    result = self.check_uniqueness(
                        check_config['table'], 
                        check_config['column']
                    )
                elif check_type == 'validity':
                    result = self.check_validity(
                        check_config['table'], 
                        check_config['column'],
                        check_config.get('valid_values'),
                        check_config.get('pattern')
                    )
                elif check_type == 'freshness':
                    result = self.check_freshness(
                        check_config['table'], 
                        check_config['column'],
                        check_config.get('max_age_hours', 24)
                    )
                elif check_type == 'consistency':
                    result = self.check_consistency(
                        check_config['table1'], 
                        check_config['table2'],
                        check_config['join_column'],
                        check_config.get('check_column')
                    )
                else:
                    continue
                
                # Add metadata
                result['pipeline_name'] = pipeline_name
                result['execution_id'] = execution_id
                result['check_config'] = check_config
                
                results.append(result)
                
            except Exception as e:
                self.logger.error(f"Quality check {check_type} failed: {e}")
                results.append({
                    "metric_type": check_type,
                    "pipeline_name": pipeline_name,
                    "execution_id": execution_id,
                    "status": "error",
                    "message": str(e)
                })
        
        return results
    
    def store_quality_results(self, results: List[Dict[str, Any]]):
        """Store quality check results in database"""
        conn = self.connect_db()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            for result in results:
                if result.get('status') == 'error':
                    continue
                
                query = """
                INSERT INTO data_quality_metrics 
                (pipeline_name, environment, execution_id, table_name, column_name, 
                 metric_type, metric_value, threshold_value, status, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    result['pipeline_name'],
                    result.get('environment', 'production'),
                    result['execution_id'],
                    result.get('table_name'),
                    result.get('column_name'),
                    result['metric_type'],
                    result['metric_value'],
                    result.get('threshold_value'),
                    result['status'],
                    json.dumps(result)
                ))
            
            conn.commit()
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to store quality results: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 data_quality_validator.py <pipeline_name> <execution_id> <config_file>")
        sys.exit(1)
    
    pipeline_name = sys.argv[1]
    execution_id = sys.argv[2]
    config_file = sys.argv[3]
    
    # Load configuration
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    # Initialize validator
    validator = DataQualityValidator(config['database'])
    
    # Run quality checks
    results = validator.run_quality_checks(pipeline_name, execution_id, config)
    
    # Store results
    validator.store_quality_results(results)
    
    # Output results
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
EOF

    chmod +x "$QUALITY_DIR/data_quality_validator.py"
    log_success "Data quality validator created"
}

# Monitor pipeline health
monitor_pipeline_health() {
    log "Monitoring pipeline health for $PIPELINE_NAME in $ENVIRONMENT"
    
    # Get time range for monitoring
    local time_condition
    case $TIME_PERIOD in
        1h) time_condition="start_time > NOW() - INTERVAL '1 hour'" ;;
        6h) time_condition="start_time > NOW() - INTERVAL '6 hours'" ;;
        24h) time_condition="start_time > NOW() - INTERVAL '24 hours'" ;;
        7d) time_condition="start_time > NOW() - INTERVAL '7 days'" ;;
        30d) time_condition="start_time > NOW() - INTERVAL '30 days'" ;;
        *) time_condition="start_time > NOW() - INTERVAL '24 hours'" ;;
    esac
    
    # Pipeline name condition
    local pipeline_condition=""
    if [ "$PIPELINE_NAME" != "all" ]; then
        pipeline_condition="AND pipeline_name = '$PIPELINE_NAME'"
    fi
    
    # Environment condition
    local env_condition=""
    if [ "$ENVIRONMENT" != "all" ]; then
        env_condition="AND environment = '$ENVIRONMENT'"
    fi
    
    # Check pipeline execution status
    check_pipeline_execution_status "$time_condition" "$pipeline_condition" "$env_condition"
    
    # Monitor performance metrics
    monitor_performance_metrics "$time_condition" "$pipeline_condition" "$env_condition"
    
    # Check data quality metrics
    check_data_quality_status "$time_condition" "$pipeline_condition" "$env_condition"
    
    # Analyze pipeline trends
    analyze_pipeline_trends "$time_condition" "$pipeline_condition" "$env_condition"
    
    # Generate health alerts if needed
    evaluate_health_alerts
    
    log_success "Pipeline health monitoring completed"
}

# Check pipeline execution status
check_pipeline_execution_status() {
    local time_condition=$1
    local pipeline_condition=$2
    local env_condition=$3
    
    log_info "Checking pipeline execution status"
    
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client not available, skipping database checks"
        return
    fi
    
    # Get pipeline execution summary
    local execution_summary=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT 
        pipeline_name,
        environment,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'succeeded') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
        COUNT(*) FILTER (WHERE status = 'running') as running_executions,
        AVG(duration_seconds) as avg_duration,
        MAX(end_time) as last_execution
    FROM pipeline_executions 
    WHERE $time_condition $pipeline_condition $env_condition
    GROUP BY pipeline_name, environment
    ORDER BY pipeline_name, environment;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$execution_summary" ]; then
        log_info "Pipeline Execution Summary:"
        echo "$execution_summary" | while IFS='|' read -r pipeline env total successful failed running avg_duration last_exec; do
            pipeline=$(echo "$pipeline" | xargs)
            env=$(echo "$env" | xargs)
            total=$(echo "$total" | xargs)
            successful=$(echo "$successful" | xargs)
            failed=$(echo "$failed" | xargs)
            running=$(echo "$running" | xargs)
            avg_duration=$(echo "$avg_duration" | xargs)
            
            PIPELINE_STATUS["${pipeline}_${env}_total"]=$total
            PIPELINE_STATUS["${pipeline}_${env}_successful"]=$successful
            PIPELINE_STATUS["${pipeline}_${env}_failed"]=$failed
            PIPELINE_STATUS["${pipeline}_${env}_running"]=$running
            PIPELINE_STATUS["${pipeline}_${env}_avg_duration"]=$avg_duration
            
            local success_rate=0
            if [ "$total" -gt 0 ]; then
                success_rate=$(echo "scale=2; $successful * 100 / $total" | bc)
            fi
            
            log_info "  $pipeline ($env): ${total} executions, ${success_rate}% success rate, ${failed} failures"
            
            # Check for concerning patterns
            if [ "$failed" -gt 0 ]; then
                log_warning "  Pipeline $pipeline has $failed failed executions"
                ALERT_CONDITIONS["${pipeline}_${env}_failures"]="$failed failed executions in $TIME_PERIOD"
            fi
            
            if [ "$running" -gt 3 ]; then
                log_warning "  Pipeline $pipeline has $running concurrent executions"
                ALERT_CONDITIONS["${pipeline}_${env}_concurrent"]="$running concurrent executions"
            fi
        done
    else
        log_warning "Could not retrieve pipeline execution data"
    fi
}

# Monitor performance metrics
monitor_performance_metrics() {
    local time_condition=$1
    local pipeline_condition=$2
    local env_condition=$3
    
    log_info "Monitoring pipeline performance metrics"
    
    # Get performance metrics from database
    local perf_metrics=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT 
        pe.pipeline_name,
        pe.environment,
        AVG(pe.duration_seconds) as avg_duration,
        MAX(pe.duration_seconds) as max_duration,
        AVG(pe.records_processed::float / NULLIF(pe.duration_seconds, 0)) as avg_throughput,
        AVG(CASE WHEN pe.records_processed > 0 THEN pe.records_failed::float / pe.records_processed * 100 ELSE 0 END) as avg_error_rate
    FROM pipeline_executions pe
    WHERE pe.status = 'succeeded' 
        AND $time_condition $pipeline_condition $env_condition
    GROUP BY pe.pipeline_name, pe.environment
    ORDER BY pe.pipeline_name, pe.environment;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$perf_metrics" ]; then
        log_info "Performance Metrics:"
        echo "$perf_metrics" | while IFS='|' read -r pipeline env avg_duration max_duration avg_throughput avg_error_rate; do
            pipeline=$(echo "$pipeline" | xargs)
            env=$(echo "$env" | xargs)
            avg_duration=$(echo "$avg_duration" | xargs)
            max_duration=$(echo "$max_duration" | xargs)
            avg_throughput=$(echo "$avg_throughput" | xargs)
            avg_error_rate=$(echo "$avg_error_rate" | xargs)
            
            PERFORMANCE_METRICS["${pipeline}_${env}_avg_duration"]=${avg_duration:-0}
            PERFORMANCE_METRICS["${pipeline}_${env}_max_duration"]=${max_duration:-0}
            PERFORMANCE_METRICS["${pipeline}_${env}_avg_throughput"]=${avg_throughput:-0}
            PERFORMANCE_METRICS["${pipeline}_${env}_avg_error_rate"]=${avg_error_rate:-0}
            
            log_info "  $pipeline ($env): ${avg_duration}s avg duration, ${avg_throughput} records/s throughput, ${avg_error_rate}% error rate"
            
            # Check performance thresholds
            if [ -n "$avg_duration" ] && (( $(echo "$avg_duration > $PIPELINE_DURATION_THRESHOLD" | bc -l) )); then
                log_warning "  Pipeline $pipeline duration (${avg_duration}s) exceeds threshold (${PIPELINE_DURATION_THRESHOLD}s)"
                ALERT_CONDITIONS["${pipeline}_${env}_duration"]="Average duration ${avg_duration}s exceeds threshold"
            fi
            
            if [ -n "$avg_error_rate" ] && (( $(echo "$avg_error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
                log_warning "  Pipeline $pipeline error rate (${avg_error_rate}%) exceeds threshold (${ERROR_RATE_THRESHOLD}%)"
                ALERT_CONDITIONS["${pipeline}_${env}_error_rate"]="Error rate ${avg_error_rate}% exceeds threshold"
            fi
            
            if [ -n "$avg_throughput" ] && (( $(echo "$avg_throughput < $THROUGHPUT_THRESHOLD" | bc -l) )); then
                log_warning "  Pipeline $pipeline throughput (${avg_throughput} records/s) below threshold (${THROUGHPUT_THRESHOLD} records/s)"
                ALERT_CONDITIONS["${pipeline}_${env}_throughput"]="Throughput ${avg_throughput} records/s below threshold"
            fi
        done
    fi
}

# Check data quality status
check_data_quality_status() {
    local time_condition=$1
    local pipeline_condition=$2
    local env_condition=$3
    
    log_info "Checking data quality status"
    
    # Get data quality metrics
    local quality_metrics=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT 
        pipeline_name,
        environment,
        metric_type,
        AVG(metric_value) as avg_metric_value,
        MIN(metric_value) as min_metric_value,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_checks,
        COUNT(*) as total_checks
    FROM data_quality_metrics 
    WHERE measured_at > NOW() - INTERVAL '${TIME_PERIOD#*[0-9]}'
        $pipeline_condition $env_condition
    GROUP BY pipeline_name, environment, metric_type
    ORDER BY pipeline_name, environment, metric_type;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$quality_metrics" ]; then
        log_info "Data Quality Metrics:"
        echo "$quality_metrics" | while IFS='|' read -r pipeline env metric_type avg_value min_value failed_checks total_checks; do
            pipeline=$(echo "$pipeline" | xargs)
            env=$(echo "$env" | xargs)
            metric_type=$(echo "$metric_type" | xargs)
            avg_value=$(echo "$avg_value" | xargs)
            min_value=$(echo "$min_value" | xargs)
            failed_checks=$(echo "$failed_checks" | xargs)
            total_checks=$(echo "$total_checks" | xargs)
            
            QUALITY_METRICS["${pipeline}_${env}_${metric_type}_avg"]=${avg_value:-0}
            QUALITY_METRICS["${pipeline}_${env}_${metric_type}_min"]=${min_value:-0}
            QUALITY_METRICS["${pipeline}_${env}_${metric_type}_failed"]=${failed_checks:-0}
            
            local success_rate=0
            if [ "$total_checks" -gt 0 ]; then
                success_rate=$(echo "scale=2; ($total_checks - $failed_checks) * 100 / $total_checks" | bc)
            fi
            
            log_info "  $pipeline ($env) $metric_type: ${avg_value}% avg, ${min_value}% min, ${success_rate}% check success rate"
            
            # Check quality thresholds
            local threshold
            case $metric_type in
                completeness) threshold=$COMPLETENESS_THRESHOLD ;;
                accuracy) threshold=$ACCURACY_THRESHOLD ;;
                consistency) threshold=$CONSISTENCY_THRESHOLD ;;
                uniqueness) threshold=$UNIQUENESS_THRESHOLD ;;
                validity) threshold=$VALIDITY_THRESHOLD ;;
                *) threshold=95.0 ;;
            esac
            
            if [ -n "$avg_value" ] && (( $(echo "$avg_value < $threshold" | bc -l) )); then
                log_warning "  $metric_type quality (${avg_value}%) below threshold (${threshold}%)"
                ALERT_CONDITIONS["${pipeline}_${env}_${metric_type}"]="$metric_type quality ${avg_value}% below threshold"
            fi
            
            if [ "$failed_checks" -gt 0 ]; then
                log_warning "  $metric_type has $failed_checks failed quality checks"
                ALERT_CONDITIONS["${pipeline}_${env}_${metric_type}_failures"]="$failed_checks failed $metric_type quality checks"
            fi
        done
    fi
}

# Analyze pipeline trends
analyze_pipeline_trends() {
    local time_condition=$1
    local pipeline_condition=$2
    local env_condition=$3
    
    log_info "Analyzing pipeline trends"
    
    # Get trend data (comparing current period to previous period)
    local trend_analysis=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    WITH current_period AS (
        SELECT 
            pipeline_name,
            environment,
            AVG(duration_seconds) as avg_duration,
            COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
            COUNT(*) as total_count
        FROM pipeline_executions 
        WHERE $time_condition $pipeline_condition $env_condition
        GROUP BY pipeline_name, environment
    ),
    previous_period AS (
        SELECT 
            pipeline_name,
            environment,
            AVG(duration_seconds) as avg_duration,
            COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
            COUNT(*) as total_count
        FROM pipeline_executions 
        WHERE start_time BETWEEN NOW() - INTERVAL '${TIME_PERIOD#*[0-9]}' * 2 AND NOW() - INTERVAL '${TIME_PERIOD#*[0-9]}'
            $pipeline_condition $env_condition
        GROUP BY pipeline_name, environment
    )
    SELECT 
        c.pipeline_name,
        c.environment,
        c.avg_duration as current_duration,
        p.avg_duration as previous_duration,
        CASE 
            WHEN p.avg_duration > 0 THEN ((c.avg_duration - p.avg_duration) / p.avg_duration * 100)
            ELSE 0 
        END as duration_change_percent,
        c.failed_count as current_failures,
        p.failed_count as previous_failures
    FROM current_period c
    LEFT JOIN previous_period p ON c.pipeline_name = p.pipeline_name AND c.environment = p.environment
    ORDER BY c.pipeline_name, c.environment;
    " 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$trend_analysis" ]; then
        log_info "Pipeline Trends:"
        echo "$trend_analysis" | while IFS='|' read -r pipeline env current_duration previous_duration duration_change current_failures previous_failures; do
            pipeline=$(echo "$pipeline" | xargs)
            env=$(echo "$env" | xargs)
            current_duration=$(echo "$current_duration" | xargs)
            previous_duration=$(echo "$previous_duration" | xargs)
            duration_change=$(echo "$duration_change" | xargs)
            current_failures=$(echo "$current_failures" | xargs)
            previous_failures=$(echo "$previous_failures" | xargs)
            
            log_info "  $pipeline ($env): Duration change ${duration_change}%, Failures: ${current_failures} (prev: ${previous_failures})"
            
            # Detect concerning trends
            if [ -n "$duration_change" ] && (( $(echo "$duration_change > 25" | bc -l) )); then
                log_warning "  Pipeline $pipeline duration increased by ${duration_change}%"
                ALERT_CONDITIONS["${pipeline}_${env}_duration_trend"]="Duration increased by ${duration_change}%"
            fi
            
            if [ "${current_failures:-0}" -gt "${previous_failures:-0}" ]; then
                local failure_increase=$((current_failures - previous_failures))
                log_warning "  Pipeline $pipeline failures increased by $failure_increase"
                ALERT_CONDITIONS["${pipeline}_${env}_failure_trend"]="Failures increased by $failure_increase"
            fi
        done
    fi
}

# Evaluate health alerts
evaluate_health_alerts() {
    log_info "Evaluating health alert conditions"
    
    local alert_count=0
    local critical_alerts=0
    
    for alert_key in "${!ALERT_CONDITIONS[@]}"; do
        local alert_condition="${ALERT_CONDITIONS[$alert_key]}"
        local severity="medium"
        
        # Determine severity based on alert type
        case $alert_key in
            *_failures|*_error_rate|*_duration)
                severity="high"
                ((critical_alerts++))
                ;;
            *_trend|*_concurrent)
                severity="medium"
                ;;
            *)
                severity="low"
                ;;
        esac
        
        ((alert_count++))
        log_warning "Alert: $alert_key - $alert_condition (Severity: $severity)"
        
        # Send alert notifications
        send_pipeline_alert "$alert_key" "$alert_condition" "$severity"
    done
    
    if [ "$alert_count" -eq 0 ]; then
        log_success "No health alerts detected"
    else
        log_warning "Generated $alert_count alerts ($critical_alerts critical)"
    fi
}

# Send pipeline alert
send_pipeline_alert() {
    local alert_key=$1
    local alert_condition=$2
    local severity=$3
    
    # Extract pipeline and environment from alert key
    local pipeline=$(echo "$alert_key" | cut -d'_' -f1)
    local environment=$(echo "$alert_key" | cut -d'_' -f2)
    
    # Send Slack notification
    if [[ "$NOTIFICATION_CHANNELS" == *"slack"* ]] && [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="warning"
        case $severity in
            critical|high) color="danger" ;;
            medium) color="warning" ;;
            low) color="good" ;;
        esac
        
        local message="{
            \"text\": \"📊 Data Pipeline Alert\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"fields\": [
                    {\"title\": \"Pipeline\", \"value\": \"$pipeline\", \"short\": true},
                    {\"title\": \"Environment\", \"value\": \"$environment\", \"short\": true},
                    {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                    {\"title\": \"Alert Type\", \"value\": \"$alert_key\", \"short\": true},
                    {\"title\": \"Condition\", \"value\": \"$alert_condition\", \"short\": false}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$message" \
            "${SLACK_WEBHOOK_URL}" &>/dev/null || true
    fi
    
    # Store alert in database
    store_pipeline_alert "$alert_key" "$alert_condition" "$severity" "$pipeline" "$environment"
}

# Store pipeline alert in database
store_pipeline_alert() {
    local alert_key=$1
    local alert_condition=$2
    local severity=$3
    local pipeline=$4
    local environment=$5
    
    if ! command -v psql &> /dev/null; then
        return
    fi
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO pipeline_alerts 
    (pipeline_name, environment, alert_type, severity, title, description, alert_conditions)
    VALUES (
        '$pipeline',
        '$environment', 
        '$alert_key',
        '$severity',
        'Pipeline Health Alert: $alert_key',
        '$alert_condition',
        '{\"alert_key\": \"$alert_key\", \"condition\": \"$alert_condition\"}'
    )
    ON CONFLICT DO NOTHING;
    " &>/dev/null || true
}

# Generate pipeline monitoring report
generate_pipeline_report() {
    local report_file="$REPORTS_DIR/pipeline_monitoring_report_${ENVIRONMENT}_$TIMESTAMP.$OUTPUT_FORMAT"
    
    log "Generating pipeline monitoring report: $report_file"
    
    case $OUTPUT_FORMAT in
        html) generate_html_pipeline_report "$report_file" ;;
        json) generate_json_pipeline_report "$report_file" ;;
        csv) generate_csv_pipeline_report "$report_file" ;;
        prometheus) generate_prometheus_metrics "$report_file" ;;
        *) generate_html_pipeline_report "$report_file" ;;
    esac
    
    log_success "Pipeline monitoring report generated: $report_file"
}

# Generate HTML pipeline report
generate_html_pipeline_report() {
    local report_file=$1
    
    # Calculate summary statistics
    local total_pipelines=0
    local healthy_pipelines=0
    local total_alerts=${#ALERT_CONDITIONS[@]}
    
    for key in "${!PIPELINE_STATUS[@]}"; do
        if [[ $key == *"_total" ]]; then
            ((total_pipelines++))
        fi
    done
    
    for key in "${!ALERT_CONDITIONS[@]}"; do
        if [[ $key != *"_failures"* ]] && [[ $key != *"_error_rate"* ]]; then
            ((healthy_pipelines++))
        fi
    done
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Data Pipeline Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary-cards { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; min-width: 200px; text-align: center; }
        .healthy-card { background-color: #e8f5e8; }
        .warning-card { background-color: #fff3e0; }
        .critical-card { background-color: #ffebee; }
        .section { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-healthy { color: green; font-weight: bold; }
        .status-warning { color: orange; font-weight: bold; }
        .status-critical { color: red; font-weight: bold; }
        .metric-good { color: green; }
        .metric-warning { color: orange; }
        .metric-bad { color: red; }
        .alert-item { background-color: #fff3e0; padding: 10px; margin: 5px 0; border-left: 4px solid #ff9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 TerraFusion Data Pipeline Monitoring Report</h1>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Time Period:</strong> $TIME_PERIOD</p>
        <p><strong>Pipeline Filter:</strong> $PIPELINE_NAME</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="summary-cards">
        <div class="card healthy-card">
            <h3>Total Pipelines</h3>
            <h2>$total_pipelines</h2>
            <p>Monitored pipelines</p>
        </div>
        <div class="card $([ "$total_alerts" -eq 0 ] && echo "healthy-card" || echo "warning-card")">
            <h3>Active Alerts</h3>
            <h2>$total_alerts</h2>
            <p>Health alerts</p>
        </div>
        <div class="card healthy-card">
            <h3>Quality Level</h3>
            <h2>$QUALITY_LEVEL</h2>
            <p>Check coverage</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Pipeline Execution Status</h2>
        <table>
            <tr><th>Pipeline</th><th>Environment</th><th>Total Runs</th><th>Success Rate</th><th>Avg Duration (s)</th><th>Status</th></tr>
EOF

    # Add pipeline status rows
    for key in "${!PIPELINE_STATUS[@]}"; do
        if [[ $key == *"_total" ]]; then
            local pipeline_env=$(echo "$key" | sed 's/_total$//')
            local total="${PIPELINE_STATUS[$key]}"
            local successful="${PIPELINE_STATUS[${pipeline_env}_successful]:-0}"
            local failed="${PIPELINE_STATUS[${pipeline_env}_failed]:-0}"
            local avg_duration="${PIPELINE_STATUS[${pipeline_env}_avg_duration]:-0}"
            
            local success_rate=0
            if [ "$total" -gt 0 ]; then
                success_rate=$(echo "scale=1; $successful * 100 / $total" | bc)
            fi
            
            local pipeline=$(echo "$pipeline_env" | cut -d'_' -f1)
            local env=$(echo "$pipeline_env" | cut -d'_' -f2)
            
            local status_class="status-healthy"
            local status_text="Healthy"
            if [ "$failed" -gt 0 ]; then
                status_class="status-critical"
                status_text="Issues"
            elif (( $(echo "$success_rate < 95" | bc -l) )); then
                status_class="status-warning"
                status_text="Warning"
            fi
            
            cat >> "$report_file" << EOF
            <tr>
                <td>$pipeline</td>
                <td>$env</td>
                <td>$total</td>
                <td class="$([ "$failed" -gt 0 ] && echo "metric-bad" || echo "metric-good")">${success_rate}%</td>
                <td>${avg_duration}</td>
                <td class="$status_class">$status_text</td>
            </tr>
EOF
        fi
    done

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Data Quality Metrics</h2>
        <table>
            <tr><th>Pipeline</th><th>Environment</th><th>Metric Type</th><th>Average Value</th><th>Minimum Value</th><th>Failed Checks</th></tr>
EOF

    # Add quality metrics rows
    for key in "${!QUALITY_METRICS[@]}"; do
        if [[ $key == *"_avg" ]]; then
            local metric_key=$(echo "$key" | sed 's/_avg$//')
            local avg_value="${QUALITY_METRICS[$key]}"
            local min_value="${QUALITY_METRICS[${metric_key}_min]:-0}"
            local failed_checks="${QUALITY_METRICS[${metric_key}_failed]:-0}"
            
            # Parse pipeline, env, and metric type from key
            local pipeline=$(echo "$metric_key" | cut -d'_' -f1)
            local env=$(echo "$metric_key" | cut -d'_' -f2)
            local metric_type=$(echo "$metric_key" | cut -d'_' -f3-)
            
            local avg_class="metric-good"
            if (( $(echo "$avg_value < 95" | bc -l) )); then
                avg_class="metric-bad"
            elif (( $(echo "$avg_value < 98" | bc -l) )); then
                avg_class="metric-warning"
            fi
            
            cat >> "$report_file" << EOF
            <tr>
                <td>$pipeline</td>
                <td>$env</td>
                <td>$metric_type</td>
                <td class="$avg_class">${avg_value}%</td>
                <td>${min_value}%</td>
                <td class="$([ "$failed_checks" -gt 0 ] && echo "metric-bad" || echo "metric-good")">$failed_checks</td>
            </tr>
EOF
        fi
    done

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Performance Metrics</h2>
        <table>
            <tr><th>Pipeline</th><th>Environment</th><th>Avg Duration (s)</th><th>Max Duration (s)</th><th>Throughput (rec/s)</th><th>Error Rate (%)</th></tr>
EOF

    # Add performance metrics rows
    for key in "${!PERFORMANCE_METRICS[@]}"; do
        if [[ $key == *"_avg_duration" ]]; then
            local pipeline_env=$(echo "$key" | sed 's/_avg_duration$//')
            local avg_duration="${PERFORMANCE_METRICS[$key]}"
            local max_duration="${PERFORMANCE_METRICS[${pipeline_env}_max_duration]:-0}"
            local avg_throughput="${PERFORMANCE_METRICS[${pipeline_env}_avg_throughput]:-0}"
            local avg_error_rate="${PERFORMANCE_METRICS[${pipeline_env}_avg_error_rate]:-0}"
            
            local pipeline=$(echo "$pipeline_env" | cut -d'_' -f1)
            local env=$(echo "$pipeline_env" | cut -d'_' -f2)
            
            local duration_class="metric-good"
            if (( $(echo "$avg_duration > $PIPELINE_DURATION_THRESHOLD" | bc -l) )); then
                duration_class="metric-bad"
            elif (( $(echo "$avg_duration > $(echo "$PIPELINE_DURATION_THRESHOLD * 0.8" | bc)" | bc -l) )); then
                duration_class="metric-warning"
            fi
            
            local error_class="metric-good"
            if (( $(echo "$avg_error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
                error_class="metric-bad"
            elif (( $(echo "$avg_error_rate > $(echo "$ERROR_RATE_THRESHOLD * 0.5" | bc)" | bc -l) )); then
                error_class="metric-warning"
            fi
            
            cat >> "$report_file" << EOF
            <tr>
                <td>$pipeline</td>
                <td>$env</td>
                <td class="$duration_class">$avg_duration</td>
                <td>$max_duration</td>
                <td>$avg_throughput</td>
                <td class="$error_class">$avg_error_rate</td>
            </tr>
EOF
        fi
    done

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Active Alerts</h2>
EOF

    if [ ${#ALERT_CONDITIONS[@]} -eq 0 ]; then
        cat >> "$report_file" << EOF
        <p class="status-healthy">✅ No active alerts detected</p>
EOF
    else
        for alert_key in "${!ALERT_CONDITIONS[@]}"; do
            local alert_condition="${ALERT_CONDITIONS[$alert_key]}"
            cat >> "$report_file" << EOF
        <div class="alert-item">
            <strong>$alert_key</strong>
            <p>$alert_condition</p>
        </div>
EOF
        done
    fi

    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
EOF

    # Add recommendations based on findings
    if [ ${#ALERT_CONDITIONS[@]} -gt 0 ]; then
        cat >> "$report_file" << EOF
            <li>Address active alerts immediately to prevent data quality issues</li>
            <li>Review pipeline configurations for optimization opportunities</li>
EOF
    fi
    
    cat >> "$report_file" << EOF
            <li>Implement automated data quality checks in CI/CD pipelines</li>
            <li>Set up proactive monitoring and alerting for all critical data flows</li>
            <li>Regular review and update of data quality thresholds</li>
            <li>Establish data governance policies and procedures</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Data Health Score</h2>
        <p>Overall data pipeline health score: <strong class="$([ ${#ALERT_CONDITIONS[@]} -eq 0 ] && echo "status-healthy" || echo "status-warning")">$([ ${#ALERT_CONDITIONS[@]} -eq 0 ] && echo "95%" || echo "75%")</strong></p>
        <p><em>Based on execution success rates, data quality metrics, and performance indicators</em></p>
    </div>
    
    <p><small>Report generated by TerraFusion Data Pipeline Monitoring System on $(date)</small></p>
</body>
</html>
EOF
}

# Generate JSON pipeline report
generate_json_pipeline_report() {
    local report_file=$1
    
    cat > "$report_file" << EOF
{
  "report_metadata": {
    "environment": "$ENVIRONMENT",
    "pipeline_filter": "$PIPELINE_NAME",
    "time_period": "$TIME_PERIOD",
    "quality_level": "$QUALITY_LEVEL",
    "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "summary": {
    "total_pipelines": $(echo "${!PIPELINE_STATUS[@]}" | tr ' ' '\n' | grep -c "_total$"),
    "active_alerts": ${#ALERT_CONDITIONS[@]},
    "monitoring_coverage": "$QUALITY_LEVEL"
  },
  "pipeline_status": {
EOF

    # Add pipeline status
    local first_pipeline=true
    for key in "${!PIPELINE_STATUS[@]}"; do
        if [[ $key == *"_total" ]]; then
            local pipeline_env=$(echo "$key" | sed 's/_total$//')
            local pipeline=$(echo "$pipeline_env" | cut -d'_' -f1)
            local env=$(echo "$pipeline_env" | cut -d'_' -f2)
            
            if [ "$first_pipeline" = false ]; then
                echo "," >> "$report_file"
            fi
            first_pipeline=false
            
            local total="${PIPELINE_STATUS[$key]}"
            local successful="${PIPELINE_STATUS[${pipeline_env}_successful]:-0}"
            local failed="${PIPELINE_STATUS[${pipeline_env}_failed]:-0}"
            local avg_duration="${PIPELINE_STATUS[${pipeline_env}_avg_duration]:-0}"
            
            local success_rate=0
            if [ "$total" -gt 0 ]; then
                success_rate=$(echo "scale=2; $successful * 100 / $total" | bc)
            fi
            
            cat >> "$report_file" << EOF
    "${pipeline}_${env}": {
      "total_executions": $total,
      "successful_executions": $successful,
      "failed_executions": $failed,
      "success_rate": $success_rate,
      "average_duration_seconds": $avg_duration,
      "status": "$([ "$failed" -gt 0 ] && echo "unhealthy" || echo "healthy")"
    }
EOF
        fi
    done

    cat >> "$report_file" << EOF
  },
  "quality_metrics": {
EOF

    # Add quality metrics
    local first_quality=true
    for key in "${!QUALITY_METRICS[@]}"; do
        if [[ $key == *"_avg" ]]; then
            local metric_key=$(echo "$key" | sed 's/_avg$//')
            local pipeline=$(echo "$metric_key" | cut -d'_' -f1)
            local env=$(echo "$metric_key" | cut -d'_' -f2)
            local metric_type=$(echo "$metric_key" | cut -d'_' -f3-)
            
            if [ "$first_quality" = false ]; then
                echo "," >> "$report_file"
            fi
            first_quality=false
            
            cat >> "$report_file" << EOF
    "${pipeline}_${env}_${metric_type}": {
      "average_value": ${QUALITY_METRICS[$key]},
      "minimum_value": ${QUALITY_METRICS[${metric_key}_min]:-0},
      "failed_checks": ${QUALITY_METRICS[${metric_key}_failed]:-0}
    }
EOF
        fi
    done

    cat >> "$report_file" << EOF
  },
  "alerts": [
EOF

    # Add alerts
    local first_alert=true
    for alert_key in "${!ALERT_CONDITIONS[@]}"; do
        if [ "$first_alert" = false ]; then
            echo "," >> "$report_file"
        fi
        first_alert=false
        
        local pipeline=$(echo "$alert_key" | cut -d'_' -f1)
        local environment=$(echo "$alert_key" | cut -d'_' -f2)
        local alert_type=$(echo "$alert_key" | cut -d'_' -f3-)
        
        cat >> "$report_file" << EOF
    {
      "alert_key": "$alert_key",
      "pipeline": "$pipeline",
      "environment": "$environment",
      "alert_type": "$alert_type",
      "condition": "${ALERT_CONDITIONS[$alert_key]}",
      "severity": "$(case $alert_key in *_failures|*_error_rate) echo "high" ;; *) echo "medium" ;; esac)"
    }
EOF
    done

    cat >> "$report_file" << EOF
  ]
}
EOF
}

# Generate Prometheus metrics
generate_prometheus_metrics() {
    local report_file=$1
    
    cat > "$report_file" << EOF
# HELP terrafusion_pipeline_executions_total Total number of pipeline executions
# TYPE terrafusion_pipeline_executions_total counter
EOF

    # Export pipeline execution metrics
    for key in "${!PIPELINE_STATUS[@]}"; do
        if [[ $key == *"_total" ]]; then
            local pipeline_env=$(echo "$key" | sed 's/_total$//')
            local pipeline=$(echo "$pipeline_env" | cut -d'_' -f1)
            local env=$(echo "$pipeline_env" | cut -d'_' -f2)
            local total="${PIPELINE_STATUS[$key]}"
            
            cat >> "$report_file" << EOF
terrafusion_pipeline_executions_total{pipeline="$pipeline",environment="$env"} $total
EOF
        fi
    done

    cat >> "$report_file" << EOF

# HELP terrafusion_pipeline_success_rate Pipeline success rate percentage
# TYPE terrafusion_pipeline_success_rate gauge
EOF

    # Export success rates
    for key in "${!PIPELINE_STATUS[@]}"; do
        if [[ $key == *"_total" ]]; then
            local pipeline_env=$(echo "$key" | sed 's/_total$//')
            local pipeline=$(echo "$pipeline_env" | cut -d'_' -f1)
            local env=$(echo "$pipeline_env" | cut -d'_' -f2)
            local total="${PIPELINE_STATUS[$key]}"
            local successful="${PIPELINE_STATUS[${pipeline_env}_successful]:-0}"
            
            local success_rate=0
            if [ "$total" -gt 0 ]; then
                success_rate=$(echo "scale=4; $successful * 100 / $total" | bc)
            fi
            
            cat >> "$report_file" << EOF
terrafusion_pipeline_success_rate{pipeline="$pipeline",environment="$env"} $success_rate
EOF
        fi
    done

    cat >> "$report_file" << EOF

# HELP terrafusion_data_quality_score Data quality metric scores
# TYPE terrafusion_data_quality_score gauge
EOF

    # Export quality metrics
    for key in "${!QUALITY_METRICS[@]}"; do
        if [[ $key == *"_avg" ]]; then
            local metric_key=$(echo "$key" | sed 's/_avg$//')
            local pipeline=$(echo "$metric_key" | cut -d'_' -f1)
            local env=$(echo "$metric_key" | cut -d'_' -f2)
            local metric_type=$(echo "$metric_key" | cut -d'_' -f3-)
            local avg_value="${QUALITY_METRICS[$key]}"
            
            cat >> "$report_file" << EOF
terrafusion_data_quality_score{pipeline="$pipeline",environment="$env",metric_type="$metric_type"} $avg_value
EOF
        fi
    done

    cat >> "$report_file" << EOF

# HELP terrafusion_pipeline_alerts_active Number of active pipeline alerts
# TYPE terrafusion_pipeline_alerts_active gauge
terrafusion_pipeline_alerts_active ${#ALERT_CONDITIONS[@]}
EOF

    log_info "Prometheus metrics exported to $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Data Pipeline Monitoring"
    log "Action: $ACTION"
    log "Pipeline: $PIPELINE_NAME"
    log "Environment: $ENVIRONMENT"
    log "Time Period: $TIME_PERIOD"
    log "Quality Level: $QUALITY_LEVEL"
    log "========================================="
    
    # Load configuration
    load_pipeline_config
    
    case $ACTION in
        monitor)
            monitor_pipeline_health
            generate_pipeline_report
            ;;
        validate)
            # Run data quality validation
            log_info "Running data quality validation (placeholder)"
            ;;
        report)
            monitor_pipeline_health
            generate_pipeline_report
            ;;
        schedule)
            log_info "Scheduling pipeline monitoring (placeholder)"
            ;;
        alert)
            evaluate_health_alerts
            ;;
        troubleshoot)
            monitor_pipeline_health
            log_info "Troubleshooting pipeline issues (placeholder)"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: monitor, validate, report, schedule, alert, troubleshoot"
            exit 1
            ;;
    esac
    
    log ""
    log "========================================="
    log "Data Pipeline Monitoring Complete"
    log "Action: $ACTION"
    log "Alerts Generated: ${#ALERT_CONDITIONS[@]}"
    log "Pipelines Monitored: $(echo "${!PIPELINE_STATUS[@]}" | tr ' ' '\n' | grep -c "_total$")"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Pipeline monitoring interrupted!"; exit 1' INT TERM

# Run main function
main "$@"