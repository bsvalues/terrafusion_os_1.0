import os
import requests
import json
from opentelemetry import trace
from opentelemetry.propagate import inject

IRON_API_URL = os.getenv("IRON_API_URL", "http://terrafusion-iron:5000")
tracer = trace.get_tracer(__name__)

def lookup_parcel(parcel_id: str):
    """
    Fetches parcel details from the Iron API (Muscle) with trace context.
    """
    url = f"{IRON_API_URL}/api/parcels/{parcel_id}"
    
    # 1. Start a span for the tool execution
    with tracer.start_as_current_span(f"tool_execution:lookup_parcel") as span:
        span.set_attribute("tool.name", "lookup_parcel")
        span.set_attribute("tool.target", parcel_id)
        
        # 2. Inject Context (The Nerve)
        headers = {}
        inject(headers)  # Injects TraceParent into headers
        
        try:
            # 3. Call Iron
            span.add_event("sending_request_to_iron")
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            span.set_attribute("tool.result_size", len(json.dumps(data)))
            return data
            
        except requests.exceptions.RequestException as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR))
            return {"error": str(e), "hint": "Is Iron (Backend) running?"}

def retrieve_zoning_code(query: str):
    """
    Mock RAG retrieval for zoning code (The Law).
    """
    with tracer.start_as_current_span("tool_execution:retrieve_zoning") as span:
        span.set_attribute("tool.query", query)
        # Mock retrieval
        return {
            "source": "Benton County Zoning Code, Section 4.2",
            "text": "Maximum building height in R-1 zones is 35 feet or 2.5 stories, whichever is less."
        }
