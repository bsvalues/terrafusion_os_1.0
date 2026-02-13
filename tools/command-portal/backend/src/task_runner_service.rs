use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub name: String,
    pub description: String,
    pub command: String,
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskExecution {
    pub execution_id: String,
    pub task_id: String,
    pub module_id: String,
    pub module_path: String,
    pub started_at: String,
    pub status: ExecutionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub execution_id: String,
    pub task_id: String,
    pub module_id: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u128,
    pub status: ExecutionStatus,
}

pub struct TaskRunnerService;

impl TaskRunnerService {
    /// Get available tasks for a module type
    pub fn get_available_tasks(module_type: &str) -> Vec<Task> {
        match module_type.to_lowercase().as_str() {
            "rust" | "terrafusion_core" | "government_core" => {
                vec![
                    Task {
                        id: "build".to_string(),
                        name: "Build".to_string(),
                        description: "Compile in release mode".to_string(),
                        command: "cargo".to_string(),
                        args: vec!["build".to_string(), "--release".to_string()],
                    },
                    Task {
                        id: "test".to_string(),
                        name: "Test".to_string(),
                        description: "Run test suite".to_string(),
                        command: "cargo".to_string(),
                        args: vec!["test".to_string(), "--all".to_string()],
                    },
                    Task {
                        id: "lint".to_string(),
                        name: "Lint".to_string(),
                        description: "Check code with Clippy".to_string(),
                        command: "cargo".to_string(),
                        args: vec!["clippy".to_string(), "--all-targets".to_string()],
                    },
                    Task {
                        id: "format".to_string(),
                        name: "Format".to_string(),
                        description: "Format code with rustfmt".to_string(),
                        command: "cargo".to_string(),
                        args: vec!["fmt".to_string()],
                    },
                    Task {
                        id: "clean".to_string(),
                        name: "Clean".to_string(),
                        description: "Clean build artifacts".to_string(),
                        command: "cargo".to_string(),
                        args: vec!["clean".to_string()],
                    },
                ]
            }
            "typescript" | "javascript" | "frontend" | "react" => {
                vec![
                    Task {
                        id: "build".to_string(),
                        name: "Build".to_string(),
                        description: "Build for production".to_string(),
                        command: "npm".to_string(),
                        args: vec!["run".to_string(), "build".to_string()],
                    },
                    Task {
                        id: "test".to_string(),
                        name: "Test".to_string(),
                        description: "Run test suite".to_string(),
                        command: "npm".to_string(),
                        args: vec!["test".to_string()],
                    },
                    Task {
                        id: "lint".to_string(),
                        name: "Lint".to_string(),
                        description: "Lint TypeScript/JavaScript".to_string(),
                        command: "npm".to_string(),
                        args: vec!["run".to_string(), "lint".to_string()],
                    },
                    Task {
                        id: "format".to_string(),
                        name: "Format".to_string(),
                        description: "Format code with Prettier".to_string(),
                        command: "npm".to_string(),
                        args: vec!["run".to_string(), "format".to_string()],
                    },
                    Task {
                        id: "dev".to_string(),
                        name: "Dev Server".to_string(),
                        description: "Start development server".to_string(),
                        command: "npm".to_string(),
                        args: vec!["run".to_string(), "dev".to_string()],
                    },
                ]
            }
            "python" | "ai_model" | "machine_learning" => {
                vec![
                    Task {
                        id: "test".to_string(),
                        name: "Test".to_string(),
                        description: "Run pytest test suite".to_string(),
                        command: "python".to_string(),
                        args: vec!["-m".to_string(), "pytest".to_string()],
                    },
                    Task {
                        id: "lint".to_string(),
                        name: "Lint".to_string(),
                        description: "Lint with pylint".to_string(),
                        command: "python".to_string(),
                        args: vec!["-m".to_string(), "pylint".to_string(), ".".to_string()],
                    },
                    Task {
                        id: "format".to_string(),
                        name: "Format".to_string(),
                        description: "Format with black".to_string(),
                        command: "python".to_string(),
                        args: vec!["-m".to_string(), "black".to_string(), ".".to_string()],
                    },
                    Task {
                        id: "typecheck".to_string(),
                        name: "Type Check".to_string(),
                        description: "Check types with mypy".to_string(),
                        command: "python".to_string(),
                        args: vec!["-m".to_string(), "mypy".to_string(), ".".to_string()],
                    },
                ]
            }
            "csharp" | "dotnet" | ".net" => {
                vec![
                    Task {
                        id: "build".to_string(),
                        name: "Build".to_string(),
                        description: "Build solution".to_string(),
                        command: "dotnet".to_string(),
                        args: vec!["build".to_string()],
                    },
                    Task {
                        id: "test".to_string(),
                        name: "Test".to_string(),
                        description: "Run tests".to_string(),
                        command: "dotnet".to_string(),
                        args: vec!["test".to_string()],
                    },
                    Task {
                        id: "publish".to_string(),
                        name: "Publish".to_string(),
                        description: "Publish for production".to_string(),
                        command: "dotnet".to_string(),
                        args: vec!["publish".to_string()],
                    },
                ]
            }
            _ => {
                vec![
                    Task {
                        id: "build".to_string(),
                        name: "Build".to_string(),
                        description: "Generic build command".to_string(),
                        command: "make".to_string(),
                        args: vec!["build".to_string()],
                    },
                    Task {
                        id: "test".to_string(),
                        name: "Test".to_string(),
                        description: "Generic test command".to_string(),
                        command: "make".to_string(),
                        args: vec!["test".to_string()],
                    },
                ]
            }
        }
    }

    /// Get a specific task by ID
    pub fn get_task(module_type: &str, task_id: &str) -> Option<Task> {
        Self::get_available_tasks(module_type)
            .into_iter()
            .find(|t| t.id == task_id)
    }

    /// Detect module type from manifest
    pub fn detect_module_type(module_path: &str) -> String {
        // Check for language-specific indicators
        let path = std::path::Path::new(module_path);

        // Check for Cargo.toml (Rust)
        if path.join("Cargo.toml").exists() {
            return "rust".to_string();
        }

        // Check for package.json (TypeScript/JavaScript)
        if path.join("package.json").exists() {
            return "typescript".to_string();
        }

        // Check for pyproject.toml or requirements.txt (Python)
        if path.join("pyproject.toml").exists() || path.join("requirements.txt").exists() {
            return "python".to_string();
        }

        // Check for .csproj (C#/.NET)
        for entry in std::fs::read_dir(path).unwrap_or_else(|_| {
            std::fs::read_dir(".").unwrap()
        }) {
            if let Ok(entry) = entry {
                let path = entry.path();
                if let Some(ext) = path.extension() {
                    if ext == "csproj" {
                        return "csharp".to_string();
                    }
                }
            }
        }

        // Default to generic
        "generic".to_string()
    }

    /// Generate execution ID
    pub fn generate_execution_id(task_id: &str, module_id: &str) -> String {
        format!(
            "exec-{}-{}-{}",
            task_id,
            module_id,
            chrono::Local::now().timestamp_millis()
        )
    }

    /// Create a task execution
    pub fn create_execution(
        task_id: &str,
        module_id: &str,
        module_path: &str,
    ) -> Result<TaskExecution, String> {
        let execution_id = Self::generate_execution_id(task_id, module_id);

        Ok(TaskExecution {
            execution_id,
            task_id: task_id.to_string(),
            module_id: module_id.to_string(),
            module_path: module_path.to_string(),
            started_at: chrono::Local::now().to_rfc3339(),
            status: ExecutionStatus::Pending,
        })
    }

    /// Get all module types
    pub fn get_all_module_types() -> Vec<String> {
        vec![
            "rust".to_string(),
            "typescript".to_string(),
            "python".to_string(),
            "csharp".to_string(),
            "generic".to_string(),
        ]
    }

    /// Check if task is valid for module type
    pub fn is_task_available(module_type: &str, task_id: &str) -> bool {
        Self::get_available_tasks(module_type)
            .iter()
            .any(|t| t.id == task_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_rust_tasks() {
        let tasks = TaskRunnerService::get_available_tasks("rust");
        assert!(tasks.iter().any(|t| t.id == "build"));
        assert!(tasks.iter().any(|t| t.id == "test"));
        assert!(tasks.iter().any(|t| t.id == "lint"));
    }

    #[test]
    fn test_get_typescript_tasks() {
        let tasks = TaskRunnerService::get_available_tasks("typescript");
        assert!(tasks.iter().any(|t| t.id == "build"));
        assert!(tasks.iter().any(|t| t.id == "dev"));
    }

    #[test]
    fn test_get_python_tasks() {
        let tasks = TaskRunnerService::get_available_tasks("python");
        assert!(tasks.iter().any(|t| t.id == "test"));
        assert!(tasks.iter().any(|t| t.id == "format"));
    }

    #[test]
    fn test_get_specific_task() {
        let task = TaskRunnerService::get_task("rust", "build");
        assert!(task.is_some());
        assert_eq!(task.unwrap().command, "cargo");
    }

    #[test]
    fn test_task_not_found() {
        let task = TaskRunnerService::get_task("rust", "nonexistent");
        assert!(task.is_none());
    }

    #[test]
    fn test_execution_id_generation() {
        let id1 = TaskRunnerService::generate_execution_id("build", "terra-levy");
        let id2 = TaskRunnerService::generate_execution_id("build", "terra-levy");
        assert!(id1.starts_with("exec-build-terra-levy-"));
        assert!(id2.starts_with("exec-build-terra-levy-"));
        assert_ne!(id1, id2); // Different timestamps
    }

    #[test]
    fn test_create_execution() {
        let exec = TaskRunnerService::create_execution(
            "build",
            "terra-levy",
            "modules/terra-levy"
        ).unwrap();

        assert_eq!(exec.task_id, "build");
        assert_eq!(exec.module_id, "terra-levy");
        assert_eq!(exec.status, ExecutionStatus::Pending);
    }

    #[test]
    fn test_is_task_available() {
        assert!(TaskRunnerService::is_task_available("rust", "build"));
        assert!(!TaskRunnerService::is_task_available("rust", "nonexistent"));
    }
}
