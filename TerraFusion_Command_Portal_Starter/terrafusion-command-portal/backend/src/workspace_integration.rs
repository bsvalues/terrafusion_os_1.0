// Workspace Integration - Reads from config/ai/workspace-assignments.json
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Workspace {
    pub slug: String,
    pub name: String,
    pub status: String,
    pub path: String,
    pub team_size: i32,
    pub last_active: String,
    pub mcp_server: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceAssignments {
    pub assignments: AssignmentsConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssignmentsConfig {
    pub supreme_commander: SupremeCommanderConfig,
    pub field_generals: Vec<FieldGeneralConfig>,
    pub operational_rules: Vec<OperationalRule>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupremeCommanderConfig {
    pub workspace: String,
    pub permissions: Vec<String>,
    pub scope: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FieldGeneralConfig {
    pub agents: String,
    pub workspace: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OperationalRule {
    pub task: String,
    pub workspace: String,
    pub agents: i32,
}

/// Get list of all workspaces with metadata
pub async fn get_workspaces(repo_root: &str) -> Result<Vec<Workspace>, String> {
    // Try to read workspace assignments from add-on
    let assignments_path = Path::new(repo_root)
        .join("TerraFusion_Workspace_Enhancements_Addon")
        .join("terrafusion-workspace-enhancements")
        .join("config")
        .join("ai")
        .join("workspace-assignments.json");

    if assignments_path.exists() {
        let content = fs::read_to_string(&assignments_path)
            .map_err(|e| format!("Failed to read assignments: {}", e))?;
        
        let assignments: WorkspaceAssignments = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse assignments: {}", e))?;

        return Ok(generate_workspaces_from_assignments(assignments, repo_root));
    }

    // Fallback: scan for actual workspace directories
    Ok(scan_workspace_directories(repo_root).await)
}

fn generate_workspaces_from_assignments(
    assignments: WorkspaceAssignments,
    _repo_root: &str,
) -> Vec<Workspace> {
    let mut workspaces = Vec::new();

    // Add workspaces from operational rules (these are the marketplace apps)
    for rule in assignments.assignments.operational_rules {
        let slug = rule.workspace
            .rsplit('/')
            .next()
            .and_then(|s| s.strip_suffix(".code-workspace"))
            .unwrap_or(&rule.workspace)
            .to_string();

        let name = slug
            .split('-')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ");

        // Determine MCP server path (marketplace apps have MCP servers)
        let mcp_server = if slug.starts_with("terra-") {
            Some(format!("marketplace/{}/mcp-server", slug))
        } else {
            None
        };

        workspaces.push(Workspace {
            slug: slug.clone(),
            name,
            status: "healthy".to_string(), // Will be updated by health checks
            path: format!("marketplace/{}", slug),
            team_size: rule.agents,
            last_active: "2 hours ago".to_string(),
            mcp_server,
        });
    }

    // Add pillar workspaces from field generals
    for general in assignments.assignments.field_generals {
        let slug = general.workspace
            .rsplit('/')
            .next()
            .and_then(|s| s.strip_suffix(".code-workspace"))
            .unwrap_or(&general.workspace)
            .to_string();

        let name = slug
            .split('-')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ");

        workspaces.push(Workspace {
            slug: slug.clone(),
            name,
            status: "healthy".to_string(),
            path: slug.clone(),
            team_size: 0, // Pillar workspaces don't have specific team size
            last_active: "1 day ago".to_string(),
            mcp_server: None, // Pillars don't have individual MCP servers
        });
    }

    workspaces
}

async fn scan_workspace_directories(repo_root: &str) -> Vec<Workspace> {
    let mut workspaces = Vec::new();

    // Scan marketplace directory
    let marketplace_path = Path::new(repo_root).join("marketplace");
    if marketplace_path.exists() {
        if let Ok(entries) = fs::read_dir(marketplace_path) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let slug = entry.file_name().to_string_lossy().to_string();
                    let name = slug
                        .split('-')
                        .map(|word| {
                            let mut chars = word.chars();
                            match chars.next() {
                                None => String::new(),
                                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                            }
                        })
                        .collect::<Vec<_>>()
                        .join(" ");

                    workspaces.push(Workspace {
                        slug: slug.clone(),
                        name,
                        status: "healthy".to_string(),
                        path: format!("marketplace/{}", slug),
                        team_size: 4,
                        last_active: "2 hours ago".to_string(),
                        mcp_server: Some(format!("marketplace/{}/mcp-server", slug)),
                    });
                }
            }
        }
    }

    // If no workspaces found, return mock data
    if workspaces.is_empty() {
        workspaces = vec![
            Workspace {
                slug: "terra-levy".to_string(),
                name: "Terra Levy".to_string(),
                status: "healthy".to_string(),
                path: "marketplace/terra-levy".to_string(),
                team_size: 4,
                last_active: "2 hours ago".to_string(),
                mcp_server: Some("marketplace/terra-levy/mcp-server".to_string()),
            },
            Workspace {
                slug: "terra-bank".to_string(),
                name: "Terra Bank".to_string(),
                status: "warning".to_string(),
                path: "marketplace/terra-bank".to_string(),
                team_size: 3,
                last_active: "1 day ago".to_string(),
                mcp_server: Some("marketplace/terra-bank/mcp-server".to_string()),
            },
            Workspace {
                slug: "terra-collections".to_string(),
                name: "Terra Collections".to_string(),
                status: "critical".to_string(),
                path: "marketplace/terra-collections".to_string(),
                team_size: 2,
                last_active: "Active now".to_string(),
                mcp_server: Some("marketplace/terra-collections/mcp-server".to_string()),
            },
        ];
    }

    workspaces
}
