use std::sync::Arc;

use async_graphql::{Context, Object, Result};
use shared::{
    db::Database,
    error::AppError,
    repository::user_repository::UserRepository,
};

use super::types::User;

/// GraphQL query root
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get the current user from session
    async fn me(&self, ctx: &Context<'_>) -> Result<Option<User>> {
        // For authenticated query, we would need the session
        // This is simplified for this example - normally we'd need to extract from context
        // In a production app, use middleware to extract session into context
        
        // Get a dummy user for now
        // In production, implement proper authentication
        Ok(None)
    }
    
    /// Get a user by ID
    async fn user(&self, ctx: &Context<'_>, id: String) -> Result<User> {
        let db = ctx.data::<Arc<Database>>()?;
        let repository = UserRepository::new(db.clone());
        
        match repository.get_by_id(id).await {
            Ok(user) => Ok(user.into()),
            Err(e) => {
                match e {
                    AppError::NotFound(_) => Err(async_graphql::Error::new(format!("User not found"))),
                    _ => Err(async_graphql::Error::new(format!("Error fetching user: {}", e))),
                }
            }
        }
    }
    
    /// Get all users (admin only)
    async fn users(&self, ctx: &Context<'_>) -> Result<Vec<User>> {
        let db = ctx.data::<Arc<Database>>()?;
        let repository = UserRepository::new(db.clone());
        
        // In a real application, check if the user is an admin here
        
        match repository.get_all().await {
            Ok(users) => Ok(users.into_iter().map(|u| u.into()).collect()),
            Err(e) => Err(async_graphql::Error::new(format!("Error fetching users: {}", e))),
        }
    }
}