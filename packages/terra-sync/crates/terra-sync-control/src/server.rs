use std::collections::HashMap;
use std::sync::Arc;
use terra_sync_audit::Audit;
use terra_sync_policy::PolicyEvaluator;
use terra_sync_proto::control::{
    control_plane_server::ControlPlane, Connector, GetConnectorRequest, GetStatusRequest,
    GetStatusResponse, ListConnectorsRequest, ListConnectorsResponse, PauseConnectorRequest,
    PauseConnectorResponse, ResumeConnectorRequest, ResumeConnectorResponse,
};
use tonic::{Request, Response, Status};

pub struct ControlPlaneService {
    // Held for Phase 2 — connector lifecycle RPCs will consult the
    // evaluator and emit audit events. Stubs below don't reach them yet.
    #[allow(dead_code)]
    pub policy: Arc<PolicyEvaluator>,
    #[allow(dead_code)]
    pub audit: Arc<dyn Audit>,
    pub start_time: chrono::DateTime<chrono::Utc>,
}

#[tonic::async_trait]
impl ControlPlane for ControlPlaneService {
    async fn get_status(
        &self,
        _req: Request<GetStatusRequest>,
    ) -> Result<Response<GetStatusResponse>, Status> {
        let mut states = HashMap::new();
        states.insert("control_plane".into(), "running".into());
        states.insert("policy_engine".into(), "ready".into());
        states.insert("audit_transport".into(), "ready".into());

        let now = chrono::Utc::now();
        let elapsed = now - self.start_time;
        states.insert("uptime_seconds".into(), elapsed.num_seconds().to_string());

        let resp = GetStatusResponse {
            version: env!("CARGO_PKG_VERSION").to_string(),
            server_time: Some(prost_types::Timestamp {
                seconds: now.timestamp(),
                nanos: now.timestamp_subsec_nanos() as i32,
            }),
            healthy: true,
            component_states: states,
        };
        Ok(Response::new(resp))
    }

    async fn list_connectors(
        &self,
        _req: Request<ListConnectorsRequest>,
    ) -> Result<Response<ListConnectorsResponse>, Status> {
        Ok(Response::new(ListConnectorsResponse { connectors: vec![] }))
    }

    async fn get_connector(
        &self,
        req: Request<GetConnectorRequest>,
    ) -> Result<Response<Connector>, Status> {
        Err(Status::not_found(format!(
            "connector {} not registered",
            req.into_inner().name
        )))
    }

    async fn pause_connector(
        &self,
        _req: Request<PauseConnectorRequest>,
    ) -> Result<Response<PauseConnectorResponse>, Status> {
        Err(Status::unimplemented("pause_connector — wired in Phase 2"))
    }

    async fn resume_connector(
        &self,
        _req: Request<ResumeConnectorRequest>,
    ) -> Result<Response<ResumeConnectorResponse>, Status> {
        Err(Status::unimplemented("resume_connector — wired in Phase 2"))
    }
}
