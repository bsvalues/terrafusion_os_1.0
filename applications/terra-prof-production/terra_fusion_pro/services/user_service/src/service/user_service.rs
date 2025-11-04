use chrono::Utc;
use shared::{
    error::AppResult,
    models::user::{User, UpdateUserRequest},
};

use std::sync::Arc;

use shared::repository::user_repository::UserRepository;

/// User service for handling business logic
pub struct UserService {
    repository: UserRepository,
}

impl UserService {
    /// Create a new user service
    pub fn new(repository: UserRepository) -> Self {
        Self { repository }
    }
    
    /// Find a user by ID
    pub async fn find_user_by_id(&self, id: String) -> AppResult<User> {
        self.repository.get_by_id(id).await
    }
    
    /// Find a user by email
    pub async fn find_user_by_email(&self, email: &str) -> AppResult<Option<User>> {
        self.repository.find_by_email(email).await
    }
    
    /// Update an existing user
    pub async fn update_user(&self, id: String, request: UpdateUserRequest) -> AppResult<User> {
        // First check if the user exists
        let existing = self.repository.get_by_id(id.clone()).await?;
        
        // Create updated user with same ID and creation time
        let user = User {
            id: existing.id,
            email: existing.email,
            first_name: request.first_name.or(existing.first_name),
            last_name: request.last_name.or(existing.last_name),
            profile_image_url: existing.profile_image_url,
            created_at: existing.created_at,
            updated_at: Utc::now(),
        };
        
        self.repository.update(id, &user).await
    }
    
    /// Get all users
    pub async fn get_all_users(&self) -> AppResult<Vec<User>> {
        self.repository.get_all().await
    }
}