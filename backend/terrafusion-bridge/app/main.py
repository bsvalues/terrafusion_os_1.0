from fastapi import FastAPI, Header, HTTPException, Depends
from .config import settings
from .translate.schema_map import SQL_GET_PARCEL
from .translate.mapper import sql_row_to_lattice_node
from typing import Optional

# Conditional Import for Mock vs Real DB
try:
    if not settings.PACS_USER:
        raise ValueError("No User")
    from .db import get_db_connection
    print("Using REAL Database Connection")
except Exception:
    from .mock_db import get_mock_connection as get_db_connection
    print("Using MOCK Database Connection (Missing Credentials)")

# --- PHASE 9.1: TELEMETRY START ---
import os
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# These defaults work inside docker-compose.observability.yml context
service_name = os.getenv("OTEL_SERVICE_NAME", "terrafusion-cortex")
otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")

resource = Resource.create({"service.name": service_name})

trace.set_tracer_provider(TracerProvider(resource=resource))
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True))
)

metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(endpoint=otlp_endpoint, insecure=True)
)
metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=[metric_reader]))
# --- TELEMETRY END ---

app = FastAPI(title="TerraFusion Bridge", version="1.0.0")

FastAPIInstrumentor.instrument_app(app)
RequestsInstrumentor().instrument()

# Security Gatekeeper
async def verify_key(x_tf_bridge_key: Optional[str] = Header(None)):
    if x_tf_bridge_key != settings.TF_BRIDGE_KEY:
        raise HTTPException(status_code=401, detail="Sovereignty Violation: Invalid Bridge Key")

@app.get("/health")
def health_check():
    mode = "real" if settings.PACS_USER else "mock (proval-standard)"
    return {"status": "online", "target": settings.PACS_DB, "mode": mode}

@app.get("/v1/parcels/{parcel_id}", dependencies=[Depends(verify_key)])
def get_parcel_lattice(parcel_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Execute Parameterized Query
    cursor.execute(SQL_GET_PARCEL, parcel_id)
    
    # Convert Row to Dict
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Parcel not found in PACS")
        
    columns = [column[0] for column in cursor.description]
    row_dict = dict(zip(columns, row))
    
    # Translate
    result = sql_row_to_lattice_node(row_dict)
    return result

# --- PHASE 10: THE SHOW ---
from pydantic import BaseModel
from .agent import agent

class ChatRequest(BaseModel):
    prompt: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Sovereign Agent Endpoint (Cortex).
    """
    response = agent.process(request.prompt)
    return {"response": response, "agent": "TerraFusion Cortex v1.0", "trace_id": format(trace.get_current_span().get_span_context().trace_id, "032x")}
# --------------------------
