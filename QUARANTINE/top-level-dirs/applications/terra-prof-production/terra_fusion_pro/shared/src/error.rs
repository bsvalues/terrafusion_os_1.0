use std::fmt;

/// Application result type
pub type AppResult<T> = Result<T, AppError>;

/// Application error types
#[derive(Debug)]
pub enum AppError {
    /// Database error
    Database(String),
    /// Authentication error
    Authentication(String),
    /// Authorization error
    Authorization(String),
    /// Validation error
    Validation(String),
    /// Not found error
    NotFound(String),
    /// External service error
    ExternalService(String),
    /// Configuration error
    Configuration(String),
    /// Serialization/deserialization error
    Deserialization(String),
    /// General error
    General(String),
}

impl AppError {
    /// Get error type as string
    pub fn error_type(&self) -> &'static str {
        match self {
            AppError::Database(_) => "database_error",
            AppError::Authentication(_) => "authentication_error",
            AppError::Authorization(_) => "authorization_error",
            AppError::Validation(_) => "validation_error",
            AppError::NotFound(_) => "not_found_error",
            AppError::ExternalService(_) => "external_service_error",
            AppError::Configuration(_) => "configuration_error",
            AppError::Deserialization(_) => "deserialization_error",
            AppError::General(_) => "general_error",
        }
    }

    /// Get error message
    pub fn message(&self) -> &str {
        match self {
            AppError::Database(msg) => msg,
            AppError::Authentication(msg) => msg,
            AppError::Authorization(msg) => msg,
            AppError::Validation(msg) => msg,
            AppError::NotFound(msg) => msg,
            AppError::ExternalService(msg) => msg,
            AppError::Configuration(msg) => msg,
            AppError::Deserialization(msg) => msg,
            AppError::General(msg) => msg,
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message())
    }
}

impl std::error::Error for AppError {}

/// Convert AppError to actix_web::Error
impl actix_web::ResponseError for AppError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        use actix_web::http::StatusCode;
        
        match self {
            AppError::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
            AppError::Authorization(_) => StatusCode::FORBIDDEN,
            AppError::Validation(_) => StatusCode::BAD_REQUEST,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::ExternalService(_) => StatusCode::BAD_GATEWAY,
            AppError::Configuration(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Deserialization(_) => StatusCode::BAD_REQUEST,
            AppError::General(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
    
    fn error_response(&self) -> actix_web::HttpResponse {
        let status = self.status_code();
        
        actix_web::HttpResponse::build(status)
            .json(serde_json::json!({
                "error": self.message(),
                "error_type": self.error_type(),
                "status_code": status.as_u16()
            }))
    }
}