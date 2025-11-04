use sqlx::postgres::{PgPool, PgPoolOptions};

use crate::error::{AppError, AppResult};

/// Database connection
pub struct Database {
    /// The connection pool
    pub pool: PgPool,
}

impl Database {
    /// Connect to the database with a connection string
    pub async fn connect(url: &str) -> AppResult<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(url)
            .await
            .map_err(|e| AppError::Database(format!("Failed to connect to database: {}", e)))?;
            
        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to run migrations: {}", e)))?;
            
        Ok(Self { pool })
    }
    
    /// Execute a query
    pub async fn execute(&self, query: &str) -> AppResult<u64> {
        sqlx::query(query)
            .execute(&self.pool)
            .await
            .map(|r| r.rows_affected())
            .map_err(|e| AppError::Database(format!("Failed to execute query: {}", e)))
    }
}