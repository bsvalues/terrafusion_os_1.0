use std::path::Path;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleInfo {
    pub id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub r#type: String,  // government-module, commercial-plugin, etc.
    pub tier: String,    // "Tier 1 (Core Government)", "Tier 2 (Essential Operations)", etc.
    pub status: String,  // active, experimental, deprecated, archived
    pub version: Option<String>,
    pub path: String,
    pub item_count: Option<u32>,
    pub migrated_at: Option<String>,
    pub depends_on: Vec<String>,
    pub used_by: Vec<String>,
    pub capabilities: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleManifest {
    pub name: String,
    pub tier: String,
    pub item_count: Option<u32>,
    #[serde(rename = "migratedAt")]
    pub migrated_at: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub tier: Option<String>,
    pub status: Option<String>,
    pub r#type: Option<String>,
}

pub struct ModuleService;

impl ModuleService {
    /// List all modules from modules/, marketplace/, and os-platform/ directories
    pub async fn list_modules(repo_root: &str) -> Result<Vec<ModuleInfo>, String> {
        let mut modules = Vec::new();

        // Search patterns for module locations
        let search_paths = vec![
            "modules",
            "marketplace",
            "os-platform",
            "packages",
        ];

        for search_path in search_paths {
            let full_path = format!("{}/{}", repo_root, search_path);

            if Path::new(&full_path).exists() {
                // Recursively find module.manifest.json files
                match Self::find_modules_in_path(&full_path, repo_root) {
                    Ok(mut found_modules) => modules.append(&mut found_modules),
                    Err(e) => {
                        tracing::warn!("Error scanning {}: {}", search_path, e);
                    }
                }
            }
        }

        Ok(modules)
    }

    /// Find all modules in a given directory
    fn find_modules_in_path(
        path: &str,
        repo_root: &str,
    ) -> Result<Vec<ModuleInfo>, String> {
        let mut modules = Vec::new();

        // Use walkdir to recursively find module.manifest.json files
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();

                if entry_path.is_dir() {
                    // Check if this directory has a module.manifest.json
                    let manifest_path = entry_path.join("module.manifest.json");

                    if manifest_path.exists() {
                        match Self::load_module_from_manifest(&entry_path, repo_root) {
                            Ok(module_info) => modules.push(module_info),
                            Err(e) => {
                                tracing::warn!(
                                    "Failed to load module from {:?}: {}",
                                    entry_path,
                                    e
                                );
                            }
                        }
                    }

                    // Recursively search subdirectories (limited depth)
                    if let Ok(mut sub_modules) =
                        Self::find_modules_in_path(entry_path.to_str().unwrap_or(""), repo_root)
                    {
                        // Only go 2 levels deep
                        if entry_path.components().count() - Path::new(repo_root).components().count() < 4
                        {
                            modules.append(&mut sub_modules);
                        }
                    }
                }
            }
        }

        Ok(modules)
    }

    /// Load module info from a manifest file
    fn load_module_from_manifest(
        module_path: &Path,
        repo_root: &str,
    ) -> Result<ModuleInfo, String> {
        let manifest_path = module_path.join("module.manifest.json");

        let content = std::fs::read_to_string(&manifest_path)
            .map_err(|e| format!("Failed to read manifest: {}", e))?;

        let manifest: ModuleManifest = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse manifest JSON: {}", e))?;

        let module_id = module_path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| manifest.name.clone());

        let relative_path = module_path
            .strip_prefix(repo_root)
            .ok()
            .and_then(|p| p.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("unknown/{}", module_id));

        Ok(ModuleInfo {
            id: module_id,
            name: manifest.name.clone(),
            display_name: None,
            description: None,
            r#type: "government-module".to_string(),
            tier: manifest.tier,
            status: manifest.status,
            version: None,
            path: relative_path,
            item_count: manifest.item_count,
            migrated_at: manifest.migrated_at,
            depends_on: Vec::new(),
            used_by: Vec::new(),
            capabilities: Vec::new(),
            tags: Vec::new(),
        })
    }

    /// Get a specific module by ID
    pub async fn get_module(
        repo_root: &str,
        module_id: &str,
    ) -> Result<Option<ModuleInfo>, String> {
        let modules = Self::list_modules(repo_root).await?;
        Ok(modules.into_iter().find(|m| m.id == module_id))
    }

    /// Search modules by criteria
    pub async fn search_modules(
        repo_root: &str,
        query: &SearchQuery,
    ) -> Result<Vec<ModuleInfo>, String> {
        let modules = Self::list_modules(repo_root).await?;

        let filtered = modules
            .into_iter()
            .filter(|m| {
                // Filter by search query
                if let Some(q) = &query.q {
                    let q_lower = q.to_lowercase();
                    if !m.id.to_lowercase().contains(&q_lower)
                        && !m.name.to_lowercase().contains(&q_lower)
                    {
                        return false;
                    }
                }

                // Filter by tier
                if let Some(tier) = &query.tier {
                    if !m.tier.contains(tier) {
                        return false;
                    }
                }

                // Filter by status
                if let Some(status) = &query.status {
                    if m.status != *status {
                        return false;
                    }
                }

                // Filter by type
                if let Some(r#type) = &query.r#type {
                    if m.r#type != *r#type {
                        return false;
                    }
                }

                true
            })
            .collect();

        Ok(filtered)
    }

    /// Get module dependency graph (simplified)
    pub async fn get_module_dependencies(
        repo_root: &str,
        module_id: &str,
    ) -> Result<HashMap<String, Vec<String>>, String> {
        let mut graph = HashMap::new();

        // For now, return empty graph - would be populated from Atlas registry
        // In full implementation, query terrafusion-atlas/registries/modules.json
        graph.insert(module_id.to_string(), Vec::new());

        Ok(graph)
    }
}
