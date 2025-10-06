"""
TerraFusion cOS API Server
FastAPI backend for the County Operating System desktop application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn
import asyncio
from datetime import datetime

# Import cOS services
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from services.hybrid_llm import HybridLLMService
from services.costforge_ai import CostForgeAIService
from services.ai_swarm import ai_swarm_service
from services.security_mesh import security_mesh_service
from services.terrafusion_sync import terrafusion_sync_service
from services.terra_flow import terra_flow_service
from kernel.base_kernel import base_kernel_service

app = FastAPI(
    title="TerraFusion cOS API",
    description="County Operating System Backend API",
    version="1.0.0"
)

# CORS middleware for Electron frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Electron app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service instances
hybrid_llm = None
costforge_ai = None
ai_swarm = None
security_mesh = None
terrafusion_sync = None
terra_flow = None
base_kernel = None

# Request/Response Models
class LLMRequest(BaseModel):
    prompt: str
    model_preference: Optional[str] = None
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class PropertyValuationRequest(BaseModel):
    property_id: str
    address: str
    sqft: int
    year_built: int
    lot_size: Optional[float] = None

class BudgetOptimizationRequest(BaseModel):
    department: str
    current_budget: float
    constraints: Optional[Dict[str, Any]] = None

@app.on_event("startup")
async def startup_event():
    """Initialize cOS services on startup"""
    global hybrid_llm, costforge_ai, ai_swarm, security_mesh, terrafusion_sync, terra_flow, base_kernel
    
    print("🚀 TerraFusion cOS API Server Starting...")
    print("=" * 60)
    
    # Initialize Base Kernel Service
    print("🔧 Initializing Base Kernel Service...")
    base_kernel = base_kernel_service
    await base_kernel.initialize()
    print("✅ Base Kernel Ready")
    
    # Initialize Security Mesh Service
    print("🔒 Initializing Security Mesh Service...")
    security_mesh = security_mesh_service
    await security_mesh.initialize()
    print("✅ Security Mesh Ready (Zero-trust enabled)")
    
    # Initialize TerraFusion Sync Service
    print("🔄 Initializing TerraFusion Sync Service...")
    terrafusion_sync = terrafusion_sync_service
    await terrafusion_sync.initialize()
    print("✅ TerraFusion Sync Ready (Multi-master replication)")
    
    # Initialize Hybrid LLM Service
    print("🧠 Initializing Hybrid LLM Service...")
    hybrid_llm = HybridLLMService()
    await hybrid_llm.initialize()
    print(f"✅ Hybrid LLM Ready - {len(hybrid_llm.models_available)} models available")
    
    # Initialize CostForge AI Service
    print("💰 Initializing CostForge AI Service...")
    costforge_ai = CostForgeAIService()
    await costforge_ai.initialize()
    print("✅ CostForge AI Ready")
    
    # Initialize AI Swarm Service
    print("🤖 Initializing AI Swarm Service...")
    ai_swarm = ai_swarm_service
    await ai_swarm.initialize()
    print("✅ AI Swarm Ready (50,000+ agents)")
    
    # Initialize TerraFlow Service
    print("⚡ Initializing TerraFlow Service...")
    terra_flow = terra_flow_service
    await terra_flow.initialize()
    print("✅ TerraFlow Ready (Workflow automation)")
    
    print("=" * 60)
    print("✅ TerraFusion cOS API Server Ready - ALL 7 SERVICES OPERATIONAL")
    print("📚 API docs available at /docs endpoint")
    print("🤖 AI Swarm integration active")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 TerraFusion cOS API Server Shutting Down...")
    if hybrid_llm:
        await hybrid_llm.shutdown()
    if costforge_ai:
        await costforge_ai.shutdown()

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "TerraFusion cOS API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "hybrid_llm": "ready" if hybrid_llm else "not_initialized",
            "costforge_ai": "ready" if costforge_ai else "not_initialized"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# System status endpoint
@app.get("/api/system/status")
async def get_system_status():
    """Get overall cOS system status"""
    llm_status = hybrid_llm.get_health_status() if hybrid_llm else {}
    costforge_status = costforge_ai.get_health_status() if costforge_ai else {}
    
    return {
        "system": "TerraFusion cOS",
        "version": "1.0.0",
        "status": "operational",
        "uptime": "running",
        "services": {
            "hybrid_llm": llm_status,
            "costforge_ai": costforge_status
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# Hybrid LLM Endpoints
@app.post("/api/llm/complete")
async def llm_completion(request: LLMRequest):
    """AI completion using Hybrid LLM routing"""
    if not hybrid_llm:
        raise HTTPException(status_code=503, detail="Hybrid LLM service not initialized")
    
    try:
        result = await hybrid_llm.route_request(
            prompt=request.prompt,
            preferred_model=request.model_preference,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/llm/models")
async def get_available_models():
    """Get list of available AI models"""
    if not hybrid_llm:
        raise HTTPException(status_code=503, detail="Hybrid LLM service not initialized")
    
    return {
        "models": hybrid_llm.models_available,
        "count": len(hybrid_llm.models_available)
    }

@app.post("/api/llm/cost-estimate")
async def estimate_llm_cost(request: LLMRequest):
    """Estimate cost for LLM request"""
    if not hybrid_llm:
        raise HTTPException(status_code=503, detail="Hybrid LLM service not initialized")
    
    estimate = await hybrid_llm.get_cost_estimate(
        prompt=request.prompt,
        model=request.model_preference or "auto"
    )
    return estimate

# CostForge AI Endpoints
@app.post("/api/costforge/property-valuation")
async def property_valuation(request: PropertyValuationRequest):
    """AI-powered property valuation"""
    if not costforge_ai:
        raise HTTPException(status_code=503, detail="CostForge AI service not initialized")
    
    try:
        result = await costforge_ai.property_valuation(
            property_id=request.property_id,
            address=request.address,
            sqft=request.sqft,
            year_built=request.year_built,
            lot_size=request.lot_size
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/costforge/budget-optimization")
async def budget_optimization(request: BudgetOptimizationRequest):
    """Budget optimization recommendations"""
    if not costforge_ai:
        raise HTTPException(status_code=503, detail="CostForge AI service not initialized")
    
    try:
        result = await costforge_ai.budget_optimization(
            department=request.department,
            current_budget=request.current_budget,
            constraints=request.constraints or {}
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/costforge/revenue-forecast")
async def revenue_forecast(department: str, years: int = 5):
    """Revenue forecasting"""
    if not costforge_ai:
        raise HTTPException(status_code=503, detail="CostForge AI service not initialized")
    
    try:
        result = await costforge_ai.revenue_forecast(
            department=department,
            years=years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/costforge/cost-benefit-analysis")
async def cost_benefit_analysis(
    project_name: str,
    initial_cost: float,
    annual_savings: float,
    years: int = 5
):
    """Cost-benefit analysis for projects"""
    if not costforge_ai:
        raise HTTPException(status_code=503, detail="CostForge AI service not initialized")
    
    try:
        result = await costforge_ai.cost_benefit_analysis(
            project_name=project_name,
            initial_cost=initial_cost,
            annual_savings=annual_savings,
            years=years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== AI SWARM ENDPOINTS =====

@app.get("/api/ai-swarm/status")
async def get_ai_swarm_status():
    """
    Get AI Swarm status - 50,000+ agents orchestrated by Supreme Commander Claude
    
    This is a CORE VALUE PROP for Harris demo:
    Real-time monitoring of autonomous AI agent operations
    """
    if not ai_swarm:
        raise HTTPException(status_code=503, detail="AI Swarm service not initialized")
    
    try:
        status = await ai_swarm.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-swarm/agents")
async def get_ai_swarm_agents(
    limit: int = 100,
    status: Optional[str] = None
):
    """Get list of AI agents with optional status filter"""
    if not ai_swarm:
        raise HTTPException(status_code=503, detail="AI Swarm service not initialized")
    
    try:
        agents = await ai_swarm.get_agents(limit=limit, status_filter=status)
        return {"agents": agents, "total": len(agents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-swarm/tasks")
async def get_ai_swarm_tasks():
    """Get active tasks being processed by AI Swarm"""
    if not ai_swarm:
        raise HTTPException(status_code=503, detail="AI Swarm service not initialized")
    
    try:
        tasks = await ai_swarm.get_active_tasks()
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-swarm/detect-problem")
async def detect_problem_with_swarm(context: Dict[str, Any]):
    """
    Use AI Swarm to detect problems autonomously
    
    Harris Demo Feature: AI-native problem detection without manual intervention
    """
    if not ai_swarm:
        raise HTTPException(status_code=503, detail="AI Swarm service not initialized")
    
    try:
        result = await ai_swarm.detect_problem(context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-swarm/solution/{problem_id}")
async def get_solution_proposal(problem_id: str):
    """Get AI Swarm's proposed solution for a detected problem"""
    if not ai_swarm:
        raise HTTPException(status_code=503, detail="AI Swarm service not initialized")
    
    try:
        solution = await ai_swarm.propose_solution(problem_id)
        return solution
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== BASE KERNEL ENDPOINTS =====

@app.get("/api/kernel/status")
async def get_kernel_status():
    """Get Base Kernel status and system health"""
    if not base_kernel:
        raise HTTPException(status_code=503, detail="Base Kernel service not initialized")
    
    try:
        status = await base_kernel.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kernel/health")
async def get_system_health():
    """Get comprehensive system health metrics"""
    if not base_kernel:
        raise HTTPException(status_code=503, detail="Base Kernel service not initialized")
    
    try:
        health = await base_kernel.monitor_health()
        return health
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kernel/register-service")
async def register_service(service_config: Dict[str, Any]):
    """Register a new service with the kernel"""
    if not base_kernel:
        raise HTTPException(status_code=503, detail="Base Kernel service not initialized")
    
    try:
        result = await base_kernel.register_service(service_config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== SECURITY MESH ENDPOINTS =====

@app.post("/api/security/authenticate")
async def authenticate_user(username: str, password: str, ip_address: str):
    """Authenticate user and create session"""
    if not security_mesh:
        raise HTTPException(status_code=503, detail="Security Mesh service not initialized")
    
    try:
        result = await security_mesh.authenticate(username, password, ip_address)
        if not result.get("success"):
            raise HTTPException(status_code=401, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/security/authorize")
async def authorize_action(auth_token: str, resource: str, permission: str):
    """Check if user is authorized for action"""
    if not security_mesh:
        raise HTTPException(status_code=503, detail="Security Mesh service not initialized")
    
    try:
        from services.security_mesh import Permission
        perm = Permission[permission.upper()]
        result = await security_mesh.authorize(auth_token, resource, perm)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/security/audit-log")
async def get_audit_log(limit: int = 100):
    """Get security audit log"""
    if not security_mesh:
        raise HTTPException(status_code=503, detail="Security Mesh service not initialized")
    
    try:
        log = await security_mesh.get_audit_log(limit=limit)
        return {"events": log, "count": len(log)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/security/status")
async def get_security_status():
    """Get Security Mesh status"""
    if not security_mesh:
        raise HTTPException(status_code=503, detail="Security Mesh service not initialized")
    
    try:
        status = await security_mesh.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== TERRAFUSION SYNC ENDPOINTS =====

@app.post("/api/sync/register-node")
async def register_sync_node(node_info: Dict[str, Any]):
    """Register a node in the sync mesh"""
    if not terrafusion_sync:
        raise HTTPException(status_code=503, detail="TerraFusion Sync service not initialized")
    
    try:
        result = await terrafusion_sync.register_node(node_info)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync/replicate")
async def replicate_data(data: Dict[str, Any], target_nodes: Optional[List[str]] = None):
    """Replicate data change to peer nodes"""
    if not terrafusion_sync:
        raise HTTPException(status_code=503, detail="TerraFusion Sync service not initialized")
    
    try:
        result = await terrafusion_sync.replicate(data, target_nodes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sync/status")
async def get_sync_status():
    """Get current synchronization status"""
    if not terrafusion_sync:
        raise HTTPException(status_code=503, detail="TerraFusion Sync service not initialized")
    
    try:
        status = await terrafusion_sync.get_sync_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sync/nodes")
async def get_registered_nodes():
    """Get list of registered sync nodes"""
    if not terrafusion_sync:
        raise HTTPException(status_code=503, detail="TerraFusion Sync service not initialized")
    
    try:
        status = await terrafusion_sync.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== TERRAFLOW ENDPOINTS =====

@app.post("/api/flow/create-workflow")
async def create_workflow(definition: Dict[str, Any]):
    """Create a new workflow definition"""
    if not terra_flow:
        raise HTTPException(status_code=503, detail="TerraFlow service not initialized")
    
    try:
        result = await terra_flow.create_workflow(definition)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/flow/execute/{workflow_id}")
async def execute_workflow(workflow_id: str, context: Optional[Dict[str, Any]] = None):
    """Execute a workflow"""
    if not terra_flow:
        raise HTTPException(status_code=503, detail="TerraFlow service not initialized")
    
    try:
        result = await terra_flow.execute_workflow(workflow_id, context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flow/workflows")
async def list_workflows():
    """List all workflows"""
    if not terra_flow:
        raise HTTPException(status_code=503, detail="TerraFlow service not initialized")
    
    try:
        workflows = [
            await terra_flow.get_workflow_status(wf_id)
            for wf_id in terra_flow.workflows.keys()
        ]
        return {"workflows": workflows, "count": len(workflows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flow/execution/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get workflow execution status"""
    if not terra_flow:
        raise HTTPException(status_code=503, detail="TerraFlow service not initialized")
    
    try:
        status = await terra_flow.get_execution_status(execution_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flow/status")
async def get_terraflow_status():
    """Get TerraFlow service status"""
    if not terra_flow:
        raise HTTPException(status_code=503, detail="TerraFlow service not initialized")
    
    try:
        status = await terra_flow.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== COMPREHENSIVE SYSTEM STATUS =====

@app.get("/api/cos/status")
async def get_cos_comprehensive_status():
    """Get comprehensive cOS status - all 7 services"""
    try:
        return {
            "system": "TerraFusion cOS",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "base_kernel": await base_kernel.get_status() if base_kernel else {"status": "not_initialized"},
                "security_mesh": await security_mesh.get_status() if security_mesh else {"status": "not_initialized"},
                "terrafusion_sync": await terrafusion_sync.get_status() if terrafusion_sync else {"status": "not_initialized"},
                "hybrid_llm": hybrid_llm.get_health_status() if hybrid_llm else {"status": "not_initialized"},
                "ai_swarm": await ai_swarm.get_status() if ai_swarm else {"status": "not_initialized"},
                "terra_flow": await terra_flow.get_status() if terra_flow else {"status": "not_initialized"},
                "costforge_ai": costforge_ai.get_health_status() if costforge_ai else {"status": "not_initialized"}
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import os
    # Load port from environment (DO NOT HARDCODE!)
    port = int(os.getenv('COS_API_PORT', os.getenv('TF_API_PORT', '8090')))
    
    print("🏛️ TerraFusion cOS - County Operating System")
    print("=" * 60)
    print(f"🌐 Starting API server on port {port}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
