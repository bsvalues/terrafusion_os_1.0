#!/bin/bash

# TerraFusion Distributed Tracing and Performance Profiling System
# Enterprise-grade distributed tracing with OpenTelemetry integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
TRACE_DB="${TRACE_DB:-terrafusion_traces}"
TRACE_USER="${DB_USER:-tftraces}"
TRACE_PASS="${DB_PASS:-$(generate_password)}"
JAEGER_ENDPOINT="${JAEGER_ENDPOINT:-http://localhost:\${{TF_PORT_4317:-4317}}}"
OTEL_COLLECTOR_ENDPOINT="${OTEL_COLLECTOR_ENDPOINT:-localhost:\${{TF_PORT_4317:-4317}}}"
TEMPO_ENDPOINT="${TEMPO_ENDPOINT:-http://localhost:\${{TF_PORT_4317:-4317}}}"
TRACE_SAMPLING_RATE="${TRACE_SAMPLING_RATE:-0.1}"
TRACE_RETENTION_DAYS="${TRACE_RETENTION_DAYS:-30}"

# Initialize database
init_trace_database() {
    log_info "Initializing trace database..."
    
    psql -U postgres -c "CREATE DATABASE ${TRACE_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${TRACE_USER} WITH PASSWORD '${TRACE_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${TRACE_DB} TO ${TRACE_USER};"
    
    psql -U ${TRACE_USER} -d ${TRACE_DB} <<EOF
-- Service registry
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50),
    environment VARCHAR(50),
    namespace VARCHAR(255),
    language VARCHAR(50),
    framework VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trace metadata
CREATE TABLE IF NOT EXISTS trace_metadata (
    trace_id VARCHAR(32) PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    root_span_name VARCHAR(500),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms BIGINT,
    span_count INTEGER,
    error_count INTEGER,
    status VARCHAR(50),
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    client_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(32) REFERENCES trace_metadata(trace_id),
    span_id VARCHAR(16),
    operation_name VARCHAR(500),
    service_name VARCHAR(255),
    duration_ms BIGINT,
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_mb INTEGER,
    db_query_count INTEGER,
    http_request_count INTEGER,
    cache_hit_rate DECIMAL(5,2),
    error_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Span relationships
CREATE TABLE IF NOT EXISTS span_relationships (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(32),
    span_id VARCHAR(16),
    parent_span_id VARCHAR(16),
    service_name VARCHAR(255),
    operation_name VARCHAR(500),
    start_time TIMESTAMP,
    duration_ms BIGINT,
    status VARCHAR(50),
    attributes JSONB,
    events JSONB,
    links JSONB
);

-- Service dependencies
CREATE TABLE IF NOT EXISTS service_dependencies (
    id SERIAL PRIMARY KEY,
    caller_service_id INTEGER REFERENCES services(id),
    callee_service_id INTEGER REFERENCES services(id),
    operation_name VARCHAR(500),
    call_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    avg_duration_ms BIGINT GENERATED ALWAYS AS (CASE WHEN call_count > 0 THEN total_duration_ms / call_count ELSE 0 END) STORED,
    p95_duration_ms BIGINT,
    p99_duration_ms BIGINT,
    last_call_at TIMESTAMP,
    UNIQUE(caller_service_id, callee_service_id, operation_name)
);

-- Performance profiles
CREATE TABLE IF NOT EXISTS performance_profiles (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    profile_type VARCHAR(50), -- cpu, memory, goroutine, mutex
    profile_data BYTEA,
    duration_seconds INTEGER,
    labels JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly detection
CREATE TABLE IF NOT EXISTS trace_anomalies (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(32) REFERENCES trace_metadata(trace_id),
    anomaly_type VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    detection_method VARCHAR(100),
    confidence_score DECIMAL(3,2),
    baseline_value DECIMAL(10,2),
    observed_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SLI metrics
CREATE TABLE IF NOT EXISTS sli_metrics (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    metric_name VARCHAR(255),
    metric_type VARCHAR(50), -- latency, error_rate, throughput
    value DECIMAL(10,4),
    unit VARCHAR(50),
    timestamp TIMESTAMP,
    labels JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trace_metadata_service_time ON trace_metadata(service_id, start_time);
CREATE INDEX IF NOT EXISTS idx_trace_metadata_duration ON trace_metadata(duration_ms);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_trace ON performance_metrics(trace_id);
CREATE INDEX IF NOT EXISTS idx_span_relationships_trace ON span_relationships(trace_id);
CREATE INDEX IF NOT EXISTS idx_service_dependencies_caller ON service_dependencies(caller_service_id);
CREATE INDEX IF NOT EXISTS idx_trace_anomalies_severity ON trace_anomalies(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_sli_metrics_service_time ON sli_metrics(service_id, timestamp);
EOF
    
    log_success "Trace database initialized"
}

# Deploy OpenTelemetry Collector
deploy_otel_collector() {
    log_info "Deploying OpenTelemetry Collector..."
    
    cat > otel-collector-config.yaml <<EOF
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:\${{TF_PORT_4317:-4317}}
      http:
        endpoint: 0.0.0.0:\${{TF_PORT_4317:-4317}}
  
  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 10s
          static_configs:
            - targets: ['localhost:\${{TF_PORT_4317:-4317}}']

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128
    
  attributes:
    actions:
      - key: environment
        value: \${ENVIRONMENT}
        action: upsert
      - key: service.namespace
        value: terrafusion
        action: upsert
        
  probabilistic_sampler:
    sampling_percentage: \${TRACE_SAMPLING_RATE}
    
  span:
    name:
      from_attributes: ["http.method", "http.route"]
      separator: " "

exporters:
  logging:
    loglevel: info
    
  jaeger:
    endpoint: \${JAEGER_ENDPOINT}
    tls:
      insecure: true
      
  otlp/tempo:
    endpoint: \${TEMPO_ENDPOINT}
    tls:
      insecure: true
      
  prometheus:
    endpoint: "0.0.0.0:\${{TF_PORT_4317:-4317}}"
    
  otlphttp/metrics:
    endpoint: http://prometheus:9090/api/v1/write

extensions:
  health_check:
    endpoint: 0.0.0.0:\${{TF_PORT_4317:-4317}}
    
  pprof:
    endpoint: 0.0.0.0:\${{TF_PORT_4317:-4317}}
    
  zpages:
    endpoint: 0.0.0.0:\${{TF_PORT_4317:-4317}}

service:
  extensions: [health_check, pprof, zpages]
  
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes, probabilistic_sampler, span]
      exporters: [logging, jaeger, otlp/tempo]
      
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch, attributes]
      exporters: [prometheus, otlphttp/metrics]
EOF
    
    # Create Docker Compose for tracing stack
    cat > docker-compose-tracing.yml <<EOF
version: '3.8'

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: terrafusion-otel-collector
    command: ["--config", "/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Prometheus metrics
      - "8889:8889"   # Prometheus exporter
      - "13133:13133" # Health check
      - "55679:55679" # zPages
    environment:
      - ENVIRONMENT=\${ENVIRONMENT:-production}
      - TRACE_SAMPLING_RATE=\${TRACE_SAMPLING_RATE:-10}
      - JAEGER_ENDPOINT=jaeger:14250
      - TEMPO_ENDPOINT=tempo:4317
    depends_on:
      - jaeger
      - tempo
    restart: unless-stopped
    
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: terrafusion-jaeger
    ports:
      - "16686:16686" # Jaeger UI
      - "14250:14250" # gRPC
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    restart: unless-stopped
    
  tempo:
    image: grafana/tempo:latest
    container_name: terrafusion-tempo
    command: [ "-config.file=/etc/tempo.yaml" ]
    volumes:
      - ./tempo-config.yaml:/etc/tempo.yaml
      - tempo-data:/var/tempo
    ports:
      - "3200:3200"   # Tempo
      - "4317"        # OTLP gRPC
    restart: unless-stopped

volumes:
  tempo-data:
EOF
    
    # Create Tempo configuration
    cat > tempo-config.yaml <<EOF
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:\${{TF_PORT_4317:-4317}}

ingester:
  trace_idle_period: 10s
  max_block_bytes: 1_000_000
  max_block_duration: 5m

compactor:
  compaction:
    compaction_window: 1h
    max_block_bytes: 100_000_000
    block_retention: 720h
    compacted_block_retention: 10m

storage:
  trace:
    backend: local
    block:
      bloom_filter_false_positive: .05
      index_downsample_bytes: 1000
      encoding: zstd
    wal:
      path: /var/tempo/wal
      encoding: snappy
    local:
      path: /var/tempo/blocks
    pool:
      max_workers: 100
      queue_depth: 10000
EOF
    
    docker-compose -f docker-compose-tracing.yml up -d
    log_success "OpenTelemetry Collector deployed"
}

# Instrument application
instrument_application() {
    local service_name=$1
    local language=$2
    
    log_info "Instrumenting ${service_name} (${language})..."
    
    case $language in
        "nodejs"|"javascript")
            cat > instrumentation-nodejs.js <<'EOF'
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:\${{TF_PORT_4317:-4317}}',
});

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:\${{TF_PORT_4317:-4317}}',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'terrafusion-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'production',
  }),
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
EOF
            ;;
            
        "python")
            cat > instrumentation_python.py <<'EOF'
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor
import os

def init_telemetry(app=None):
    # Create resource
    resource = Resource.create({
        SERVICE_NAME: os.getenv("SERVICE_NAME", "terrafusion-app"),
        SERVICE_VERSION: os.getenv("SERVICE_VERSION", "1.0.0"),
        "deployment.environment": os.getenv("ENVIRONMENT", "production"),
    })
    
    # Setup tracing
    trace.set_tracer_provider(TracerProvider(resource=resource))
    tracer_provider = trace.get_tracer_provider()
    
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:\${{TF_PORT_4317:-4317}}"),
        insecure=True,
    )
    
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    
    # Setup metrics
    metric_reader = PeriodicExportingMetricReader(
        exporter=OTLPMetricExporter(
            endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:\${{TF_PORT_4317:-4317}}"),
            insecure=True,
        ),
        export_interval_millis=10000,
    )
    
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    
    # Instrument libraries
    if app:
        FlaskInstrumentor().instrument_app(app)
    RequestsInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
    RedisInstrumentor().instrument()
    CeleryInstrumentor().instrument()
    
    return trace.get_tracer(__name__)
EOF
            ;;
            
        "java")
            cat > TelemetryConfig.java <<'EOF'
package com.terrafusion.telemetry;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.exporter.otlp.metrics.OtlpGrpcMetricExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.metrics.SdkMeterProvider;
import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.semconv.resource.attributes.ResourceAttributes;
import io.opentelemetry.instrumentation.spring.webmvc.v5_3.SpringWebMvcTelemetry;
import io.opentelemetry.instrumentation.jdbc.OpenTelemetryDriver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.time.Duration;

@Configuration
public class TelemetryConfig {
    
    @Bean
    public OpenTelemetry openTelemetry(Environment env) {
        Resource resource = Resource.getDefault()
            .merge(Resource.create(Attributes.builder()
                .put(ResourceAttributes.SERVICE_NAME, env.getProperty("service.name", "terrafusion-app"))
                .put(ResourceAttributes.SERVICE_VERSION, env.getProperty("service.version", "1.0.0"))
                .put("deployment.environment", env.getProperty("environment", "production"))
                .build()));
        
        String endpoint = env.getProperty("otel.exporter.otlp.endpoint", "http://localhost:\${{TF_PORT_4317:-4317}}");
        
        // Configure trace exporter
        OtlpGrpcSpanExporter spanExporter = OtlpGrpcSpanExporter.builder()
            .setEndpoint(endpoint)
            .setTimeout(Duration.ofSeconds(10))
            .build();
        
        SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
            .addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())
            .setResource(resource)
            .build();
        
        // Configure metric exporter
        OtlpGrpcMetricExporter metricExporter = OtlpGrpcMetricExporter.builder()
            .setEndpoint(endpoint)
            .setTimeout(Duration.ofSeconds(10))
            .build();
        
        SdkMeterProvider meterProvider = SdkMeterProvider.builder()
            .registerMetricReader(
                PeriodicMetricReader.builder(metricExporter)
                    .setInterval(Duration.ofSeconds(10))
                    .build())
            .setResource(resource)
            .build();
        
        OpenTelemetrySdk openTelemetry = OpenTelemetrySdk.builder()
            .setTracerProvider(tracerProvider)
            .setMeterProvider(meterProvider)
            .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
            .buildAndRegisterGlobal();
        
        // Register shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(tracerProvider::close));
        
        return openTelemetry;
    }
    
    @Bean
    public SpringWebMvcTelemetry springWebMvcTelemetry(OpenTelemetry openTelemetry) {
        return SpringWebMvcTelemetry.builder(openTelemetry).build();
    }
}
EOF
            ;;
            
        "go")
            cat > telemetry.go <<'EOF'
package telemetry

import (
    "context"
    "fmt"
    "os"
    "time"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/metric"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
    "google.golang.org/grpc"
)

func InitTelemetry(ctx context.Context, serviceName string) (func(), error) {
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName(serviceName),
            semconv.ServiceVersion(getEnv("SERVICE_VERSION", "1.0.0")),
            attribute.String("deployment.environment", getEnv("ENVIRONMENT", "production")),
        ),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create resource: %w", err)
    }
    
    endpoint := getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:\${{TF_PORT_4317:-4317}}")
    
    // Setup trace exporter
    conn, err := grpc.DialContext(ctx, endpoint,
        grpc.WithInsecure(),
        grpc.WithBlock(),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create gRPC connection: %w", err)
    }
    
    traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
    if err != nil {
        return nil, fmt.Errorf("failed to create trace exporter: %w", err)
    }
    
    bsp := sdktrace.NewBatchSpanProcessor(traceExporter)
    tracerProvider := sdktrace.NewTracerProvider(
        sdktrace.WithSampler(sdktrace.AlwaysSample()),
        sdktrace.WithResource(res),
        sdktrace.WithSpanProcessor(bsp),
    )
    
    otel.SetTracerProvider(tracerProvider)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))
    
    // Setup metric exporter
    metricExporter, err := otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithGRPCConn(conn))
    if err != nil {
        return nil, fmt.Errorf("failed to create metric exporter: %w", err)
    }
    
    meterProvider := metric.NewMeterProvider(
        metric.WithReader(metric.NewPeriodicReader(metricExporter,
            metric.WithInterval(10*time.Second))),
        metric.WithResource(res),
    )
    
    otel.SetMeterProvider(meterProvider)
    
    // Return cleanup function
    return func() {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        
        if err := tracerProvider.Shutdown(ctx); err != nil {
            otel.Handle(err)
        }
        if err := meterProvider.Shutdown(ctx); err != nil {
            otel.Handle(err)
        }
        conn.Close()
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
EOF
            ;;
    esac
    
    log_success "Application instrumentation templates created"
}

# Collect traces
collect_traces() {
    local service_name=$1
    local duration=${2:-60}
    
    log_info "Collecting traces for ${service_name} (${duration}s)..."
    
    # Start trace collection
    local start_time=$(date +%s)
    local trace_count=0
    
    while [ $(($(date +%s) - start_time)) -lt $duration ]; do
        # Query Jaeger for recent traces
        local traces=$(curl -s "${JAEGER_ENDPOINT}/api/traces?service=${service_name}&limit=100")
        
        if [ -n "$traces" ]; then
            # Process and store traces
            echo "$traces" | jq -r '.data[]' | while read -r trace; do
                local trace_id=$(echo "$trace" | jq -r '.traceID')
                local spans=$(echo "$trace" | jq -r '.spans')
                
                # Store trace metadata
                psql -U ${TRACE_USER} -d ${TRACE_DB} <<EOF
INSERT INTO trace_metadata (
    trace_id, service_id, root_span_name, start_time, end_time,
    duration_ms, span_count, error_count, status
)
SELECT 
    '${trace_id}',
    (SELECT id FROM services WHERE name = '${service_name}'),
    '$(echo "$trace" | jq -r '.spans[0].operationName')',
    to_timestamp($(echo "$trace" | jq -r '.spans[0].startTime / 1000000')),
    to_timestamp($(echo "$trace" | jq -r '.spans[-1].startTime + .spans[-1].duration / 1000000')),
    $(echo "$trace" | jq -r '.spans | map(.duration) | add / 1000'),
    $(echo "$spans" | jq 'length'),
    $(echo "$spans" | jq '[.[] | select(.tags[]? | select(.key == "error" and .value == true))] | length'),
    CASE 
        WHEN $(echo "$spans" | jq '[.[] | select(.tags[]? | select(.key == "error" and .value == true))] | length') > 0 
        THEN 'error' 
        ELSE 'success' 
    END
ON CONFLICT (trace_id) DO NOTHING;
EOF
                ((trace_count++))
            done
        fi
        
        sleep 5
    done
    
    log_success "Collected ${trace_count} traces"
}

# Analyze performance
analyze_performance() {
    local service_name=$1
    local time_range=${2:-"1 hour"}
    
    log_info "Analyzing performance for ${service_name}..."
    
    # Generate performance report
    psql -U ${TRACE_USER} -d ${TRACE_DB} -t <<EOF > performance_report.txt
-- Service performance summary
SELECT 
    s.name AS service_name,
    COUNT(DISTINCT tm.trace_id) AS trace_count,
    AVG(tm.duration_ms)::INTEGER AS avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY tm.duration_ms)::INTEGER AS p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY tm.duration_ms)::INTEGER AS p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY tm.duration_ms)::INTEGER AS p99_duration_ms,
    MAX(tm.duration_ms) AS max_duration_ms,
    (COUNT(CASE WHEN tm.status = 'error' THEN 1 END)::FLOAT / COUNT(*) * 100)::DECIMAL(5,2) AS error_rate
FROM trace_metadata tm
JOIN services s ON tm.service_id = s.id
WHERE s.name = '${service_name}'
AND tm.created_at > NOW() - INTERVAL '${time_range}'
GROUP BY s.name;

-- Top slow operations
SELECT 
    pm.operation_name,
    COUNT(*) AS call_count,
    AVG(pm.duration_ms)::INTEGER AS avg_duration_ms,
    MAX(pm.duration_ms) AS max_duration_ms,
    AVG(pm.cpu_usage_percent)::DECIMAL(5,2) AS avg_cpu_percent,
    AVG(pm.memory_usage_mb)::INTEGER AS avg_memory_mb
FROM performance_metrics pm
JOIN trace_metadata tm ON pm.trace_id = tm.trace_id
JOIN services s ON tm.service_id = s.id
WHERE s.name = '${service_name}'
AND tm.created_at > NOW() - INTERVAL '${time_range}'
GROUP BY pm.operation_name
ORDER BY avg_duration_ms DESC
LIMIT 10;

-- Service dependencies
SELECT 
    caller.name AS caller_service,
    callee.name AS callee_service,
    sd.operation_name,
    sd.call_count,
    sd.avg_duration_ms,
    sd.error_count,
    (sd.error_count::FLOAT / sd.call_count * 100)::DECIMAL(5,2) AS error_rate
FROM service_dependencies sd
JOIN services caller ON sd.caller_service_id = caller.id
JOIN services callee ON sd.callee_service_id = callee.id
WHERE caller.name = '${service_name}'
AND sd.last_call_at > NOW() - INTERVAL '${time_range}'
ORDER BY sd.call_count DESC;
EOF
    
    # Detect anomalies
    python3 <<EOF
import psycopg2
import numpy as np
from scipy import stats
import json

conn = psycopg2.connect(
    dbname="${TRACE_DB}",
    user="${TRACE_USER}",
    password="${TRACE_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get recent performance data
cur.execute("""
    SELECT 
        tm.trace_id,
        tm.duration_ms,
        pm.cpu_usage_percent,
        pm.memory_usage_mb,
        pm.error_rate
    FROM trace_metadata tm
    LEFT JOIN performance_metrics pm ON tm.trace_id = pm.trace_id
    JOIN services s ON tm.service_id = s.id
    WHERE s.name = %s
    AND tm.created_at > NOW() - INTERVAL '1 day'
    ORDER BY tm.created_at DESC
    LIMIT 1000
""", (service_name,))

data = cur.fetchall()
if data:
    durations = [row[1] for row in data if row[1] is not None]
    cpu_usage = [row[2] for row in data if row[2] is not None]
    memory_usage = [row[3] for row in data if row[3] is not None]
    
    # Calculate statistics
    duration_mean = np.mean(durations)
    duration_std = np.std(durations)
    
    # Detect anomalies (values > 3 standard deviations)
    for row in data:
        trace_id = row[0]
        duration = row[1]
        
        if duration and abs(duration - duration_mean) > 3 * duration_std:
            confidence = min(0.99, abs(duration - duration_mean) / (4 * duration_std))
            
            cur.execute("""
                INSERT INTO trace_anomalies (
                    trace_id, anomaly_type, severity, description,
                    detection_method, confidence_score, baseline_value, observed_value
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                trace_id,
                'high_latency',
                'warning' if duration < duration_mean + 4 * duration_std else 'critical',
                f'Latency {duration}ms exceeds normal range',
                'statistical_zscore',
                confidence,
                duration_mean,
                duration
            ))
    
    conn.commit()
    print(f"Analyzed {len(data)} traces, found {cur.rowcount} anomalies")

cur.close()
conn.close()
EOF
    
    log_success "Performance analysis complete"
}

# Generate performance profile
generate_profile() {
    local service_name=$1
    local profile_type=${2:-"cpu"}
    local duration=${3:-30}
    
    log_info "Generating ${profile_type} profile for ${service_name}..."
    
    case $profile_type in
        "cpu")
            # Generate CPU profile (example for Go service)
            curl -o cpu.prof "http://${service_name}:6060/debug/pprof/profile?seconds=${duration}"
            go tool pprof -http=:8080 cpu.prof &
            ;;
            
        "memory")
            # Generate memory profile
            curl -o mem.prof "http://${service_name}:6060/debug/pprof/heap"
            go tool pprof -http=:8081 mem.prof &
            ;;
            
        "goroutine")
            # Generate goroutine profile
            curl -o goroutine.prof "http://${service_name}:6060/debug/pprof/goroutine"
            go tool pprof -http=:8082 goroutine.prof &
            ;;
    esac
    
    # Store profile in database
    psql -U ${TRACE_USER} -d ${TRACE_DB} <<EOF
INSERT INTO performance_profiles (
    service_id, profile_type, profile_data, duration_seconds, labels
)
SELECT 
    (SELECT id FROM services WHERE name = '${service_name}'),
    '${profile_type}',
    pg_read_binary_file('${profile_type}.prof'),
    ${duration},
    '{"timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}'::jsonb
WHERE EXISTS (SELECT 1 FROM services WHERE name = '${service_name}');
EOF
    
    log_success "Performance profile generated"
}

# Main execution
case ${1:-} in
    "init")
        init_trace_database
        deploy_otel_collector
        ;;
        
    "instrument")
        instrument_application "$2" "$3"
        ;;
        
    "collect")
        collect_traces "$2" "${3:-60}"
        ;;
        
    "analyze")
        analyze_performance "$2" "${3:-1 hour}"
        ;;
        
    "profile")
        generate_profile "$2" "${3:-cpu}" "${4:-30}"
        ;;
        
    *)
        echo "Usage: $0 {init|instrument|collect|analyze|profile} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                          - Initialize tracing infrastructure"
        echo "  instrument <service> <lang>   - Generate instrumentation code"
        echo "  collect <service> [duration]  - Collect traces for a service"
        echo "  analyze <service> [range]     - Analyze service performance"
        echo "  profile <service> [type] [sec] - Generate performance profile"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 instrument api-service nodejs"
        echo "  $0 collect api-service 300"
        echo "  $0 analyze api-service '6 hours'"
        echo "  $0 profile api-service cpu 60"
        exit 1
        ;;
esac