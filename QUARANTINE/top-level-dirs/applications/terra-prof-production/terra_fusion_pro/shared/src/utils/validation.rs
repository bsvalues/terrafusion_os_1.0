use serde::{Deserialize, Serialize};
use validator::{Validate, ValidationError, ValidationErrors};

use crate::error::{AppError, AppResult};

/// Validation error response
#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationErrorResponse {
    /// Error message
    pub message: String,
    /// Field errors
    pub errors: std::collections::HashMap<String, Vec<String>>,
}

impl From<ValidationErrors> for ValidationErrorResponse {
    fn from(errors: ValidationErrors) -> Self {
        let mut error_map = std::collections::HashMap::new();
        
        for (field, field_errors) in errors.field_errors() {
            let error_messages: Vec<String> = field_errors
                .iter()
                .map(|error| {
                    error.message.clone().unwrap_or_else(|| "Invalid value".into()).to_string()
                })
                .collect();
                
            error_map.insert(field.to_string(), error_messages);
        }
        
        Self {
            message: "Validation failed".to_string(),
            errors: error_map,
        }
    }
}

/// Validate a struct and return a result
pub fn validate_struct<T: Validate>(data: &T) -> AppResult<()> {
    data.validate()
        .map_err(|e| {
            let error_response = ValidationErrorResponse::from(e);
            AppError::Validation(format!("{:?}", error_response))
        })
}

/// Validate an email address
pub fn validate_email(email: &str) -> Result<(), ValidationError> {
    let email_regex = regex::Regex::new(
        r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
    )
    .unwrap();
    
    if !email_regex.is_match(email) {
        return Err(ValidationError::new("invalid_email"));
    }
    
    Ok(())
}

/// Validate a password
pub fn validate_password(password: &str) -> Result<(), ValidationError> {
    if password.len() < 8 {
        return Err(ValidationError::new("password_too_short"));
    }
    
    // Check for at least one uppercase letter
    if !password.chars().any(|c| c.is_ascii_uppercase()) {
        return Err(ValidationError::new("password_no_uppercase"));
    }
    
    // Check for at least one lowercase letter
    if !password.chars().any(|c| c.is_ascii_lowercase()) {
        return Err(ValidationError::new("password_no_lowercase"));
    }
    
    // Check for at least one digit
    if !password.chars().any(|c| c.is_ascii_digit()) {
        return Err(ValidationError::new("password_no_digit"));
    }
    
    // Check for at least one special character
    let special = r#"[!@#$%^&*(),.?:{}|<>]"#;
    let special_chars = regex::Regex::new(special).unwrap();
    if !special_chars.is_match(password) {
        return Err(ValidationError::new("password_no_special_char"));
    }
    
    Ok(())
}

/// Validate a phone number
pub fn validate_phone(phone: &str) -> Result<(), ValidationError> {
    let phone_pattern = r"^\+?[1-9]\d{1,14}$";
    let phone_regex = regex::Regex::new(phone_pattern).unwrap();
    
    if !phone_regex.is_match(phone) {
        return Err(ValidationError::new("invalid_phone"));
    }
    
    Ok(())
}

/// Validate a URL
pub fn validate_url(url: &str) -> Result<(), ValidationError> {
    let url_pattern = r"^(https?://)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)";
    let url_regex = regex::Regex::new(url_pattern).unwrap();
    
    if !url_regex.is_match(url) {
        return Err(ValidationError::new("invalid_url"));
    }
    
    Ok(())
}