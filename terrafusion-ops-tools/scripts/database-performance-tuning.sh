#!/bin/bash

# TerraFusion Advanced Database Performance Tuning Automation
# AI-powered database optimization with predictive tuning

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
TUNING_DB="${TUNING_DB:-terrafusion_tuning}"
TUNING_USER="${DB_USER:-tftuning}"
TUNING_PASS="${DB_PASS:-$(generate_password)}"
TARGET_DB_HOST="${TARGET_DB_HOST:-localhost}"
TARGET_DB_PORT="${TARGET_DB_PORT:-5432}"
TUNING_INTERVAL="${TUNING_INTERVAL:-3600}" # 1 hour
ML_ENABLED="${ML_ENABLED:-true}"

# Initialize database
init_tuning_database() {
    log_info "Initializing database tuning system..."
    
    psql -U postgres -c "CREATE DATABASE ${TUNING_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${TUNING_USER} WITH PASSWORD '${TUNING_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${TUNING_DB} TO ${TUNING_USER};"
    
    psql -U ${TUNING_USER} -d ${TUNING_DB} <<EOF
-- Database instances
CREATE TABLE IF NOT EXISTS database_instances (
    id SERIAL PRIMARY KEY,
    instance_name VARCHAR(255) UNIQUE NOT NULL,
    db_type VARCHAR(50), -- postgresql, mysql, mongodb, redis
    version VARCHAR(50),
    host VARCHAR(255),
    port INTEGER,
    total_memory_gb INTEGER,
    cpu_cores INTEGER,
    storage_type VARCHAR(50), -- ssd, hdd, nvme
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    timestamp TIMESTAMP NOT NULL,
    queries_per_second DECIMAL(10,2),
    average_query_time_ms DECIMAL(10,2),
    p95_query_time_ms DECIMAL(10,2),
    p99_query_time_ms DECIMAL(10,2),
    active_connections INTEGER,
    cache_hit_ratio DECIMAL(5,2),
    buffer_hit_ratio DECIMAL(5,2),
    disk_read_rate_mb DECIMAL(10,2),
    disk_write_rate_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    deadlock_count INTEGER DEFAULT 0,
    slow_query_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query performance
CREATE TABLE IF NOT EXISTS query_performance (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    query_hash VARCHAR(64),
    query_template TEXT,
    execution_count BIGINT DEFAULT 0,
    total_time_ms BIGINT DEFAULT 0,
    mean_time_ms DECIMAL(10,2),
    stddev_time_ms DECIMAL(10,2),
    min_time_ms DECIMAL(10,2),
    max_time_ms DECIMAL(10,2),
    rows_returned BIGINT DEFAULT 0,
    shared_blks_hit BIGINT DEFAULT 0,
    shared_blks_read BIGINT DEFAULT 0,
    temp_blks_written BIGINT DEFAULT 0,
    last_executed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instance_id, query_hash)
);

-- Index recommendations
CREATE TABLE IF NOT EXISTS index_recommendations (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    table_schema VARCHAR(255),
    table_name VARCHAR(255),
    column_names TEXT[],
    index_type VARCHAR(50), -- btree, hash, gin, gist
    estimated_benefit_score DECIMAL(5,2),
    estimated_size_mb INTEGER,
    recommendation_reason TEXT,
    sql_statement TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, applied, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP
);

-- Configuration parameters
CREATE TABLE IF NOT EXISTS config_parameters (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    parameter_name VARCHAR(255),
    current_value TEXT,
    recommended_value TEXT,
    unit VARCHAR(50),
    category VARCHAR(100), -- memory, checkpoint, vacuum, query_planner
    impact_score DECIMAL(3,2), -- 0-1 score of performance impact
    risk_level VARCHAR(20), -- low, medium, high
    description TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instance_id, parameter_name)
);

-- Tuning history
CREATE TABLE IF NOT EXISTS tuning_history (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    parameter_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    performance_before JSONB,
    performance_after JSONB,
    rollback_command TEXT,
    applied_by VARCHAR(255) DEFAULT 'auto-tuner',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rolled_back BOOLEAN DEFAULT false,
    rolled_back_at TIMESTAMP
);

-- Workload patterns
CREATE TABLE IF NOT EXISTS workload_patterns (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    pattern_name VARCHAR(255),
    pattern_type VARCHAR(50), -- oltp, olap, mixed, batch
    time_window VARCHAR(50), -- business_hours, off_hours, weekend
    characteristics JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(3,2)
);

-- ML models for prediction
CREATE TABLE IF NOT EXISTS tuning_models (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    model_type VARCHAR(50), -- performance_predictor, workload_classifier
    model_data BYTEA,
    features JSONB,
    accuracy_score DECIMAL(3,2),
    training_data_points INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_trained TIMESTAMP
);

-- Alerts and issues
CREATE TABLE IF NOT EXISTS performance_alerts (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES database_instances(id),
    alert_type VARCHAR(100),
    severity VARCHAR(20),
    message TEXT,
    details JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    auto_resolved BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_instance_time ON performance_metrics(instance_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_instance ON query_performance(instance_id, mean_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_index_recommendations_status ON index_recommendations(instance_id, status);
CREATE INDEX IF NOT EXISTS idx_tuning_history_instance ON tuning_history(instance_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_active ON performance_alerts(instance_id, resolved_at) WHERE resolved_at IS NULL;
EOF
    
    log_success "Database tuning system initialized"
}

# Collect database metrics
collect_metrics() {
    local instance_name=$1
    
    log_info "Collecting metrics for ${instance_name}..."
    
    # PostgreSQL metrics collection
    python3 <<EOF
import psycopg2
import json
from datetime import datetime
import hashlib

# Connect to tuning database
tuning_conn = psycopg2.connect(
    dbname="${TUNING_DB}",
    user="${TUNING_USER}",
    password="${TUNING_PASS}",
    host="localhost"
)
tuning_cur = tuning_conn.cursor()

# Get instance info
tuning_cur.execute(
    "SELECT id, host, port FROM database_instances WHERE instance_name = %s",
    ("${instance_name}",)
)
instance = tuning_cur.fetchone()
if not instance:
    print(f"Instance ${instance_name} not found")
    exit(1)

instance_id, host, port = instance

# Connect to target database
target_conn = psycopg2.connect(
    host=host,
    port=port,
    dbname="postgres",
    user="${DB_USER}",
    password="${DB_PASS}"
)
target_cur = target_conn.cursor()

# Collect general metrics
target_cur.execute("""
    SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
        (SELECT count(*) FROM pg_stat_activity) as total_connections,
        (SELECT sum(blks_hit)::float / (sum(blks_hit) + sum(blks_read)) * 100 
         FROM pg_stat_database WHERE blks_hit + blks_read > 0) as cache_hit_ratio,
        (SELECT sum(xact_commit + xact_rollback) / 
         EXTRACT(EPOCH FROM (now() - stats_reset)) 
         FROM pg_stat_database) as tps,
        (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock') as lock_waits,
        (SELECT count(*) FROM pg_stat_user_tables WHERE n_dead_tup > n_live_tup * 0.2) as tables_need_vacuum
""")

metrics = target_cur.fetchone()

# Collect query statistics
target_cur.execute("""
    SELECT 
        query,
        calls,
        total_time,
        mean_time,
        stddev_time,
        min_time,
        max_time,
        rows,
        shared_blks_hit,
        shared_blks_read,
        temp_blks_written
    FROM pg_stat_statements
    WHERE query NOT LIKE 'COPY%'
    AND query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_time DESC
    LIMIT 100
""")

queries = target_cur.fetchall()

# Store metrics
tuning_cur.execute("""
    INSERT INTO performance_metrics (
        instance_id, timestamp, queries_per_second, active_connections,
        cache_hit_ratio, cpu_usage_percent
    ) VALUES (%s, %s, %s, %s, %s, %s)
""", (
    instance_id,
    datetime.now(),
    metrics[3],  # TPS
    metrics[1],  # Total connections
    metrics[2],  # Cache hit ratio
    0  # CPU usage (would need system metrics)
))

# Store query performance
for query_data in queries:
    query_text = query_data[0]
    query_hash = hashlib.md5(query_text.encode()).hexdigest()
    
    tuning_cur.execute("""
        INSERT INTO query_performance (
            instance_id, query_hash, query_template, execution_count,
            total_time_ms, mean_time_ms, stddev_time_ms, min_time_ms,
            max_time_ms, rows_returned, shared_blks_hit, shared_blks_read,
            temp_blks_written, last_executed
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (instance_id, query_hash) DO UPDATE SET
            execution_count = EXCLUDED.execution_count,
            total_time_ms = EXCLUDED.total_time_ms,
            mean_time_ms = EXCLUDED.mean_time_ms,
            last_executed = EXCLUDED.last_executed
    """, (
        instance_id, query_hash, query_text[:1000], query_data[1],
        query_data[2], query_data[3], query_data[4], query_data[5],
        query_data[6], query_data[7], query_data[8], query_data[9],
        query_data[10], datetime.now()
    ))

# Analyze missing indexes
target_cur.execute("""
    SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
    FROM pg_stats
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    AND n_distinct > 100
    AND correlation < 0.1
    ORDER BY n_distinct DESC
    LIMIT 20
""")

index_candidates = target_cur.fetchall()

for schema, table, column, n_distinct, correlation in index_candidates:
    # Check if index already exists
    target_cur.execute("""
        SELECT 1 FROM pg_indexes
        WHERE schemaname = %s
        AND tablename = %s
        AND indexdef LIKE %s
    """, (schema, table, f'%{column}%'))
    
    if not target_cur.fetchone():
        # Calculate benefit score
        benefit_score = min(100, (n_distinct / 1000) * 50 + (1 - abs(correlation)) * 50)
        
        tuning_cur.execute("""
            INSERT INTO index_recommendations (
                instance_id, table_schema, table_name, column_names,
                index_type, estimated_benefit_score, recommendation_reason,
                sql_statement
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            instance_id, schema, table, [column], 'btree',
            benefit_score,
            f'High cardinality column ({n_distinct} distinct values) with low correlation',
            f'CREATE INDEX idx_{table}_{column} ON {schema}.{table}({column});'
        ))

tuning_conn.commit()
target_conn.close()
tuning_conn.close()

print("Metrics collection complete")
EOF
    
    log_success "Metrics collected for ${instance_name}"
}

# Analyze performance
analyze_performance() {
    local instance_name=$1
    
    log_info "Analyzing performance for ${instance_name}..."
    
    python3 <<EOF
import psycopg2
import numpy as np
from datetime import datetime, timedelta
import json

conn = psycopg2.connect(
    dbname="${TUNING_DB}",
    user="${TUNING_USER}",
    password="${TUNING_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get instance ID
cur.execute(
    "SELECT id, total_memory_gb, cpu_cores FROM database_instances WHERE instance_name = %s",
    ("${instance_name}",)
)
instance = cur.fetchone()
if not instance:
    exit(1)

instance_id, total_memory_gb, cpu_cores = instance

# Analyze recent performance trends
cur.execute("""
    SELECT 
        AVG(queries_per_second) as avg_qps,
        AVG(cache_hit_ratio) as avg_cache_hit,
        AVG(cpu_usage_percent) as avg_cpu,
        MAX(queries_per_second) as max_qps,
        STDDEV(queries_per_second) as stddev_qps
    FROM performance_metrics
    WHERE instance_id = %s
    AND timestamp > NOW() - INTERVAL '24 hours'
""", (instance_id,))

perf_stats = cur.fetchone()

# PostgreSQL parameter recommendations
recommendations = []

# Shared buffers (25% of RAM is typical)
recommended_shared_buffers = int(total_memory_gb * 0.25 * 1024)
recommendations.append({
    'parameter': 'shared_buffers',
    'recommended': f'{recommended_shared_buffers}MB',
    'category': 'memory',
    'impact': 0.9,
    'risk': 'low',
    'description': 'Main cache for database pages'
})

# Effective cache size (50-75% of RAM)
recommended_cache_size = int(total_memory_gb * 0.75 * 1024)
recommendations.append({
    'parameter': 'effective_cache_size',
    'recommended': f'{recommended_cache_size}MB',
    'category': 'query_planner',
    'impact': 0.7,
    'risk': 'low',
    'description': 'Estimate of OS cache available for PostgreSQL'
})

# Work mem (RAM / max_connections / 2)
work_mem = int((total_memory_gb * 1024) / 100 / 2)
recommendations.append({
    'parameter': 'work_mem',
    'recommended': f'{work_mem}MB',
    'category': 'memory',
    'impact': 0.8,
    'risk': 'medium',
    'description': 'Memory for sort and hash operations'
})

# Maintenance work mem (5-10% of RAM)
maint_work_mem = int(total_memory_gb * 0.1 * 1024)
recommendations.append({
    'parameter': 'maintenance_work_mem',
    'recommended': f'{maint_work_mem}MB',
    'category': 'memory',
    'impact': 0.6,
    'risk': 'low',
    'description': 'Memory for maintenance operations'
})

# Checkpoint settings based on workload
if perf_stats and perf_stats[0] > 1000:  # High throughput
    recommendations.extend([
        {
            'parameter': 'checkpoint_segments',
            'recommended': '64',
            'category': 'checkpoint',
            'impact': 0.8,
            'risk': 'medium',
            'description': 'Number of WAL segments between checkpoints'
        },
        {
            'parameter': 'checkpoint_completion_target',
            'recommended': '0.9',
            'category': 'checkpoint',
            'impact': 0.7,
            'risk': 'low',
            'description': 'Spread checkpoint I/O over time'
        }
    ])

# Store recommendations
for rec in recommendations:
    cur.execute("""
        INSERT INTO config_parameters (
            instance_id, parameter_name, recommended_value,
            unit, category, impact_score, risk_level, description
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (instance_id, parameter_name) DO UPDATE SET
            recommended_value = EXCLUDED.recommended_value,
            last_updated = CURRENT_TIMESTAMP
    """, (
        instance_id, rec['parameter'], rec['recommended'],
        rec.get('unit', ''), rec['category'], rec['impact'],
        rec['risk'], rec['description']
    ))

# Detect workload patterns
cur.execute("""
    WITH hourly_stats AS (
        SELECT 
            EXTRACT(HOUR FROM timestamp) as hour,
            AVG(queries_per_second) as qps,
            AVG(cpu_usage_percent) as cpu
        FROM performance_metrics
        WHERE instance_id = %s
        AND timestamp > NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(HOUR FROM timestamp)
    )
    SELECT 
        CASE 
            WHEN AVG(CASE WHEN hour BETWEEN 9 AND 17 THEN qps END) > 
                 AVG(CASE WHEN hour NOT BETWEEN 9 AND 17 THEN qps END) * 2
            THEN 'business_hours_heavy'
            WHEN STDDEV(qps) < AVG(qps) * 0.2
            THEN 'steady_load'
            ELSE 'variable_load'
        END as pattern
    FROM hourly_stats
""", (instance_id,))

workload_pattern = cur.fetchone()[0]

cur.execute("""
    INSERT INTO workload_patterns (
        instance_id, pattern_name, pattern_type, characteristics
    ) VALUES (%s, %s, %s, %s)
""", (
    instance_id,
    workload_pattern,
    'temporal',
    json.dumps({
        'avg_qps': float(perf_stats[0]) if perf_stats[0] else 0,
        'qps_variability': float(perf_stats[4] / perf_stats[0]) if perf_stats[0] else 0
    })
))

# Check for performance issues
issues = []

# Low cache hit ratio
if perf_stats and perf_stats[1] < 90:
    issues.append({
        'type': 'low_cache_hit_ratio',
        'severity': 'warning',
        'message': f'Cache hit ratio {perf_stats[1]:.1f}% is below recommended 90%',
        'details': {
            'current_ratio': float(perf_stats[1]),
            'recommended_ratio': 90
        }
    })

# High CPU usage
if perf_stats and perf_stats[2] > 80:
    issues.append({
        'type': 'high_cpu_usage',
        'severity': 'critical',
        'message': f'CPU usage {perf_stats[2]:.1f}% is critically high',
        'details': {
            'current_cpu': float(perf_stats[2]),
            'threshold': 80
        }
    })

# Store alerts
for issue in issues:
    cur.execute("""
        INSERT INTO performance_alerts (
            instance_id, alert_type, severity, message, details
        ) VALUES (%s, %s, %s, %s, %s)
    """, (
        instance_id, issue['type'], issue['severity'],
        issue['message'], json.dumps(issue['details'])
    ))

conn.commit()
conn.close()

print(f"Performance analysis complete. Found {len(issues)} issues.")
EOF
    
    log_success "Performance analysis complete"
}

# Apply tuning recommendations
apply_tuning() {
    local instance_name=$1
    local risk_level=${2:-"low"}
    
    log_info "Applying tuning recommendations for ${instance_name} (risk: ${risk_level})..."
    
    python3 <<EOF
import psycopg2
import subprocess
import json
from datetime import datetime

# Connect to tuning database
tuning_conn = psycopg2.connect(
    dbname="${TUNING_DB}",
    user="${TUNING_USER}",
    password="${TUNING_PASS}",
    host="localhost"
)
tuning_cur = tuning_conn.cursor()

# Get instance info
tuning_cur.execute(
    "SELECT id, host, port, db_type FROM database_instances WHERE instance_name = %s",
    ("${instance_name}",)
)
instance = tuning_cur.fetchone()
if not instance:
    exit(1)

instance_id, host, port, db_type = instance

# Get recommendations to apply
risk_levels = ['low']
if '${risk_level}' in ['medium', 'high']:
    risk_levels.append('medium')
if '${risk_level}' == 'high':
    risk_levels.append('high')

tuning_cur.execute("""
    SELECT 
        parameter_name, 
        current_value, 
        recommended_value,
        risk_level,
        description
    FROM config_parameters
    WHERE instance_id = %s
    AND risk_level = ANY(%s)
    AND (current_value IS NULL OR current_value != recommended_value)
    ORDER BY impact_score DESC
""", (instance_id, risk_levels))

recommendations = tuning_cur.fetchall()

# Connect to target database
target_conn = psycopg2.connect(
    host=host,
    port=port,
    dbname="postgres",
    user="${DB_USER}",
    password="${DB_PASS}"
)
target_cur = target_conn.cursor()

applied_count = 0

for param_name, current_value, recommended_value, risk_level, description in recommendations:
    print(f"Applying {param_name}: {current_value} -> {recommended_value}")
    
    # Get current performance metrics
    tuning_cur.execute("""
        SELECT 
            AVG(queries_per_second),
            AVG(cache_hit_ratio),
            AVG(cpu_usage_percent)
        FROM performance_metrics
        WHERE instance_id = %s
        AND timestamp > NOW() - INTERVAL '1 hour'
    """, (instance_id,))
    
    perf_before = tuning_cur.fetchone()
    
    try:
        if db_type == 'postgresql':
            # Apply PostgreSQL parameter
            if param_name in ['shared_buffers', 'work_mem', 'maintenance_work_mem']:
                # Parameters that require restart
                target_cur.execute(
                    "ALTER SYSTEM SET %s = %s",
                    (param_name, recommended_value)
                )
                print(f"Set {param_name} = {recommended_value} (requires restart)")
            else:
                # Parameters that can be reloaded
                target_cur.execute(
                    "ALTER SYSTEM SET %s = %s",
                    (param_name, recommended_value)
                )
                target_cur.execute("SELECT pg_reload_conf()")
                print(f"Set and reloaded {param_name} = {recommended_value}")
        
        # Record the change
        tuning_cur.execute("""
            INSERT INTO tuning_history (
                instance_id, parameter_name, old_value, new_value,
                change_reason, performance_before, rollback_command
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            instance_id, param_name, current_value, recommended_value,
            f"Auto-tuning: {description}",
            json.dumps({
                'qps': float(perf_before[0]) if perf_before[0] else 0,
                'cache_hit': float(perf_before[1]) if perf_before[1] else 0,
                'cpu': float(perf_before[2]) if perf_before[2] else 0
            }),
            f"ALTER SYSTEM SET {param_name} = '{current_value}';"
        ))
        
        # Update current value
        tuning_cur.execute("""
            UPDATE config_parameters
            SET current_value = recommended_value
            WHERE instance_id = %s AND parameter_name = %s
        """, (instance_id, param_name))
        
        applied_count += 1
        
    except Exception as e:
        print(f"Error applying {param_name}: {e}")
        tuning_cur.execute("""
            INSERT INTO performance_alerts (
                instance_id, alert_type, severity, message, details
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            instance_id, 'tuning_failed', 'error',
            f'Failed to apply parameter {param_name}',
            json.dumps({'error': str(e), 'parameter': param_name})
        ))

target_conn.commit()
tuning_conn.commit()
target_conn.close()
tuning_conn.close()

print(f"Applied {applied_count} tuning recommendations")
EOF
    
    log_success "Tuning recommendations applied"
}

# Train ML models
train_ml_models() {
    local instance_name=$1
    
    log_info "Training ML models for ${instance_name}..."
    
    python3 <<EOF
import psycopg2
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timedelta
import json

conn = psycopg2.connect(
    dbname="${TUNING_DB}",
    user="${TUNING_USER}",
    password="${TUNING_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get instance ID
cur.execute(
    "SELECT id FROM database_instances WHERE instance_name = %s",
    ("${instance_name}",)
)
instance_id = cur.fetchone()[0]

# Fetch training data
cur.execute("""
    SELECT 
        timestamp,
        queries_per_second,
        cache_hit_ratio,
        cpu_usage_percent,
        memory_usage_percent,
        active_connections,
        slow_query_count
    FROM performance_metrics
    WHERE instance_id = %s
    AND timestamp > NOW() - INTERVAL '30 days'
    ORDER BY timestamp
""", (instance_id,))

data = pd.DataFrame(
    cur.fetchall(),
    columns=['timestamp', 'qps', 'cache_hit', 'cpu', 'memory', 'connections', 'slow_queries']
)

if len(data) < 100:
    print("Insufficient data for ML training")
    exit(0)

# Feature engineering
data['hour'] = pd.to_datetime(data['timestamp']).dt.hour
data['day_of_week'] = pd.to_datetime(data['timestamp']).dt.dayofweek
data['is_business_hours'] = ((data['hour'] >= 9) & (data['hour'] <= 17)).astype(int)

# Train performance predictor
features = ['hour', 'day_of_week', 'is_business_hours', 'connections']
X = data[features]
y = data['qps']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Random Forest for QPS prediction
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_scaled, y)

# Calculate accuracy
from sklearn.model_selection import cross_val_score
cv_scores = cross_val_score(rf_model, X_scaled, y, cv=5, scoring='r2')
accuracy = cv_scores.mean()

# Train anomaly detector
anomaly_features = ['qps', 'cache_hit', 'cpu', 'memory', 'slow_queries']
X_anomaly = data[anomaly_features].fillna(0)
X_anomaly_scaled = scaler.fit_transform(X_anomaly)

iso_model = IsolationForest(contamination=0.05, random_state=42)
iso_model.fit(X_anomaly_scaled)

# Save models
model_data = {
    'performance_predictor': {
        'model': rf_model,
        'scaler': scaler,
        'features': features
    },
    'anomaly_detector': {
        'model': iso_model,
        'scaler': scaler,
        'features': anomaly_features
    }
}

model_bytes = joblib.dumps(model_data)

# Store model
cur.execute("""
    INSERT INTO tuning_models (
        instance_id, model_type, model_data, features,
        accuracy_score, training_data_points, last_trained
    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (instance_id, model_type) DO UPDATE SET
        model_data = EXCLUDED.model_data,
        accuracy_score = EXCLUDED.accuracy_score,
        last_trained = EXCLUDED.last_trained
""", (
    instance_id, 'ml_ensemble', model_bytes,
    json.dumps({'predictor': features, 'anomaly': anomaly_features}),
    accuracy, len(data), datetime.now()
))

conn.commit()
conn.close()

print(f"ML models trained with accuracy: {accuracy:.2f}")
EOF
    
    log_success "ML models trained successfully"
}

# Generate tuning report
generate_report() {
    local instance_name=$1
    local output_file=${2:-"db-tuning-report.html"}
    
    log_info "Generating database tuning report..."
    
    # Create report data
    psql -U ${TUNING_USER} -d ${TUNING_DB} -t <<EOF > tuning-stats.txt
-- Database performance summary
SELECT 
    di.instance_name,
    di.db_type,
    di.version,
    ROUND(AVG(pm.queries_per_second)::numeric, 2) as avg_qps,
    ROUND(AVG(pm.cache_hit_ratio)::numeric, 2) as avg_cache_hit,
    ROUND(AVG(pm.cpu_usage_percent)::numeric, 2) as avg_cpu,
    COUNT(DISTINCT DATE(pm.timestamp)) as days_monitored
FROM database_instances di
JOIN performance_metrics pm ON di.id = pm.instance_id
WHERE di.instance_name = '${instance_name}'
AND pm.timestamp > NOW() - INTERVAL '7 days'
GROUP BY di.instance_name, di.db_type, di.version;

-- Top slow queries
SELECT 
    LEFT(query_template, 80) as query,
    execution_count,
    ROUND(mean_time_ms::numeric, 2) as avg_time_ms,
    ROUND(max_time_ms::numeric, 2) as max_time_ms
FROM query_performance qp
JOIN database_instances di ON qp.instance_id = di.id
WHERE di.instance_name = '${instance_name}'
ORDER BY mean_time_ms DESC
LIMIT 10;

-- Recent tuning changes
SELECT 
    parameter_name,
    old_value,
    new_value,
    to_char(applied_at, 'YYYY-MM-DD HH24:MI') as applied_at
FROM tuning_history th
JOIN database_instances di ON th.instance_id = di.id
WHERE di.instance_name = '${instance_name}'
ORDER BY applied_at DESC
LIMIT 10;

-- Active recommendations
SELECT 
    parameter_name,
    current_value,
    recommended_value,
    risk_level,
    ROUND(impact_score::numeric, 2) as impact
FROM config_parameters cp
JOIN database_instances di ON cp.instance_id = di.id
WHERE di.instance_name = '${instance_name}'
AND (current_value IS NULL OR current_value != recommended_value)
ORDER BY impact_score DESC
LIMIT 10;
EOF
    
    # Generate visualizations
    python3 <<EOF
import matplotlib.pyplot as plt
import psycopg2
import pandas as pd
from datetime import datetime, timedelta

conn = psycopg2.connect(
    dbname="${TUNING_DB}",
    user="${TUNING_USER}",
    password="${TUNING_PASS}",
    host="localhost"
)

# Get instance ID
cur = conn.cursor()
cur.execute(
    "SELECT id FROM database_instances WHERE instance_name = %s",
    ("${instance_name}",)
)
instance_id = cur.fetchone()[0]

# Create performance trend chart
query = """
    SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        AVG(queries_per_second) as qps,
        AVG(cache_hit_ratio) as cache_hit,
        AVG(cpu_usage_percent) as cpu
    FROM performance_metrics
    WHERE instance_id = %s
    AND timestamp > NOW() - INTERVAL '24 hours'
    GROUP BY hour
    ORDER BY hour
"""

df = pd.read_sql(query, conn, params=(instance_id,))

fig, axes = plt.subplots(3, 1, figsize=(12, 10), sharex=True)

# QPS trend
axes[0].plot(df['hour'], df['qps'], 'b-', linewidth=2)
axes[0].set_ylabel('Queries/Second')
axes[0].set_title('Database Performance Trends (Last 24 Hours)')
axes[0].grid(True, alpha=0.3)

# Cache hit ratio
axes[1].plot(df['hour'], df['cache_hit'], 'g-', linewidth=2)
axes[1].set_ylabel('Cache Hit Ratio (%)')
axes[1].axhline(y=90, color='r', linestyle='--', alpha=0.5)
axes[1].grid(True, alpha=0.3)

# CPU usage
axes[2].plot(df['hour'], df['cpu'], 'r-', linewidth=2)
axes[2].set_ylabel('CPU Usage (%)')
axes[2].set_xlabel('Time')
axes[2].axhline(y=80, color='r', linestyle='--', alpha=0.5)
axes[2].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('db-performance-trends.png', dpi=150, bbox_inches='tight')

conn.close()
EOF
    
    # Generate HTML report
    cat > ${output_file} <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Database Tuning Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .summary { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 28px; font-weight: bold; color: #1976d2; }
        .metric-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        tr:hover { background: #f9f9f9; }
        .risk-low { color: #4caf50; }
        .risk-medium { color: #ff9800; }
        .risk-high { color: #f44336; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .chart { text-align: center; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Database Performance Tuning Report</h1>
        <p>Generated: $(date)</p>
        
        <div class="summary">
            <h2>Performance Summary</h2>
EOF
    
    # Add summary metrics
    head -n 7 tuning-stats.txt | awk -F'|' 'NR==1 {
        print "<div class=\"metric\">"
        print "  <div class=\"metric-label\">Instance</div>"
        print "  <div class=\"metric-value\">" $1 "</div>"
        print "</div>"
        print "<div class=\"metric\">"
        print "  <div class=\"metric-label\">Type</div>"
        print "  <div class=\"metric-value\">" $2 " " $3 "</div>"
        print "</div>"
        print "<div class=\"metric\">"
        print "  <div class=\"metric-label\">Avg QPS</div>"
        print "  <div class=\"metric-value\">" $4 "</div>"
        print "</div>"
        print "<div class=\"metric\">"
        print "  <div class=\"metric-label\">Cache Hit</div>"
        print "  <div class=\"metric-value\">" $5 "%</div>"
        print "</div>"
        print "<div class=\"metric\">"
        print "  <div class=\"metric-label\">CPU Usage</div>"
        print "  <div class=\"metric-value\">" $6 "%</div>"
        print "</div>"
    }' >> ${output_file}
    
    cat >> ${output_file} <<'EOF'
        </div>
        
        <div class="chart">
            <h2>Performance Trends</h2>
            <img src="db-performance-trends.png" alt="Performance Trends" style="max-width: 100%;">
        </div>
        
        <h2>Top Slow Queries</h2>
        <table>
            <tr>
                <th>Query</th>
                <th>Executions</th>
                <th>Avg Time (ms)</th>
                <th>Max Time (ms)</th>
            </tr>
EOF
    
    # Add slow queries
    sed -n '9,18p' tuning-stats.txt | awk -F'|' '{
        print "<tr>"
        print "  <td><code>" $1 "</code></td>"
        print "  <td>" $2 "</td>"
        print "  <td>" $3 "</td>"
        print "  <td>" $4 "</td>"
        print "</tr>"
    }' >> ${output_file}
    
    cat >> ${output_file} <<'EOF'
        </table>
        
        <h2>Recent Tuning Changes</h2>
        <table>
            <tr>
                <th>Parameter</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Applied</th>
            </tr>
EOF
    
    # Add tuning history
    sed -n '20,29p' tuning-stats.txt | awk -F'|' '{
        print "<tr>"
        print "  <td><code>" $1 "</code></td>"
        print "  <td>" $2 "</td>"
        print "  <td><strong>" $3 "</strong></td>"
        print "  <td>" $4 "</td>"
        print "</tr>"
    }' >> ${output_file}
    
    cat >> ${output_file} <<'EOF'
        </table>
        
        <h2>Recommended Optimizations</h2>
EOF
    
    # Add recommendations
    sed -n '31,$p' tuning-stats.txt | awk -F'|' '{
        risk_class = "risk-" $4
        gsub(/ /, "", risk_class)
        print "<div class=\"recommendation\">"
        print "  <strong>" $1 "</strong>"
        print "  <span class=\"" risk_class "\" style=\"float: right;\">Risk: " $4 " | Impact: " $5 "</span><br>"
        print "  Current: <code>" $2 "</code> → Recommended: <code>" $3 "</code>"
        print "</div>"
    }' >> ${output_file}
    
    cat >> ${output_file} <<'EOF'
    </div>
</body>
</html>
EOF
    
    rm -f tuning-stats.txt
    log_success "Database tuning report generated: ${output_file}"
}

# Main execution
case ${1:-} in
    "init")
        init_tuning_database
        ;;
        
    "register")
        # Register database instance
        psql -U ${TUNING_USER} -d ${TUNING_DB} <<EOF
INSERT INTO database_instances (
    instance_name, db_type, version, host, port,
    total_memory_gb, cpu_cores, storage_type
) VALUES (
    '$2', '${3:-postgresql}', '${4:-14}', '${5:-localhost}', ${6:-5432},
    ${7:-16}, ${8:-4}, '${9:-ssd}'
)
ON CONFLICT (instance_name) DO UPDATE SET
    updated_at = CURRENT_TIMESTAMP;
EOF
        log_success "Database instance $2 registered"
        ;;
        
    "collect")
        collect_metrics "$2"
        ;;
        
    "analyze")
        analyze_performance "$2"
        ;;
        
    "tune")
        apply_tuning "$2" "${3:-low}"
        ;;
        
    "train")
        train_ml_models "$2"
        ;;
        
    "report")
        generate_report "$2" "${3:-db-tuning-report.html}"
        ;;
        
    *)
        echo "Usage: $0 {init|register|collect|analyze|tune|train|report} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                          - Initialize tuning system"
        echo "  register <name> [type] [ver]  - Register database instance"
        echo "  collect <instance>            - Collect performance metrics"
        echo "  analyze <instance>            - Analyze performance"
        echo "  tune <instance> [risk]        - Apply tuning (risk: low/medium/high)"
        echo "  train <instance>              - Train ML models"
        echo "  report <instance> [file]      - Generate tuning report"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 register prod-db postgresql 14 db.example.com 5432 32 8 ssd"
        echo "  $0 collect prod-db"
        echo "  $0 analyze prod-db"
        echo "  $0 tune prod-db medium"
        echo "  $0 report prod-db tuning-report.html"
        exit 1
        ;;
esac