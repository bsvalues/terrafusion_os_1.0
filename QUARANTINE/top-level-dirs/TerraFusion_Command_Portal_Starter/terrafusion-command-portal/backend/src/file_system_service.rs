use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub language: String,  // rust, javascript, json, markdown, etc.
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileWriteRequest {
    pub path: String,
    pub content: String,
    pub validate_manifest: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub timestamp: String,
    pub operation: String,  // "read", "write", "delete", "create"
    pub path: String,
    pub workspace_id: String,
    pub status: String,  // "success", "error"
    pub details: Option<String>,
}

pub struct FileSystemService;

impl FileSystemService {
    /// List files and directories in a path
    pub async fn list_directory(
        repo_root: &str,
        workspace_id: &str,
        relative_path: Option<&str>,
    ) -> Result<Vec<FileInfo>, String> {
        use crate::workspace_service::WorkspaceService;

        let file_path = if let Some(rel_path) = relative_path {
            WorkspaceService::resolve_file_path(repo_root, workspace_id, rel_path)?
        } else {
            format!("{}/{}", repo_root, WorkspaceService::resolve_workspace_path(workspace_id)?)
        };

        let path = Path::new(&file_path);

        if !path.exists() {
            return Err(format!("Path does not exist: {}", file_path));
        }

        if !path.is_dir() {
            return Err(format!("Path is not a directory: {}", file_path));
        }

        let mut files = Vec::new();

        for entry in fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let metadata = entry.metadata().map_err(|e| format!("Failed to read metadata: {}", e))?;

            let name = entry
                .file_name()
                .into_string()
                .unwrap_or_else(|_| "unknown".to_string());

            // Skip hidden files and node_modules
            if name.starts_with('.') || name == "node_modules" || name == "target" {
                continue;
            }

            let path_str = entry.path()
                .to_string_lossy()
                .to_string();

            // Convert to relative path for consistency
            let relative = path_str
                .strip_prefix(&format!("{}/", repo_root))
                .unwrap_or(&path_str)
                .to_string();

            files.push(FileInfo {
                path: relative,
                name,
                is_dir: metadata.is_dir(),
                size: metadata.len(),
                modified: metadata.modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs().to_string()),
            });
        }

        // Sort directories first, then files
        files.sort_by_key(|f| (!f.is_dir, f.name.clone()));

        Ok(files)
    }

    /// Read file content
    pub async fn read_file(
        repo_root: &str,
        workspace_id: &str,
        relative_path: &str,
    ) -> Result<FileContent, String> {
        use crate::workspace_service::WorkspaceService;

        let file_path = WorkspaceService::resolve_file_path(repo_root, workspace_id, relative_path)?;

        let path = Path::new(&file_path);

        if !path.exists() {
            return Err(format!("File does not exist: {}", file_path));
        }

        if !path.is_file() {
            return Err(format!("Path is not a file: {}", file_path));
        }

        // Prevent reading very large files (>10MB)
        let metadata = fs::metadata(path)
            .map_err(|e| format!("Failed to read file metadata: {}", e))?;

        if metadata.len() > 10 * 1024 * 1024 {
            return Err("File is too large (>10MB)".to_string());
        }

        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let language = Self::detect_language(&file_path);

        Ok(FileContent {
            path: relative_path.to_string(),
            content,
            language,
            size: metadata.len(),
        })
    }

    /// Write file content
    pub async fn write_file(
        repo_root: &str,
        workspace_id: &str,
        request: &FileWriteRequest,
    ) -> Result<AuditLog, String> {
        use crate::workspace_service::WorkspaceService;

        let timestamp = chrono::Local::now().to_rfc3339();

        let file_path = WorkspaceService::resolve_file_path(
            repo_root,
            workspace_id,
            &request.path,
        )?;

        let path = Path::new(&file_path);

        // Validate manifest if requested and it's a module.manifest.json file
        if request.validate_manifest.unwrap_or(false) {
            if request.path.ends_with("module.manifest.json") {
                if let Err(e) = Self::validate_manifest_content(&request.content) {
                    return Ok(AuditLog {
                        timestamp,
                        operation: "write".to_string(),
                        path: request.path.clone(),
                        workspace_id: workspace_id.to_string(),
                        status: "error".to_string(),
                        details: Some(format!("Manifest validation failed: {}", e)),
                    });
                }
            }
        }

        // Create parent directories if needed
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {}", e))?;
        }

        // Write the file
        fs::write(path, &request.content)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        tracing::info!(
            "File written: {} in workspace {}",
            request.path,
            workspace_id
        );

        Ok(AuditLog {
            timestamp,
            operation: "write".to_string(),
            path: request.path.clone(),
            workspace_id: workspace_id.to_string(),
            status: "success".to_string(),
            details: Some(format!("Wrote {} bytes", request.content.len())),
        })
    }

    /// Validate module manifest JSON structure
    fn validate_manifest_content(content: &str) -> Result<(), String> {
        match serde_json::from_str::<serde_json::Value>(content) {
            Ok(json) => {
                // Check for required fields
                let required_fields = vec!["name", "tier"];
                for field in required_fields {
                    if !json.get(field).is_some() {
                        return Err(format!("Missing required field: {}", field));
                    }
                }
                Ok(())
            }
            Err(e) => Err(format!("Invalid JSON: {}", e)),
        }
    }

    /// Detect file language based on extension
    fn detect_language(file_path: &str) -> String {
        match Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
        {
            Some("rs") => "rust".to_string(),
            Some("ts") => "typescript".to_string(),
            Some("tsx") => "typescript".to_string(),
            Some("js") => "javascript".to_string(),
            Some("jsx") => "javascript".to_string(),
            Some("json") => "json".to_string(),
            Some("md") => "markdown".to_string(),
            Some("py") => "python".to_string(),
            Some("sh") => "shell".to_string(),
            Some("toml") => "toml".to_string(),
            Some("yaml") | Some("yml") => "yaml".to_string(),
            Some("css") => "css".to_string(),
            Some("html") => "html".to_string(),
            _ => "plaintext".to_string(),
        }
    }

    /// Check if file exists within workspace
    pub fn file_exists(
        repo_root: &str,
        workspace_id: &str,
        relative_path: &str,
    ) -> bool {
        use crate::workspace_service::WorkspaceService;

        match WorkspaceService::resolve_file_path(repo_root, workspace_id, relative_path) {
            Ok(file_path) => Path::new(&file_path).exists(),
            Err(_) => false,
        }
    }

    /// Get file size
    pub fn get_file_size(
        repo_root: &str,
        workspace_id: &str,
        relative_path: &str,
    ) -> Result<u64, String> {
        use crate::workspace_service::WorkspaceService;

        let file_path = WorkspaceService::resolve_file_path(repo_root, workspace_id, relative_path)?;
        let metadata = fs::metadata(&file_path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;

        Ok(metadata.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_language() {
        assert_eq!(FileSystemService::detect_language("main.rs"), "rust");
        assert_eq!(FileSystemService::detect_language("app.tsx"), "typescript");
        assert_eq!(FileSystemService::detect_language("config.json"), "json");
        assert_eq!(FileSystemService::detect_language("unknown.xyz"), "plaintext");
    }

    #[test]
    fn test_validate_manifest() {
        let valid = r#"{"name": "test", "tier": "Tier 1"}"#;
        assert!(FileSystemService::validate_manifest_content(valid).is_ok());

        let missing_field = r#"{"name": "test"}"#;
        assert!(FileSystemService::validate_manifest_content(missing_field).is_err());

        let invalid_json = r#"{"name": "test""#;
        assert!(FileSystemService::validate_manifest_content(invalid_json).is_err());
    }
}
