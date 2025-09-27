use tonic::{Request, Response, Status};
use crate::proto::demo::{
    SystemStatusRequest, SystemStatusResponse,
    ModuleHealthRequest, ModuleHealthResponse,
    demo_service_server::DemoService,
};
use chrono::Utc;
use tracing::{info, debug};

/// TerraFusion Demo gRPC Service Implementation
/// 
/// Demonstrates basic gRPC functionality for TerraFusion OS
pub struct DemoServiceImpl {
    _system_name: String,
}

impl DemoServiceImpl {
    pub fn new(system_name: String) -> Self {
        Self { _system_name: system_name }
    }
}

#[tonic::async_trait]
impl DemoService for DemoServiceImpl {
    async fn get_system_status(
        &self,
        request: Request<SystemStatusRequest>,
    ) -> Result<Response<SystemStatusResponse>, Status> {
        let req = request.into_inner();
        
        info!(
            system_id = %req.system_id,
            "Processing system status request"
        );

        let response = SystemStatusResponse {
            system_id: req.system_id,
            status: "OPERATIONAL".to_string(),
            total_modules: 35,
            active_modules: 35,
            timestamp: Utc::now().to_rfc3339(),
        };

        debug!("System status response: {:?}", response);
        Ok(Response::new(response))
    }

    async fn get_module_health(
        &self,
        request: Request<ModuleHealthRequest>,
    ) -> Result<Response<ModuleHealthResponse>, Status> {
        let req = request.into_inner();
        
        info!(
            module_id = %req.module_id,
            "Processing module health request"
        );

        let response = ModuleHealthResponse {
            module_id: req.module_id,
            health_status: "HEALTHY".to_string(),
            cpu_usage: 25.5,
            memory_usage: 1024 * 1024 * 128, // 128MB
            last_updated: Utc::now().to_rfc3339(),
        };

        debug!("Module health response: {:?}", response);
        Ok(Response::new(response))
    }
}