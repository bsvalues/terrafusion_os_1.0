use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::time::Instant;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRequest {
    pub command: String,
    pub args: Option<Vec<String>>,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandExecution {
    pub command: String,
    pub args: Vec<String>,
    pub exit_code: i32,
    pub stdout_lines: Vec<String>,
    pub stderr_lines: Vec<String>,
    pub duration_ms: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamMessage {
    pub r#type: String, // "stdout", "stderr", "exit", "error"
    pub data: String,
    pub timestamp: String,
}

pub struct TerminalService;

impl TerminalService {
    /// Whitelisted commands that can be executed
    fn get_whitelisted_commands() -> Vec<&'static str> {
        vec![
            "cargo",
            "npm",
            "yarn",
            "pnpm",
            "python",
            "python3",
            "dotnet",
            "bash",
            "sh",
            "pwsh",
            "powershell",
            "git",
            "docker",
            "make",
        ]
    }

    /// Check if a command is whitelisted
    pub fn is_command_whitelisted(cmd: &str) -> bool {
        let cmd_name = std::path::Path::new(cmd)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(cmd);

        Self::get_whitelisted_commands().iter().any(|&wl| {
            wl.eq_ignore_ascii_case(cmd_name) || cmd_name.contains(wl)
        })
    }

    /// Get list of supported commands
    pub fn supported_commands() -> Vec<String> {
        Self::get_whitelisted_commands()
            .iter()
            .map(|s| s.to_string())
            .collect()
    }

    /// Execute a command synchronously and return output
    pub async fn execute_command(
        cmd: &str,
        args: Option<Vec<String>>,
        cwd: &str,
    ) -> Result<CommandExecution, String> {
        // Validate command
        if !Self::is_command_whitelisted(cmd) {
            return Err(format!(
                "Command '{}' is not whitelisted. Allowed: {:?}",
                cmd,
                Self::supported_commands()
            ));
        }

        // Validate working directory exists
        let cwd_path = std::path::Path::new(cwd);
        if !cwd_path.exists() {
            return Err(format!("Working directory does not exist: {}", cwd));
        }

        let start = Instant::now();
        let args_vec = args.unwrap_or_default();

        // Execute command using tokio
        let mut child = TokioCommand::new(cmd)
            .args(&args_vec)
            .current_dir(cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))?;

        let mut stdout_lines = Vec::new();
        let mut stderr_lines = Vec::new();

        // Capture stdout
        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                stdout_lines.push(line);
            }
        }

        // Capture stderr
        if let Some(stderr) = child.stderr.take() {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                stderr_lines.push(line);
            }
        }

        let exit_status = child.wait().await
            .map_err(|e| format!("Failed to wait for process: {}", e))?;

        let exit_code = exit_status.code().unwrap_or(-1);
        let duration_ms = start.elapsed().as_millis();

        tracing::info!(
            "Command executed: {} {:?} (exit: {}, duration: {}ms)",
            cmd,
            args_vec,
            exit_code,
            duration_ms
        );

        Ok(CommandExecution {
            command: cmd.to_string(),
            args: args_vec,
            exit_code,
            stdout_lines,
            stderr_lines,
            duration_ms,
        })
    }

    /// Stream command output line-by-line through a channel
    pub async fn stream_command_output(
        cmd: &str,
        args: Option<Vec<String>>,
        cwd: &str,
        tx: tokio::sync::mpsc::Sender<StreamMessage>,
    ) -> Result<i32, String> {
        // Validate command
        if !Self::is_command_whitelisted(cmd) {
            return Err(format!(
                "Command '{}' is not whitelisted",
                cmd
            ));
        }

        // Validate working directory
        let cwd_path = std::path::Path::new(cwd);
        if !cwd_path.exists() {
            return Err(format!("Working directory does not exist: {}", cwd));
        }

        let args_vec = args.unwrap_or_default();

        // Spawn the process
        let mut child = TokioCommand::new(cmd)
            .args(&args_vec)
            .current_dir(cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))?;

        // Stream stdout
        if let Some(stdout) = child.stdout.take() {
            let tx_stdout = tx.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let msg = StreamMessage {
                        r#type: "stdout".to_string(),
                        data: line,
                        timestamp: chrono::Local::now().to_rfc3339(),
                    };
                    let _ = tx_stdout.send(msg).await;
                }
            });
        }

        // Stream stderr
        if let Some(stderr) = child.stderr.take() {
            let tx_stderr = tx.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let msg = StreamMessage {
                        r#type: "stderr".to_string(),
                        data: line,
                        timestamp: chrono::Local::now().to_rfc3339(),
                    };
                    let _ = tx_stderr.send(msg).await;
                }
            });
        }

        // Wait for process to complete
        let exit_status = child.wait().await
            .map_err(|e| format!("Failed to wait for process: {}", e))?;

        let exit_code = exit_status.code().unwrap_or(-1);

        // Send exit message
        let exit_msg = StreamMessage {
            r#type: "exit".to_string(),
            data: exit_code.to_string(),
            timestamp: chrono::Local::now().to_rfc3339(),
        };
        let _ = tx.send(exit_msg).await;

        tracing::info!(
            "Stream command completed: {} {:?} (exit: {})",
            cmd,
            args_vec,
            exit_code
        );

        Ok(exit_code)
    }

    /// Validate if command can be executed
    pub async fn validate_command(cmd: &str, cwd: &str) -> Result<(), String> {
        if !Self::is_command_whitelisted(cmd) {
            return Err(format!("Command '{}' is not whitelisted", cmd));
        }

        let cwd_path = std::path::Path::new(cwd);
        if !cwd_path.exists() {
            return Err(format!("Working directory does not exist: {}", cwd));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_whitelisted() {
        assert!(TerminalService::is_command_whitelisted("cargo"));
        assert!(TerminalService::is_command_whitelisted("npm"));
        assert!(TerminalService::is_command_whitelisted("python"));
        assert!(!TerminalService::is_command_whitelisted("rm"));
        assert!(!TerminalService::is_command_whitelisted("rm -rf /"));
    }

    #[test]
    fn test_supported_commands() {
        let commands = TerminalService::supported_commands();
        assert!(commands.contains(&"cargo".to_string()));
        assert!(commands.contains(&"npm".to_string()));
        assert!(commands.len() > 0);
    }

    #[tokio::test]
    async fn test_validate_command_invalid_dir() {
        let result = TerminalService::validate_command("cargo", "/nonexistent/path")
            .await;
        assert!(result.is_err());
    }

    #[test]
    fn test_whitelisted_check_case_insensitive() {
        assert!(TerminalService::is_command_whitelisted("CARGO"));
        assert!(TerminalService::is_command_whitelisted("NPM"));
        assert!(TerminalService::is_command_whitelisted("Cargo"));
    }
}
