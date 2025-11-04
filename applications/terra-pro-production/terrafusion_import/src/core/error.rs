use thiserror::Error;

#[derive(Error, Debug)]
pub enum ImportError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
    
    #[error("Unknown format for file: {path}")]
    UnknownFormat { path: String },
    
    #[error("Schema mapping error: {message}")]
    MappingError { message: String },
    
    #[error("Invalid data format: {details}")]
    InvalidData { details: String },
    
    #[error("File not found: {path}")]
    FileNotFound { path: String },
    
    #[error("Permission denied accessing: {path}")]
    PermissionDenied { path: String },
    
    #[error("Database connection failed: {reason}")]
    DatabaseConnection { reason: String },
    
    #[error("Export failed: {reason}")]
    ExportFailed { reason: String },
}