use serde::{Deserialize, Serialize};
use std::path::Path;
use crate::task_runner_service::TaskRunnerService;

/// AI Service - Enriches queries with IDE context (modules, workspaces, tasks, etc.)
/// Routes requests through the main /api/portal/ask endpoint with contextual metadata

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIQueryRequest {
    /// The workspace context for the query (e.g., "benton-county", "marketplace")
    pub workspace: String,
    /// The module being worked on (e.g., "terrafusion-core", "property-management")
    pub module_id: Option<String>,
    /// The file currently open in editor (if any)
    pub current_file: Option<String>,
    /// The user's actual query/question
    pub query: String,
    /// Additional context data (optional)
    pub context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIQueryResponse {
    /// The query that was processed
    pub query: String,
    /// AI-generated answer
    pub answer: String,
    /// Suggested follow-up questions
    pub suggested_next: Vec<String>,
    /// References/sources used
    pub sources: Vec<String>,
    /// Module/workspace metadata that enriched the response
    pub context_metadata: ContextMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContextMetadata {
    /// Detected module type (rust, typescript, python, dotnet)
    pub module_type: Option<String>,
    /// Available tasks in the current module
    pub available_tasks: Vec<String>,
    /// Recently modified files in workspace
    pub recent_files: Vec<String>,
    /// Module dependencies
    pub dependencies: Vec<String>,
    /// Current workspace description
    pub workspace_description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIEnrichedQuery {
    /// Original user query
    pub query: String,
    /// Enhanced query with context
    pub enhanced_query: String,
    /// Workspace context
    pub workspace: String,
    /// Module context
    pub module_context: Option<ModuleContext>,
    /// File context
    pub file_context: Option<FileContext>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleContext {
    pub module_id: String,
    pub module_type: String,
    pub module_path: String,
    pub available_tasks: Vec<String>,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContext {
    pub file_path: String,
    pub file_name: String,
    pub file_size: usize,
    pub language: String,
}

pub struct AIService;

impl AIService {
    /// Process an AI query with full IDE context enrichment
    pub async fn process_query(request: AIQueryRequest) -> Result<AIEnrichedQuery, String> {
        // Validate workspace exists by constructing path
        let repo_root = r"C:\Users\bsval\terrafusion_os_1.0";
        let workspace_path = format!("{}/SDK/workspaces/{}", repo_root, request.workspace);

        // Verify workspace directory exists
        if !Path::new(&workspace_path).exists() {
            return Err(format!(
                "Workspace '{}' not found at {}",
                request.workspace, workspace_path
            ));
        }

        // Build enhanced query with context
        let mut enhanced_query = format!("Workspace: {}\n", request.workspace);

        // Add module context if specified
        let module_context = if let Some(module_id) = &request.module_id {
            let ctx = Self::enrich_module_context(&workspace_path, module_id).await?;
            enhanced_query.push_str(&format!(
                "Module: {} (Type: {}, Path: {})\nAvailable tasks: {}\n",
                ctx.module_id,
                ctx.module_type,
                ctx.module_path,
                ctx.available_tasks.join(", ")
            ));
            Some(ctx)
        } else {
            None
        };

        // Add file context if specified
        let file_context = if let Some(file_path) = &request.current_file {
            if let Ok(ctx) = Self::enrich_file_context(&workspace_path, file_path).await {
                enhanced_query.push_str(&format!(
                    "Currently editing: {} ({} bytes, Language: {})\n",
                    ctx.file_name, ctx.file_size, ctx.language
                ));
                Some(ctx)
            } else {
                None
            }
        } else {
            None
        };

        // Add any user-provided context
        if let Some(ctx) = &request.context {
            enhanced_query.push_str(&format!("Additional context:\n{}\n", ctx));
        }

        // Append the actual query
        enhanced_query.push_str(&format!("Query: {}", request.query));

        Ok(AIEnrichedQuery {
            query: request.query,
            enhanced_query,
            workspace: request.workspace,
            module_context,
            file_context,
        })
    }

    /// Extract metadata for AI context enrichment
    pub async fn get_query_metadata(
        workspace: &str,
        module_id: Option<&str>,
    ) -> Result<ContextMetadata, String> {
        let repo_root = r"C:\Users\bsval\terrafusion_os_1.0";
        let workspace_path = format!("{}/SDK/workspaces/{}", repo_root, workspace);

        if !Path::new(&workspace_path).exists() {
            return Err(format!(
                "Workspace '{}' not found at {}",
                workspace, workspace_path
            ));
        }

        let mut metadata = ContextMetadata::default();

        // Detect module type and get available tasks
        if let Some(mod_id) = module_id {
            let module_path = format!("{}/{}", workspace_path, mod_id);
            metadata.module_type = Some(TaskRunnerService::detect_module_type(&module_path));

            // Get available tasks for this module
            let module_type = TaskRunnerService::detect_module_type(&module_path);
            let tasks = TaskRunnerService::get_available_tasks(&module_type);
            metadata.available_tasks = tasks.iter().map(|t| t.name.clone()).collect();

            // Try to detect dependencies from manifest
            if let Ok(deps) = Self::extract_dependencies(&module_path, &module_type).await {
                metadata.dependencies = deps;
            }
        }

        // Get recently modified files
        if let Ok(files) = Self::get_recent_files(&workspace_path, 5).await {
            metadata.recent_files = files;
        }

        Ok(metadata)
    }

    /// Enrich module context with detailed information
    async fn enrich_module_context(
        workspace_path: &str,
        module_id: &str,
    ) -> Result<ModuleContext, String> {
        let module_path = format!("{}/{}", workspace_path, module_id);

        // Detect module type
        let module_type = TaskRunnerService::detect_module_type(&module_path);

        // Get available tasks
        let tasks = TaskRunnerService::get_available_tasks(&module_type);
        let available_tasks = tasks.iter().map(|t| t.name.clone()).collect();

        // Extract dependencies
        let dependencies = Self::extract_dependencies(&module_path, &module_type)
            .await
            .unwrap_or_default();

        Ok(ModuleContext {
            module_id: module_id.to_string(),
            module_type,
            module_path,
            available_tasks,
            dependencies,
        })
    }

    /// Enrich file context with language detection
    async fn enrich_file_context(
        workspace_path: &str,
        file_path: &str,
    ) -> Result<FileContext, String> {
        let full_path = format!("{}/{}", workspace_path, file_path);

        // Check if file exists and is readable
        let metadata = std::fs::metadata(&full_path)
            .map_err(|e| format!("Failed to read file metadata: {}", e))?;

        let file_name = Path::new(file_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Detect language from extension
        let language = Self::detect_language(&file_path);

        Ok(FileContext {
            file_path: file_path.to_string(),
            file_name,
            file_size: metadata.len() as usize,
            language,
        })
    }

    /// Detect programming language from file extension
    fn detect_language(file_path: &str) -> String {
        let ext = Path::new(file_path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");

        match ext {
            "rs" => "Rust".to_string(),
            "ts" | "tsx" => "TypeScript".to_string(),
            "js" | "jsx" => "JavaScript".to_string(),
            "py" => "Python".to_string(),
            "cs" => "C#".to_string(),
            "go" => "Go".to_string(),
            "java" => "Java".to_string(),
            "cpp" | "cc" | "cxx" => "C++".to_string(),
            "c" => "C".to_string(),
            "sh" | "bash" => "Bash".to_string(),
            "json" => "JSON".to_string(),
            "yaml" | "yml" => "YAML".to_string(),
            "toml" => "TOML".to_string(),
            "xml" => "XML".to_string(),
            "html" => "HTML".to_string(),
            "css" | "scss" | "less" => "CSS".to_string(),
            "sql" => "SQL".to_string(),
            "md" => "Markdown".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    /// Extract dependencies from module manifest files
    async fn extract_dependencies(
        module_path: &str,
        module_type: &str,
    ) -> Result<Vec<String>, String> {
        match module_type {
            "rust" => Self::extract_cargo_deps(module_path).await,
            "typescript" => Self::extract_npm_deps(module_path).await,
            "python" => Self::extract_python_deps(module_path).await,
            "dotnet" => Self::extract_dotnet_deps(module_path).await,
            _ => Ok(vec![]),
        }
    }

    async fn extract_cargo_deps(module_path: &str) -> Result<Vec<String>, String> {
        let cargo_path = format!("{}/Cargo.toml", module_path);
        if !Path::new(&cargo_path).exists() {
            return Ok(vec![]);
        }

        let content = std::fs::read_to_string(&cargo_path)
            .map_err(|e| format!("Failed to read Cargo.toml: {}", e))?;

        let mut deps = vec![];
        let mut in_deps = false;

        for line in content.lines() {
            if line.contains("[dependencies]") {
                in_deps = true;
                continue;
            }
            if in_deps && line.starts_with('[') {
                break;
            }
            if in_deps && !line.is_empty() && !line.starts_with('#') {
                if let Some(dep_name) = line.split('=').next() {
                    deps.push(dep_name.trim().to_string());
                }
            }
        }

        Ok(deps)
    }

    async fn extract_npm_deps(module_path: &str) -> Result<Vec<String>, String> {
        let package_path = format!("{}/package.json", module_path);
        if !Path::new(&package_path).exists() {
            return Ok(vec![]);
        }

        let content = std::fs::read_to_string(&package_path)
            .map_err(|e| format!("Failed to read package.json: {}", e))?;

        // Simple JSON parsing for dependencies
        let mut deps = vec![];

        if let Some(start) = content.find("\"dependencies\"") {
            let deps_section = &content[start..];
            if let Some(end) = deps_section.find('}') {
                let deps_text = &deps_section[..end];
                for line in deps_text.lines() {
                    if line.contains(':') {
                        if let Some(name) = line.split('"').nth(1) {
                            deps.push(name.to_string());
                        }
                    }
                }
            }
        }

        Ok(deps)
    }

    async fn extract_python_deps(module_path: &str) -> Result<Vec<String>, String> {
        let requirements_path = format!("{}/requirements.txt", module_path);
        if !Path::new(&requirements_path).exists() {
            return Ok(vec![]);
        }

        let content = std::fs::read_to_string(&requirements_path)
            .map_err(|e| format!("Failed to read requirements.txt: {}", e))?;

        let deps = content
            .lines()
            .filter(|l| !l.is_empty() && !l.starts_with('#'))
            .map(|l| l.split('=').next().unwrap_or("").to_string())
            .filter(|d| !d.is_empty())
            .collect();

        Ok(deps)
    }

    async fn extract_dotnet_deps(module_path: &str) -> Result<Vec<String>, String> {
        // Find .csproj or .fsproj file
        let dir = std::fs::read_dir(module_path)
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in dir {
            if let Ok(entry) = entry {
                let path = entry.path();
                if let Some(ext) = path.extension() {
                    if ext == "csproj" || ext == "fsproj" {
                        let content = std::fs::read_to_string(&path)
                            .map_err(|e| format!("Failed to read project file: {}", e))?;

                        let mut deps = vec![];
                        for line in content.lines() {
                            if line.contains("PackageReference") {
                                if let Some(include) = line.split("Include=\"").nth(1) {
                                    if let Some(pkg) = include.split('"').next() {
                                        deps.push(pkg.to_string());
                                    }
                                }
                            }
                        }
                        return Ok(deps);
                    }
                }
            }
        }

        Ok(vec![])
    }

    /// Get recently modified files in workspace
    async fn get_recent_files(workspace_path: &str, limit: usize) -> Result<Vec<String>, String> {
        use std::time::SystemTime;

        let mut files = vec![];

        fn walk_dir(
            path: &str,
            base_path: &str,
            files: &mut Vec<(String, SystemTime)>,
            depth: usize,
        ) -> std::io::Result<()> {
            if depth > 3 {
                return Ok(());
            }

            for entry in std::fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();

                // Skip hidden and common build directories
                if let Some(name) = path.file_name() {
                    if let Some(name_str) = name.to_str() {
                        if name_str.starts_with('.')
                            || name_str == "node_modules"
                            || name_str == "target"
                            || name_str == "bin"
                            || name_str == "obj"
                        {
                            continue;
                        }
                    }
                }

                if path.is_dir() {
                    let _ = walk_dir(
                        path.to_str().unwrap_or(""),
                        base_path,
                        files,
                        depth + 1,
                    );
                } else if let Ok(metadata) = path.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        let relative_path = path
                            .to_str()
                            .unwrap_or("")
                            .strip_prefix(base_path)
                            .unwrap_or("")
                            .to_string();
                        files.push((relative_path, modified));
                    }
                }
            }

            Ok(())
        }

        let _ = walk_dir(workspace_path, workspace_path, &mut files, 0);

        // Sort by modification time and take the most recent
        files.sort_by(|a, b| b.1.cmp(&a.1));

        Ok(files
            .into_iter()
            .take(limit)
            .map(|(f, _)| f)
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_language_detection() {
        assert_eq!(AIService::detect_language("main.rs"), "Rust");
        assert_eq!(AIService::detect_language("app.ts"), "TypeScript");
        assert_eq!(AIService::detect_language("script.py"), "Python");
        assert_eq!(AIService::detect_language("program.cs"), "C#");
        assert_eq!(AIService::detect_language("unknown.xyz"), "Unknown");
    }

    #[test]
    fn test_cargo_dependency_parsing() {
        let test_cargo = r#"
[package]
name = "test"

[dependencies]
tokio = "1.0"
serde = { version = "1.0" }
axum = "0.7"

[dev-dependencies]
"#;

        // Verify parsing logic
        let mut deps = vec![];
        let mut in_deps = false;

        for line in test_cargo.lines() {
            if line.contains("[dependencies]") {
                in_deps = true;
                continue;
            }
            if in_deps && line.starts_with('[') {
                break;
            }
            if in_deps && !line.is_empty() && !line.starts_with('#') {
                if let Some(dep_name) = line.split('=').next() {
                    deps.push(dep_name.trim().to_string());
                }
            }
        }

        assert!(deps.contains(&"tokio".to_string()));
        assert!(deps.contains(&"serde".to_string()));
        assert!(deps.contains(&"axum".to_string()));
    }

    #[test]
    fn test_context_metadata_default() {
        let metadata = ContextMetadata::default();
        assert!(metadata.module_type.is_none());
        assert!(metadata.available_tasks.is_empty());
        assert!(metadata.recent_files.is_empty());
    }

    #[test]
    fn test_ai_enriched_query_creation() {
        let query = AIEnrichedQuery {
            query: "How do I build this?".to_string(),
            enhanced_query: "Workspace: test\nQuery: How do I build this?".to_string(),
            workspace: "test".to_string(),
            module_context: None,
            file_context: None,
        };

        assert_eq!(query.query, "How do I build this?");
        assert_eq!(query.workspace, "test");
        assert!(query.module_context.is_none());
    }

    #[test]
    fn test_module_context_fields() {
        let ctx = ModuleContext {
            module_id: "core".to_string(),
            module_type: "rust".to_string(),
            module_path: "/path/to/core".to_string(),
            available_tasks: vec!["build".to_string(), "test".to_string()],
            dependencies: vec!["tokio".to_string()],
        };

        assert_eq!(ctx.module_id, "core");
        assert_eq!(ctx.module_type, "rust");
        assert_eq!(ctx.available_tasks.len(), 2);
        assert_eq!(ctx.dependencies.len(), 1);
    }
}
