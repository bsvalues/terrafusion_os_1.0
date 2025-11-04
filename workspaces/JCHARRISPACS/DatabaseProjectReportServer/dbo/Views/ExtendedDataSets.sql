from fastapi import FastAPI, HTTPException
from .integration.pacs_integration import PACSIntegration
from .integration.sync_config import PACSConfig
from .utils.performance_monitoring import PerformanceMonitor

app = FastAPI(
    title="PACS Integration API",
    version="1.0.0",
    description="API for PACS-GIS synchronization"
)

config = PACSConfig.from_env()
pacs_integration = PACSIntegration(config)
performance_monitor = PerformanceMonitor()

@app.post("/api/v1/sync/properties")
@performance_monitor.monitor_query("sync_properties")
async def sync_properties():
    try:
        result = await pacs_integration.sync_property_data()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}