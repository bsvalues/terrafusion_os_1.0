use std::sync::Arc;

use async_graphql::{Context, Object, Result};
use shared::{
    db::Database,
    error::AppError,
    repository::user_repository::UserRepository,
};

use super::types::{User, UpdateUserInput};

/// GraphQL mutation root
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Update a user's profile
    async fn update_user(&self, ctx: &Context<'_>, id: String, input: UpdateUserInput) -> Result<User> {
        let db = ctx.data::<Arc<Database>>()?;
        let repository = UserRepository::new(db.clone());
        
        // In a real application, check if the current user is authorized to update this user
        // For example, only allow users to update their own profile or admin users to update any profile
        
        // First check if the user exists
        let existing_user = match repository.get_by_id(id.clone()).await {
            Ok(user) => user,
            Err(e) => {
                match e {
                    AppError::NotFound(_) => {
                        return Err(async_graphql::Error::new(format!("User not found")));
                    }
                    _ => {
                        return Err(async_graphql::Error::new(format!("Error finding user: {}", e)));
                    }
                }
            }
        };
        
        // Create an updated user with the same ID and mix in the updated fields
        let updated_user = shared::models::user::User {
            id: existing_user.id,
            email: existing_user.email,
            first_name: input.first_name.or(existing_user.first_name),
            last_name: input.last_name.or(existing_user.last_name),
            profile_image_url: existing_user.profile_image_url,
            created_at: existing_user.created_at,
            updated_at: chrono::Utc::now(),
        };
        
        match repository.update(id, &updated_user).await {
            Ok(user) => Ok(user.into()),
            Err(e) => Err(async_graphql::Error::new(format!("Error updating user: {}", e))),
        }
    }
}