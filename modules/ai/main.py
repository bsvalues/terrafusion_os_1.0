#!/usr/bin/env python3
"""
TerraFusion AI Engine - Main FastAPI Application
Municipal Property Assessment with Quantum Computing and Machine Learning
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
import structlog

from .config import settings
from .database import engine, create_tables
from .routers import health, quantum, ml_models, predictions
from .middleware import request_id, timing, error_handling
from .services.quantum_service import QuantumService
from .services.ml_service import MLService


# Configure structured logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Global service instances
quantum_service: QuantumService = None
ml_service: MLService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown"""
    global quantum_service, ml_service
    
    logger.info("🚀 Starting TerraFusion AI Engine")
    
    try:
        # Initialize database
        await create_tables()
        logger.info("✅ Database initialized")
        
        # Initialize services
        quantum_service = QuantumService()
        await quantum_service.initialize()
        logger.info("✅ Quantum service initialized")
        
        ml_service = MLService()
        await ml_service.initialize()
        logger.info("✅ ML service initialized")
        
        # Warm up models
        if settings.PRELOAD_MODELS:
            await ml_service.preload_models()
            logger.info("✅ Models preloaded")
        
        logger.info("🟢 TerraFusion AI Engine ready")
        
        yield
        
    except Exception as e:
        logger.error("❌ Failed to start AI Engine", error=str(e))
        raise
    finally:
        logger.info("🔄 Shutting down TerraFusion AI Engine")
        
        if quantum_service:
            await quantum_service.cleanup()
        if ml_service:
            await ml_service.cleanup()
            
        logger.info("✅ Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="TerraFusion AI Engine",
    description="Municipal Property Assessment with Quantum Computing and ML",
    version="1.0.0",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(request_id.RequestIDMiddleware)
app.add_middleware(timing.TimingMiddleware)
app.add_middleware(error_handling.ErrorHandlingMiddleware)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(quantum.router, prefix="/api/v1/quantum", tags=["quantum"])
app.include_router(ml_models.router, prefix="/api/v1/ml", tags=["ml"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["predictions"])

# Add Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with service information"""
    return {
        "service": "TerraFusion AI Engine",
        "version": "1.0.0",
        "status": "operational",
        "features": {
            "quantum_computing": settings.QUANTUM_ENABLED,
            "gpu_acceleration": settings.GPU_ENABLED,
            "ml_models": True,
            "real_time_predictions": True,
        },
        "endpoints": {
            "health": "/health",
            "quantum": "/api/v1/quantum",
            "ml": "/api/v1/ml",
            "predictions": "/api/v1/predictions",
            "docs": "/docs" if settings.ENABLE_DOCS else None,
            "metrics": "/metrics",
        }
    }


# Dependency injection
def get_quantum_service() -> QuantumService:
    if not quantum_service:
        raise HTTPException(status_code=503, detail="Quantum service not available")
    return quantum_service


def get_ml_service() -> MLService:
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    return ml_service


# Health check endpoint for container orchestration
@app.get("/health/liveness")
async def liveness_probe():
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive", "timestamp": "2025-07-21T12:55:23Z"}


@app.get("/health/readiness")
async def readiness_probe():
    """Kubernetes readiness probe endpoint"""
    ready = bool(quantum_service and ml_service)
    return {
        "status": "ready" if ready else "not_ready",
        "services": {
            "quantum": bool(quantum_service),
            "ml": bool(ml_service),
        },
        "timestamp": "2025-07-21T12:55:23Z"
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error("HTTP exception", status_code=exc.status_code, detail=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": 500}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        access_log=settings.ACCESS_LOG,
        log_level="info" if not settings.DEBUG else "debug",
    )
