use serde::{Deserialize, Serialize};
use std::fmt;
use std::io;

/// Log level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LogLevel {
    /// Trace level (most verbose)
    Trace,
    /// Debug level
    Debug,
    /// Info level
    Info,
    /// Warn level
    Warn,
    /// Error level
    Error,
}

impl fmt::Display for LogLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LogLevel::Trace => write!(f, "TRACE"),
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, "INFO"),
            LogLevel::Warn => write!(f, "WARN"),
            LogLevel::Error => write!(f, "ERROR"),
        }
    }
}

/// Structured log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    /// Service name
    pub service: String,
    /// Log level
    pub level: LogLevel,
    /// Log message
    pub message: String,
    /// Timestamp (ISO 8601)
    pub timestamp: String,
    /// Request ID for tracing
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    /// Additional context data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<serde_json::Value>,
}

/// Logger configuration
#[derive(Debug, Clone)]
pub struct LoggerConfig {
    /// Service name
    pub service_name: String,
    /// Minimum log level
    pub min_level: LogLevel,
    /// Enable JSON output
    pub json_output: bool,
}

/// Structured logger
pub struct Logger {
    /// Logger configuration
    config: LoggerConfig,
}

impl Logger {
    /// Create a new logger
    pub fn new(config: LoggerConfig) -> Self {
        Self { config }
    }
    
    /// Initialize global logger
    pub fn init() -> Result<(), log::SetLoggerError> {
        env_logger::init();
        Ok(())
    }
    
    /// Log a message at the specified level
    pub fn log(&self, level: LogLevel, message: &str, request_id: Option<&str>, context: Option<serde_json::Value>) {
        if level as u8 >= self.config.min_level as u8 {
            let entry = LogEntry {
                service: self.config.service_name.clone(),
                level,
                message: message.to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                request_id: request_id.map(|s| s.to_string()),
                context,
            };
            
            if self.config.json_output {
                if let Ok(json) = serde_json::to_string(&entry) {
                    println!("{}", json);
                }
            } else {
                let context_str = match entry.context {
                    Some(ctx) => format!(" context={}", ctx),
                    None => String::new(),
                };
                
                let request_str = match entry.request_id {
                    Some(id) => format!(" request_id={}", id),
                    None => String::new(),
                };
                
                println!(
                    "[{}] [{}] [{}]{}{} {}",
                    entry.timestamp,
                    entry.service,
                    entry.level,
                    request_str,
                    context_str,
                    entry.message
                );
            }
        }
    }
    
    /// Log a message at trace level
    pub fn trace(&self, message: &str, request_id: Option<&str>, context: Option<serde_json::Value>) {
        self.log(LogLevel::Trace, message, request_id, context);
    }
    
    /// Log a message at debug level
    pub fn debug(&self, message: &str, request_id: Option<&str>, context: Option<serde_json::Value>) {
        self.log(LogLevel::Debug, message, request_id, context);
    }
    
    /// Log a message at info level
    pub fn info(&self, message: &str, request_id: Option<&str>, context: Option<serde_json::Value>) {
        self.log(LogLevel::Info, message, request_id, context);
    }
    
    /// Log a message at warn level
    pub fn warn(&self, message: &str, request_id: Option<&str>, context: Option<serde_json::Value>) {
        self.log(LogLevel::Warn, message, request_id, context);
    }
    
    /// Log a message at error level
    pub fn error(&self, message: &str, request_id: Option<&str>, context: Option<serde_json::Value>) {
        self.log(LogLevel::Error, message, request_id, context);
    }
}

/// Create a middleware for request logging
pub fn request_logger() -> impl Fn(actix_web::dev::ServiceRequest) -> actix_web::Result<Option<String>> {
    move |req: actix_web::dev::ServiceRequest| {
        // Generate a request ID if not present
        let request_id = req
            .headers()
            .get("X-Request-ID")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
            
        // Add request ID to extensions
        req.extensions_mut().insert(request_id.clone());
        
        // Log the request
        log::info!(
            "Request started: {} {} (ID: {})",
            req.method(),
            req.uri(),
            request_id
        );
        
        Ok(Some(request_id))
    }
}