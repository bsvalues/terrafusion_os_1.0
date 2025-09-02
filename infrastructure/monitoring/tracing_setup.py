#!/usr/bin/env python3
"""
TerraFusion Distributed Tracing Setup
OpenTelemetry integration for all services
"""
from opentelemetry import trace, metrics
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.propagate import set_global_textmap
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class TerraFusionTracing:
    """Centralized tracing configuration for TerraFusion services"""
    
    def __init__(self, service_name: str, service_version: str = "1.0.0"):
        self.service_name = service_name
        self.service_version = service_version
        self.resource = Resource.create({
            SERVICE_NAME: service_name,
            SERVICE_VERSION: service_version,
            "service.namespace": "terrafusion",
            "deployment.environment": "production"
        })
        
        self.tracer_provider = None
        self.meter_provider = None
        self.tracer = None
        self.meter = None
        
    def setup_tracing(
        self,
        jaeger_endpoint: str = "http://localhost:14268/api/traces",
        otlp_endpoint: str = "localhost:4317",
        enable_console_export: bool = False
    ):
        """Setup distributed tracing"""
        # Create tracer provider
        self.tracer_provider = TracerProvider(resource=self.resource)
        
        # Jaeger exporter
        jaeger_exporter = JaegerExporter(
            collector_endpoint=jaeger_endpoint,
            username="",
            password="",
        )
        
        # OTLP exporter (for cloud providers)
        otlp_exporter = OTLPSpanExporter(
            endpoint=otlp_endpoint,
            insecure=True
        )
        
        # Add span processors
        self.tracer_provider.add_span_processor(
            BatchSpanProcessor(jaeger_exporter)
        )
        
        if enable_console_export:
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter
            self.tracer_provider.add_span_processor(
                BatchSpanProcessor(ConsoleSpanExporter())
            )
        
        # Set as global tracer provider
        trace.set_tracer_provider(self.tracer_provider)
        
        # Set propagator
        set_global_textmap(TraceContextTextMapPropagator())
        
        # Get tracer
        self.tracer = trace.get_tracer(self.service_name, self.service_version)
        
        logger.info(f"Tracing initialized for {self.service_name}")
        
    def setup_metrics(
        self,
        prometheus_port: int = 9090,
        otlp_endpoint: str = "localhost:4317"
    ):
        """Setup metrics collection"""
        # Prometheus exporter
        prometheus_reader = PrometheusMetricReader()
        
        # OTLP metrics exporter
        otlp_metric_exporter = OTLPMetricExporter(
            endpoint=otlp_endpoint,
            insecure=True
        )
        
        # Create meter provider
        self.meter_provider = MeterProvider(
            resource=self.resource,
            metric_readers=[prometheus_reader]
        )
        
        # Set as global meter provider
        metrics.set_meter_provider(self.meter_provider)
        
        # Get meter
        self.meter = metrics.get_meter(self.service_name, self.service_version)
        
        logger.info(f"Metrics initialized for {self.service_name}")
        
    def instrument_fastapi(self, app):
        """Instrument FastAPI application"""
        FastAPIInstrumentor.instrument_app(
            app,
            tracer_provider=self.tracer_provider,
            excluded_urls="health,metrics"
        )
        
    def instrument_requests(self):
        """Instrument HTTP requests library"""
        RequestsInstrumentor().instrument(
            tracer_provider=self.tracer_provider
        )
        
    def instrument_aiohttp(self):
        """Instrument aiohttp client"""
        AioHttpClientInstrumentor().instrument(
            tracer_provider=self.tracer_provider
        )
        
    def instrument_redis(self):
        """Instrument Redis client"""
        RedisInstrumentor().instrument(
            tracer_provider=self.tracer_provider
        )
        
    def instrument_sqlalchemy(self, engine):
        """Instrument SQLAlchemy engine"""
        SQLAlchemyInstrumentor().instrument(
            engine=engine,
            tracer_provider=self.tracer_provider
        )
        
    def instrument_psycopg2(self):
        """Instrument PostgreSQL driver"""
        Psycopg2Instrumentor().instrument(
            tracer_provider=self.tracer_provider
        )
        
    def create_custom_metrics(self):
        """Create custom metrics for TerraFusion"""
        # Request counter
        self.request_counter = self.meter.create_counter(
            "terrafusion_requests_total",
            description="Total number of requests",
            unit="requests"
        )
        
        # Response time histogram
        self.response_time_histogram = self.meter.create_histogram(
            "terrafusion_response_time_ms",
            description="Response time in milliseconds",
            unit="ms"
        )
        
        # Active users gauge
        self.active_users_gauge = self.meter.create_up_down_counter(
            "terrafusion_active_users",
            description="Number of active users",
            unit="users"
        )
        
        # Property valuations counter
        self.valuations_counter = self.meter.create_counter(
            "terrafusion_valuations_total",
            description="Total property valuations performed",
            unit="valuations"
        )
        
        # Quantum calculations counter
        self.quantum_calculations_counter = self.meter.create_counter(
            "terrafusion_quantum_calculations_total",
            description="Total quantum calculations performed",
            unit="calculations"
        )
        
        # RAG queries counter
        self.rag_queries_counter = self.meter.create_counter(
            "terrafusion_rag_queries_total",
            description="Total RAG queries processed",
            unit="queries"
        )
        
        return {
            "request_counter": self.request_counter,
            "response_time_histogram": self.response_time_histogram,
            "active_users_gauge": self.active_users_gauge,
            "valuations_counter": self.valuations_counter,
            "quantum_calculations_counter": self.quantum_calculations_counter,
            "rag_queries_counter": self.rag_queries_counter
        }
    
    def create_span(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        """Create a new span"""
        span = self.tracer.start_span(name)
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        return span
    
    def trace_function(self, func):
        """Decorator to trace function execution"""
        def wrapper(*args, **kwargs):
            with self.tracer.start_as_current_span(
                func.__name__,
                attributes={
                    "function.module": func.__module__,
                    "function.name": func.__name__
                }
            ) as span:
                try:
                    result = func(*args, **kwargs)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(
                        trace.Status(trace.StatusCode.ERROR, str(e))
                    )
                    span.record_exception(e)
                    raise
        return wrapper
    
    def get_trace_context(self) -> Dict[str, str]:
        """Get current trace context for propagation"""
        from opentelemetry import propagate
        carrier = {}
        propagate.inject(carrier)
        return carrier

# Service-specific instrumentation configurations
class FrontendTracing(TerraFusionTracing):
    """Frontend-specific tracing configuration"""
    
    def __init__(self):
        super().__init__("terrafusion-frontend", "1.0.0")
        
    def setup(self):
        self.setup_tracing()
        self.setup_metrics()
        self.instrument_requests()
        
        # Create frontend-specific metrics
        self.page_load_time = self.meter.create_histogram(
            "frontend_page_load_time_ms",
            description="Page load time in milliseconds",
            unit="ms"
        )
        
        self.api_call_duration = self.meter.create_histogram(
            "frontend_api_call_duration_ms",
            description="API call duration from frontend",
            unit="ms"
        )

class BackendTracing(TerraFusionTracing):
    """Backend API-specific tracing configuration"""
    
    def __init__(self):
        super().__init__("terrafusion-backend", "1.0.0")
        
    def setup(self, app, db_engine=None):
        self.setup_tracing()
        self.setup_metrics()
        self.instrument_fastapi(app)
        self.instrument_redis()
        
        if db_engine:
            self.instrument_sqlalchemy(db_engine)
        
        # Create backend-specific metrics
        self.db_query_duration = self.meter.create_histogram(
            "backend_db_query_duration_ms",
            description="Database query duration",
            unit="ms"
        )
        
        self.cache_hit_rate = self.meter.create_histogram(
            "backend_cache_hit_rate",
            description="Cache hit rate percentage",
            unit="percent"
        )

class AIEngineTracing(TerraFusionTracing):
    """AI Engine-specific tracing configuration"""
    
    def __init__(self):
        super().__init__("terrafusion-ai-engine", "1.0.0")
        
    def setup(self, app):
        self.setup_tracing()
        self.setup_metrics()
        self.instrument_fastapi(app)
        self.instrument_aiohttp()
        
        # Create AI-specific metrics
        self.model_inference_time = self.meter.create_histogram(
            "ai_model_inference_time_ms",
            description="Model inference time",
            unit="ms"
        )
        
        self.quantum_computation_time = self.meter.create_histogram(
            "ai_quantum_computation_time_ms",
            description="Quantum computation time",
            unit="ms"
        )
        
        self.prediction_accuracy = self.meter.create_histogram(
            "ai_prediction_accuracy",
            description="Prediction accuracy percentage",
            unit="percent"
        )

class RAGServiceTracing(TerraFusionTracing):
    """RAG Service-specific tracing configuration"""
    
    def __init__(self):
        super().__init__("terrafusion-rag-service", "1.0.0")
        
    def setup(self, app):
        self.setup_tracing()
        self.setup_metrics()
        self.instrument_fastapi(app)
        
        # Create RAG-specific metrics
        self.query_processing_time = self.meter.create_histogram(
            "rag_query_processing_time_ms",
            description="Query processing time",
            unit="ms"
        )
        
        self.document_retrieval_time = self.meter.create_histogram(
            "rag_document_retrieval_time_ms",
            description="Document retrieval time",
            unit="ms"
        )
        
        self.relevance_score = self.meter.create_histogram(
            "rag_relevance_score",
            description="Query result relevance score",
            unit="score"
        )

# Example usage in a FastAPI app
def setup_service_tracing(app, service_type: str = "backend"):
    """Setup tracing for a specific service"""
    if service_type == "backend":
        tracing = BackendTracing()
        tracing.setup(app)
    elif service_type == "ai":
        tracing = AIEngineTracing()
        tracing.setup(app)
    elif service_type == "rag":
        tracing = RAGServiceTracing()
        tracing.setup(app)
    else:
        tracing = TerraFusionTracing(f"terrafusion-{service_type}")
        tracing.setup_tracing()
        tracing.setup_metrics()
    
    return tracing

# Middleware for trace context propagation
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class TraceContextMiddleware(BaseHTTPMiddleware):
    """Middleware to propagate trace context"""
    
    async def dispatch(self, request: Request, call_next):
        # Extract trace context from headers
        from opentelemetry import propagate
        ctx = propagate.extract(dict(request.headers))
        
        # Execute request with trace context
        from opentelemetry import context
        with context.attach(ctx):
            response = await call_next(request)
            
        # Add trace ID to response headers
        span = trace.get_current_span()
        if span.is_recording():
            trace_id = format(span.get_span_context().trace_id, '032x')
            response.headers["X-Trace-ID"] = trace_id
            
        return response