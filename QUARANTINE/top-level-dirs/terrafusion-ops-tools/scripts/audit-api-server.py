#!/usr/bin/env python3

"""
TerraFusion Audit API and Webhook Integration Server
REST API endpoints and webhook integrations for audit system
Features: RESTful API, webhooks, real-time notifications, external integrations
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import hmac
import hashlib
import base64
from pathlib import Path

# FastAPI and web framework imports
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn
from pydantic import BaseModel, Field
from typing_extensions import Annotated
import aiohttp
import asyncpg

# WebSocket support
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

class WebhookEvent(Enum):
    AUDIT_STARTED = "audit.started"
    AUDIT_COMPLETED = "audit.completed" 
    AUDIT_FAILED = "audit.failed"
    ANOMALY_DETECTED = "anomaly.detected"
    ALERT_TRIGGERED = "alert.triggered"
    ALERT_RESOLVED = "alert.resolved"
    REMEDIATION_STARTED = "remediation.started"
    REMEDIATION_COMPLETED = "remediation.completed"
    INSIGHT_GENERATED = "insight.generated"
    THRESHOLD_BREACHED = "threshold.breached"

class APIKeyScope(Enum):
    READ_ONLY = "read_only"
    READ_WRITE = "read_write" 
    ADMIN = "admin"
    WEBHOOK = "webhook"

@dataclass
class APIKey:
    key_id: str
    key_hash: str
    name: str
    scope: APIKeyScope
    created_by: str
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool = True

@dataclass
class WebhookEndpoint:
    endpoint_id: str
    url: str
    secret: str
    events: List[WebhookEvent]
    is_active: bool
    created_at: datetime
    last_triggered: Optional[datetime] = None
    failure_count: int = 0

# Pydantic models for API requests/responses
class AuditSessionResponse(BaseModel):
    session_id: str
    audit_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    total_checks: int
    passed_checks: int
    failed_checks: int
    audit_score: float

class AuditFindingResponse(BaseModel):
    finding_id: str
    session_id: str
    component: str
    finding_type: str
    severity: str
    title: str
    description: str
    recommendations: List[str]
    created_at: datetime

class MetricsResponse(BaseModel):
    timestamp: datetime
    system_metrics: Dict[str, Any]
    api_metrics: Dict[str, Any]
    database_metrics: Dict[str, Any]
    application_metrics: Dict[str, Any]

class InsightResponse(BaseModel):
    insight_id: str
    analytics_type: str
    title: str
    description: str
    confidence_score: float
    impact_level: str
    recommendations: List[str]
    generated_at: datetime
    expires_at: Optional[datetime]

class WebhookRequest(BaseModel):
    url: str
    secret: str
    events: List[str]
    name: str = "Webhook Endpoint"

class AlertResponse(BaseModel):
    alert_id: str
    component: str
    metric_name: str
    severity: str
    current_value: float
    threshold_value: float
    message: str
    timestamp: datetime
    resolved: bool

class AuditAPIServer:
    def __init__(self):
        self.app = FastAPI(
            title="TerraFusion Audit API",
            description="REST API for TerraFusion audit system",
            version="1.0.0"
        )
        
        # Database connections
        self.db_pool = None
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        
        # API configuration
        self.api_keys = {}
        self.webhook_endpoints = {}
        self.active_websockets = set()
        
        # Security
        self.security = HTTPBearer()
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure appropriately for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Initialize routes
        self.setup_routes()
        
    async def startup(self):
        """Initialize the API server"""
        self.logger.info("Starting TerraFusion Audit API Server...")
        
        # Initialize database connection pool
        await self.init_database_pool()
        
        # Load API keys and webhooks
        await self.load_api_keys()
        await self.load_webhook_endpoints()
        
        # Start background tasks
        asyncio.create_task(self.webhook_monitor_loop())
        
        self.logger.info("Audit API Server started successfully")
        
    async def init_database_pool(self):
        """Initialize async database connection pool"""
        try:
            self.db_pool = await asyncpg.create_pool(
                "postgresql://postgres@localhost/terrafusion",
                min_size=5,
                max_size=20
            )
            self.logger.info("Database connection pool initialized")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize database pool: {e}")
            raise
            
    async def load_api_keys(self):
        """Load API keys from database"""
        try:
            # For demo, create a default API key
            default_key = APIKey(
                key_id="demo_key_001",
                key_hash=hashlib.sha256("demo_api_key_12345".encode()).hexdigest(),
                name="Demo API Key",
                scope=APIKeyScope.ADMIN,
                created_by="system",
                created_at=datetime.now(),
                expires_at=None
            )
            
            self.api_keys[default_key.key_hash] = default_key
            self.logger.info(f"Loaded {len(self.api_keys)} API keys")
            
        except Exception as e:\n            self.logger.error(f\"Error loading API keys: {e}\")\n            \n    async def load_webhook_endpoints(self):\n        \"\"\"Load webhook endpoints from database\"\"\"\n        try:\n            # For demo, no webhooks loaded initially\n            self.logger.info(f\"Loaded {len(self.webhook_endpoints)} webhook endpoints\")\n            \n        except Exception as e:\n            self.logger.error(f\"Error loading webhook endpoints: {e}\")\n            \n    def setup_routes(self):\n        \"\"\"Setup all API routes\"\"\"\n        \n        # Health check endpoint\n        @self.app.get(\"/health\")\n        async def health_check():\n            return {\"status\": \"healthy\", \"timestamp\": datetime.now()}\n            \n        # Authentication dependency\n        async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(self.security)):\n            api_key = credentials.credentials\n            key_hash = hashlib.sha256(api_key.encode()).hexdigest()\n            \n            if key_hash not in self.api_keys:\n                raise HTTPException(status_code=401, detail=\"Invalid API key\")\n                \n            api_key_obj = self.api_keys[key_hash]\n            \n            if not api_key_obj.is_active:\n                raise HTTPException(status_code=401, detail=\"API key is disabled\")\n                \n            if api_key_obj.expires_at and datetime.now() > api_key_obj.expires_at:\n                raise HTTPException(status_code=401, detail=\"API key has expired\")\n                \n            return api_key_obj\n            \n        # Audit Sessions Endpoints\n        @self.app.get(\"/api/v1/audit/sessions\", response_model=List[AuditSessionResponse])\n        async def get_audit_sessions(\n            limit: int = 50,\n            offset: int = 0,\n            status: Optional[str] = None,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Get audit sessions with pagination and filtering\"\"\"\n            try:\n                query = \"\"\"\n                    SELECT session_id, audit_type, status, started_at, completed_at,\n                           total_checks, passed_checks, failed_checks, audit_score\n                    FROM audit_sessions\n                \"\"\"\n                \n                params = []\n                if status:\n                    query += \" WHERE status = $1\"\n                    params.append(status)\n                    \n                query += f\" ORDER BY started_at DESC LIMIT ${len(params)+1} OFFSET ${len(params)+2}\"\n                params.extend([limit, offset])\n                \n                async with self.db_pool.acquire() as conn:\n                    rows = await conn.fetch(query, *params)\n                    \n                return [\n                    AuditSessionResponse(\n                        session_id=str(row['session_id']),\n                        audit_type=row['audit_type'],\n                        status=row['status'],\n                        started_at=row['started_at'],\n                        completed_at=row['completed_at'],\n                        total_checks=row['total_checks'] or 0,\n                        passed_checks=row['passed_checks'] or 0,\n                        failed_checks=row['failed_checks'] or 0,\n                        audit_score=row['audit_score'] or 0.0\n                    )\n                    for row in rows\n                ]\n                \n            except Exception as e:\n                self.logger.error(f\"Error getting audit sessions: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        @self.app.get(\"/api/v1/audit/sessions/{session_id}\", response_model=AuditSessionResponse)\n        async def get_audit_session(\n            session_id: str,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Get specific audit session details\"\"\"\n            try:\n                query = \"\"\"\n                    SELECT session_id, audit_type, status, started_at, completed_at,\n                           total_checks, passed_checks, failed_checks, audit_score\n                    FROM audit_sessions\n                    WHERE session_id = $1\n                \"\"\"\n                \n                async with self.db_pool.acquire() as conn:\n                    row = await conn.fetchrow(query, session_id)\n                    \n                if not row:\n                    raise HTTPException(status_code=404, detail=\"Audit session not found\")\n                    \n                return AuditSessionResponse(\n                    session_id=str(row['session_id']),\n                    audit_type=row['audit_type'],\n                    status=row['status'],\n                    started_at=row['started_at'],\n                    completed_at=row['completed_at'],\n                    total_checks=row['total_checks'] or 0,\n                    passed_checks=row['passed_checks'] or 0,\n                    failed_checks=row['failed_checks'] or 0,\n                    audit_score=row['audit_score'] or 0.0\n                )\n                \n            except HTTPException:\n                raise\n            except Exception as e:\n                self.logger.error(f\"Error getting audit session: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        # Audit Findings Endpoints\n        @self.app.get(\"/api/v1/audit/sessions/{session_id}/findings\", response_model=List[AuditFindingResponse])\n        async def get_audit_findings(\n            session_id: str,\n            severity: Optional[str] = None,\n            component: Optional[str] = None,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Get audit findings for a specific session\"\"\"\n            try:\n                query = \"\"\"\n                    SELECT finding_id, session_id, component, finding_type, severity,\n                           title, description, recommendations, created_at\n                    FROM audit_findings\n                    WHERE session_id = $1\n                \"\"\"\n                \n                params = [session_id]\n                \n                if severity:\n                    query += f\" AND severity = ${len(params)+1}\"\n                    params.append(severity)\n                    \n                if component:\n                    query += f\" AND component = ${len(params)+1}\"\n                    params.append(component)\n                    \n                query += \" ORDER BY created_at DESC\"\n                \n                async with self.db_pool.acquire() as conn:\n                    rows = await conn.fetch(query, *params)\n                    \n                return [\n                    AuditFindingResponse(\n                        finding_id=str(row['finding_id']),\n                        session_id=str(row['session_id']),\n                        component=row['component'],\n                        finding_type=row['finding_type'],\n                        severity=row['severity'],\n                        title=row['title'],\n                        description=row['description'],\n                        recommendations=json.loads(row['recommendations']) if row['recommendations'] else [],\n                        created_at=row['created_at']\n                    )\n                    for row in rows\n                ]\n                \n            except Exception as e:\n                self.logger.error(f\"Error getting audit findings: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        # Real-time Metrics Endpoints\n        @self.app.get(\"/api/v1/metrics/current\", response_model=MetricsResponse)\n        async def get_current_metrics(api_key: APIKey = Depends(verify_api_key)):\n            \"\"\"Get current system metrics\"\"\"\n            try:\n                # Get latest metrics from Redis\n                latest_metrics = self.redis_client.get('audit:metrics:latest')\n                \n                if not latest_metrics:\n                    raise HTTPException(status_code=404, detail=\"No current metrics available\")\n                    \n                metrics_data = json.loads(latest_metrics)\n                \n                return MetricsResponse(\n                    timestamp=datetime.fromisoformat(metrics_data.get('timestamp', datetime.now().isoformat())),\n                    system_metrics=metrics_data.get('system', {}),\n                    api_metrics=metrics_data.get('api', {}),\n                    database_metrics=metrics_data.get('database', {}),\n                    application_metrics=metrics_data.get('application', {})\n                )\n                \n            except HTTPException:\n                raise\n            except Exception as e:\n                self.logger.error(f\"Error getting current metrics: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        @self.app.get(\"/api/v1/metrics/historical\")\n        async def get_historical_metrics(\n            hours: int = 24,\n            interval: int = 300,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Get historical metrics with specified time range and interval\"\"\"\n            try:\n                # Get historical metrics from Redis\n                end_time = int(time.time())\n                start_time = end_time - (hours * 3600)\n                \n                historical_data = []\n                \n                # Get metrics keys in time range\n                for timestamp in range(start_time, end_time, interval):\n                    key = f\"audit:metrics:timeseries:{timestamp}\"\n                    data = self.redis_client.get(key)\n                    \n                    if data:\n                        metrics = json.loads(data)\n                        historical_data.append({\n                            'timestamp': datetime.fromtimestamp(timestamp),\n                            'metrics': metrics\n                        })\n                        \n                return {\n                    'start_time': datetime.fromtimestamp(start_time),\n                    'end_time': datetime.fromtimestamp(end_time),\n                    'interval_seconds': interval,\n                    'data_points': len(historical_data),\n                    'data': historical_data\n                }\n                \n            except Exception as e:\n                self.logger.error(f\"Error getting historical metrics: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        # ML Insights Endpoints\n        @self.app.get(\"/api/v1/insights\", response_model=List[InsightResponse])\n        async def get_insights(\n            analytics_type: Optional[str] = None,\n            impact_level: Optional[str] = None,\n            limit: int = 50,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Get ML-generated insights\"\"\"\n            try:\n                query = \"\"\"\n                    SELECT insight_id, analytics_type, title, description, confidence_score,\n                           impact_level, recommendations, generated_at, expires_at\n                    FROM ml_analytics_insights\n                    WHERE is_active = true\n                \"\"\"\n                \n                params = []\n                \n                if analytics_type:\n                    query += f\" AND analytics_type = ${len(params)+1}\"\n                    params.append(analytics_type)\n                    \n                if impact_level:\n                    query += f\" AND impact_level = ${len(params)+1}\"\n                    params.append(impact_level)\n                    \n                query += f\" ORDER BY generated_at DESC LIMIT ${len(params)+1}\"\n                params.append(limit)\n                \n                async with self.db_pool.acquire() as conn:\n                    rows = await conn.fetch(query, *params)\n                    \n                return [\n                    InsightResponse(\n                        insight_id=row['insight_id'],\n                        analytics_type=row['analytics_type'],\n                        title=row['title'],\n                        description=row['description'],\n                        confidence_score=row['confidence_score'],\n                        impact_level=row['impact_level'],\n                        recommendations=json.loads(row['recommendations']) if row['recommendations'] else [],\n                        generated_at=row['generated_at'],\n                        expires_at=row['expires_at']\n                    )\n                    for row in rows\n                ]\n                \n            except Exception as e:\n                self.logger.error(f\"Error getting insights: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        # Alerts Endpoints\n        @self.app.get(\"/api/v1/alerts\", response_model=List[AlertResponse])\n        async def get_alerts(\n            severity: Optional[str] = None,\n            resolved: Optional[bool] = None,\n            limit: int = 50,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Get current alerts\"\"\"\n            try:\n                # Get alerts from Redis\n                alerts_data = []\n                \n                # Get active alerts\n                if resolved is None or not resolved:\n                    active_alerts = self.redis_client.lrange('audit:alerts:active', 0, limit-1)\n                    for alert_json in active_alerts:\n                        alert_data = json.loads(alert_json)\n                        if not severity or alert_data.get('severity') == severity:\n                            alerts_data.append({\n                                **alert_data,\n                                'resolved': False\n                            })\n                            \n                # Get resolved alerts\n                if resolved is None or resolved:\n                    resolved_alerts = self.redis_client.lrange('audit:alerts:resolved', 0, limit-1)\n                    for alert_json in resolved_alerts:\n                        alert_data = json.loads(alert_json)\n                        if not severity or alert_data.get('severity') == severity:\n                            alerts_data.append({\n                                **alert_data,\n                                'resolved': True\n                            })\n                            \n                # Convert to response objects\n                alerts = []\n                for alert_data in alerts_data[:limit]:\n                    alerts.append(AlertResponse(\n                        alert_id=alert_data.get('alert_id', ''),\n                        component=alert_data.get('component', ''),\n                        metric_name=alert_data.get('metric_name', ''),\n                        severity=alert_data.get('severity', 'low'),\n                        current_value=float(alert_data.get('current_value', 0)),\n                        threshold_value=float(alert_data.get('threshold_value', 0)),\n                        message=alert_data.get('message', ''),\n                        timestamp=datetime.fromisoformat(alert_data.get('timestamp', datetime.now().isoformat())),\n                        resolved=alert_data.get('resolved', False)\n                    ))\n                    \n                return alerts\n                \n            except Exception as e:\n                self.logger.error(f\"Error getting alerts: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        # Webhook Management Endpoints\n        @self.app.post(\"/api/v1/webhooks\")\n        async def create_webhook(\n            webhook_data: WebhookRequest,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Create a new webhook endpoint\"\"\"\n            try:\n                if api_key.scope not in [APIKeyScope.ADMIN, APIKeyScope.READ_WRITE]:\n                    raise HTTPException(status_code=403, detail=\"Insufficient permissions\")\n                    \n                webhook_id = f\"webhook_{int(time.time())}\"\n                \n                webhook = WebhookEndpoint(\n                    endpoint_id=webhook_id,\n                    url=webhook_data.url,\n                    secret=webhook_data.secret,\n                    events=[WebhookEvent(event) for event in webhook_data.events],\n                    is_active=True,\n                    created_at=datetime.now()\n                )\n                \n                self.webhook_endpoints[webhook_id] = webhook\n                \n                return {\n                    \"webhook_id\": webhook_id,\n                    \"url\": webhook.url,\n                    \"events\": [event.value for event in webhook.events],\n                    \"created_at\": webhook.created_at\n                }\n                \n            except HTTPException:\n                raise\n            except Exception as e:\n                self.logger.error(f\"Error creating webhook: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        @self.app.get(\"/api/v1/webhooks\")\n        async def list_webhooks(api_key: APIKey = Depends(verify_api_key)):\n            \"\"\"List all webhook endpoints\"\"\"\n            try:\n                if api_key.scope not in [APIKeyScope.ADMIN, APIKeyScope.READ_WRITE]:\n                    raise HTTPException(status_code=403, detail=\"Insufficient permissions\")\n                    \n                return [\n                    {\n                        \"webhook_id\": webhook.endpoint_id,\n                        \"url\": webhook.url,\n                        \"events\": [event.value for event in webhook.events],\n                        \"is_active\": webhook.is_active,\n                        \"created_at\": webhook.created_at,\n                        \"last_triggered\": webhook.last_triggered,\n                        \"failure_count\": webhook.failure_count\n                    }\n                    for webhook in self.webhook_endpoints.values()\n                ]\n                \n            except HTTPException:\n                raise\n            except Exception as e:\n                self.logger.error(f\"Error listing webhooks: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        @self.app.delete(\"/api/v1/webhooks/{webhook_id}\")\n        async def delete_webhook(\n            webhook_id: str,\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Delete a webhook endpoint\"\"\"\n            try:\n                if api_key.scope not in [APIKeyScope.ADMIN, APIKeyScope.READ_WRITE]:\n                    raise HTTPException(status_code=403, detail=\"Insufficient permissions\")\n                    \n                if webhook_id not in self.webhook_endpoints:\n                    raise HTTPException(status_code=404, detail=\"Webhook not found\")\n                    \n                del self.webhook_endpoints[webhook_id]\n                \n                return {\"message\": \"Webhook deleted successfully\"}\n                \n            except HTTPException:\n                raise\n            except Exception as e:\n                self.logger.error(f\"Error deleting webhook: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n        # WebSocket endpoint for real-time updates\n        @self.app.websocket(\"/ws/realtime\")\n        async def websocket_endpoint(websocket: WebSocket):\n            await websocket.accept()\n            self.active_websockets.add(websocket)\n            \n            try:\n                while True:\n                    # Send periodic updates\n                    await asyncio.sleep(5)\n                    \n                    if websocket.client_state == WebSocketState.CONNECTED:\n                        # Get latest metrics\n                        latest_metrics = self.redis_client.get('audit:metrics:latest')\n                        \n                        if latest_metrics:\n                            metrics_data = json.loads(latest_metrics)\n                            await websocket.send_json({\n                                \"type\": \"metrics_update\",\n                                \"data\": metrics_data,\n                                \"timestamp\": datetime.now().isoformat()\n                            })\n                            \n            except WebSocketDisconnect:\n                self.active_websockets.discard(websocket)\n            except Exception as e:\n                self.logger.error(f\"WebSocket error: {e}\")\n                self.active_websockets.discard(websocket)\n                \n        # Stream endpoints for real-time data\n        @self.app.get(\"/api/v1/stream/metrics\")\n        async def stream_metrics(api_key: APIKey = Depends(verify_api_key)):\n            \"\"\"Stream real-time metrics using Server-Sent Events\"\"\"\n            \n            async def generate_metrics():\n                while True:\n                    try:\n                        # Get latest metrics\n                        latest_metrics = self.redis_client.get('audit:metrics:latest')\n                        \n                        if latest_metrics:\n                            metrics_data = json.loads(latest_metrics)\n                            yield f\"data: {json.dumps(metrics_data)}\\n\\n\"\n                            \n                        await asyncio.sleep(5)  # Update every 5 seconds\n                        \n                    except Exception as e:\n                        self.logger.error(f\"Error in metrics stream: {e}\")\n                        yield f\"data: {{\\\"error\\\": \\\"{str(e)}\\\"}}\\n\\n\"\n                        break\n                        \n            return StreamingResponse(\n                generate_metrics(),\n                media_type=\"text/plain\",\n                headers={\n                    \"Cache-Control\": \"no-cache\",\n                    \"Connection\": \"keep-alive\",\n                    \"Content-Type\": \"text/event-stream\"\n                }\n            )\n            \n        # Trigger manual audit endpoint\n        @self.app.post(\"/api/v1/audit/trigger\")\n        async def trigger_audit(\n            background_tasks: BackgroundTasks,\n            audit_type: str = \"comprehensive\",\n            api_key: APIKey = Depends(verify_api_key)\n        ):\n            \"\"\"Trigger a manual audit\"\"\"\n            try:\n                if api_key.scope not in [APIKeyScope.ADMIN, APIKeyScope.READ_WRITE]:\n                    raise HTTPException(status_code=403, detail=\"Insufficient permissions\")\n                    \n                session_id = f\"manual_{int(time.time())}\"\n                \n                # Add background task to run audit\n                background_tasks.add_task(self.run_manual_audit, session_id, audit_type)\n                \n                return {\n                    \"session_id\": session_id,\n                    \"audit_type\": audit_type,\n                    \"status\": \"triggered\",\n                    \"message\": \"Audit has been triggered and will run in the background\"\n                }\n                \n            except HTTPException:\n                raise\n            except Exception as e:\n                self.logger.error(f\"Error triggering audit: {e}\")\n                raise HTTPException(status_code=500, detail=\"Internal server error\")\n                \n    async def run_manual_audit(self, session_id: str, audit_type: str):\n        \"\"\"Run manual audit in background\"\"\"\n        try:\n            self.logger.info(f\"Starting manual audit: {session_id} ({audit_type})\")\n            \n            # Trigger webhook for audit started\n            await self.trigger_webhook(WebhookEvent.AUDIT_STARTED, {\n                \"session_id\": session_id,\n                \"audit_type\": audit_type,\n                \"started_at\": datetime.now().isoformat()\n            })\n            \n            # Here you would integrate with the actual audit orchestrator\n            # For now, we'll simulate an audit\n            await asyncio.sleep(5)  # Simulate audit duration\n            \n            # Mock audit completion\n            result = {\n                \"session_id\": session_id,\n                \"audit_type\": audit_type,\n                \"status\": \"completed\",\n                \"total_checks\": 100,\n                \"passed_checks\": 87,\n                \"failed_checks\": 13,\n                \"audit_score\": 87.0,\n                \"completed_at\": datetime.now().isoformat()\n            }\n            \n            # Trigger webhook for audit completed\n            await self.trigger_webhook(WebhookEvent.AUDIT_COMPLETED, result)\n            \n            # Broadcast to WebSocket clients\n            await self.broadcast_websocket_message({\n                \"type\": \"audit_completed\",\n                \"data\": result\n            })\n            \n            self.logger.info(f\"Manual audit completed: {session_id}\")\n            \n        except Exception as e:\n            self.logger.error(f\"Error in manual audit {session_id}: {e}\")\n            \n            # Trigger webhook for audit failed\n            await self.trigger_webhook(WebhookEvent.AUDIT_FAILED, {\n                \"session_id\": session_id,\n                \"audit_type\": audit_type,\n                \"error\": str(e),\n                \"failed_at\": datetime.now().isoformat()\n            })\n            \n    async def trigger_webhook(self, event: WebhookEvent, data: Dict[str, Any]):\n        \"\"\"Trigger webhook for specific event\"\"\"\n        try:\n            webhook_payload = {\n                \"event\": event.value,\n                \"timestamp\": datetime.now().isoformat(),\n                \"data\": data\n            }\n            \n            # Trigger all webhooks that listen for this event\n            for webhook in self.webhook_endpoints.values():\n                if webhook.is_active and event in webhook.events:\n                    await self.send_webhook(webhook, webhook_payload)\n                    \n        except Exception as e:\n            self.logger.error(f\"Error triggering webhook for event {event.value}: {e}\")\n            \n    async def send_webhook(self, webhook: WebhookEndpoint, payload: Dict[str, Any]):\n        \"\"\"Send webhook to specific endpoint\"\"\"\n        try:\n            # Create signature for payload verification\n            payload_json = json.dumps(payload, sort_keys=True)\n            signature = hmac.new(\n                webhook.secret.encode(),\n                payload_json.encode(),\n                hashlib.sha256\n            ).hexdigest()\n            \n            headers = {\n                \"Content-Type\": \"application/json\",\n                \"X-TerraFusion-Signature\": f\"sha256={signature}\",\n                \"X-TerraFusion-Event\": payload[\"event\"],\n                \"User-Agent\": \"TerraFusion-Audit-Webhook/1.0\"\n            }\n            \n            async with aiohttp.ClientSession() as session:\n                async with session.post(\n                    webhook.url,\n                    data=payload_json,\n                    headers=headers,\n                    timeout=aiohttp.ClientTimeout(total=30)\n                ) as response:\n                    \n                    if response.status == 200:\n                        webhook.last_triggered = datetime.now()\n                        webhook.failure_count = 0\n                        self.logger.debug(f\"Webhook sent successfully to {webhook.url}\")\n                    else:\n                        webhook.failure_count += 1\n                        self.logger.warning(\n                            f\"Webhook failed to {webhook.url}: HTTP {response.status} \"\n                            f\"(failure count: {webhook.failure_count})\"\n                        )\n                        \n        except Exception as e:\n            webhook.failure_count += 1\n            self.logger.error(f\"Error sending webhook to {webhook.url}: {e}\")\n            \n    async def broadcast_websocket_message(self, message: Dict[str, Any]):\n        \"\"\"Broadcast message to all connected WebSocket clients\"\"\"\n        try:\n            disconnected_sockets = set()\n            \n            for websocket in self.active_websockets:\n                try:\n                    if websocket.client_state == WebSocketState.CONNECTED:\n                        await websocket.send_json(message)\n                    else:\n                        disconnected_sockets.add(websocket)\n                except Exception as e:\n                    self.logger.warning(f\"Failed to send WebSocket message: {e}\")\n                    disconnected_sockets.add(websocket)\n                    \n            # Remove disconnected sockets\n            self.active_websockets -= disconnected_sockets\n            \n        except Exception as e:\n            self.logger.error(f\"Error broadcasting WebSocket message: {e}\")\n            \n    async def webhook_monitor_loop(self):\n        \"\"\"Monitor webhook endpoints and handle failures\"\"\"\n        while True:\n            try:\n                # Disable webhooks with too many failures\n                for webhook in self.webhook_endpoints.values():\n                    if webhook.failure_count >= 5:  # Disable after 5 failures\n                        webhook.is_active = False\n                        self.logger.warning(f\"Disabled webhook {webhook.endpoint_id} due to repeated failures\")\n                        \n                await asyncio.sleep(300)  # Check every 5 minutes\n                \n            except Exception as e:\n                self.logger.error(f\"Error in webhook monitor loop: {e}\")\n                await asyncio.sleep(300)\n                \n    async def shutdown(self):\n        \"\"\"Cleanup on server shutdown\"\"\"\n        try:\n            # Close database pool\n            if self.db_pool:\n                await self.db_pool.close()\n                \n            # Close active WebSocket connections\n            for websocket in self.active_websockets:\n                try:\n                    if websocket.client_state == WebSocketState.CONNECTED:\n                        await websocket.close()\n                except:\n                    pass\n                    \n            self.logger.info(\"Audit API Server shutdown completed\")\n            \n        except Exception as e:\n            self.logger.error(f\"Error during shutdown: {e}\")\n\nasync def main():\n    \"\"\"Main function to start the API server\"\"\"\n    print(\"\ud83c\udf10 Starting TerraFusion Audit API and Webhook Integration Server...\")\n    print(\"=\" * 70)\n    print(\"Capabilities:\")\n    print(\"  \u2022 RESTful API for audit data access\")\n    print(\"  \u2022 Webhook integrations for real-time notifications\")\n    print(\"  \u2022 WebSocket support for live updates\")\n    print(\"  \u2022 Server-Sent Events for streaming data\")\n    print(\"  \u2022 Secure API key authentication\")\n    print(\"  \u2022 Comprehensive audit management\")\n    print(\"=\" * 70)\n    print(\"API Documentation: http://localhost:8080/docs\")\n    print(\"=\" * 70)\n    \n    server = AuditAPIServer()\n    \n    try:\n        # Initialize server\n        await server.startup()\n        \n        # Run the server\n        config = uvicorn.Config(\n            server.app,\n            host=\"0.0.0.0\",\n            port=8080,\n            log_level=\"info\"\n        )\n        \n        server_instance = uvicorn.Server(config)\n        await server_instance.serve()\n        \n    except KeyboardInterrupt:\n        print(\"\\n\ud83d\uded1 Shutting down API server...\")\n        await server.shutdown()\n    except Exception as e:\n        print(f\"\\n\u274c Error in API server: {e}\")\n        await server.shutdown()\n        raise\n\nif __name__ == '__main__':\n    asyncio.run(main())"}, {"old_string": "        except Exception as e:\n            self.logger.error(f\"Error loading API keys: {e}\")", "new_string": "        except Exception as e:\n            self.logger.error(f\"Error loading API keys: {e}\")"}]