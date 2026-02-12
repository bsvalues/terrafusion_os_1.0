mod mcp;
mod agents;
mod swarm;
mod aci_adapter;
mod bootstrap;
mod api;
mod mobile;

use swarm::orchestrator::SwarmOrchestrator;
use agents::{
    valuation::ValuationAgent,
    data_processing::DataProcessingAgent,
    rag::RAGAgent,
    compliance::ComplianceAgent,
    uad_adapter::UADAdapterAgent,
    env_adapter::ENVAdapterAgent,
    total_sidecar::TotalSidecarAgent,
    aci_sidecar::ACISidecarAgent,
    clickforms_sidecar::ClickFormsSidecarAgent,
    sfrep_sidecar::SFREPSidecarAgent,
    sketch::SketchAgent,
};
use aci_adapter::AciAdapter;
use clap::Parser;
use bootstrap::bootstrap_system;
use api::serve_api;
use mobile::start_mobile_agent;
use tracing::{info, error};

#[derive(Parser)]
#[command(name = "TerraFusion-AI Rust Platform", version = "0.1.0")]
#[command(about = "Next-generation AI-powered real estate appraisal platform")]
enum Cli {
    #[command(about = "Run the complete agent swarm orchestrator")]
    Run,
    #[command(about = "Bootstrap the system environment")]
    Bootstrap,
    #[command(about = "Start as ACI.dev adapter")]
    AciDev,
    #[command(about = "Serve as cloud API")]
    ServeApi,
    #[command(about = "Start mobile agent interface")]
    Mobile,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::init();
    
    match Cli::parse() {
        Cli::Run => {
            info!("🚀 Starting TerraFusion Agent Swarm...");
            bootstrap_system().await?;
            
            let mut swarm = SwarmOrchestrator::new();
            
            swarm.register(Box::new(ValuationAgent::default())).await;
            swarm.register(Box::new(DataProcessingAgent::default())).await;
            swarm.register(Box::new(RAGAgent::default())).await;
            swarm.register(Box::new(ComplianceAgent::default())).await;
            swarm.register(Box::new(UADAdapterAgent::default())).await;
            swarm.register(Box::new(ENVAdapterAgent::default())).await;
            swarm.register(Box::new(TotalSidecarAgent::default())).await;
            swarm.register(Box::new(ACISidecarAgent::default())).await;
            swarm.register(Box::new(ClickFormsSidecarAgent::default())).await;
            swarm.register(Box::new(SFREPSidecarAgent::default())).await;
            swarm.register(Box::new(SketchAgent::default())).await;
            
            info!("✅ All agents registered and ready");
            swarm.run().await?;
        }
        Cli::Bootstrap => {
            info!("🔧 Bootstrapping TerraFusion system...");
            bootstrap_system().await?;
            info!("✅ System bootstrap completed");
        }
        Cli::AciDev => {
            info!("🔌 Starting ACI.dev adapter...");
            let mut adapter = AciAdapter::new();
            adapter.run().await?;
        }
        Cli::ServeApi => {
            info!("🌐 Starting cloud API server...");
            bootstrap_system().await?;
            serve_api().await;
        }
        Cli::Mobile => {
            info!("📱 Starting mobile agent interface...");
            start_mobile_agent().await?;
        }
    }
    
    Ok(())
}