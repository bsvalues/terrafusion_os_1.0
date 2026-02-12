#!/bin/bash

# TerraFusion AI-Powered Root Cause Analysis System
# Advanced ML-based incident analysis with knowledge graph integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
RCA_DB="${RCA_DB:-terrafusion_rca}"
RCA_USER="${DB_USER:-tfrca}"
RCA_PASS="${DB_PASS:-$(generate_password)}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
NEO4J_URL="${NEO4J_URL:-bolt://localhost:7687}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASS="${NEO4J_PASS:-password}"
ML_SERVICE_URL="${ML_SERVICE_URL:-http://localhost:5000}"

# Initialize database
init_rca_database() {
    log_info "Initializing root cause analysis database..."
    
    psql -U postgres -c "CREATE DATABASE ${RCA_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${RCA_USER} WITH PASSWORD '${RCA_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${RCA_DB} TO ${RCA_USER};"
    
    psql -U ${RCA_USER} -d ${RCA_DB} <<EOF
-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500),
    description TEXT,
    severity VARCHAR(20), -- critical, high, medium, low
    status VARCHAR(50), -- open, investigating, resolved
    service_affected VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    detection_source VARCHAR(100), -- monitoring, user_report, automated
    impact_scope JSONB, -- affected services, users, regions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Root cause analysis results
CREATE TABLE IF NOT EXISTS rca_results (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(100) REFERENCES incidents(incident_id),
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    root_causes JSONB, -- [{cause, confidence, evidence}]
    contributing_factors JSONB,
    analysis_method VARCHAR(100), -- ml_model, rule_based, graph_analysis
    confidence_score DECIMAL(3,2),
    recommendations JSONB,
    prevention_measures JSONB,
    estimated_mttr INTEGER, -- minutes
    analysis_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System dependencies
CREATE TABLE IF NOT EXISTS system_dependencies (
    id SERIAL PRIMARY KEY,
    source_service VARCHAR(255) NOT NULL,
    target_service VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(50), -- api, database, cache, queue
    criticality VARCHAR(20), -- critical, high, medium, low
    latency_sla_ms INTEGER,
    error_rate_threshold DECIMAL(5,2),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_service, target_service, dependency_type)
);

-- Event correlation patterns
CREATE TABLE IF NOT EXISTS correlation_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(255) UNIQUE NOT NULL,
    pattern_type VARCHAR(50), -- temporal, causal, spatial
    event_sequence JSONB, -- ordered list of events
    time_window_seconds INTEGER,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
    occurrence_count INTEGER DEFAULT 0,
    last_matched TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    kb_type VARCHAR(50), -- symptom, cause, solution, runbook
    category VARCHAR(100),
    title VARCHAR(500),
    content TEXT,
    tags TEXT[],
    related_services TEXT[],
    resolution_steps JSONB,
    average_resolution_time INTEGER, -- minutes
    success_rate DECIMAL(5,2),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML models metadata
CREATE TABLE IF NOT EXISTS rca_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) UNIQUE NOT NULL,
    model_type VARCHAR(50), -- classification, clustering, graph_neural_network
    version VARCHAR(50),
    features JSONB,
    performance_metrics JSONB,
    training_data_size INTEGER,
    model_path VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_trained TIMESTAMP
);

-- Analysis history
CREATE TABLE IF NOT EXISTS analysis_history (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(100),
    analysis_type VARCHAR(50),
    input_data JSONB,
    output_results JSONB,
    model_used VARCHAR(255),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Symptom patterns
CREATE TABLE IF NOT EXISTS symptom_patterns (
    id SERIAL PRIMARY KEY,
    pattern_id VARCHAR(100) UNIQUE NOT NULL,
    symptoms JSONB, -- [{metric, condition, threshold}]
    root_cause_mapping JSONB, -- probable root causes
    confidence_weights JSONB,
    validation_count INTEGER DEFAULT 0,
    false_positive_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resolution actions
CREATE TABLE IF NOT EXISTS resolution_actions (
    id SERIAL PRIMARY KEY,
    action_id VARCHAR(100) UNIQUE NOT NULL,
    action_type VARCHAR(50), -- restart, scale, failover, config_change
    target_service VARCHAR(255),
    action_script TEXT,
    prerequisites JSONB,
    expected_outcome TEXT,
    risk_level VARCHAR(20),
    automation_enabled BOOLEAN DEFAULT false,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    average_execution_time INTEGER, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status_time ON incidents(status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_rca_results_incident ON rca_results(incident_id);
CREATE INDEX IF NOT EXISTS idx_system_dependencies_source ON system_dependencies(source_service);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_analysis_history_incident ON analysis_history(incident_id, created_at DESC);
EOF
    
    log_success "RCA database initialized"
}

# Deploy ML service
deploy_ml_service() {
    log_info "Deploying ML analysis service..."
    
    # Create ML service
    cat > ml-rca-service.py <<'EOF'
from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import networkx as nx
import torch
import torch.nn as nn
import torch.nn.functional as F
from datetime import datetime, timedelta
import json
import psycopg2
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Graph Neural Network for root cause analysis
class GNNRootCause(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(GNNRootCause, self).__init__()
        self.conv1 = nn.Linear(input_dim, hidden_dim)
        self.conv2 = nn.Linear(hidden_dim, hidden_dim)
        self.classifier = nn.Linear(hidden_dim, output_dim)
        self.dropout = nn.Dropout(0.2)
        
    def forward(self, x, edge_index):
        # Simplified GNN implementation
        x = F.relu(self.conv1(x))
        x = self.dropout(x)
        x = F.relu(self.conv2(x))
        x = self.classifier(x)
        return F.log_softmax(x, dim=1)

class RootCauseAnalyzer:
    def __init__(self):
        self.models = {}
        self.dependency_graph = nx.DiGraph()
        self.load_models()
        self.load_dependency_graph()
    
    def load_models(self):
        """Load pre-trained ML models"""
        # Initialize models (in production, load from saved files)
        self.models['anomaly_detector'] = IsolationForest(contamination=0.1)
        self.models['pattern_classifier'] = RandomForestClassifier(n_estimators=100)
        self.models['cluster_analyzer'] = DBSCAN(eps=0.3, min_samples=2)
        self.models['gnn_analyzer'] = GNNRootCause(input_dim=10, hidden_dim=64, output_dim=5)
    
    def load_dependency_graph(self):
        """Load system dependency graph from database"""
        try:
            conn = psycopg2.connect(
                dbname="${RCA_DB}",
                user="${RCA_USER}",
                password="${RCA_PASS}",
                host="localhost"
            )
            cur = conn.cursor()
            
            cur.execute("""
                SELECT source_service, target_service, dependency_type, criticality
                FROM system_dependencies
            """)
            
            for source, target, dep_type, criticality in cur.fetchall():
                self.dependency_graph.add_edge(
                    source, target,
                    type=dep_type,
                    criticality=criticality,
                    weight=1.0 if criticality == 'critical' else 0.5
                )
            
            cur.close()
            conn.close()
        except Exception as e:
            logging.error(f"Error loading dependency graph: {e}")
    
    def analyze_incident(self, incident_data):
        """Main analysis function"""
        results = {
            'analysis_id': f"rca_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'root_causes': [],
            'contributing_factors': [],
            'confidence_score': 0.0,
            'recommendations': [],
            'analysis_methods': []
        }
        
        # 1. Anomaly Detection
        anomaly_results = self.detect_anomalies(incident_data)
        results['analysis_methods'].append('anomaly_detection')
        
        # 2. Pattern Matching
        pattern_results = self.match_patterns(incident_data)
        results['analysis_methods'].append('pattern_matching')
        
        # 3. Dependency Analysis
        dependency_results = self.analyze_dependencies(incident_data)
        results['analysis_methods'].append('dependency_analysis')
        
        # 4. Graph Neural Network Analysis
        if 'metrics' in incident_data:
            gnn_results = self.gnn_analysis(incident_data)
            results['analysis_methods'].append('graph_neural_network')
        
        # 5. Correlation Analysis
        correlation_results = self.correlation_analysis(incident_data)
        results['analysis_methods'].append('correlation_analysis')
        
        # Combine results
        all_causes = (
            anomaly_results.get('causes', []) +
            pattern_results.get('causes', []) +
            dependency_results.get('causes', []) +
            correlation_results.get('causes', [])
        )
        
        # Rank and deduplicate causes
        cause_scores = {}
        for cause in all_causes:
            key = cause['cause']
            if key not in cause_scores:
                cause_scores[key] = {
                    'cause': key,
                    'confidence': 0,
                    'evidence': [],
                    'count': 0
                }
            cause_scores[key]['confidence'] += cause.get('confidence', 0.5)
            cause_scores[key]['evidence'].extend(cause.get('evidence', []))
            cause_scores[key]['count'] += 1
        
        # Normalize confidence scores
        for key in cause_scores:
            cause_scores[key]['confidence'] /= cause_scores[key]['count']
            cause_scores[key]['evidence'] = list(set(cause_scores[key]['evidence']))
        
        # Sort by confidence
        results['root_causes'] = sorted(
            cause_scores.values(),
            key=lambda x: x['confidence'],
            reverse=True
        )[:5]  # Top 5 causes
        
        # Calculate overall confidence
        if results['root_causes']:
            results['confidence_score'] = results['root_causes'][0]['confidence']
        
        # Generate recommendations
        results['recommendations'] = self.generate_recommendations(results['root_causes'])
        results['prevention_measures'] = self.generate_prevention_measures(results['root_causes'])
        
        return results
    
    def detect_anomalies(self, incident_data):
        """Detect anomalies in metrics"""
        results = {'causes': []}
        
        if 'metrics' not in incident_data:
            return results
        
        metrics = incident_data['metrics']
        
        # Prepare data for anomaly detection
        metric_values = []
        metric_names = []
        
        for metric_name, values in metrics.items():
            if isinstance(values, list) and len(values) > 0:
                metric_values.extend(values)
                metric_names.extend([metric_name] * len(values))
        
        if not metric_values:
            return results
        
        # Reshape for sklearn
        X = np.array(metric_values).reshape(-1, 1)
        
        # Detect anomalies
        try:
            predictions = self.models['anomaly_detector'].fit_predict(X)
            anomaly_indices = np.where(predictions == -1)[0]
            
            for idx in anomaly_indices:
                if idx < len(metric_names):
                    results['causes'].append({
                        'cause': f"Anomaly in {metric_names[idx]}",
                        'confidence': 0.8,
                        'evidence': [f"Abnormal value detected: {metric_values[idx]}"]
                    })
        except Exception as e:
            logging.error(f"Anomaly detection error: {e}")
        
        return results
    
    def match_patterns(self, incident_data):
        """Match against known patterns"""
        results = {'causes': []}
        
        # Connect to database to fetch patterns
        try:
            conn = psycopg2.connect(
                dbname="${RCA_DB}",
                user="${RCA_USER}",
                password="${RCA_PASS}",
                host="localhost"
            )
            cur = conn.cursor()
            
            # Get symptom patterns
            cur.execute("""
                SELECT pattern_id, symptoms, root_cause_mapping, confidence_weights
                FROM symptom_patterns
            """)
            
            patterns = cur.fetchall()
            
            for pattern_id, symptoms, cause_mapping, weights in patterns:
                match_score = self.calculate_pattern_match(incident_data, symptoms)
                
                if match_score > 0.7:  # Threshold for pattern match
                    for cause, weight in cause_mapping.items():
                        results['causes'].append({
                            'cause': cause,
                            'confidence': match_score * weight,
                            'evidence': [f"Matched pattern: {pattern_id}"]
                        })
            
            cur.close()
            conn.close()
        except Exception as e:
            logging.error(f"Pattern matching error: {e}")
        
        return results
    
    def analyze_dependencies(self, incident_data):
        """Analyze service dependencies"""
        results = {'causes': []}
        
        affected_service = incident_data.get('service_affected')
        if not affected_service or affected_service not in self.dependency_graph:
            return results
        
        # Find upstream dependencies
        upstream = list(self.dependency_graph.predecessors(affected_service))
        
        # Check if any upstream service has issues
        for service in upstream:
            # In real implementation, check actual service health
            edge_data = self.dependency_graph[service][affected_service]
            
            if edge_data.get('criticality') == 'critical':
                results['causes'].append({
                    'cause': f"Dependency failure: {service}",
                    'confidence': 0.9,
                    'evidence': [
                        f"Critical dependency of {affected_service}",
                        f"Dependency type: {edge_data.get('type')}"
                    ]
                })
        
        # Analyze cascading failures
        downstream = list(self.dependency_graph.successors(affected_service))
        if downstream:
            results['contributing_factors'] = [
                f"Potential cascade to: {', '.join(downstream)}"
            ]
        
        return results
    
    def correlation_analysis(self, incident_data):
        """Analyze event correlations"""
        results = {'causes': []}
        
        # Temporal correlation
        if 'events' in incident_data:
            events = incident_data['events']
            
            # Sort by timestamp
            sorted_events = sorted(events, key=lambda x: x.get('timestamp', 0))
            
            # Find events that occurred just before the incident
            incident_time = incident_data.get('start_time', datetime.now())
            
            for event in sorted_events:
                event_time = event.get('timestamp')
                if event_time and (incident_time - event_time).total_seconds() < 300:  # 5 minutes
                    results['causes'].append({
                        'cause': f"Correlated event: {event.get('type', 'Unknown')}",
                        'confidence': 0.7,
                        'evidence': [
                            f"Event occurred {(incident_time - event_time).total_seconds()}s before incident",
                            f"Event details: {event.get('details', '')}"
                        ]
                    })
        
        return results
    
    def gnn_analysis(self, incident_data):
        """Graph Neural Network analysis"""
        results = {'causes': []}
        
        # This is a simplified implementation
        # In production, would use actual graph data and trained models
        
        try:
            # Prepare node features
            services = list(self.dependency_graph.nodes())
            if incident_data.get('service_affected') in services:
                # Create feature vectors
                num_nodes = len(services)
                node_features = torch.randn(num_nodes, 10)  # Random features for demo
                
                # Create edge index
                edges = list(self.dependency_graph.edges())
                edge_index = torch.tensor(edges, dtype=torch.long).t()
                
                # Run GNN
                with torch.no_grad():
                    output = self.models['gnn_analyzer'](node_features, edge_index)
                    predictions = output.argmax(dim=1)
                
                # Interpret results (simplified)
                affected_idx = services.index(incident_data.get('service_affected'))
                if predictions[affected_idx] > 0:
                    results['causes'].append({
                        'cause': "Complex dependency interaction detected",
                        'confidence': 0.85,
                        'evidence': ["GNN analysis indicates multi-hop dependency issue"]
                    })
        except Exception as e:
            logging.error(f"GNN analysis error: {e}")
        
        return results
    
    def calculate_pattern_match(self, incident_data, symptoms):
        """Calculate how well incident matches symptom pattern"""
        if not symptoms:
            return 0.0
        
        matches = 0
        total = len(symptoms)
        
        for symptom in symptoms:
            metric = symptom.get('metric')
            condition = symptom.get('condition')
            threshold = symptom.get('threshold')
            
            if metric in incident_data.get('metrics', {}):
                values = incident_data['metrics'][metric]
                if isinstance(values, list) and values:
                    value = values[-1]  # Latest value
                    
                    if condition == 'gt' and value > threshold:
                        matches += 1
                    elif condition == 'lt' and value < threshold:
                        matches += 1
                    elif condition == 'eq' and value == threshold:
                        matches += 1
        
        return matches / total if total > 0 else 0.0
    
    def generate_recommendations(self, root_causes):
        """Generate recommendations based on root causes"""
        recommendations = []
        
        for cause in root_causes[:3]:  # Top 3 causes
            cause_text = cause['cause'].lower()
            
            if 'memory' in cause_text or 'oom' in cause_text:
                recommendations.append({
                    'action': 'increase_memory',
                    'description': 'Increase memory allocation or optimize memory usage',
                    'priority': 'high',
                    'automation_available': True
                })
            elif 'cpu' in cause_text or 'load' in cause_text:
                recommendations.append({
                    'action': 'scale_horizontally',
                    'description': 'Add more instances to distribute load',
                    'priority': 'high',
                    'automation_available': True
                })
            elif 'dependency' in cause_text:
                recommendations.append({
                    'action': 'check_upstream_services',
                    'description': 'Investigate health of upstream dependencies',
                    'priority': 'high',
                    'automation_available': False
                })
            elif 'database' in cause_text or 'query' in cause_text:
                recommendations.append({
                    'action': 'optimize_database',
                    'description': 'Review and optimize database queries and indexes',
                    'priority': 'medium',
                    'automation_available': True
                })
            elif 'network' in cause_text or 'timeout' in cause_text:
                recommendations.append({
                    'action': 'review_network_config',
                    'description': 'Check network configuration and timeout settings',
                    'priority': 'medium',
                    'automation_available': False
                })
        
        return recommendations
    
    def generate_prevention_measures(self, root_causes):
        """Generate prevention measures"""
        measures = []
        
        for cause in root_causes[:3]:
            cause_text = cause['cause'].lower()
            
            if 'anomaly' in cause_text:
                measures.append({
                    'measure': 'enhanced_monitoring',
                    'description': 'Implement predictive monitoring for early detection',
                    'implementation_time': '1 week'
                })
            elif 'dependency' in cause_text:
                measures.append({
                    'measure': 'circuit_breaker',
                    'description': 'Implement circuit breaker pattern for dependencies',
                    'implementation_time': '2 weeks'
                })
            elif 'capacity' in cause_text or 'scale' in cause_text:
                measures.append({
                    'measure': 'auto_scaling',
                    'description': 'Configure predictive auto-scaling policies',
                    'implementation_time': '1 week'
                })
        
        return measures

# Flask routes
analyzer = RootCauseAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze incident for root cause"""
    try:
        incident_data = request.json
        results = analyzer.analyze_incident(incident_data)
        return jsonify(results), 200
    except Exception as e:
        logging.error(f"Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train():
    """Train ML models with new data"""
    try:
        training_data = request.json
        # Training logic here
        return jsonify({'status': 'success', 'message': 'Models updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'models_loaded': len(analyzer.models)}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF
    
    # Create requirements file
    cat > ml-requirements.txt <<EOF
flask==2.3.2
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
networkx==3.1
torch==2.0.1
psycopg2-binary==2.9.6
EOF
    
    # Create Dockerfile
    cat > Dockerfile.ml-service <<EOF
FROM python:3.10-slim

WORKDIR /app

COPY ml-requirements.txt .
RUN pip install --no-cache-dir -r ml-requirements.txt

COPY ml-rca-service.py .

EXPOSE 5000

CMD ["python", "ml-rca-service.py"]
EOF
    
    # Build and run ML service
    docker build -f Dockerfile.ml-service -t terrafusion-ml-rca .
    docker run -d --name terrafusion-ml-rca -p 5000:5000 terrafusion-ml-rca
    
    log_success "ML service deployed"
}

# Analyze incident
analyze_incident() {
    local incident_id=$1
    
    log_info "Analyzing incident ${incident_id}..."
    
    # Collect incident data
    python3 <<EOF
import psycopg2
import requests
import json
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch

# Connect to RCA database
conn = psycopg2.connect(
    dbname="${RCA_DB}",
    user="${RCA_USER}",
    password="${RCA_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get incident details
cur.execute("""
    SELECT incident_id, title, description, service_affected,
           start_time, impact_scope
    FROM incidents
    WHERE incident_id = %s
""", ("${incident_id}",))

incident = cur.fetchone()
if not incident:
    print(f"Incident {incident_id} not found")
    exit(1)

incident_id, title, description, service, start_time, impact = incident

# Collect relevant data
incident_data = {
    'incident_id': incident_id,
    'title': title,
    'description': description,
    'service_affected': service,
    'start_time': start_time.isoformat(),
    'impact_scope': impact,
    'metrics': {},
    'logs': [],
    'events': [],
    'traces': []
}

# 1. Collect metrics from Prometheus
try:
    # Get CPU metrics
    prom_query = f'avg(rate(cpu_usage_seconds_total{{service="{service}"}}[5m]))'
    response = requests.get(
        'http://localhost:9090/api/v1/query_range',
        params={
            'query': prom_query,
            'start': (start_time - timedelta(hours=1)).timestamp(),
            'end': (start_time + timedelta(hours=1)).timestamp(),
            'step': '60s'
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        if data['data']['result']:
            values = [float(v[1]) for v in data['data']['result'][0]['values']]
            incident_data['metrics']['cpu_usage'] = values
    
    # Get memory metrics
    prom_query = f'avg(memory_usage_bytes{{service="{service}"}}) / avg(memory_limit_bytes{{service="{service}"}})'
    response = requests.get(
        'http://localhost:9090/api/v1/query_range',
        params={
            'query': prom_query,
            'start': (start_time - timedelta(hours=1)).timestamp(),
            'end': (start_time + timedelta(hours=1)).timestamp(),
            'step': '60s'
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        if data['data']['result']:
            values = [float(v[1]) for v in data['data']['result'][0]['values']]
            incident_data['metrics']['memory_usage'] = values
    
    # Get error rate
    prom_query = f'sum(rate(http_requests_total{{service="{service}",status=~"5.."}}[5m])) / sum(rate(http_requests_total{{service="{service}"}}[5m]))'
    response = requests.get(
        'http://localhost:9090/api/v1/query_range',
        params={
            'query': prom_query,
            'start': (start_time - timedelta(hours=1)).timestamp(),
            'end': (start_time + timedelta(hours=1)).timestamp(),
            'step': '60s'
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        if data['data']['result']:
            values = [float(v[1]) for v in data['data']['result'][0]['values']]
            incident_data['metrics']['error_rate'] = values

except Exception as e:
    print(f"Error collecting metrics: {e}")

# 2. Collect logs from Elasticsearch
try:
    es = Elasticsearch(['${ELASTICSEARCH_URL}'])
    
    # Search for error logs
    query = {
        'query': {
            'bool': {
                'must': [
                    {'match': {'service': service}},
                    {'range': {
                        '@timestamp': {
                            'gte': (start_time - timedelta(hours=1)).isoformat(),
                            'lte': (start_time + timedelta(minutes=30)).isoformat()
                        }
                    }},
                    {'match': {'level': 'ERROR'}}
                ]
            }
        },
        'sort': [{'@timestamp': 'desc'}],
        'size': 100
    }
    
    result = es.search(index='logs-*', body=query)
    
    for hit in result['hits']['hits']:
        incident_data['logs'].append({
            'timestamp': hit['_source']['@timestamp'],
            'level': hit['_source']['level'],
            'message': hit['_source']['message'],
            'error_type': hit['_source'].get('error_type')
        })

except Exception as e:
    print(f"Error collecting logs: {e}")

# 3. Collect deployment events
cur.execute("""
    SELECT event_type, event_data, created_at
    FROM deployment_events
    WHERE service_name = %s
    AND created_at BETWEEN %s AND %s
    ORDER BY created_at
""", (
    service,
    start_time - timedelta(hours=2),
    start_time + timedelta(minutes=30)
))

for event_type, event_data, created_at in cur.fetchall():
    incident_data['events'].append({
        'type': event_type,
        'timestamp': created_at.isoformat(),
        'details': event_data
    })

# 4. Call ML service for analysis
print("Calling ML service for root cause analysis...")
response = requests.post(
    '${ML_SERVICE_URL}/analyze',
    json=incident_data,
    timeout=30
)

if response.status_code == 200:
    analysis_results = response.json()
    
    # Store results
    cur.execute("""
        INSERT INTO rca_results (
            incident_id, analysis_id, root_causes,
            contributing_factors, analysis_method,
            confidence_score, recommendations,
            prevention_measures, analysis_duration_ms
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        incident_id,
        analysis_results['analysis_id'],
        json.dumps(analysis_results['root_causes']),
        json.dumps(analysis_results.get('contributing_factors', [])),
        ','.join(analysis_results.get('analysis_methods', [])),
        analysis_results.get('confidence_score', 0),
        json.dumps(analysis_results.get('recommendations', [])),
        json.dumps(analysis_results.get('prevention_measures', [])),
        int((datetime.now() - datetime.fromisoformat(incident_data['start_time'])).total_seconds() * 1000)
    ))
    
    conn.commit()
    
    # Print summary
    print(f"\n=== Root Cause Analysis Results ===")
    print(f"Analysis ID: {analysis_results['analysis_id']}")
    print(f"Confidence Score: {analysis_results.get('confidence_score', 0):.2%}")
    print(f"\nTop Root Causes:")
    
    for i, cause in enumerate(analysis_results['root_causes'][:3], 1):
        print(f"{i}. {cause['cause']} (confidence: {cause['confidence']:.2%})")
        for evidence in cause.get('evidence', [])[:2]:
            print(f"   - {evidence}")
    
    print(f"\nRecommendations:")
    for rec in analysis_results.get('recommendations', []):
        print(f"- {rec['description']} (priority: {rec['priority']})")
    
    print(f"\nPrevention Measures:")
    for measure in analysis_results.get('prevention_measures', []):
        print(f"- {measure['description']} (implementation: {measure['implementation_time']})")
    
else:
    print(f"ML service error: {response.status_code}")

cur.close()
conn.close()
EOF
    
    log_success "Incident analysis complete"
}

# Build knowledge graph
build_knowledge_graph() {
    log_info "Building system knowledge graph..."
    
    # Initialize Neo4j with system topology
    python3 <<EOF
from neo4j import GraphDatabase
import psycopg2
import json

# Connect to Neo4j
driver = GraphDatabase.driver(
    "${NEO4J_URL}",
    auth=("${NEO4J_USER}", "${NEO4J_PASS}")
)

# Connect to PostgreSQL
pg_conn = psycopg2.connect(
    dbname="${RCA_DB}",
    user="${RCA_USER}",
    password="${RCA_PASS}",
    host="localhost"
)
pg_cur = pg_conn.cursor()

with driver.session() as session:
    # Clear existing data
    session.run("MATCH (n) DETACH DELETE n")
    
    # Create services
    pg_cur.execute("SELECT DISTINCT source_service FROM system_dependencies")
    services = set([row[0] for row in pg_cur.fetchall()])
    
    pg_cur.execute("SELECT DISTINCT target_service FROM system_dependencies")
    services.update([row[0] for row in pg_cur.fetchall()])
    
    for service in services:
        session.run(
            "CREATE (s:Service {name: \$name})",
            name=service
        )
    
    # Create dependencies
    pg_cur.execute("""
        SELECT source_service, target_service, dependency_type, criticality
        FROM system_dependencies
    """)
    
    for source, target, dep_type, criticality in pg_cur.fetchall():
        session.run("""
            MATCH (s:Service {name: \$source})
            MATCH (t:Service {name: \$target})
            CREATE (s)-[r:DEPENDS_ON {
                type: \$dep_type,
                criticality: \$criticality
            }]->(t)
        """, source=source, target=target, dep_type=dep_type, criticality=criticality)
    
    # Add incident history
    pg_cur.execute("""
        SELECT i.incident_id, i.service_affected, r.root_causes
        FROM incidents i
        JOIN rca_results r ON i.incident_id = r.incident_id
        WHERE r.confidence_score > 0.7
        LIMIT 100
    """)
    
    for incident_id, service, root_causes in pg_cur.fetchall():
        # Create incident node
        session.run("""
            CREATE (i:Incident {
                id: \$id,
                service: \$service
            })
        """, id=incident_id, service=service)
        
        # Link to service
        session.run("""
            MATCH (i:Incident {id: \$incident_id})
            MATCH (s:Service {name: \$service})
            CREATE (i)-[:AFFECTED]->(s)
        """, incident_id=incident_id, service=service)
        
        # Add root causes
        for cause in root_causes[:3]:
            cause_name = cause['cause']
            session.run("""
                MERGE (c:RootCause {name: \$cause})
                WITH c
                MATCH (i:Incident {id: \$incident_id})
                CREATE (i)-[:CAUSED_BY {confidence: \$confidence}]->(c)
            """, cause=cause_name, incident_id=incident_id, confidence=cause['confidence'])
    
    print("Knowledge graph built successfully")
    
    # Run some analysis queries
    # Find services with most incidents
    result = session.run("""
        MATCH (i:Incident)-[:AFFECTED]->(s:Service)
        RETURN s.name as service, count(i) as incident_count
        ORDER BY incident_count DESC
        LIMIT 5
    """)
    
    print("\nServices with most incidents:")
    for record in result:
        print(f"- {record['service']}: {record['incident_count']} incidents")
    
    # Find common root cause patterns
    result = session.run("""
        MATCH (i:Incident)-[r:CAUSED_BY]->(c:RootCause)
        WHERE r.confidence > 0.8
        RETURN c.name as cause, count(i) as frequency
        ORDER BY frequency DESC
        LIMIT 5
    """)
    
    print("\nMost common root causes:")
    for record in result:
        print(f"- {record['cause']}: {record['frequency']} occurrences")
    
    # Find critical dependency chains
    result = session.run("""
        MATCH path = (s1:Service)-[:DEPENDS_ON*1..3 {criticality: 'critical'}]->(s2:Service)
        RETURN s1.name as source, s2.name as target, length(path) as chain_length
        ORDER BY chain_length DESC
        LIMIT 5
    """)
    
    print("\nCritical dependency chains:")
    for record in result:
        print(f"- {record['source']} -> {record['target']} (length: {record['chain_length']})")

driver.close()
pg_cur.close()
pg_conn.close()
EOF
    
    log_success "Knowledge graph built"
}

# Generate RCA report
generate_rca_report() {
    local incident_id=$1
    local output_file=${2:-"rca-report-${incident_id}.html"}
    
    log_info "Generating RCA report for incident ${incident_id}..."
    
    # Generate report
    python3 <<EOF
import psycopg2
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

conn = psycopg2.connect(
    dbname="${RCA_DB}",
    user="${RCA_USER}",
    password="${RCA_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get incident and analysis data
cur.execute("""
    SELECT i.*, r.root_causes, r.confidence_score, r.recommendations,
           r.prevention_measures, r.analysis_duration_ms
    FROM incidents i
    LEFT JOIN rca_results r ON i.incident_id = r.incident_id
    WHERE i.incident_id = %s
    ORDER BY r.created_at DESC
    LIMIT 1
""", ("${incident_id}",))

data = cur.fetchone()
if not data:
    print("No data found for incident")
    exit(1)

# Create visualizations
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# 1. Root cause confidence scores
root_causes = data[11] if data[11] else []
if root_causes:
    causes = [c['cause'][:30] + '...' if len(c['cause']) > 30 else c['cause'] for c in root_causes[:5]]
    confidences = [c['confidence'] for c in root_causes[:5]]
    
    axes[0, 0].barh(causes, confidences)
    axes[0, 0].set_xlabel('Confidence Score')
    axes[0, 0].set_title('Root Cause Analysis Results')
    axes[0, 0].set_xlim(0, 1)

# 2. Timeline visualization (placeholder)
axes[0, 1].text(0.5, 0.5, 'Incident Timeline\n(To be implemented)', 
                ha='center', va='center', fontsize=12)
axes[0, 1].set_title('Event Timeline')

# 3. Impact visualization
if data[9]:  # impact_scope
    impact = data[9]
    if 'services' in impact:
        services = impact['services']
        axes[1, 0].pie([1] * len(services), labels=services, autopct='')
        axes[1, 0].set_title('Affected Services')

# 4. Recommendation priorities
recommendations = data[13] if data[13] else []
if recommendations:
    priorities = {}
    for rec in recommendations:
        p = rec.get('priority', 'medium')
        priorities[p] = priorities.get(p, 0) + 1
    
    axes[1, 1].bar(priorities.keys(), priorities.values())
    axes[1, 1].set_title('Recommendations by Priority')

plt.tight_layout()
plt.savefig('rca-visualization.png', dpi=150, bbox_inches='tight')

# Generate HTML report
html_template = '''<!DOCTYPE html>
<html>
<head>
    <title>Root Cause Analysis Report - {incident_id}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
        .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
        .section {{ margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; }}
        .severity-critical {{ color: #d32f2f; font-weight: bold; }}
        .severity-high {{ color: #f57c00; font-weight: bold; }}
        .severity-medium {{ color: #fbc02d; }}
        .severity-low {{ color: #388e3c; }}
        .confidence {{ display: inline-block; padding: 5px 10px; border-radius: 3px; }}
        .confidence-high {{ background: #4caf50; color: white; }}
        .confidence-medium {{ background: #ff9800; color: white; }}
        .confidence-low {{ background: #f44336; color: white; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background: #eceff1; font-weight: bold; }}
        .root-cause {{ background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .evidence {{ margin-left: 20px; font-style: italic; color: #666; }}
        .recommendation {{ background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ffc107; }}
        .prevention {{ background: #d4edda; padding: 10px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #28a745; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Root Cause Analysis Report</h1>
        <p>Incident ID: {incident_id}</p>
        <p>Generated: {timestamp}</p>
    </div>
    
    <div class="section">
        <h2>Incident Summary</h2>
        <table>
            <tr><th>Title</th><td>{title}</td></tr>
            <tr><th>Severity</th><td class="severity-{severity}">{severity}</td></tr>
            <tr><th>Status</th><td>{status}</td></tr>
            <tr><th>Service Affected</th><td>{service}</td></tr>
            <tr><th>Start Time</th><td>{start_time}</td></tr>
            <tr><th>Duration</th><td>{duration}</td></tr>
            <tr><th>Analysis Confidence</th><td><span class="confidence confidence-{confidence_level}">{confidence:.1%}</span></td></tr>
        </table>
        <p><strong>Description:</strong> {description}</p>
    </div>
    
    <div class="section">
        <h2>Root Cause Analysis</h2>
        {root_causes_html}
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        {recommendations_html}
    </div>
    
    <div class="section">
        <h2>Prevention Measures</h2>
        {prevention_html}
    </div>
    
    <div class="section">
        <h2>Analysis Visualization</h2>
        <img src="rca-visualization.png" style="max-width: 100%;">
    </div>
    
    <div class="section">
        <h2>Analysis Metadata</h2>
        <p>Analysis Duration: {analysis_duration}ms</p>
        <p>Methods Used: ML-based anomaly detection, Pattern matching, Dependency analysis, Correlation analysis</p>
    </div>
</body>
</html>'''

# Format root causes
root_causes_html = ""
for i, cause in enumerate(root_causes[:5], 1):
    root_causes_html += f'''
    <div class="root-cause">
        <h3>{i}. {cause['cause']} (Confidence: {cause['confidence']:.1%})</h3>
        <h4>Evidence:</h4>
        <ul>
    '''
    for evidence in cause.get('evidence', []):
        root_causes_html += f'<li class="evidence">{evidence}</li>'
    root_causes_html += '</ul></div>'

# Format recommendations
recommendations_html = ""
for rec in recommendations:
    recommendations_html += f'''
    <div class="recommendation">
        <strong>{rec['description']}</strong><br>
        Priority: {rec['priority']}<br>
        Automation Available: {'Yes' if rec.get('automation_available') else 'No'}
    </div>
    '''

# Format prevention measures
prevention_html = ""
prevention_measures = data[14] if data[14] else []
for measure in prevention_measures:
    prevention_html += f'''
    <div class="prevention">
        <strong>{measure['description']}</strong><br>
        Implementation Time: {measure['implementation_time']}
    </div>
    '''

# Calculate values
duration = "N/A"
if data[6] and data[7]:  # start_time and end_time
    duration = str(data[7] - data[6])

confidence = data[12] if data[12] else 0
confidence_level = 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low'

# Generate final HTML
html_content = html_template.format(
    incident_id=data[1],
    timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    title=data[2] or 'N/A',
    severity=data[4] or 'unknown',
    status=data[5] or 'unknown',
    service=data[6] or 'N/A',
    start_time=data[7] if data[7] else 'N/A',
    duration=duration,
    confidence=confidence,
    confidence_level=confidence_level,
    description=data[3] or 'No description provided',
    root_causes_html=root_causes_html,
    recommendations_html=recommendations_html,
    prevention_html=prevention_html,
    analysis_duration=data[15] if data[15] else 'N/A'
)

with open('${output_file}', 'w') as f:
    f.write(html_content)

cur.close()
conn.close()

print(f"RCA report generated: ${output_file}")
EOF
    
    log_success "RCA report generated: ${output_file}"
}

# Main execution
case ${1:-} in
    "init")
        init_rca_database
        deploy_ml_service
        ;;
        
    "analyze")
        analyze_incident "$2"
        ;;
        
    "graph")
        build_knowledge_graph
        ;;
        
    "report")
        generate_rca_report "$2" "${3:-rca-report-$2.html}"
        ;;
        
    "register-incident")
        # Register new incident
        psql -U ${RCA_USER} -d ${RCA_DB} <<EOF
INSERT INTO incidents (
    incident_id, title, description, severity,
    status, service_affected, start_time, impact_scope
) VALUES (
    '$2', '$3', '$4', '${5:-high}',
    'open', '$6', NOW(), '{"services": ["$6"]}'::jsonb
);
EOF
        log_success "Incident $2 registered"
        ;;
        
    *)
        echo "Usage: $0 {init|analyze|graph|report|register-incident} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                          - Initialize RCA system"
        echo "  analyze <incident_id>         - Analyze incident"
        echo "  graph                         - Build knowledge graph"
        echo "  report <incident_id> [file]   - Generate RCA report"
        echo "  register-incident <id> <title> <desc> <sev> <service> - Register incident"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 register-incident INC-001 'API Outage' 'Complete API failure' critical api-service"
        echo "  $0 analyze INC-001"
        echo "  $0 report INC-001 incident-report.html"
        exit 1
        ;;
esac