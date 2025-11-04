#!/usr/bin/env python3
"""
TerraFusion CostForge AI - Python API Service
RESTful API service for CostForge AI machine learning capabilities

This service provides:
- RESTful API endpoints for property valuation
- Integration with C# TerraFusion backend
- Quantum-enhanced ML model serving
- Harris PACS integration for property data
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import asyncio
import logging
import uvicorn
import aiohttp
import os
from datetime import datetime
import json

# Import our ML service
from costforge_ml_service import (
    CostForgeMLService,
    PropertyData,
    ValuationResult,
    create_costforge_ml_service
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class PropertyValuationRequest(BaseModel):
    parcel_id: str = Field(..., description="Unique parcel identifier")
    county_id: str = Field(..., description="County identifier")
    square_footage: float = Field(gt=0, description="Property square footage")
    lot_size: float = Field(gt=0, description="Lot size in acres")
    year_built: int = Field(ge=1800, le=2025, description="Year property was built")
    bedrooms: int = Field(ge=0, le=20, description="Number of bedrooms")
    bathrooms: float = Field(ge=0, le=20, description="Number of bathrooms")
    property_type: str = Field(..., description="Type of property")
    zoning: str = Field(..., description="Zoning classification")
    latitude: float = Field(..., description="Property latitude")
    longitude: float = Field(..., description="Property longitude")

class BatchValuationRequest(BaseModel):
    properties: List[PropertyValuationRequest]
    max_concurrency: int = Field(default=10, ge=1, le=50)

class PropertyValuationResponse(BaseModel):
    parcel_id: str
    estimated_value: float
    land_value: float
    improvement_value: float
    confidence_score: float
    calculation_method: str
    factors_considered: List[str]
    comparable_properties: Dict[str, float]
    market_analysis: Dict[str, Any]
    risk_assessment: Dict[str, float]
    processing_time_ms: float
    timestamp: datetime

class BatchValuationResponse(BaseModel):
    total_requested: int
    successful_valuations: int
    failed_valuations: int
    processing_time_ms: float
    results: List[PropertyValuationResponse]
    errors: List[str]

class ServiceStatus(BaseModel):
    service_name: str
    version: str
    status: str
    quantum_factor: int
    target_accuracy: float
    models_loaded: int
    active_inferences: int
    total_inferences: int
    avg_processing_time_ms: float
    avg_confidence_score: float
    uptime_seconds: float

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    quantum_factor: int
    models_status: Dict[str, str]
    backend_connectivity: bool

# Create FastAPI app
app = FastAPI(
    title="CostForge AI Python API",
    description="Quantum-enhanced property valuation and cost analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global ML service instance
ml_service: Optional[CostForgeMLService] = None
service_start_time = datetime.utcnow()

@app.on_event("startup")
async def startup_event():
    """Initialize the ML service on startup"""
    global ml_service

    logger.info("Starting CostForge AI Python API Service...")

    try:
        ml_service = create_costforge_ml_service()

        if await ml_service.initialize():
            logger.info("✅ CostForge AI Python API Service started successfully")
        else:
            logger.error("❌ Failed to initialize ML service")
            raise Exception("ML service initialization failed")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Gracefully shutdown the ML service"""
    global ml_service

    logger.info("Shutting down CostForge AI Python API Service...")

    if ml_service:
        await ml_service.shutdown()

    logger.info("✅ CostForge AI Python API Service shutdown complete")

async def get_ml_service() -> CostForgeMLService:
    """Dependency to get the ML service instance"""
    if ml_service is None:
        raise HTTPException(status_code=503, detail="ML service not initialized")
    return ml_service

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""

    # Check backend connectivity
    backend_healthy = await check_backend_connectivity()

    # Get ML service status
    models_status = {}
    if ml_service:
        try:
            status = await ml_service.get_service_status()
            models_status = {name: "healthy" for name in status['models'].keys()}
        except Exception as e:
            logger.error(f"Error getting ML service status: {e}")
            models_status = {"error": str(e)}

    return HealthResponse(
        status="healthy" if ml_service and backend_healthy else "degraded",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        quantum_factor=949,  # Default or from config
        models_status=models_status,
        backend_connectivity=backend_healthy
    )

@app.get("/status", response_model=ServiceStatus)
async def get_service_status(service: CostForgeMLService = Depends(get_ml_service)):
    """Get comprehensive service status"""

    try:
        status = await service.get_service_status()
        uptime = (datetime.utcnow() - service_start_time).total_seconds()

        return ServiceStatus(
            service_name=status['service_name'],
            version=status['version'],
            status=status['status'],
            quantum_factor=status['quantum_factor'],
            target_accuracy=status['target_accuracy'],
            models_loaded=status['models_loaded'],
            active_inferences=status['active_inferences'],
            total_inferences=status['total_inferences'],
            avg_processing_time_ms=status['avg_processing_time_ms'],
            avg_confidence_score=status['avg_confidence_score'],
            uptime_seconds=uptime
        )

    except Exception as e:
        logger.error(f"Error getting service status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculate-valuation", response_model=PropertyValuationResponse)
async def calculate_property_valuation(
    request: PropertyValuationRequest,
    service: CostForgeMLService = Depends(get_ml_service)
):
    """Calculate property valuation using quantum-enhanced ML models"""

    try:
        logger.info(f"Calculating valuation for parcel {request.parcel_id}")

        # Convert request to PropertyData
        property_data = PropertyData(
            parcel_id=request.parcel_id,
            county_id=request.county_id,
            square_footage=request.square_footage,
            lot_size=request.lot_size,
            year_built=request.year_built,
            bedrooms=request.bedrooms,
            bathrooms=request.bathrooms,
            property_type=request.property_type,
            zoning=request.zoning,
            location={"lat": request.latitude, "lng": request.longitude}
        )

        # Calculate valuation
        result = await service.calculate_property_valuation(property_data)

        # Convert to response model
        response = PropertyValuationResponse(
            parcel_id=result.parcel_id,
            estimated_value=result.estimated_value,
            land_value=result.land_value,
            improvement_value=result.improvement_value,
            confidence_score=result.confidence_score,
            calculation_method=result.calculation_method,
            factors_considered=result.factors_considered,
            comparable_properties=result.comparable_properties,
            market_analysis=result.market_analysis,
            risk_assessment=result.risk_assessment,
            processing_time_ms=result.processing_time_ms,
            timestamp=datetime.utcnow()
        )

        logger.info(f"Valuation completed for {request.parcel_id}: ${result.estimated_value:,.2f}")

        return response

    except Exception as e:
        logger.error(f"Error calculating valuation for {request.parcel_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-calculate-valuations", response_model=BatchValuationResponse)
async def batch_calculate_valuations(
    request: BatchValuationRequest,
    background_tasks: BackgroundTasks,
    service: CostForgeMLService = Depends(get_ml_service)
):
    """Calculate valuations for multiple properties"""

    start_time = datetime.utcnow()

    try:
        logger.info(f"Starting batch valuation for {len(request.properties)} properties")

        # Convert requests to PropertyData objects
        property_data_list = []
        for prop_request in request.properties:
            property_data = PropertyData(
                parcel_id=prop_request.parcel_id,
                county_id=prop_request.county_id,
                square_footage=prop_request.square_footage,
                lot_size=prop_request.lot_size,
                year_built=prop_request.year_built,
                bedrooms=prop_request.bedrooms,
                bathrooms=prop_request.bathrooms,
                property_type=prop_request.property_type,
                zoning=prop_request.zoning,
                location={"lat": prop_request.latitude, "lng": prop_request.longitude}
            )
            property_data_list.append(property_data)

        # Calculate batch valuations
        results = await service.batch_calculate_valuations(property_data_list)

        # Convert results to response format
        successful_results = []
        errors = []

        for result in results:
            try:
                response = PropertyValuationResponse(
                    parcel_id=result.parcel_id,
                    estimated_value=result.estimated_value,
                    land_value=result.land_value,
                    improvement_value=result.improvement_value,
                    confidence_score=result.confidence_score,
                    calculation_method=result.calculation_method,
                    factors_considered=result.factors_considered,
                    comparable_properties=result.comparable_properties,
                    market_analysis=result.market_analysis,
                    risk_assessment=result.risk_assessment,
                    processing_time_ms=result.processing_time_ms,
                    timestamp=datetime.utcnow()
                )
                successful_results.append(response)

            except Exception as e:
                errors.append(f"Error processing result: {str(e)}")

        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        response = BatchValuationResponse(
            total_requested=len(request.properties),
            successful_valuations=len(successful_results),
            failed_valuations=len(errors),
            processing_time_ms=processing_time,
            results=successful_results,
            errors=errors
        )

        logger.info(f"Batch valuation completed: {len(successful_results)}/{len(request.properties)} successful")

        return response

    except Exception as e:
        logger.error(f"Error in batch valuation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def get_models_info(service: CostForgeMLService = Depends(get_ml_service)):
    """Get information about loaded ML models"""

    try:
        status = await service.get_service_status()
        return {
            "models_loaded": status['models_loaded'],
            "models": status['models'],
            "quantum_factor": status['quantum_factor'],
            "target_accuracy": status['target_accuracy']
        }

    except Exception as e:
        logger.error(f"Error getting models info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync-harris-pacs")
async def sync_harris_pacs(county_id: str):
    """Trigger Harris PACS synchronization for a county"""

    try:
        logger.info(f"Triggering Harris PACS sync for county {county_id}")

        # In a real implementation, this would trigger actual Harris PACS sync
        # For now, simulate the sync process
        await asyncio.sleep(2)  # Simulate sync time

        sync_result = {
            "county_id": county_id,
            "status": "completed",
            "records_processed": 89247,  # Benton County parcel count
            "records_updated": 1247,
            "sync_duration_ms": 2000,
            "timestamp": datetime.utcnow()
        }

        logger.info(f"Harris PACS sync completed for {county_id}")

        return sync_result

    except Exception as e:
        logger.error(f"Error syncing Harris PACS for {county_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/performance-metrics")
async def get_performance_metrics(service: CostForgeMLService = Depends(get_ml_service)):
    """Get performance metrics for monitoring"""

    try:
        # Get recent performance metrics
        recent_metrics = service.performance_metrics[-100:] if service.performance_metrics else []

        if not recent_metrics:
            return {
                "message": "No performance metrics available",
                "total_metrics": 0
            }

        # Calculate aggregated metrics
        avg_processing_time = sum(m['processing_time_ms'] for m in recent_metrics) / len(recent_metrics)
        avg_confidence = sum(m['confidence_score'] for m in recent_metrics) / len(recent_metrics)

        performance_summary = {
            "total_metrics": len(service.performance_metrics),
            "recent_metrics_count": len(recent_metrics),
            "avg_processing_time_ms": avg_processing_time,
            "avg_confidence_score": avg_confidence,
            "quantum_factor": service.quantum_config.factor,
            "target_accuracy": service.quantum_config.target_accuracy,
            "recent_metrics": recent_metrics[-10:]  # Last 10 metrics
        }

        return performance_summary

    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def check_backend_connectivity() -> bool:
    """Check connectivity to C# TerraFusion backend"""

    try:
        backend_url = os.getenv('TERRAFUSION_BACKEND_URL', 'http://localhost:5000')

        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/health", timeout=5) as response:
                return response.status == 200

    except Exception as e:
        logger.warning(f"Backend connectivity check failed: {e}")
        return False

# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": {
            "code": exc.status_code,
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {
        "error": {
            "code": 500,
            "message": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    }

# Development and testing endpoints
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "CostForge AI Python API",
        "version": "1.0.0",
        "description": "Quantum-enhanced property valuation and cost analysis",
        "status": "operational",
        "quantum_factor": 949,
        "government_transcended": True,
        "endpoints": {
            "health": "/health",
            "status": "/status",
            "docs": "/docs",
            "valuation": "/api/calculate-valuation",
            "batch_valuation": "/api/batch-calculate-valuations",
            "models": "/api/models",
            "performance": "/api/performance-metrics"
        }
    }

def create_app() -> FastAPI:
    """Factory function to create the FastAPI app"""
    return app

if __name__ == "__main__":
    # Run the API server
    port = int(os.getenv('COSTFORGE_API_PORT', '8002'))
    host = os.getenv('COSTFORGE_API_HOST', '0.0.0.0')

    logger.info(f"Starting CostForge AI API on {host}:{port}")

    uvicorn.run(
        "costforge_api_service:app",
        host=host,
        port=port,
        reload=True,  # Disable in production
        log_level="info"
    )
