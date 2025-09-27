//! EMERGENCY SECURITY FIX: Memory-safe database implementation
//! Replaces CRITICAL VULNERABILITY: unsafe static mut DB_POOL

use sqlx::{sqlite::SqlitePool, Row};
use std::sync::Arc;
use tokio::sync::OnceCell;
use dirs::data_dir;

/// SECURE: Thread-safe database manager (NO UNSAFE CODE)
static DATABASE_MANAGER: OnceCell<Arc<DatabaseManager>> = OnceCell::const_new();

pub struct DatabaseManager {
    pool: SqlitePool,
}

impl DatabaseManager {
    /// Initialize database manager (called once, memory-safe)
    pub async fn initialize() -> anyhow::Result<()> {
        let manager = Self::new().await?;
        DATABASE_MANAGER.set(Arc::new(manager))
            .map_err(|_| anyhow::anyhow!("Database already initialized"))?;
        Ok(())
    }
    
    /// Get database manager instance (memory-safe)
    pub fn instance() -> Arc<DatabaseManager> {
        DATABASE_MANAGER.get()
            .expect("Database not initialized")
            .clone()
    }
    
    /// Create new database manager
    async fn new() -> anyhow::Result<Self> {
        let app_data_dir = data_dir()
            .ok_or_else(|| anyhow::anyhow!("Failed to get data directory"))?
            .join("TerraFusion");
        
        tokio::fs::create_dir_all(&app_data_dir).await?;
        
        let db_path = app_data_dir.join("app.db");
        let db_url = format!("sqlite:{}", db_path.display());
        
        let pool = SqlitePool::connect(&db_url).await?;
        
        let manager = Self { pool };
        manager.initialize_schema().await?;
        
        tracing::info!("SECURE: Database initialized successfully");
        Ok(manager)
    }
    
    async fn initialize_schema(&self) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS app_data (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    /// SECURE: Save application data with parameterized queries
    pub async fn save_app_data(&self, key: &str, value: &serde_json::Value) -> anyhow::Result<()> {
        let value_str = serde_json::to_string(value)?;
        
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO app_data (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(key)
        .bind(value_str)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    /// SECURE: Load application data with parameterized queries
    pub async fn load_app_data(&self, key: &str) -> anyhow::Result<serde_json::Value> {
        let row = sqlx::query("SELECT value FROM app_data WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;
        
        match row {
            Some(row) => {
                let value_str: String = row.get("value");
                let value: serde_json::Value = serde_json::from_str(&value_str)?;
                Ok(value)
            }
            None => Ok(serde_json::Value::Null),
        }
    }
}

/// SECURE: Initialize database (call this from main)
pub async fn init_database() -> anyhow::Result<()> {
    DatabaseManager::initialize().await
}

/// SECURE: Save application data (public API)
pub async fn save_app_data(key: &str, value: &serde_json::Value) -> anyhow::Result<()> {
    let db = DatabaseManager::instance();
    db.save_app_data(key, value).await
}

/// SECURE: Load application data (public API)  
pub async fn load_app_data(key: &str) -> anyhow::Result<serde_json::Value> {
    let db = DatabaseManager::instance();
    db.load_app_data(key).await
}
