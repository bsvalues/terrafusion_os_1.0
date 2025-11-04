use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::env;
use crate::models::AppError;

pub async fn create_pool() -> Result<SqlitePool, AppError> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:../terrabuild.db".to_string());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .connect(&database_url)
        .await
        .map_err(|e| AppError::Database(e))?;
    
    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::Internal(format!("Migration failed: {}", e)))?;
    
    Ok(pool)
}