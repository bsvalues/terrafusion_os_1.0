use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// User model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique user ID (from Replit Auth)
    pub id: String,
    /// User email (optional)
    pub email: Option<String>,
    /// User first name (optional)
    pub first_name: Option<String>,
    /// User last name (optional)
    pub last_name: Option<String>,
    /// URL to user profile image (optional)
    pub profile_image_url: Option<String>,
    /// When the user was created
    pub created_at: DateTime<Utc>,
    /// When the user was last updated
    pub updated_at: DateTime<Utc>,
}

/// Data needed to upsert a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertUser {
    /// Unique user ID (from Replit Auth)
    pub id: String,
    /// User email (optional)
    pub email: Option<String>,
    /// User first name (optional)
    pub first_name: Option<String>,
    /// User last name (optional)
    pub last_name: Option<String>,
    /// URL to user profile image (optional)
    pub profile_image_url: Option<String>,
}

/// Data needed to update a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    /// User first name (optional)
    pub first_name: Option<String>,
    /// User last name (optional)
    pub last_name: Option<String>,
}