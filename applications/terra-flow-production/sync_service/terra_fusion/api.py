"""
FastAPI Server for TerraFusion Sync Service.

This module provides a FastAPI server that exposes the TerraFusion Sync Service via
RESTful API endpoints.
"""

import os
import logging
import datetime
import json
from typing import Dict, List, Any, Optional, Union

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query, Path, Body
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from pydantic import BaseModel, Field

from sync_service.terra_fusion.sync_service import TerraFusionSyncService

# Initialize logging
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="TerraFusion Sync Service",
    description="API for the TerraFusion Database Synchronization Service",
    version="1.0.0"
)

# Active sync services
active_services: Dict[str, TerraFusionSyncService] = {}


# Pydantic models for request/response validation
class SyncRequest(BaseModel):
    """Request model for starting a sync job."""
    source_connection: str = Field(..., description="Source database connection string")
    target_connection: str = Field(..., description="Target database connection string")
    user_id: Optional[int] = Field(None, description="User ID who initiated the request")
    tables: Optional[List[str]] = Field(None, description="List of tables to sync (for incremental sync)")
    config: Optional[Dict[str, Any]] = Field(None, description="Optional configuration settings")


class SyncResponse(BaseModel):
    """Response model for sync operations."""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Status of the operation")
    message: str = Field(..., description="Message describing the result")


class ConflictResolveRequest(BaseModel):
    """Request model for resolving conflicts."""
    strategy: Optional[str] = Field(None, description="Strategy to use for resolution")


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str = Field(..., description="Overall health status")
    source_db: str = Field(..., description="Source database status")
    target_db: str = Field(..., description="Target database status")
    components: Dict[str, str] = Field(..., description="Component statuses")
    timestamp: str = Field(..., description="Time of health check")


# Dependency to get an active sync service by job_id
def get_sync_service(job_id: str) -> TerraFusionSyncService:
    """
    Get an active sync service by job ID.
    
    Args:
        job_id: ID of the sync job
        
    Returns:
        TerraFusionSyncService instance
    
    Raises:
        HTTPException: If job ID not found
    """
    if job_id not in active_services:
        raise HTTPException(status_code=404, detail=f"Sync job {job_id} not found")
    return active_services[job_id]


@app.post("/sync/full", response_model=SyncResponse)
async def start_full_sync(
    request: SyncRequest,
    background_tasks: BackgroundTasks
) -> SyncResponse:
    """
    Start a full synchronization of all tables.
    
    Args:
        request: Sync request with connection details
        background_tasks: FastAPI background tasks
        
    Returns:
        SyncResponse with job ID and status
    """
    try:
        # Create a new sync service
        service = TerraFusionSyncService(
            source_connection_string=request.source_connection,
            target_connection_string=request.target_connection,
            user_id=request.user_id,
            config=request.config
        )
        
        # Register the service
        job_id = service.job_id
        active_services[job_id] = service
        
        # Start the sync in the background
        background_tasks.add_task(service.start_full_sync)
        
        return SyncResponse(
            job_id=job_id,
            status="started",
            message=f"Full sync started with job ID: {job_id}"
        )
        
    except Exception as e:
        logger.error(f"Error starting full sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting sync: {str(e)}")


@app.post("/sync/incremental", response_model=SyncResponse)
async def start_incremental_sync(
    request: SyncRequest,
    background_tasks: BackgroundTasks
) -> SyncResponse:
    """
    Start an incremental synchronization of specified tables.
    
    Args:
        request: Sync request with connection details and tables
        background_tasks: FastAPI background tasks
        
    Returns:
        SyncResponse with job ID and status
    """
    try:
        # Create a new sync service
        service = TerraFusionSyncService(
            source_connection_string=request.source_connection,
            target_connection_string=request.target_connection,
            user_id=request.user_id,
            config=request.config
        )
        
        # Register the service
        job_id = service.job_id
        active_services[job_id] = service
        
        # Start the sync in the background
        background_tasks.add_task(service.start_incremental_sync, tables=request.tables)
        
        return SyncResponse(
            job_id=job_id,
            status="started",
            message=f"Incremental sync started with job ID: {job_id}"
        )
        
    except Exception as e:
        logger.error(f"Error starting incremental sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting sync: {str(e)}")


@app.get("/sync/status/{job_id}")
async def get_sync_status(
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> Dict[str, Any]:
    """
    Get the status of a synchronization job.
    
    Args:
        service: Active sync service
        
    Returns:
        Status information for the job
    """
    try:
        status = service.get_sync_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting sync status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")


@app.post("/sync/stop/{job_id}", response_model=SyncResponse)
async def stop_sync(
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> SyncResponse:
    """
    Stop an ongoing synchronization job.
    
    Args:
        service: Active sync service
        
    Returns:
        SyncResponse with job ID and status
    """
    try:
        stopped = service.stop_sync()
        
        if stopped:
            return SyncResponse(
                job_id=service.job_id,
                status="stopped",
                message=f"Sync job {service.job_id} stopped successfully"
            )
        else:
            return SyncResponse(
                job_id=service.job_id,
                status="error",
                message=f"Failed to stop sync job {service.job_id}"
            )
            
    except Exception as e:
        logger.error(f"Error stopping sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error stopping sync: {str(e)}")


@app.post("/sync/resume/{job_id}", response_model=SyncResponse)
async def resume_sync(
    service: TerraFusionSyncService = Depends(get_sync_service),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> SyncResponse:
    """
    Resume a previously interrupted sync job.
    
    Args:
        service: Active sync service
        background_tasks: FastAPI background tasks
        
    Returns:
        SyncResponse with job ID and status
    """
    try:
        # Resume in the background
        background_tasks.add_task(service.resume_sync)
        
        return SyncResponse(
            job_id=service.job_id,
            status="resuming",
            message=f"Resuming sync job {service.job_id}"
        )
        
    except Exception as e:
        logger.error(f"Error resuming sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resuming sync: {str(e)}")


@app.get("/sync/conflicts/{job_id}")
async def get_conflicts(
    table_name: Optional[str] = None,
    status: Optional[str] = None,
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> List[Dict[str, Any]]:
    """
    Get conflicts for a sync job.
    
    Args:
        table_name: Optional table name to filter by
        status: Optional status to filter by
        service: Active sync service
        
    Returns:
        List of conflicts
    """
    try:
        conflicts = service.get_conflicts(table_name=table_name, status=status)
        return conflicts
        
    except Exception as e:
        logger.error(f"Error getting conflicts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting conflicts: {str(e)}")


@app.post("/sync/conflicts/{job_id}/{conflict_id}/resolve", response_model=SyncResponse)
async def resolve_conflict(
    conflict_id: str = Path(..., description="ID of the conflict to resolve"),
    request: ConflictResolveRequest = Body(...),
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> SyncResponse:
    """
    Resolve a specific conflict.
    
    Args:
        conflict_id: ID of the conflict to resolve
        request: Resolution request with strategy
        service: Active sync service
        
    Returns:
        SyncResponse with status
    """
    try:
        resolved = service.resolve_conflict(
            conflict_id=conflict_id,
            strategy=request.strategy
        )
        
        if resolved:
            return SyncResponse(
                job_id=service.job_id,
                status="success",
                message=f"Conflict {conflict_id} resolved successfully"
            )
        else:
            return SyncResponse(
                job_id=service.job_id,
                status="error",
                message=f"Failed to resolve conflict {conflict_id}"
            )
            
    except Exception as e:
        logger.error(f"Error resolving conflict: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resolving conflict: {str(e)}")


@app.post("/sync/conflicts/{job_id}/resolve-all", response_model=SyncResponse)
async def resolve_all_conflicts(
    request: ConflictResolveRequest = Body(...),
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> SyncResponse:
    """
    Resolve all pending conflicts.
    
    Args:
        request: Resolution request with strategy
        service: Active sync service
        
    Returns:
        SyncResponse with status
    """
    try:
        count = service.resolve_all_conflicts(strategy=request.strategy)
        
        return SyncResponse(
            job_id=service.job_id,
            status="success",
            message=f"Resolved {count} conflicts"
        )
        
    except Exception as e:
        logger.error(f"Error resolving conflicts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resolving conflicts: {str(e)}")


@app.get("/sync/audit/{job_id}")
async def get_audit_events(
    event_type: Optional[str] = None,
    table_name: Optional[str] = None,
    limit: int = 1000,
    offset: int = 0,
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> List[Dict[str, Any]]:
    """
    Get audit events for a sync job.
    
    Args:
        event_type: Optional event type to filter by
        table_name: Optional table name to filter by
        limit: Maximum number of events to return
        offset: Offset for pagination
        service: Active sync service
        
    Returns:
        List of audit events
    """
    try:
        events = service.get_audit_events(
            event_type=event_type,
            table_name=table_name,
            limit=limit,
            offset=offset
        )
        return events
        
    except Exception as e:
        logger.error(f"Error getting audit events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting audit events: {str(e)}")


@app.get("/sync/audit/{job_id}/report")
async def get_audit_report(
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> Dict[str, Any]:
    """
    Generate an audit report for a sync job.
    
    Args:
        service: Active sync service
        
    Returns:
        Audit report
    """
    try:
        report = service.get_audit_report()
        return report
        
    except Exception as e:
        logger.error(f"Error generating audit report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating audit report: {str(e)}")


@app.post("/sync/validate/{job_id}/{table_name}")
async def validate_schema(
    table_name: str = Path(..., description="Name of the table to validate"),
    service: TerraFusionSyncService = Depends(get_sync_service)
) -> Dict[str, Any]:
    """
    Validate schema compatibility for a table.
    
    Args:
        table_name: Name of the table to validate
        service: Active sync service
        
    Returns:
        Validation results
    """
    try:
        is_compatible, issues = service.validate_schema_compatibility(table_name)
        
        return {
            "table_name": table_name,
            "is_compatible": is_compatible,
            "issues": issues
        }
        
    except Exception as e:
        logger.error(f"Error validating schema: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error validating schema: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Check the health of the sync service.
    
    Returns:
        Health status information
    """
    try:
        # Create a temporary service for health check
        service = TerraFusionSyncService()
        health = service.health_check()
        
        return health
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            source_db="error",
            target_db="error",
            components={},
            timestamp=datetime.datetime.utcnow().isoformat()
        )


@app.get("/")
async def root() -> Dict[str, str]:
    """
    Root endpoint with basic service information.
    
    Returns:
        Basic service information
    """
    return {
        "service": "TerraFusion Sync Service",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


def run_server(host: str = "0.0.0.0", port: int = 8000):
    """
    Run the FastAPI server.
    
    Args:
        host: Host to bind to
        port: Port to listen on
    """
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run_server()