#!/bin/bash

# TerraFusion Intelligent Alerting with Anomaly Detection
# ML-powered alerting system with predictive analytics

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
ALERT_DB="${ALERT_DB:-terrafusion_alerts}"
ALERT_USER="${DB_USER:-tfalerts}"
ALERT_PASS="${DB_PASS:-$(generate_password)}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}}"
ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}}"
ML_MODEL_PATH="${ML_MODEL_PATH:-/opt/terrafusion/ml-models}"
ANOMALY_THRESHOLD="${ANOMALY_THRESHOLD:-0.95}"

# Initialize database
init_alert_database() {
    log_info "Initializing intelligent alerting database..."
    
    psql -U postgres -c "CREATE DATABASE ${ALERT_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${ALERT_USER} WITH PASSWORD '${ALERT_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${ALERT_DB} TO ${ALERT_USER};"
    
    psql -U ${ALERT_USER} -d ${ALERT_DB} <<EOF
-- Alert definitions
CREATE TABLE IF NOT EXISTS alert_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    metric_query TEXT NOT NULL,
    condition_type VARCHAR(50), -- threshold, rate, anomaly, prediction
    threshold_value DECIMAL(20,4),
    comparison_operator VARCHAR(10),
    evaluation_window_minutes INTEGER DEFAULT 5,
    severity VARCHAR(20) DEFAULT 'warning',
    labels JSONB DEFAULT '{}',
    annotations JSONB DEFAULT '{}',
    ml_model_id VARCHAR(100),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert instances
CREATE TABLE IF NOT EXISTS alert_instances (
    id SERIAL PRIMARY KEY,
    alert_definition_id INTEGER REFERENCES alert_definitions(id),
    fingerprint VARCHAR(64) UNIQUE NOT NULL,
    state VARCHAR(20), -- pending, firing, resolved
    started_at TIMESTAMP,
    resolved_at TIMESTAMP,
    labels JSONB,
    annotations JSONB,
    value DECIMAL(20,4),
    anomaly_score DECIMAL(3,2),
    prediction_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    alert_instance_id INTEGER REFERENCES alert_instances(id),
    state VARCHAR(20),
    value DECIMAL(20,4),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metric baselines
CREATE TABLE IF NOT EXISTS metric_baselines (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(500),
    labels_hash VARCHAR(64),
    time_bucket VARCHAR(20), -- hour_of_day, day_of_week, day_of_month
    mean_value DECIMAL(20,4),
    std_deviation DECIMAL(20,4),
    min_value DECIMAL(20,4),
    max_value DECIMAL(20,4),
    p50_value DECIMAL(20,4),
    p95_value DECIMAL(20,4),
    p99_value DECIMAL(20,4),
    sample_count INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_name, labels_hash, time_bucket)
);

-- Anomaly detections
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(500),
    labels JSONB,
    timestamp TIMESTAMP,
    value DECIMAL(20,4),
    expected_value DECIMAL(20,4),
    anomaly_score DECIMAL(3,2),
    detection_method VARCHAR(100),
    is_anomaly BOOLEAN,
    baseline_id INTEGER REFERENCES metric_baselines(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML models
CREATE TABLE IF NOT EXISTS ml_models (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50), -- isolation_forest, lstm, prophet, arima
    target_metric VARCHAR(500),
    features JSONB,
    hyperparameters JSONB,
    performance_metrics JSONB,
    model_data BYTEA,
    training_data_start TIMESTAMP,
    training_data_end TIMESTAMP,
    last_trained_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert correlations
CREATE TABLE IF NOT EXISTS alert_correlations (
    id SERIAL PRIMARY KEY,
    primary_alert_id INTEGER REFERENCES alert_instances(id),
    correlated_alert_id INTEGER REFERENCES alert_instances(id),
    correlation_score DECIMAL(3,2),
    correlation_type VARCHAR(50), -- temporal, causal, spatial
    time_lag_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prediction results
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) REFERENCES ml_models(id),
    metric_name VARCHAR(500),
    labels JSONB,
    prediction_time TIMESTAMP,
    predicted_value DECIMAL(20,4),
    confidence_interval_lower DECIMAL(20,4),
    confidence_interval_upper DECIMAL(20,4),
    confidence_score DECIMAL(3,2),
    actual_value DECIMAL(20,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert suppressions
CREATE TABLE IF NOT EXISTS alert_suppressions (
    id SERIAL PRIMARY KEY,
    alert_definition_id INTEGER REFERENCES alert_definitions(id),
    reason VARCHAR(500),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_instances_state ON alert_instances(state, started_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_instance ON alert_history(alert_instance_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_metric_baselines_lookup ON metric_baselines(metric_name, labels_hash, time_bucket);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_metric ON anomaly_detections(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_predictions_metric ON predictions(metric_name, prediction_time);
CREATE INDEX IF NOT EXISTS idx_alert_correlations_primary ON alert_correlations(primary_alert_id);
EOF
    
    log_success "Alert database initialized"
}

# Deploy ML models
deploy_ml_models() {
    log_info "Deploying ML models for anomaly detection..."
    
    mkdir -p "${ML_MODEL_PATH}"
    
    # Create anomaly detection model
    python3 <<EOF
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import psycopg2
from datetime import datetime, timedelta
import json

# Connect to database
conn = psycopg2.connect(
    dbname="${ALERT_DB}",
    user="${ALERT_USER}",
    password="${ALERT_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Train Isolation Forest model
def train_isolation_forest(metric_name, lookback_days=30):
    # Fetch historical data
    cur.execute("""
        SELECT timestamp, value, labels
        FROM metric_history
        WHERE metric_name = %s
        AND timestamp > NOW() - INTERVAL '%s days'
        ORDER BY timestamp
    """, (metric_name, lookback_days))
    
    data = cur.fetchall()
    if len(data) < 100:
        print(f"Insufficient data for {metric_name}")
        return None
    
    # Prepare features
    df = pd.DataFrame(data, columns=['timestamp', 'value', 'labels'])
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
    df['minute'] = pd.to_datetime(df['timestamp']).dt.minute
    
    # Calculate rolling statistics
    df['rolling_mean'] = df['value'].rolling(window=10, min_periods=1).mean()
    df['rolling_std'] = df['value'].rolling(window=10, min_periods=1).std()
    df['diff'] = df['value'].diff()
    
    # Prepare feature matrix
    features = ['value', 'hour', 'day_of_week', 'minute', 'rolling_mean', 'rolling_std', 'diff']
    X = df[features].fillna(0)
    
    # Train model
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=100
    )
    model.fit(X_scaled)
    
    # Save model
    model_id = f"isolation_forest_{metric_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    model_path = f"{ML_MODEL_PATH}/{model_id}.joblib"
    
    joblib.dump({
        'model': model,
        'scaler': scaler,
        'features': features
    }, model_path)
    
    # Store model metadata
    cur.execute("""
        INSERT INTO ml_models (
            id, name, model_type, target_metric, features,
            hyperparameters, model_data, training_data_start,
            training_data_end, last_trained_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        model_id,
        f"Isolation Forest for {metric_name}",
        'isolation_forest',
        metric_name,
        json.dumps(features),
        json.dumps({
            'contamination': 0.05,
            'n_estimators': 100
        }),
        open(model_path, 'rb').read(),
        datetime.now() - timedelta(days=lookback_days),
        datetime.now(),
        datetime.now()
    ))
    
    conn.commit()
    return model_id

# Train LSTM model for time series prediction
def train_lstm_model(metric_name, lookback_days=90):
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout
        from sklearn.preprocessing import MinMaxScaler
        
        # Fetch historical data
        cur.execute("""
            SELECT timestamp, value
            FROM metric_history
            WHERE metric_name = %s
            AND timestamp > NOW() - INTERVAL '%s days'
            ORDER BY timestamp
        """, (metric_name, lookback_days))
        
        data = cur.fetchall()
        if len(data) < 1000:
            print(f"Insufficient data for LSTM on {metric_name}")
            return None
        
        # Prepare data
        df = pd.DataFrame(data, columns=['timestamp', 'value'])
        values = df['value'].values.reshape(-1, 1)
        
        # Normalize
        scaler = MinMaxScaler()
        scaled_values = scaler.fit_transform(values)
        
        # Create sequences
        sequence_length = 60
        X, y = [], []
        for i in range(sequence_length, len(scaled_values)):
            X.append(scaled_values[i-sequence_length:i, 0])
            y.append(scaled_values[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = X.reshape(X.shape[0], X.shape[1], 1)
        
        # Build model
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),
            Dropout(0.2),
            LSTM(50, return_sequences=True),
            Dropout(0.2),
            LSTM(50),
            Dropout(0.2),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        
        # Train
        model.fit(X, y, epochs=50, batch_size=32, validation_split=0.2, verbose=0)
        
        # Save model
        model_id = f"lstm_{metric_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        model_path = f"{ML_MODEL_PATH}/{model_id}.h5"
        model.save(model_path)
        
        # Save scaler
        scaler_path = f"{ML_MODEL_PATH}/{model_id}_scaler.joblib"
        joblib.dump(scaler, scaler_path)
        
        # Store model metadata
        cur.execute("""
            INSERT INTO ml_models (
                id, name, model_type, target_metric,
                hyperparameters, training_data_start,
                training_data_end, last_trained_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            model_id,
            f"LSTM for {metric_name}",
            'lstm',
            metric_name,
            json.dumps({
                'sequence_length': sequence_length,
                'lstm_units': 50,
                'dropout_rate': 0.2,
                'epochs': 50
            }),
            datetime.now() - timedelta(days=lookback_days),
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        return model_id
        
    except ImportError:
        print("TensorFlow not available for LSTM models")
        return None

# Example: Train models for common metrics
common_metrics = [
    'cpu_usage_percent',
    'memory_usage_percent',
    'disk_io_rate',
    'network_traffic_rate',
    'http_request_rate',
    'error_rate',
    'response_time_ms'
]

for metric in common_metrics:
    print(f"Training models for {metric}...")
    isolation_forest_id = train_isolation_forest(metric)
    lstm_id = train_lstm_model(metric)
    print(f"Models trained: IF={isolation_forest_id}, LSTM={lstm_id}")

cur.close()
conn.close()
EOF
    
    log_success "ML models deployed"
}

# Create intelligent alerts
create_intelligent_alerts() {
    log_info "Creating intelligent alert definitions..."
    
    # Define alert templates
    cat > alert-definitions.yaml <<EOF
alerts:
  # Anomaly-based alerts
  - name: cpu_anomaly_detection
    description: "Detects anomalous CPU usage patterns"
    metric_query: "avg(rate(cpu_usage_seconds_total[5m])) by (instance)"
    condition_type: anomaly
    ml_model_id: "isolation_forest_cpu_usage_percent"
    severity: warning
    labels:
      category: performance
      ml_enabled: "true"
    annotations:
      summary: "Anomalous CPU usage detected on {{ \$labels.instance }}"
      description: "CPU usage pattern is unusual with anomaly score {{ \$value }}"
      
  - name: traffic_spike_prediction
    description: "Predicts traffic spikes before they occur"
    metric_query: "sum(rate(http_requests_total[5m])) by (service)"
    condition_type: prediction
    ml_model_id: "lstm_http_request_rate"
    threshold_value: 1000
    comparison_operator: ">"
    severity: warning
    labels:
      category: capacity
      predictive: "true"
    annotations:
      summary: "Traffic spike predicted for {{ \$labels.service }}"
      description: "Expected traffic increase to {{ \$value }} req/s in next 30 minutes"
      
  # Smart threshold alerts
  - name: adaptive_memory_alert
    description: "Memory alert with adaptive thresholds"
    metric_query: "node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes"
    condition_type: adaptive_threshold
    evaluation_window_minutes: 10
    severity: warning
    labels:
      category: resource
      adaptive: "true"
    annotations:
      summary: "Memory usage exceeds adaptive threshold on {{ \$labels.instance }}"
      description: "Current usage {{ \$value }}% exceeds dynamic threshold"
      
  # Correlation-based alerts
  - name: service_degradation_pattern
    description: "Detects correlated service degradation"
    metric_query: |
      (
        increase(http_request_duration_seconds_bucket{le="1"}[5m]) /
        increase(http_request_duration_seconds_count[5m])
      ) < 0.95
    condition_type: correlation
    severity: critical
    labels:
      category: sla
      correlation_enabled: "true"
    annotations:
      summary: "Service degradation pattern detected"
      description: "Multiple correlated indicators show service degradation"
      
  # Predictive capacity alerts
  - name: disk_space_forecast
    description: "Predicts disk space exhaustion"
    metric_query: "predict_linear(node_filesystem_avail_bytes[4h], 3600 * 24)"
    condition_type: threshold
    threshold_value: 0
    comparison_operator: "<"
    severity: warning
    labels:
      category: capacity
      forecast: "true"
    annotations:
      summary: "Disk space will be exhausted on {{ \$labels.instance }}"
      description: "Filesystem {{ \$labels.mountpoint }} predicted to fill within 24 hours"
EOF
    
    # Load alert definitions
    python3 <<EOF
import yaml
import psycopg2
import json

conn = psycopg2.connect(
    dbname="${ALERT_DB}",
    user="${ALERT_USER}",
    password="${ALERT_PASS}",
    host="localhost"
)
cur = conn.cursor()

with open('alert-definitions.yaml', 'r') as f:
    config = yaml.safe_load(f)

for alert in config['alerts']:
    cur.execute("""
        INSERT INTO alert_definitions (
            name, description, metric_query, condition_type,
            threshold_value, comparison_operator, evaluation_window_minutes,
            severity, labels, annotations, ml_model_id, enabled
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            metric_query = EXCLUDED.metric_query,
            updated_at = CURRENT_TIMESTAMP
    """, (
        alert['name'],
        alert['description'],
        alert['metric_query'],
        alert.get('condition_type', 'threshold'),
        alert.get('threshold_value'),
        alert.get('comparison_operator'),
        alert.get('evaluation_window_minutes', 5),
        alert.get('severity', 'warning'),
        json.dumps(alert.get('labels', {})),
        json.dumps(alert.get('annotations', {})),
        alert.get('ml_model_id'),
        True
    ))

conn.commit()
cur.close()
conn.close()
EOF
    
    log_success "Intelligent alerts created"
}

# Run anomaly detection
run_anomaly_detection() {
    log_info "Running anomaly detection..."
    
    python3 <<EOF
import numpy as np
import pandas as pd
import psycopg2
from datetime import datetime, timedelta
import joblib
import json
import hashlib
import requests

# Connect to database
conn = psycopg2.connect(
    dbname="${ALERT_DB}",
    user="${ALERT_USER}",
    password="${ALERT_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Prometheus query function
def query_prometheus(query, time=None):
    params = {'query': query}
    if time:
        params['time'] = time
    
    response = requests.get(f"${PROMETHEUS_URL}/api/v1/query", params=params)
    if response.status_code == 200:
        return response.json()['data']['result']
    return []

# Calculate metric baseline
def update_baseline(metric_name, labels, value, timestamp):
    labels_hash = hashlib.md5(json.dumps(labels, sort_keys=True).encode()).hexdigest()
    time_bucket = f"hour_{timestamp.hour}"
    
    cur.execute("""
        INSERT INTO metric_baselines (
            metric_name, labels_hash, time_bucket, mean_value,
            std_deviation, min_value, max_value, sample_count
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        ON CONFLICT (metric_name, labels_hash, time_bucket) DO UPDATE SET
            mean_value = (
                metric_baselines.mean_value * metric_baselines.sample_count + %s
            ) / (metric_baselines.sample_count + 1),
            min_value = LEAST(metric_baselines.min_value, %s),
            max_value = GREATEST(metric_baselines.max_value, %s),
            sample_count = metric_baselines.sample_count + 1,
            last_updated = CURRENT_TIMESTAMP
    """, (
        metric_name, labels_hash, time_bucket, value, 0, value, value,
        value, value, value
    ))

# Detect anomalies using Isolation Forest
def detect_anomaly_isolation_forest(model_id, metric_name, value, timestamp):
    try:
        # Load model
        cur.execute("SELECT model_data FROM ml_models WHERE id = %s", (model_id,))
        model_data = cur.fetchone()
        if not model_data:
            return None
            
        model_dict = joblib.loads(model_data[0])
        model = model_dict['model']
        scaler = model_dict['scaler']
        features = model_dict['features']
        
        # Prepare features
        feature_values = {
            'value': value,
            'hour': timestamp.hour,
            'day_of_week': timestamp.weekday(),
            'minute': timestamp.minute,
            'rolling_mean': value,  # Simplified
            'rolling_std': 0,       # Simplified
            'diff': 0               # Simplified
        }
        
        X = np.array([[feature_values[f] for f in features]])
        X_scaled = scaler.transform(X)
        
        # Predict
        anomaly_score = model.decision_function(X)[0]
        is_anomaly = model.predict(X_scaled)[0] == -1
        
        # Normalize score to 0-1 range
        anomaly_score = 1 / (1 + np.exp(-anomaly_score))
        
        return {
            'score': float(anomaly_score),
            'is_anomaly': bool(is_anomaly),
            'method': 'isolation_forest'
        }
        
    except Exception as e:
        print(f"Error in anomaly detection: {e}")
        return None

# Statistical anomaly detection
def detect_anomaly_statistical(metric_name, labels, value, timestamp):
    labels_hash = hashlib.md5(json.dumps(labels, sort_keys=True).encode()).hexdigest()
    time_bucket = f"hour_{timestamp.hour}"
    
    # Get baseline
    cur.execute("""
        SELECT mean_value, std_deviation, sample_count
        FROM metric_baselines
        WHERE metric_name = %s
        AND labels_hash = %s
        AND time_bucket = %s
    """, (metric_name, labels_hash, time_bucket))
    
    baseline = cur.fetchone()
    if not baseline or baseline[2] < 10:  # Need at least 10 samples
        return None
        
    mean, std, _ = baseline
    if std == 0:
        std = 0.01  # Avoid division by zero
        
    # Calculate z-score
    z_score = abs(value - mean) / std
    
    # Determine if anomaly (z-score > 3)
    is_anomaly = z_score > 3
    anomaly_score = min(1.0, z_score / 4)  # Normalize to 0-1
    
    return {
        'score': float(anomaly_score),
        'is_anomaly': bool(is_anomaly),
        'method': 'statistical_zscore',
        'expected_value': float(mean)
    }

# Process alerts
cur.execute("""
    SELECT id, name, metric_query, condition_type, ml_model_id
    FROM alert_definitions
    WHERE enabled = true
    AND condition_type IN ('anomaly', 'adaptive_threshold')
""")

alerts = cur.fetchall()

for alert_id, alert_name, metric_query, condition_type, ml_model_id in alerts:
    print(f"Processing alert: {alert_name}")
    
    # Query current metric values
    results = query_prometheus(metric_query)
    
    for result in results:
        labels = result['metric']
        value = float(result['value'][1])
        timestamp = datetime.fromtimestamp(result['value'][0])
        
        # Update baseline
        update_baseline(alert_name, labels, value, timestamp)
        
        # Detect anomaly
        anomaly_result = None
        
        if condition_type == 'anomaly' and ml_model_id:
            anomaly_result = detect_anomaly_isolation_forest(
                ml_model_id, alert_name, value, timestamp
            )
        elif condition_type in ['anomaly', 'adaptive_threshold']:
            anomaly_result = detect_anomaly_statistical(
                alert_name, labels, value, timestamp
            )
        
        if anomaly_result:
            # Store anomaly detection
            cur.execute("""
                INSERT INTO anomaly_detections (
                    metric_name, labels, timestamp, value,
                    expected_value, anomaly_score, detection_method,
                    is_anomaly
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                alert_name,
                json.dumps(labels),
                timestamp,
                value,
                anomaly_result.get('expected_value'),
                anomaly_result['score'],
                anomaly_result['method'],
                anomaly_result['is_anomaly']
            ))
            
            # Create alert if anomaly detected
            if anomaly_result['is_anomaly']:
                fingerprint = hashlib.md5(
                    f"{alert_id}{json.dumps(labels)}".encode()
                ).hexdigest()
                
                cur.execute("""
                    INSERT INTO alert_instances (
                        alert_definition_id, fingerprint, state,
                        started_at, labels, value, anomaly_score
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (fingerprint) DO UPDATE SET
                        value = EXCLUDED.value,
                        anomaly_score = EXCLUDED.anomaly_score
                """, (
                    alert_id, fingerprint, 'firing',
                    timestamp, json.dumps(labels), value,
                    anomaly_result['score']
                ))

conn.commit()
cur.close()
conn.close()

print("Anomaly detection completed")
EOF
    
    log_success "Anomaly detection completed"
}

# Alert correlation analysis
analyze_correlations() {
    log_info "Analyzing alert correlations..."
    
    python3 <<EOF
import numpy as np
import pandas as pd
import psycopg2
from datetime import datetime, timedelta
from scipy.stats import pearsonr
import json

conn = psycopg2.connect(
    dbname="${ALERT_DB}",
    user="${ALERT_USER}",
    password="${ALERT_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get recent alerts
cur.execute("""
    SELECT 
        ai.id,
        ai.alert_definition_id,
        ad.name,
        ai.started_at,
        ai.labels
    FROM alert_instances ai
    JOIN alert_definitions ad ON ai.alert_definition_id = ad.id
    WHERE ai.started_at > NOW() - INTERVAL '24 hours'
    ORDER BY ai.started_at
""")

alerts = pd.DataFrame(
    cur.fetchall(),
    columns=['id', 'definition_id', 'name', 'started_at', 'labels']
)

if len(alerts) > 1:
    # Temporal correlation
    for i in range(len(alerts)):
        for j in range(i + 1, len(alerts)):
            time_diff = (alerts.iloc[j]['started_at'] - alerts.iloc[i]['started_at']).total_seconds()
            
            # Check if alerts occurred within 5 minutes
            if 0 < time_diff < 300:
                correlation_score = 1.0 - (time_diff / 300)
                
                cur.execute("""
                    INSERT INTO alert_correlations (
                        primary_alert_id, correlated_alert_id,
                        correlation_score, correlation_type, time_lag_seconds
                    ) VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (
                    alerts.iloc[i]['id'],
                    alerts.iloc[j]['id'],
                    correlation_score,
                    'temporal',
                    int(time_diff)
                ))
    
    # Causal correlation (based on service dependencies)
    service_alerts = alerts[alerts['labels'].str.contains('"service"')]
    
    for _, alert in service_alerts.iterrows():
        labels = json.loads(alert['labels'])
        if 'service' in labels:
            # Find alerts from dependent services
            cur.execute("""
                SELECT DISTINCT ai2.id
                FROM alert_instances ai1
                JOIN alert_instances ai2 ON ai2.id != ai1.id
                WHERE ai1.id = %s
                AND ai2.labels->>'service' IN (
                    SELECT callee.name
                    FROM service_dependencies sd
                    JOIN services caller ON sd.caller_service_id = caller.id
                    JOIN services callee ON sd.callee_service_id = callee.id
                    WHERE caller.name = %s
                )
                AND ABS(EXTRACT(EPOCH FROM (ai2.started_at - ai1.started_at))) < 600
            """, (alert['id'], labels['service']))
            
            dependent_alerts = cur.fetchall()
            for (dep_alert_id,) in dependent_alerts:
                cur.execute("""
                    INSERT INTO alert_correlations (
                        primary_alert_id, correlated_alert_id,
                        correlation_score, correlation_type
                    ) VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (alert['id'], dep_alert_id, 0.8, 'causal'))

conn.commit()
cur.close()
conn.close()

print("Correlation analysis completed")
EOF
    
    log_success "Alert correlation analysis completed"
}

# Generate alert insights
generate_insights() {
    local output_file=${1:-"alert-insights.html"}
    
    log_info "Generating alert insights..."
    
    # Create insights report
    cat > generate_insights.py <<'EOF'
import psycopg2
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import json

conn = psycopg2.connect(
    dbname="${ALERT_DB}",
    user="${ALERT_USER}",
    password="${ALERT_PASS}",
    host="localhost"
)

# Generate visualizations
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# 1. Alert frequency by severity
ax = axes[0, 0]
query = """
    SELECT ad.severity, COUNT(*) as count
    FROM alert_instances ai
    JOIN alert_definitions ad ON ai.alert_definition_id = ad.id
    WHERE ai.started_at > NOW() - INTERVAL '7 days'
    GROUP BY ad.severity
"""
df = pd.read_sql(query, conn)
df.plot(kind='bar', x='severity', y='count', ax=ax, legend=False)
ax.set_title('Alert Frequency by Severity (Last 7 Days)')
ax.set_xlabel('Severity')
ax.set_ylabel('Count')

# 2. Anomaly detection accuracy
ax = axes[0, 1]
query = """
    SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN is_anomaly THEN 1 END) as anomalies,
        COUNT(*) as total
    FROM anomaly_detections
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date
"""
df = pd.read_sql(query, conn, parse_dates=['date'])
df['anomaly_rate'] = df['anomalies'] / df['total'] * 100
df.plot(x='date', y='anomaly_rate', ax=ax, marker='o')
ax.set_title('Anomaly Detection Rate Over Time')
ax.set_xlabel('Date')
ax.set_ylabel('Anomaly Rate (%)')

# 3. Top correlated alerts
ax = axes[1, 0]
query = """
    SELECT 
        ad1.name as primary_alert,
        ad2.name as correlated_alert,
        AVG(ac.correlation_score) as avg_correlation
    FROM alert_correlations ac
    JOIN alert_instances ai1 ON ac.primary_alert_id = ai1.id
    JOIN alert_instances ai2 ON ac.correlated_alert_id = ai2.id
    JOIN alert_definitions ad1 ON ai1.alert_definition_id = ad1.id
    JOIN alert_definitions ad2 ON ai2.alert_definition_id = ad2.id
    GROUP BY ad1.name, ad2.name
    ORDER BY avg_correlation DESC
    LIMIT 10
"""
df = pd.read_sql(query, conn)
if not df.empty:
    df['alert_pair'] = df['primary_alert'].str[:20] + ' -> ' + df['correlated_alert'].str[:20]
    df.plot(kind='barh', x='alert_pair', y='avg_correlation', ax=ax, legend=False)
    ax.set_title('Top Correlated Alerts')
    ax.set_xlabel('Correlation Score')

# 4. ML model performance
ax = axes[1, 1]
query = """
    SELECT 
        model_type,
        COUNT(*) as prediction_count,
        AVG(confidence_score) as avg_confidence
    FROM predictions p
    JOIN ml_models m ON p.model_id = m.id
    WHERE p.created_at > NOW() - INTERVAL '7 days'
    GROUP BY model_type
"""
df = pd.read_sql(query, conn)
if not df.empty:
    df.plot(kind='bar', x='model_type', y='avg_confidence', ax=ax, legend=False)
    ax.set_title('ML Model Performance')
    ax.set_xlabel('Model Type')
    ax.set_ylabel('Average Confidence Score')

plt.tight_layout()
plt.savefig('alert-insights.png', dpi=150, bbox_inches='tight')

# Generate HTML report
html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Alert Insights</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .metric h3 { margin: 0 0 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .anomaly { color: #d9534f; }
        .prediction { color: #5bc0de; }
    </style>
</head>
<body>
    <h1>TerraFusion Alert Insights</h1>
    <p>Generated: {timestamp}</p>
    
    <h2>Key Metrics</h2>
    {metrics}
    
    <h2>Recent Anomalies</h2>
    {anomalies}
    
    <h2>Active Predictions</h2>
    {predictions}
    
    <h2>Alert Correlations</h2>
    {correlations}
    
    <h2>Visualizations</h2>
    <img src="alert-insights.png" style="max-width: 100%;">
</body>
</html>
"""

# Get key metrics
metrics_html = ""
queries = [
    ("Total Alerts (24h)", "SELECT COUNT(*) FROM alert_instances WHERE started_at > NOW() - INTERVAL '24 hours'"),
    ("Active Alerts", "SELECT COUNT(*) FROM alert_instances WHERE state = 'firing'"),
    ("Anomalies Detected (24h)", "SELECT COUNT(*) FROM anomaly_detections WHERE created_at > NOW() - INTERVAL '24 hours' AND is_anomaly = true"),
    ("Average Anomaly Score", "SELECT AVG(anomaly_score)::DECIMAL(3,2) FROM anomaly_detections WHERE created_at > NOW() - INTERVAL '24 hours'")
]

for title, query in queries:
    cur = conn.cursor()
    cur.execute(query)
    value = cur.fetchone()[0] or 0
    metrics_html += f'''
    <div class="metric">
        <h3>{title}</h3>
        <div class="metric-value">{value}</div>
    </div>
    '''

# Get recent anomalies
cur.execute("""
    SELECT 
        metric_name,
        timestamp,
        value,
        anomaly_score,
        detection_method
    FROM anomaly_detections
    WHERE is_anomaly = true
    AND created_at > NOW() - INTERVAL '6 hours'
    ORDER BY anomaly_score DESC
    LIMIT 10
""")

anomalies_html = "<table><tr><th>Metric</th><th>Time</th><th>Value</th><th>Anomaly Score</th><th>Method</th></tr>"
for row in cur.fetchall():
    anomalies_html += f"<tr><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]:.2f}</td><td class='anomaly'>{row[3]:.2f}</td><td>{row[4]}</td></tr>"
anomalies_html += "</table>"

# Get active predictions
cur.execute("""
    SELECT 
        m.name,
        p.prediction_time,
        p.predicted_value,
        p.confidence_score
    FROM predictions p
    JOIN ml_models m ON p.model_id = m.id
    WHERE p.prediction_time > NOW()
    AND p.created_at > NOW() - INTERVAL '1 hour'
    ORDER BY p.confidence_score DESC
    LIMIT 10
""")

predictions_html = "<table><tr><th>Model</th><th>Prediction Time</th><th>Predicted Value</th><th>Confidence</th></tr>"
for row in cur.fetchall():
    predictions_html += f"<tr><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]:.2f}</td><td class='prediction'>{row[3]:.2f}</td></tr>"
predictions_html += "</table>"

# Get correlations
cur.execute("""
    SELECT 
        ad1.name as alert1,
        ad2.name as alert2,
        ac.correlation_score,
        ac.correlation_type
    FROM alert_correlations ac
    JOIN alert_instances ai1 ON ac.primary_alert_id = ai1.id
    JOIN alert_instances ai2 ON ac.correlated_alert_id = ai2.id
    JOIN alert_definitions ad1 ON ai1.alert_definition_id = ad1.id
    JOIN alert_definitions ad2 ON ai2.alert_definition_id = ad2.id
    WHERE ac.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY ac.correlation_score DESC
    LIMIT 10
""")

correlations_html = "<table><tr><th>Primary Alert</th><th>Correlated Alert</th><th>Score</th><th>Type</th></tr>"
for row in cur.fetchall():
    correlations_html += f"<tr><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]:.2f}</td><td>{row[3]}</td></tr>"
correlations_html += "</table>"

# Write HTML file
with open('${output_file}', 'w') as f:
    f.write(html_content.format(
        timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        metrics=metrics_html,
        anomalies=anomalies_html,
        predictions=predictions_html,
        correlations=correlations_html
    ))

conn.close()
print(f"Alert insights generated: ${output_file}")
EOF
    
    python3 generate_insights.py
    rm generate_insights.py
    
    log_success "Alert insights generated: ${output_file}"
}

# Main execution
case ${1:-} in
    "init")
        init_alert_database
        deploy_ml_models
        create_intelligent_alerts
        ;;
        
    "detect")
        run_anomaly_detection
        ;;
        
    "correlate")
        analyze_correlations
        ;;
        
    "insights")
        generate_insights "${2:-alert-insights.html}"
        ;;
        
    "train")
        deploy_ml_models
        ;;
        
    *)
        echo "Usage: $0 {init|detect|correlate|insights|train} [args...]"
        echo ""
        echo "Commands:"
        echo "  init          - Initialize intelligent alerting system"
        echo "  detect        - Run anomaly detection"
        echo "  correlate     - Analyze alert correlations"
        echo "  insights      - Generate alert insights report"
        echo "  train         - Train ML models"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 detect"
        echo "  $0 correlate"
        echo "  $0 insights dashboard.html"
        exit 1
        ;;
esac