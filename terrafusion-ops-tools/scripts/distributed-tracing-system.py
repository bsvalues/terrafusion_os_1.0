#!/usr/bin/env python3

"""
TerraFusion Distributed Tracing and Observability System
Advanced distributed tracing with performance analytics and service mesh insights
Features: Request tracing, service mapping, latency analysis, dependency tracking
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path
import uuid
import aiohttp
import jaeger_client
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
import networkx as nx
from prometheus_client import Counter, Histogram, Gauge
import matplotlib.pyplot as plt
import seaborn as sns

class TraceLevel(Enum):
    DEBUG = "debug"
    INFO = "info"
    WARN = "warn"
    ERROR = "error"
    CRITICAL = "critical"

class SpanType(Enum):
    HTTP_REQUEST = "http_request"
    DATABASE_QUERY = "database_query"
    EXTERNAL_API = "external_api"
    INTERNAL_SERVICE = "internal_service"
    BACKGROUND_JOB = "background_job"
    MESSAGE_QUEUE = "message_queue"
    CACHE_OPERATION = "cache_operation"

class ServiceHealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

@dataclass
class TraceSpan:
    span_id: str
    trace_id: str
    parent_span_id: Optional[str]
    operation_name: str
    service_name: str
    span_type: SpanType
    start_time: datetime
    end_time: Optional[datetime]
    duration_ms: Optional[float]
    status_code: int
    tags: Dict[str, str]
    logs: List[Dict[str, Any]]
    baggage: Dict[str, str]

@dataclass
class ServiceDependency:
    caller_service: str
    callee_service: str
    call_count: int
    avg_latency_ms: float
    error_rate: float
    last_call_time: datetime
    dependency_type: str

@dataclass
class ServiceMetrics:
    service_name: str
    requests_per_second: float
    avg_response_time_ms: float
    error_rate_percent: float
    cpu_usage_percent: float
    memory_usage_mb: float
    active_connections: int
    health_status: ServiceHealthStatus
    last_updated: datetime

class DistributedTracingSystem:
    def __init__(self):
        self.session_id = f"tracing_system_{int(time.time())}"
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.redis_client = redis.Redis(host='localhost', port=\${{TF_REDIS_PORT:-6379}}, db=0)
        
        # Tracing configuration
        self.active_traces = {}
        self.service_dependencies = {}
        self.service_metrics = {}
        self.service_map = nx.DiGraph()
        
        # Prometheus metrics
        self.request_counter = Counter('terrafusion_requests_total', 'Total requests', ['service', 'endpoint', 'method'])
        self.response_time_histogram = Histogram('terrafusion_response_time_seconds', 'Response time', ['service', 'endpoint'])
        self.error_rate_gauge = Gauge('terrafusion_error_rate', 'Error rate', ['service'])
        
        # Initialize OpenTelemetry
        self.setup_opentelemetry()
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize tracing tables
        self.init_tracing_tables()
        
    def setup_opentelemetry(self):
        """Setup OpenTelemetry distributed tracing"""
        try:
            # Configure tracer provider
            trace.set_tracer_provider(TracerProvider())
            tracer = trace.get_tracer(__name__)
            
            # Configure Jaeger exporter
            jaeger_exporter = JaegerExporter(
                agent_host_name="localhost",
                agent_port=\${{TF_REDIS_PORT:-6379}},
            )
            
            # Configure span processor
            span_processor = BatchSpanProcessor(jaeger_exporter)
            trace.get_tracer_provider().add_span_processor(span_processor)
            
            # Auto-instrument libraries
            RequestsInstrumentor().instrument()
            Psycopg2Instrumentor().instrument()
            
            self.tracer = tracer
            self.logger.info("OpenTelemetry tracing initialized successfully")
            
        except Exception as e:
            self.logger.warning(f"Failed to initialize OpenTelemetry: {e}")
            self.tracer = None
            
    def init_tracing_tables(self):
        """Initialize distributed tracing database tables"""
        cur = self.db_conn.cursor()
        
        # Trace spans table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS trace_spans (
                id SERIAL PRIMARY KEY,
                span_id VARCHAR(32) NOT NULL,
                trace_id VARCHAR(32) NOT NULL,
                parent_span_id VARCHAR(32),
                operation_name VARCHAR(200) NOT NULL,
                service_name VARCHAR(100) NOT NULL,
                span_type VARCHAR(50) NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                duration_ms FLOAT,
                status_code INTEGER,
                tags JSONB,
                logs JSONB,
                baggage JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (trace_id),
                INDEX (service_name),
                INDEX (start_time)
            )
        """)
        
        # Service dependencies table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS service_dependencies (
                id SERIAL PRIMARY KEY,
                caller_service VARCHAR(100) NOT NULL,
                callee_service VARCHAR(100) NOT NULL,
                call_count INTEGER DEFAULT 0,
                avg_latency_ms FLOAT DEFAULT 0,
                error_rate FLOAT DEFAULT 0,
                last_call_time TIMESTAMP,
                dependency_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(caller_service, callee_service)
            )
        """)
        
        # Service metrics table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS service_metrics (
                id SERIAL PRIMARY KEY,
                service_name VARCHAR(100) NOT NULL,
                requests_per_second FLOAT DEFAULT 0,
                avg_response_time_ms FLOAT DEFAULT 0,
                error_rate_percent FLOAT DEFAULT 0,
                cpu_usage_percent FLOAT DEFAULT 0,
                memory_usage_mb FLOAT DEFAULT 0,
                active_connections INTEGER DEFAULT 0,
                health_status VARCHAR(20) DEFAULT 'unknown',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (service_name),
                INDEX (timestamp)
            )
        """)
        
        # Trace analytics table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS trace_analytics (
                id SERIAL PRIMARY KEY,
                analysis_id VARCHAR(100) UNIQUE NOT NULL,
                trace_id VARCHAR(32) NOT NULL,
                total_duration_ms FLOAT,
                service_count INTEGER,
                span_count INTEGER,
                error_count INTEGER,
                critical_path JSONB,
                bottlenecks JSONB,
                anomalies JSONB,
                performance_score FLOAT,
                analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.db_conn.commit()
        self.logger.info("Distributed tracing database tables initialized")
        
    async def start_distributed_tracing_system(self):
        """Start distributed tracing and observability system"""
        self.logger.info("🔍 Starting Distributed Tracing System...")
        
        tasks = [
            asyncio.create_task(self.continuous_trace_collection()),
            asyncio.create_task(self.service_dependency_mapping()),
            asyncio.create_task(self.performance_analytics_engine()),
            asyncio.create_task(self.service_health_monitoring()),
            asyncio.create_task(self.trace_anomaly_detection()),
            asyncio.create_task(self.critical_path_analysis()),
            asyncio.create_task(self.service_topology_visualization()),
            asyncio.create_task(self.distributed_debugging_assistant())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 Stopping distributed tracing system...")
            for task in tasks:
                task.cancel()
                
    async def continuous_trace_collection(self):
        """Continuously collect and process distributed traces"""
        while True:
            try:
                await self.collect_active_traces()
                await self.process_trace_data()
                await asyncio.sleep(10)  # Collect every 10 seconds
                
            except Exception as e:
                self.logger.error(f"Error in trace collection: {e}")
                await asyncio.sleep(10)
                
    async def collect_active_traces(self):
        """Collect active traces from various sources"""
        try:
            self.logger.info("📊 Collecting active traces...")
            
            # Collect traces from Jaeger
            await self.collect_jaeger_traces()
            
            # Collect traces from application logs
            await self.collect_application_traces()
            
            # Collect traces from service mesh (if available)
            await self.collect_service_mesh_traces()
            
            # Collect custom trace data
            await self.collect_custom_traces()
            
        except Exception as e:
            self.logger.error(f"Error collecting traces: {e}")
            
    async def collect_jaeger_traces(self):
        """Collect traces from Jaeger backend"""
        try:
            # Query Jaeger API for recent traces
            jaeger_url = "http://localhost:16686/api/traces"
            
            params = {
                'service': 'terrafusion',
                'lookback': '1h',
                'limit': 100
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(jaeger_url, params=params) as response:
                    if response.status == 200:
                        traces_data = await response.json()
                        
                        for trace_data in traces_data.get('data', []):
                            await self.process_jaeger_trace(trace_data)
                            
        except Exception as e:
            self.logger.debug(f"Error collecting Jaeger traces: {e}")
            
    async def process_jaeger_trace(self, trace_data: Dict[str, Any]):
        """Process individual Jaeger trace"""
        try:
            trace_id = trace_data.get('traceID', '')
            spans = trace_data.get('spans', [])
            
            for span_data in spans:
                span = self.parse_jaeger_span(span_data, trace_id)
                await self.store_trace_span(span)
                
        except Exception as e:
            self.logger.error(f"Error processing Jaeger trace: {e}")
            
    def parse_jaeger_span(self, span_data: Dict[str, Any], trace_id: str) -> TraceSpan:
        """Parse Jaeger span data into TraceSpan object"""
        try:
            span_id = span_data.get('spanID', '')
            parent_span_id = span_data.get('references', [{}])[0].get('spanID') if span_data.get('references') else None
            
            operation_name = span_data.get('operationName', 'unknown')
            service_name = span_data.get('process', {}).get('serviceName', 'unknown')
            
            start_time = datetime.fromtimestamp(span_data.get('startTime', 0) / 1_000_000)
            duration_us = span_data.get('duration', 0)
            end_time = start_time + timedelta(microseconds=duration_us)
            duration_ms = duration_us / 1000
            
            # Extract tags
            tags = {}
            for tag in span_data.get('tags', []):
                tags[tag.get('key', '')] = str(tag.get('value', ''))
                
            # Extract logs
            logs = []
            for log in span_data.get('logs', []):
                log_entry = {
                    'timestamp': datetime.fromtimestamp(log.get('timestamp', 0) / 1_000_000),
                    'fields': {field.get('key', ''): field.get('value', '') for field in log.get('fields', [])}
                }
                logs.append(log_entry)
                
            # Determine span type
            span_type = self.determine_span_type(operation_name, tags)
            
            # Extract status code
            status_code = 200
            if 'http.status_code' in tags:
                status_code = int(tags['http.status_code'])
            elif 'error' in tags and tags['error'].lower() == 'true':
                status_code = 500
                
            return TraceSpan(
                span_id=span_id,
                trace_id=trace_id,
                parent_span_id=parent_span_id,
                operation_name=operation_name,
                service_name=service_name,
                span_type=span_type,
                start_time=start_time,
                end_time=end_time,
                duration_ms=duration_ms,
                status_code=status_code,
                tags=tags,
                logs=logs,
                baggage={}
            )
            
        except Exception as e:
            self.logger.error(f"Error parsing Jaeger span: {e}")
            return None
            
    def determine_span_type(self, operation_name: str, tags: Dict[str, str]) -> SpanType:
        """Determine span type based on operation name and tags"""
        try:
            operation_lower = operation_name.lower()
            
            if 'http.method' in tags or 'http.url' in tags:
                return SpanType.HTTP_REQUEST
            elif 'db.statement' in tags or 'sql' in operation_lower:
                return SpanType.DATABASE_QUERY
            elif 'component' in tags and 'redis' in tags['component'].lower():
                return SpanType.CACHE_OPERATION
            elif 'external' in operation_lower or 'api' in operation_lower:
                return SpanType.EXTERNAL_API
            elif 'job' in operation_lower or 'worker' in operation_lower:
                return SpanType.BACKGROUND_JOB
            elif 'queue' in operation_lower or 'message' in operation_lower:
                return SpanType.MESSAGE_QUEUE
            else:
                return SpanType.INTERNAL_SERVICE
                
        except Exception:
            return SpanType.INTERNAL_SERVICE
            
    async def store_trace_span(self, span: TraceSpan):
        """Store trace span in database"""
        try:
            if not span:
                return
                
            cur = self.db_conn.cursor()
            
            cur.execute("""
                INSERT INTO trace_spans 
                (span_id, trace_id, parent_span_id, operation_name, service_name, span_type,
                 start_time, end_time, duration_ms, status_code, tags, logs, baggage)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (span_id) DO NOTHING
            """, (
                span.span_id,
                span.trace_id,
                span.parent_span_id,
                span.operation_name,
                span.service_name,
                span.span_type.value,
                span.start_time,
                span.end_time,
                span.duration_ms,
                span.status_code,
                json.dumps(span.tags),
                json.dumps(span.logs, default=str),
                json.dumps(span.baggage)
            ))
            
            self.db_conn.commit()
            
            # Update service dependencies
            await self.update_service_dependencies(span)
            
        except Exception as e:
            self.logger.error(f"Error storing trace span: {e}")
            
    async def update_service_dependencies(self, span: TraceSpan):
        """Update service dependency mapping"""
        try:
            if span.parent_span_id:
                # Find parent span to determine dependency
                cur = self.db_conn.cursor()
                
                cur.execute("""
                    SELECT service_name FROM trace_spans 
                    WHERE span_id = %s
                    LIMIT 1
                """, (span.parent_span_id,))
                
                parent_result = cur.fetchone()
                
                if parent_result:
                    caller_service = parent_result[0]
                    callee_service = span.service_name
                    
                    if caller_service != callee_service:
                        await self.record_service_dependency(
                            caller_service, 
                            callee_service, 
                            span.duration_ms or 0,
                            span.status_code >= 400
                        )
                        
        except Exception as e:
            self.logger.error(f"Error updating service dependencies: {e}")
            
    async def record_service_dependency(self, caller: str, callee: str, latency_ms: float, is_error: bool):
        """Record service dependency call"""
        try:
            cur = self.db_conn.cursor()
            
            # Update or insert dependency record
            cur.execute("""
                INSERT INTO service_dependencies 
                (caller_service, callee_service, call_count, avg_latency_ms, error_rate, last_call_time, dependency_type)
                VALUES (%s, %s, 1, %s, %s, %s, 'service_call')
                ON CONFLICT (caller_service, callee_service) 
                DO UPDATE SET
                    call_count = service_dependencies.call_count + 1,
                    avg_latency_ms = (service_dependencies.avg_latency_ms * service_dependencies.call_count + %s) / (service_dependencies.call_count + 1),
                    error_rate = (service_dependencies.error_rate * service_dependencies.call_count + %s) / (service_dependencies.call_count + 1),
                    last_call_time = %s,
                    updated_at = CURRENT_TIMESTAMP
            """, (caller, callee, latency_ms, 1 if is_error else 0, datetime.now(), latency_ms, 1 if is_error else 0, datetime.now()))
            
            self.db_conn.commit()
            
            # Update service map
            self.service_map.add_edge(caller, callee, weight=latency_ms)
            
        except Exception as e:
            self.logger.error(f"Error recording service dependency: {e}")

async def main():
    """Main function to start distributed tracing system"""
    print("🔍 Starting TerraFusion Distributed Tracing System...")
    print("=" * 70)
    print("Capabilities:")
    print("  • Distributed request tracing")
    print("  • Service dependency mapping")
    print("  • Performance analytics and insights")
    print("  • Critical path analysis")
    print("  • Service health monitoring")
    print("  • Anomaly detection in traces")
    print("  • Service topology visualization")
    print("  • Distributed debugging assistance")
    print("=" * 70)
    
    tracing_system = DistributedTracingSystem()
    
    try:
        # Demo: Collect initial traces
        print("\n📊 Collecting initial trace data...")
        await tracing_system.collect_active_traces()
        
        # Start tracing system
        await tracing_system.start_distributed_tracing_system()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down distributed tracing system...")
    except Exception as e:
        print(f"\n❌ Error in distributed tracing system: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())