#!/usr/bin/env python3
"""
ACME Assessment Pro - TerraFusion cOS Integration Demo

This demo showcases a realistic vendor integration using the TerraFusion cOS
platform substrate. It simulates a property assessment application that
integrates with the platform using the container sidecar pattern.

Features demonstrated:
- Zero-rewrite integration pattern
- Real-time property data access via platform
- Event-driven updates from other government systems
- AI agent coordination for assessment validation
- Government-grade audit trails
- Multi-county data access capabilities
"""

import asyncio
import json
import logging
import aiohttp
import websockets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from faker import Faker
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import jwt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('acme-assessment-demo')

@dataclass
class PropertyAssessment:
    """Property assessment data structure"""
    parcel_id: str
    assessed_value: float
    market_value: float
    land_value: float
    improvement_value: float
    assessment_date: datetime
    assessment_method: str
    assessor_id: str
    confidence_score: float
    comparable_properties: List[str]
    ai_validation_status: str
    compliance_status: str

@dataclass
class AssessmentRequest:
    """Assessment request from client"""
    parcel_id: str
    assessment_type: str = "market_approach"
    force_recalculation: bool = False
    include_comparables: bool = True

class TerraFusionPlatformClient:
    """Client for TerraFusion cOS platform integration"""

    def __init__(self, platform_endpoint: str, api_key: str, vendor_id: str):
        self.platform_endpoint = platform_endpoint
        self.api_key = api_key
        self.vendor_id = vendor_id
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'X-Vendor-ID': self.vendor_id,
                'Content-Type': 'application/json'
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get_property(self, parcel_id: str) -> Dict[str, Any]:
        """Get property data from platform data plane"""
        async with self.session.get(f'{self.platform_endpoint}/api/v1/data/properties/{parcel_id}') as response:
            if response.status == 200:
                return await response.json()
            else:
                raise HTTPException(status_code=response.status, detail=f"Property not found: {parcel_id}")

    async def get_comparable_sales(self, parcel_id: str, radius_miles: float = 1.0, limit: int = 10) -> List[Dict]:
        """Get comparable sales data from platform"""
        params = {
            'near_property': parcel_id,
            'radius_miles': radius_miles,
            'sale_date_after': (datetime.now() - timedelta(days=365)).isoformat(),
            'limit': limit
        }

        async with self.session.get(f'{self.platform_endpoint}/api/v1/data/sales', params=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                return []

    async def publish_event(self, event_type: str, data: Dict[str, Any]) -> bool:
        """Publish event to platform event bus"""
        event_data = {
            'type': event_type,
            'source': self.vendor_id,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }

        async with self.session.post(f'{self.platform_endpoint}/api/v1/events', json=event_data) as response:
            return response.status == 200

    async def request_ai_validation(self, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Request AI agent validation of assessment"""
        validation_request = {
            'type': 'assessment_validation',
            'assessment': assessment_data,
            'requester': self.vendor_id
        }

        async with self.session.post(f'{self.platform_endpoint}/api/v1/ai-agents/validate', json=validation_request) as response:
            if response.status == 200:
                return await response.json()
            else:
                return {'status': 'unavailable', 'confidence': 0.5}

    async def log_audit_event(self, action: str, details: Dict[str, Any]) -> bool:
        """Log audit event for compliance"""
        audit_data = {
            'vendor_id': self.vendor_id,
            'action': action,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'user_id': details.get('user_id', 'system')
        }

        async with self.session.post(f'{self.platform_endpoint}/api/v1/audit/log', json=audit_data) as response:
            return response.status == 200

class ACMEAssessmentEngine:
    """ACME Assessment calculation engine (simulated legacy application)"""

    def __init__(self, platform_client: TerraFusionPlatformClient):
        self.platform = platform_client
        self.fake = Faker()

    async def calculate_market_assessment(self, parcel_id: str) -> PropertyAssessment:
        """Calculate property assessment using market approach"""
        logger.info(f"Calculating market assessment for {parcel_id}")

        # Step 1: Get property data from platform (instead of direct DB access)
        property_data = await self.platform.get_property(parcel_id)

        # Step 2: Get comparable sales from platform
        comparables = await self.platform.get_comparable_sales(parcel_id, radius_miles=1.0, limit=5)

        # Step 3: Apply ACME's proprietary assessment algorithm
        assessment_value = await self._calculate_acme_value(property_data, comparables)

        # Step 4: Request AI validation from platform agents
        ai_validation = await self.platform.request_ai_validation({
            'parcel_id': parcel_id,
            'calculated_value': assessment_value,
            'method': 'market_approach',
            'comparables_count': len(comparables)
        })

        # Step 5: Create assessment record
        assessment = PropertyAssessment(
            parcel_id=parcel_id,
            assessed_value=assessment_value,
            market_value=assessment_value * 1.15,  # Market typically 15% higher
            land_value=assessment_value * 0.35,    # Land typically 35% of total
            improvement_value=assessment_value * 0.65,  # Improvements 65%
            assessment_date=datetime.now(),
            assessment_method='Market Approach - ACME Algorithm',
            assessor_id='ACME_ASSESSOR_001',
            confidence_score=ai_validation.get('confidence', 0.85),
            comparable_properties=[c['parcel_id'] for c in comparables[:3]],
            ai_validation_status=ai_validation.get('status', 'validated'),
            compliance_status='compliant'
        )

        # Step 6: Publish assessment completion event
        await self.platform.publish_event('assessment.completed', {
            'parcel_id': parcel_id,
            'assessed_value': assessment_value,
            'assessor': 'ACME Assessment Pro',
            'method': 'market_approach'
        })

        # Step 7: Log audit event for compliance
        await self.platform.log_audit_event('assessment_calculated', {
            'parcel_id': parcel_id,
            'method': 'market_approach',
            'value': assessment_value,
            'user_id': 'acme_system'
        })

        return assessment

    async def _calculate_acme_value(self, property_data: Dict, comparables: List[Dict]) -> float:
        """ACME's proprietary assessment calculation"""
        # Simulate sophisticated assessment algorithm
        base_value = property_data.get('last_sale_price', 300000)

        if comparables:
            # Weight comparables by recency and similarity
            comparable_values = []
            for comp in comparables:
                sale_date = datetime.fromisoformat(comp['sale_date'].replace('Z', '+00:00'))
                recency_factor = max(0.5, 1 - (datetime.now(sale_date.tzinfo) - sale_date).days / 365)
                adjusted_value = comp['sale_price'] * recency_factor
                comparable_values.append(adjusted_value)

            if comparable_values:
                base_value = sum(comparable_values) / len(comparable_values)

        # Apply ACME's market adjustments
        market_adjustment = 1.0 + (self.fake.random.uniform(-0.1, 0.15))  # -10% to +15%
        condition_adjustment = self.fake.random.uniform(0.95, 1.05)  # Property condition
        location_adjustment = self.fake.random.uniform(0.98, 1.08)   # Location premium/discount

        final_value = base_value * market_adjustment * condition_adjustment * location_adjustment

        return round(final_value, -2)  # Round to nearest $100

# FastAPI application (simulating legacy ACME web application)
app = FastAPI(title="ACME Assessment Pro", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Platform client (injected by sidecar integration)
platform_client = TerraFusionPlatformClient(
    platform_endpoint="http://platform-core:3000",  # Platform endpoint via sidecar
    api_key="acme-demo-api-key",
    vendor_id="acme-assessment-pro"
)

# Assessment engine
assessment_engine = ACMEAssessmentEngine(platform_client)

# In-memory cache for demo (in reality, this might be Redis)
assessment_cache = {}
connected_websockets = set()

@app.on_event("startup")
async def startup_event():
    """Initialize ACME application with platform registration"""
    logger.info("ACME Assessment Pro starting up...")

    # Register with TerraFusion platform (via sidecar)
    async with platform_client as client:
        registration_data = {
            'vendor_id': 'acme-assessment-pro',
            'vendor_name': 'ACME Assessment Pro',
            'version': '2.1.0',
            'capabilities': [
                'property-assessment',
                'market-analysis',
                'comparable-sales',
                'ai-validation'
            ],
            'integration_type': 'sidecar',
            'health_endpoint': '/health'
        }

        try:
            async with client.session.post(f'{client.platform_endpoint}/api/v1/vendors/register',
                                         json=registration_data) as response:
                if response.status == 200:
                    logger.info("Successfully registered with TerraFusion platform")
                else:
                    logger.warning(f"Platform registration failed: {response.status}")
        except Exception as e:
            logger.error(f"Failed to register with platform: {e}")

@app.get("/")
async def root():
    """ACME Assessment Pro main page"""
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>ACME Assessment Pro - TerraFusion Integration Demo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #1e40af; font-size: 2em; font-weight: bold; }
            .subtitle { color: #666; margin-top: 10px; }
            .integration-status { background: #10b981; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .demo-section { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 5px; }
            .button { background: #1e40af; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .button:hover { background: #1e3a8a; }
            input[type="text"] { padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 200px; margin: 5px; }
            .result { background: #e5e7eb; padding: 15px; border-radius: 5px; margin-top: 15px; font-family: monospace; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 5px 0; }
            .feature-list li:before { content: "✓ "; color: #10b981; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">ACME Assessment Pro</div>
                <div class="subtitle">Property Assessment System</div>
                <div class="integration-status">
                    🔗 Integrated with TerraFusion cOS Platform
                </div>
            </div>

            <div class="demo-section">
                <h3>Platform-Enhanced Features</h3>
                <ul class="feature-list">
                    <li>Real-time access to Harris PACS database via TerraFusion Data Plane</li>
                    <li>AI agent validation using 50,000+ government AI agents</li>
                    <li>Event-driven updates from other county systems</li>
                    <li>Government-grade audit trails and compliance logging</li>
                    <li>Multi-county data access through platform federation</li>
                    <li>Zero-rewrite integration - legacy code unchanged</li>
                </ul>
            </div>

            <div class="demo-section">
                <h3>Property Assessment Demo</h3>
                <p>Enter a Benton County parcel ID to see the TerraFusion integration in action:</p>
                <div>
                    <input type="text" id="parcel-id" placeholder="BC001234" value="BC001234">
                    <button class="button" onclick="assessProperty()">Calculate Assessment</button>
                    <button class="button" onclick="getPropertyData()">Get Property Data</button>
                </div>
                <div id="result" class="result" style="display: none;"></div>
            </div>

            <div class="demo-section">
                <h3>Real-time Platform Integration</h3>
                <p>This demonstrates how your existing ACME application integrates with TerraFusion cOS:</p>
                <button class="button" onclick="connectWebSocket()">Connect to Real-time Updates</button>
                <button class="button" onclick="showSystemHealth()">Show System Health</button>
                <div id="realtime-data" class="result" style="display: none;"></div>
            </div>
        </div>

        <script>
            let ws = null;

            async function assessProperty() {
                const parcelId = document.getElementById('parcel-id').value;
                if (!parcelId) {
                    alert('Please enter a parcel ID');
                    return;
                }

                const resultDiv = document.getElementById('result');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = 'Calculating assessment via TerraFusion platform...';

                try {
                    const response = await fetch(`/api/assess/${parcelId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ assessment_type: 'market_approach' })
                    });

                    const data = await response.json();

                    resultDiv.innerHTML = `
                        <strong>Assessment Results (via TerraFusion cOS)</strong><br><br>
                        Parcel ID: ${data.parcel_id}<br>
                        Assessed Value: $${data.assessed_value.toLocaleString()}<br>
                        Market Value: $${data.market_value.toLocaleString()}<br>
                        Assessment Method: ${data.assessment_method}<br>
                        AI Confidence Score: ${(data.confidence_score * 100).toFixed(1)}%<br>
                        AI Validation: ${data.ai_validation_status}<br>
                        Compliance Status: ${data.compliance_status}<br>
                        Comparable Properties: ${data.comparable_properties.join(', ')}<br>
                        Assessment Date: ${new Date(data.assessment_date).toLocaleString()}<br><br>
                        <em>✓ Data accessed via TerraFusion Data Plane</em><br>
                        <em>✓ AI validation by TerraFusion AI Agents</em><br>
                        <em>✓ Audit trail logged for government compliance</em>
                    `;
                } catch (error) {
                    resultDiv.innerHTML = `Error: ${error.message}`;
                }
            }

            async function getPropertyData() {
                const parcelId = document.getElementById('parcel-id').value;
                if (!parcelId) {
                    alert('Please enter a parcel ID');
                    return;
                }

                const resultDiv = document.getElementById('result');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = 'Fetching property data from TerraFusion platform...';

                try {
                    const response = await fetch(`/api/property/${parcelId}`);
                    const data = await response.json();

                    resultDiv.innerHTML = `
                        <strong>Property Data (from Harris PACS via TerraFusion)</strong><br><br>
                        Parcel ID: ${data.parcel_id}<br>
                        Address: ${data.address}<br>
                        Owner: ${data.owner_name}<br>
                        Property Type: ${data.property_type}<br>
                        Square Feet: ${data.square_feet?.toLocaleString() || 'N/A'}<br>
                        Year Built: ${data.year_built || 'N/A'}<br>
                        Current Assessed Value: $${data.assessed_value?.toLocaleString()}<br>
                        Last Sale Date: ${data.last_sale_date || 'N/A'}<br>
                        Last Sale Price: ${data.last_sale_price ? '$' + data.last_sale_price.toLocaleString() : 'N/A'}<br><br>
                        <em>✓ Real-time data from Harris PACS database</em><br>
                        <em>✓ Accessed via TerraFusion Data Plane API</em>
                    `;
                } catch (error) {
                    resultDiv.innerHTML = `Error: ${error.message}`;
                }
            }

            function connectWebSocket() {
                const realtimeDiv = document.getElementById('realtime-data');
                realtimeDiv.style.display = 'block';
                realtimeDiv.innerHTML = 'Connecting to TerraFusion real-time updates...';

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

                ws.onopen = function(event) {
                    realtimeDiv.innerHTML = '<strong>Real-time Platform Updates</strong><br><br>Connected to TerraFusion event bus...<br>';
                };

                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    const timestamp = new Date().toLocaleTimeString();
                    realtimeDiv.innerHTML += `[${timestamp}] ${data.type}: ${data.message}<br>`;
                    realtimeDiv.scrollTop = realtimeDiv.scrollHeight;
                };

                ws.onerror = function(error) {
                    realtimeDiv.innerHTML += `Error: ${error}<br>`;
                };
            }

            async function showSystemHealth() {
                const realtimeDiv = document.getElementById('realtime-data');
                realtimeDiv.style.display = 'block';

                try {
                    const response = await fetch('/health');
                    const health = await response.json();

                    realtimeDiv.innerHTML = `
                        <strong>ACME Assessment Pro - System Health</strong><br><br>
                        Application Status: ${health.status}<br>
                        Platform Connection: ${health.platform_connected ? '✓ Connected' : '✗ Disconnected'}<br>
                        TerraFusion Integration: ${health.integration_status}<br>
                        Data Plane Access: ${health.data_plane_healthy ? '✓ Healthy' : '✗ Unhealthy'}<br>
                        AI Agent Access: ${health.ai_agents_available ? '✓ Available' : '✗ Unavailable'}<br>
                        Event Bus: ${health.event_bus_connected ? '✓ Connected' : '✗ Disconnected'}<br>
                        Uptime: ${health.uptime} seconds<br><br>
                        <em>Real-time health monitoring via TerraFusion platform</em>
                    `;
                } catch (error) {
                    realtimeDiv.innerHTML = `Error getting health status: ${error.message}`;
                }
            }
        </script>
    </body>
    </html>
    """)

@app.get("/health")
async def health_check():
    """Health check endpoint for platform monitoring"""
    return {
        "status": "healthy",
        "application": "ACME Assessment Pro",
        "version": "2.1.0",
        "platform_connected": True,
        "integration_status": "active",
        "data_plane_healthy": True,
        "ai_agents_available": True,
        "event_bus_connected": True,
        "uptime": 3600,  # Simulated uptime
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/property/{parcel_id}")
async def get_property_data(parcel_id: str):
    """Get property data via TerraFusion platform (demo endpoint)"""
    async with platform_client as client:
        try:
            # In a real integration, this would call the platform API
            # For demo, we'll return simulated data that shows the integration
            property_data = await client.get_property(parcel_id)
            return property_data
        except Exception as e:
            # Return demo data if platform not available
            return {
                "parcel_id": parcel_id,
                "address": f"{1000 + hash(parcel_id) % 9000} Demo St, Richland, WA",
                "owner_name": "Demo Property Owner",
                "assessed_value": 485200.00,
                "market_value": 525000.00,
                "property_type": "Single Family Residential",
                "square_feet": 2150,
                "year_built": 1985,
                "last_sale_date": "2022-03-15",
                "last_sale_price": 475000.00,
                "coordinates": [-119.2781, 46.2396],
                "_source": "Demo data - Harris PACS integration via TerraFusion"
            }

@app.post("/api/assess/{parcel_id}")
async def calculate_assessment(parcel_id: str, request: AssessmentRequest):
    """Calculate property assessment using ACME engine + TerraFusion platform"""
    try:
        # Check cache first
        cache_key = f"assessment_{parcel_id}_{request.assessment_type}"
        if not request.force_recalculation and cache_key in assessment_cache:
            cached_result = assessment_cache[cache_key]
            logger.info(f"Returning cached assessment for {parcel_id}")
            return cached_result

        # Calculate new assessment via platform integration
        async with platform_client as client:
            assessment = await assessment_engine.calculate_market_assessment(parcel_id)

            # Cache result
            result = asdict(assessment)
            assessment_cache[cache_key] = result

            # Broadcast to connected WebSocket clients
            if connected_websockets:
                event_data = {
                    "type": "assessment_completed",
                    "message": f"New assessment calculated for {parcel_id}: ${assessment.assessed_value:,.0f}"
                }

                for ws in connected_websockets.copy():
                    try:
                        await ws.send_text(json.dumps(event_data))
                    except:
                        connected_websockets.discard(ws)

            return result

    except Exception as e:
        logger.error(f"Assessment calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    connected_websockets.add(websocket)

    # Send welcome message
    await websocket.send_text(json.dumps({
        "type": "connection_established",
        "message": "Connected to ACME Assessment Pro real-time updates via TerraFusion"
    }))

    try:
        # Send periodic demo updates
        while True:
            await asyncio.sleep(10)  # Send update every 10 seconds

            demo_events = [
                {
                    "type": "platform_event",
                    "message": f"AI Agent processed {1000 + hash(str(datetime.now())) % 500} assessments"
                },
                {
                    "type": "data_sync",
                    "message": f"Harris PACS data synchronized: {50 + hash(str(datetime.now())) % 20} records updated"
                },
                {
                    "type": "system_metric",
                    "message": f"Platform response time: {20 + hash(str(datetime.now())) % 30}ms"
                }
            ]

            event = demo_events[hash(str(datetime.now())) % len(demo_events)]
            await websocket.send_text(json.dumps(event))

    except Exception as e:
        logger.info(f"WebSocket disconnected: {e}")
    finally:
        connected_websockets.discard(websocket)

@app.get("/api/demo/stats")
async def get_demo_stats():
    """Get demo statistics for dashboard"""
    return {
        "assessments_calculated": len(assessment_cache),
        "platform_requests": 1247,
        "ai_validations": 892,
        "active_connections": len(connected_websockets),
        "uptime_seconds": 3600,
        "integration_status": "healthy",
        "last_platform_sync": datetime.now().isoformat()
    }

# Demo data simulation
async def simulate_background_activity():
    """Simulate background assessment activity for demo"""
    while True:
        try:
            await asyncio.sleep(15)  # Every 15 seconds

            if connected_websockets:
                # Simulate various platform events
                events = [
                    {
                        "type": "property_updated",
                        "message": f"Property BC{hash(str(datetime.now())) % 100000:06d} updated via platform"
                    },
                    {
                        "type": "ai_analysis",
                        "message": f"AI agents validated {5 + hash(str(datetime.now())) % 15} assessments"
                    },
                    {
                        "type": "compliance_check",
                        "message": "All assessments passed FISMA compliance validation"
                    }
                ]

                event = events[hash(str(datetime.now())) % len(events)]

                for ws in connected_websockets.copy():
                    try:
                        await ws.send_text(json.dumps(event))
                    except:
                        connected_websockets.discard(ws)

        except Exception as e:
            logger.error(f"Background simulation error: {e}")

@app.on_event("startup")
async def start_background_tasks():
    """Start background demo simulation tasks"""
    asyncio.create_task(simulate_background_activity())

if __name__ == "__main__":
    # Run ACME Assessment Pro demo application
    logger.info("Starting ACME Assessment Pro - TerraFusion Integration Demo")
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")