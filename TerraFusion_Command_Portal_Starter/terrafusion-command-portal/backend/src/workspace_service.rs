use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub r#type: String,  // "core", "government", "commercial", "terra-app", "specialized"
    pub tier: u8,        // 1-18 tier level
    pub description: Option<String>,
    pub modules_count: Option<u32>,
    pub ai_agents_assigned: Option<Vec<AIAgentInfo>>,
    pub health_status: WorkspaceHealth,
    pub immersive_capabilities: ImmersiveCapabilities,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAgentInfo {
    pub id: String,
    pub agent_type: String, // "supreme_commander", "field_general", "operational_force", "claude_flow_hive_mind", "neural_cognitive"
    pub status: String,     // "active", "idle", "processing", "offline"
    pub current_task: Option<String>,
    pub performance_metrics: AgentMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetrics {
    pub response_time_ms: f64,
    pub tasks_completed: u64,
    pub error_rate: f64,
    pub efficiency_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceHealth {
    pub status: String,     // "healthy", "warning", "critical", "offline"
    pub last_checked: String,
    pub metrics: HealthMetrics,
    pub alerts: Vec<Alert>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthMetrics {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub response_time_ms: f64,
    pub error_rate: f64,
    pub uptime_percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub level: String,      // "info", "warning", "error", "critical"
    pub message: String,
    pub timestamp: String,
    pub workspace_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImmersiveCapabilities {
    pub vr_enabled: bool,
    pub ar_enabled: bool,
    pub three_d_visualization: bool,
    pub metaverse_integration: Vec<String>, // "decentraland", "sandbox", "roblox", "minetest"
    pub quantum_visualization: bool,
    pub privacy_visualization: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceContext {
    pub current_workspace: String,
    pub available_workspaces: Vec<WorkspaceInfo>,
    pub repo_root: String,
    pub ai_swarm_status: AISwarmStatus,
    pub system_health: SystemHealth,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AISwarmStatus {
    pub total_agents: u32,
    pub active_agents: u32,
    pub supreme_commander_status: String,
    pub field_generals_count: u32,
    pub operational_forces_count: u32,
    pub claude_flow_hive_minds: u32,
    pub neural_cognitive_systems: u32,
    pub quantum_coherence: f64,
    pub processing_paradigm: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemHealth {
    pub overall_status: String,
    pub tier_status: HashMap<u8, String>, // Tier 1-18 status
    pub deployment_health: DeploymentHealth,
    pub performance_summary: PerformanceSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentHealth {
    pub benton_county_status: String,
    pub parcels_processed: u32,
    pub harris_pacs_integration: String,
    pub tyler_vision_integration: String,
    pub aumentum_integration: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub api_response_time_ms: f64,
    pub ai_processing_time_ms: f64,
    pub database_query_time_ms: f64,
    pub uptime_percentage: f64,
    pub throughput_requests_per_second: f64,
}

pub struct WorkspaceService;

impl WorkspaceService {
    /// Define all known workspaces in TerraFusion OS
    pub fn get_workspace_mapping() -> Vec<(String, String, String)> {
        vec![
            // Core AI Systems
            ("ai-systems".to_string(), "workspaces/ai-systems".to_string(), "core".to_string()),
            ("api".to_string(), "workspaces/api".to_string(), "core".to_string()),
            ("auth".to_string(), "workspaces/auth".to_string(), "core".to_string()),
            ("autonomous-research-engine".to_string(), "workspaces/autonomous-research-engine".to_string(), "core".to_string()),
            ("consciousness".to_string(), "workspaces/consciousness".to_string(), "core".to_string()),
            ("engines".to_string(), "workspaces/engines".to_string(), "core".to_string()),
            ("infrastructure".to_string(), "workspaces/infrastructure".to_string(), "core".to_string()),
            ("monitoring".to_string(), "workspaces/monitoring".to_string(), "core".to_string()),
            ("performance".to_string(), "workspaces/performance".to_string(), "core".to_string()),
            ("platform".to_string(), "workspaces/platform".to_string(), "core".to_string()),
            ("security".to_string(), "workspaces/security".to_string(), "core".to_string()),
            ("services".to_string(), "workspaces/services".to_string(), "core".to_string()),

            // Government Services
            ("citizen-services".to_string(), "workspaces/citizen-services".to_string(), "government".to_string()),
            ("code-enforcement".to_string(), "workspaces/code-enforcement".to_string(), "government".to_string()),
            ("economic-development".to_string(), "workspaces/economic-development".to_string(), "government".to_string()),
            ("government-core".to_string(), "workspaces/government-core".to_string(), "government".to_string()),
            ("government-edition".to_string(), "workspaces/government-edition".to_string(), "government".to_string()),
            ("human-resources".to_string(), "workspaces/human-resources".to_string(), "government".to_string()),
            ("legal-judicial".to_string(), "workspaces/legal-judicial".to_string(), "government".to_string()),
            ("public-health".to_string(), "workspaces/public-health".to_string(), "government".to_string()),
            ("public-works".to_string(), "workspaces/public-works".to_string(), "government".to_string()),

            // Commercial & Marketplace
            ("commercial".to_string(), "workspaces/commercial".to_string(), "commercial".to_string()),
            ("commercial-suite".to_string(), "workspaces/commercial-suite".to_string(), "commercial".to_string()),
            ("marketplace".to_string(), "workspaces/marketplace".to_string(), "commercial".to_string()),
            ("marketplace-frontend".to_string(), "workspaces/marketplace-frontend".to_string(), "commercial".to_string()),
            ("store".to_string(), "workspaces/store".to_string(), "commercial".to_string()),

            // Development & Tools
            ("development".to_string(), "workspaces/development".to_string(), "development".to_string()),
            ("frontend".to_string(), "workspaces/frontend".to_string(), "development".to_string()),
            ("plugins".to_string(), "workspaces/plugins".to_string(), "development".to_string()),
            ("templates".to_string(), "workspaces/templates".to_string(), "development".to_string()),
            ("testing".to_string(), "workspaces/testing".to_string(), "development".to_string()),
            ("TerraFusionIDE".to_string(), "workspaces/TerraFusionIDE".to_string(), "development".to_string()),

            // Specialized Applications
            ("costforge-ai".to_string(), "workspaces/costforge-ai".to_string(), "specialized".to_string()),
            ("LeafScope".to_string(), "workspaces/LeafScope".to_string(), "specialized".to_string()),
            ("property-workbench".to_string(), "workspaces/property-workbench".to_string(), "specialized".to_string()),
            ("RAGPanel".to_string(), "workspaces/RAGPanel".to_string(), "specialized".to_string()),
            ("shock-and-awe".to_string(), "workspaces/shock-and-awe".to_string(), "specialized".to_string()),
            ("specialized".to_string(), "workspaces/specialized".to_string(), "specialized".to_string()),
            ("submissions".to_string(), "workspaces/submissions".to_string(), "specialized".to_string()),

            // Terra Applications
            ("terra-bank".to_string(), "workspaces/terra-bank".to_string(), "terra-app".to_string()),
            ("terra-collections".to_string(), "workspaces/terra-collections".to_string(), "terra-app".to_string()),
            ("terra-flow".to_string(), "workspaces/terra-flow".to_string(), "terra-app".to_string()),
            ("terra-fusion-dashboard".to_string(), "workspaces/terra-fusion-dashboard".to_string(), "terra-app".to_string()),
            ("terra-fusion-sync".to_string(), "workspaces/terra-fusion-sync".to_string(), "terra-app".to_string()),
            ("terra-insight".to_string(), "workspaces/terra-insight".to_string(), "terra-app".to_string()),
            ("terra-justice".to_string(), "workspaces/terra-justice".to_string(), "terra-app".to_string()),
            ("terra-levy".to_string(), "workspaces/terra-levy".to_string(), "terra-app".to_string()),
            ("terra-net".to_string(), "workspaces/terra-net".to_string(), "terra-app".to_string()),
            ("terra-sync".to_string(), "workspaces/terra-sync".to_string(), "terra-app".to_string()),
            ("terra-university".to_string(), "workspaces/terra-university".to_string(), "terra-app".to_string()),

            // System Components
            ("revenue".to_string(), "workspaces/revenue".to_string(), "system".to_string()),
            ("trust".to_string(), "workspaces/trust".to_string(), "system".to_string()),
            ("unified-system".to_string(), "workspaces/unified-system".to_string(), "system".to_string()),
            ("TerraFusion-PublicRecords".to_string(), "workspaces/TerraFusion-PublicRecords".to_string(), "system".to_string()),
        ]
    }

    /// List all available workspaces
    pub async fn list_workspaces(repo_root: &str) -> Result<Vec<WorkspaceInfo>, String> {
        let mut workspaces = Vec::new();

        for (id, path, workspace_type) in Self::get_workspace_mapping() {
            let full_path = format!("{}/{}", repo_root, path);

            // Check if path exists
            if std::path::Path::new(&full_path).exists() {
                workspaces.push(WorkspaceInfo {
                    id: id.clone(),
                    name: Self::format_workspace_name(&id),
                    path: path.clone(),
                    r#type: workspace_type,
                    description: None,
                    modules_count: None,
                });
            }
        }

        Ok(workspaces)
    }

    /// Get a specific workspace info
    pub async fn get_workspace(
        repo_root: &str,
        workspace_id: &str,
    ) -> Result<Option<WorkspaceInfo>, String> {
        let workspaces = Self::list_workspaces(repo_root).await?;
        Ok(workspaces.into_iter().find(|w| w.id == workspace_id))
    }

    /// Resolve workspace path (convert workspace_id to actual filesystem path)
    pub fn resolve_workspace_path(workspace_id: &str) -> Result<String, String> {
        let mapping = Self::get_workspace_mapping();

        mapping
            .into_iter()
            .find(|(id, _, _)| id == workspace_id)
            .map(|(_, path, _)| path)
            .ok_or_else(|| format!("Unknown workspace: {}", workspace_id))
    }

    /// Resolve full file path within a workspace
    pub fn resolve_file_path(
        repo_root: &str,
        workspace_id: &str,
        relative_path: &str,
    ) -> Result<String, String> {
        let workspace_path = Self::resolve_workspace_path(workspace_id)?;
        let full_workspace_path = format!("{}/{}", repo_root, workspace_path);

        // Build requested path
        let requested_path = if relative_path == "/" || relative_path.is_empty() {
            full_workspace_path.clone()
        } else {
            format!("{}/{}", full_workspace_path, relative_path.trim_start_matches('/'))
        };

        // Simple string-based boundary check
        let req_normalized = requested_path.replace("\\", "/");
        let ws_normalized = full_workspace_path.replace("\\", "/");

        if !req_normalized.starts_with(&ws_normalized) && !req_normalized.eq(&ws_normalized) {
            return Err(format!("Path is outside workspace boundary: {} not in {}", req_normalized, ws_normalized));
        }

        Ok(requested_path)
    }    /// Check if file path is within workspace boundaries
    pub fn is_file_in_workspace(
        repo_root: &str,
        workspace_id: &str,
        file_path: &str,
    ) -> bool {
        match Self::resolve_file_path(repo_root, workspace_id, file_path) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    /// Format workspace ID into readable name
    fn format_workspace_name(workspace_id: &str) -> String {
        workspace_id
            .split('-')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    /// Get workspace context (current + available)
    pub async fn get_context(
        repo_root: &str,
        current_workspace: Option<&str>,
    ) -> Result<WorkspaceContext, String> {
        let available_workspaces = Self::list_workspaces(repo_root).await?;

        let current = current_workspace
            .unwrap_or("ai-systems")  // Default to ai-systems
            .to_string();

        Ok(WorkspaceContext {
            current_workspace: current,
            available_workspaces,
            repo_root: repo_root.to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_workspace_name() {
        assert_eq!(
            WorkspaceService::format_workspace_name("ai-systems"),
            "Ai Systems"
        );
        assert_eq!(
            WorkspaceService::format_workspace_name("government-core"),
            "Government Core"
        );
    }

    #[test]
    fn test_resolve_workspace_path() {
        let result = WorkspaceService::resolve_workspace_path("ai-systems");
        assert_eq!(result, Ok("os-platform/ai-systems".to_string()));
    }

    #[test]
    fn test_unknown_workspace() {
        let result = WorkspaceService::resolve_workspace_path("unknown");
        assert!(result.is_err());
    }
}
