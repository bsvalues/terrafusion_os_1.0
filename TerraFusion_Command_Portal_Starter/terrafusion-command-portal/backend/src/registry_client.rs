use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::path::Path;

/// Registry Client - Queries and caches Atlas registry data
/// Provides module metadata, service information, and system topology

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub module_type: String,
    pub status: String, // "active", "deprecated", "beta"
    pub owner: Option<String>,
    pub dependencies: Vec<String>,
    pub services: Vec<ServiceInfo>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub id: String,
    pub name: String,
    pub port: Option<u16>,
    pub endpoint: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryEntry {
    pub module_id: String,
    pub module_metadata: ModuleMetadata,
    pub last_synced: String,
    pub cache_version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryIndex {
    pub total_modules: usize,
    pub modules: HashMap<String, ModuleMetadata>,
    pub services: HashMap<String, ServiceInfo>,
    pub last_updated: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RegistryStats {
    pub total_modules: usize,
    pub total_services: usize,
    pub active_modules: usize,
    pub beta_modules: usize,
    pub deprecated_modules: usize,
}

/// Thread-safe registry cache
pub struct RegistryClient {
    cache: Arc<RwLock<HashMap<String, RegistryEntry>>>,
    index: Arc<RwLock<Option<RegistryIndex>>>,
}

impl RegistryClient {
    /// Create a new registry client with empty cache
    pub fn new() -> Self {
        RegistryClient {
            cache: Arc::new(RwLock::new(HashMap::new())),
            index: Arc::new(RwLock::new(None)),
        }
    }

    /// Sync with Atlas registry (local file system)
    pub async fn sync_registry(
        &self,
        atlas_path: &str,
    ) -> Result<RegistryStats, String> {
        // Load Atlas.json from the specified path
        let atlas_file = format!("{}/Atlas.json", atlas_path);

        if !Path::new(&atlas_file).exists() {
            return Err(format!("Atlas.json not found at: {}", atlas_file));
        }

        let content = std::fs::read_to_string(&atlas_file)
            .map_err(|e| format!("Failed to read Atlas.json: {}", e))?;

        // Parse the registry index
        let index: RegistryIndex = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse Atlas.json: {}", e))?;

        let stats = RegistryStats {
            total_modules: index.modules.len(),
            total_services: index.services.len(),
            active_modules: index
                .modules
                .values()
                .filter(|m| m.status == "active")
                .count(),
            beta_modules: index
                .modules
                .values()
                .filter(|m| m.status == "beta")
                .count(),
            deprecated_modules: index
                .modules
                .values()
                .filter(|m| m.status == "deprecated")
                .count(),
        };

        // Update cache
        for (module_id, metadata) in &index.modules {
            let entry = RegistryEntry {
                module_id: module_id.clone(),
                module_metadata: metadata.clone(),
                last_synced: chrono::Local::now().to_rfc3339(),
                cache_version: 1,
            };
            self.cache.write().await.insert(module_id.clone(), entry);
        }

        // Update index
        *self.index.write().await = Some(index);

        tracing::info!(
            "Registry synced: {} modules, {} services",
            stats.total_modules,
            stats.total_services
        );

        Ok(stats)
    }

    /// Get metadata for a specific module
    pub async fn get_module_metadata(&self, module_id: &str) -> Option<ModuleMetadata> {
        self.cache
            .read()
            .await
            .get(module_id)
            .map(|e| e.module_metadata.clone())
    }

    /// Get metadata for multiple modules
    pub async fn get_modules_metadata(
        &self,
        module_ids: &[String],
    ) -> HashMap<String, ModuleMetadata> {
        let cache = self.cache.read().await;
        module_ids
            .iter()
            .filter_map(|id| {
                cache
                    .get(id)
                    .map(|e| (id.clone(), e.module_metadata.clone()))
            })
            .collect()
    }

    /// Get all modules with a specific tag
    pub async fn get_modules_by_tag(&self, tag: &str) -> Vec<ModuleMetadata> {
        self.cache
            .read()
            .await
            .values()
            .filter_map(|e| {
                if e.module_metadata.tags.contains(&tag.to_string()) {
                    Some(e.module_metadata.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get all modules of a specific type
    pub async fn get_modules_by_type(&self, module_type: &str) -> Vec<ModuleMetadata> {
        self.cache
            .read()
            .await
            .values()
            .filter_map(|e| {
                if e.module_metadata.module_type == module_type {
                    Some(e.module_metadata.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get all active modules
    pub async fn get_active_modules(&self) -> Vec<ModuleMetadata> {
        self.cache
            .read()
            .await
            .values()
            .filter_map(|e| {
                if e.module_metadata.status == "active" {
                    Some(e.module_metadata.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get service information
    pub async fn get_service_info(&self, service_id: &str) -> Option<ServiceInfo> {
        let index = self.index.read().await;
        index
            .as_ref()
            .and_then(|idx| idx.services.get(service_id).cloned())
    }

    /// Get all services for a module
    pub async fn get_module_services(&self, module_id: &str) -> Vec<ServiceInfo> {
        if let Some(metadata) = self.get_module_metadata(module_id).await {
            metadata.services
        } else {
            vec![]
        }
    }

    /// Search modules by name or description
    pub async fn search_modules(&self, query: &str) -> Vec<ModuleMetadata> {
        let query_lower = query.to_lowercase();
        self.cache
            .read()
            .await
            .values()
            .filter_map(|e| {
                let meta = &e.module_metadata;
                if meta.name.to_lowercase().contains(&query_lower)
                    || meta.description.to_lowercase().contains(&query_lower)
                    || meta.id.to_lowercase().contains(&query_lower)
                {
                    Some(meta.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get module dependencies recursively
    pub async fn get_dependency_tree(
        &self,
        module_id: &str,
    ) -> Result<DependencyTree, String> {
        let mut tree = DependencyTree::new(module_id.to_string());

        // Collect dependencies iteratively using a queue to avoid async recursion
        let mut queue = vec![(module_id.to_string(), 0)];
        let mut visited = std::collections::HashSet::new();

        while let Some((curr_id, depth)) = queue.pop() {
            if depth > 10 {
                continue; // Skip if too deep
            }

            if visited.contains(&curr_id) {
                continue; // Skip if already visited
            }

            visited.insert(curr_id.clone());

            if let Some(metadata) = self.get_module_metadata(&curr_id).await {
                for dep_id in &metadata.dependencies {
                    tree.add_dependency(&curr_id, dep_id, depth + 1);
                    queue.push((dep_id.clone(), depth + 1));
                }
            }
        }

        Ok(tree)
    }

    /// Get registry statistics
    pub async fn get_stats(&self) -> RegistryStats {
        let cache = self.cache.read().await;

        RegistryStats {
            total_modules: cache.len(),
            total_services: self.index.read().await
                .as_ref()
                .map(|idx| idx.services.len())
                .unwrap_or(0),
            active_modules: cache
                .values()
                .filter(|e| e.module_metadata.status == "active")
                .count(),
            beta_modules: cache
                .values()
                .filter(|e| e.module_metadata.status == "beta")
                .count(),
            deprecated_modules: cache
                .values()
                .filter(|e| e.module_metadata.status == "deprecated")
                .count(),
        }
    }

    /// Invalidate cache (force refresh)
    pub async fn clear_cache(&self) {
        self.cache.write().await.clear();
        *self.index.write().await = None;
        tracing::info!("Registry cache cleared");
    }

    /// Get all cached modules
    pub async fn get_all_modules(&self) -> Vec<ModuleMetadata> {
        self.cache
            .read()
            .await
            .values()
            .map(|e| e.module_metadata.clone())
            .collect()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyTree {
    pub root: String,
    pub dependencies: HashMap<String, Vec<DependencyNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyNode {
    pub module_id: String,
    pub depth: usize,
}

impl DependencyTree {
    fn new(root: String) -> Self {
        DependencyTree {
            root,
            dependencies: HashMap::new(),
        }
    }

    fn add_dependency(&mut self, parent: &str, child: &str, depth: usize) {
        self.dependencies
            .entry(parent.to_string())
            .or_insert_with(Vec::new)
            .push(DependencyNode {
                module_id: child.to_string(),
                depth,
            });
    }

    pub fn get_depth(&self, module_id: &str) -> Option<usize> {
        for (_, deps) in &self.dependencies {
            for dep in deps {
                if dep.module_id == module_id {
                    return Some(dep.depth);
                }
            }
        }
        None
    }
}

impl Default for RegistryClient {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_registry_client_creation() {
        let client = RegistryClient::new();
        assert!(client.cache.blocking_read().is_empty());
    }

    #[test]
    fn test_module_metadata_creation() {
        let metadata = ModuleMetadata {
            id: "test-module".to_string(),
            name: "Test Module".to_string(),
            version: "1.0.0".to_string(),
            description: "A test module".to_string(),
            module_type: "rust".to_string(),
            status: "active".to_string(),
            owner: Some("test-owner".to_string()),
            dependencies: vec!["dep1".to_string()],
            services: vec![],
            tags: vec!["test".to_string()],
        };

        assert_eq!(metadata.id, "test-module");
        assert_eq!(metadata.status, "active");
        assert_eq!(metadata.dependencies.len(), 1);
    }

    #[test]
    fn test_service_info_creation() {
        let service = ServiceInfo {
            id: "api".to_string(),
            name: "API Service".to_string(),
            port: Some(8080),
            endpoint: Some("http://localhost:8080".to_string()),
            description: Some("Main API".to_string()),
        };

        assert_eq!(service.id, "api");
        assert_eq!(service.port, Some(8080));
    }

    #[test]
    fn test_dependency_tree_creation() {
        let mut tree = DependencyTree::new("root".to_string());
        tree.add_dependency("root", "dep1", 1);
        tree.add_dependency("root", "dep2", 1);
        tree.add_dependency("dep1", "dep3", 2);

        assert_eq!(tree.get_depth("dep1"), Some(1));
        assert_eq!(tree.get_depth("dep3"), Some(2));
        assert_eq!(tree.get_depth("nonexistent"), None);
    }

    #[test]
    fn test_registry_stats_creation() {
        let stats = RegistryStats {
            total_modules: 10,
            total_services: 5,
            active_modules: 8,
            beta_modules: 1,
            deprecated_modules: 1,
        };

        assert_eq!(stats.total_modules, 10);
        assert_eq!(stats.active_modules, 8);
        assert_eq!(stats.beta_modules + stats.deprecated_modules, 2);
    }

    #[tokio::test]
    async fn test_registry_entry_creation() {
        let metadata = ModuleMetadata {
            id: "test".to_string(),
            name: "Test".to_string(),
            version: "1.0.0".to_string(),
            description: "Test".to_string(),
            module_type: "rust".to_string(),
            status: "active".to_string(),
            owner: None,
            dependencies: vec![],
            services: vec![],
            tags: vec![],
        };

        let entry = RegistryEntry {
            module_id: "test".to_string(),
            module_metadata: metadata,
            last_synced: chrono::Local::now().to_rfc3339(),
            cache_version: 1,
        };

        assert_eq!(entry.cache_version, 1);
        assert_eq!(entry.module_id, "test");
    }
}
