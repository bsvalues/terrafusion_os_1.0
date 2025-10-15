use sqlx::{sqlite::SqlitePool, Row};
use std::path::Path;
use dirs::data_dir;

static mut DB_POOL: Option<SqlitePool> = None;

pub async fn init_database() -> anyhow::Result<()> {
    // Create app data directory
    let app_data_dir = data_dir()
        .ok_or_else(|| anyhow::anyhow!("Failed to get data directory"))?
        .join("TerraFusion");
    
    tokio::fs::create_dir_all(&app_data_dir).await?;
    
    let db_path = app_data_dir.join("app.db");
    let db_url = format!("sqlite:{}", db_path.display());
    
    let pool = SqlitePool::connect(&db_url).await?;
    
    // Create tables
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
    .execute(&pool)
    .await?;
    
    unsafe {
        DB_POOL = Some(pool);
    }
    
    tracing::info!("Database initialized successfully");
    Ok(())
}

fn get_pool() -> &'static SqlitePool {
    unsafe {
        DB_POOL.as_ref().expect("Database not initialized")
    }
}

pub async fn save_app_data(key: &str, value: &serde_json::Value) -> anyhow::Result<()> {
    let pool = get_pool();
    let value_str = serde_json::to_string(value)?;
    
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO app_data (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        "#,
    )
    .bind(key)
    .bind(value_str)
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn load_app_data(key: &str) -> anyhow::Result<serde_json::Value> {
    let pool = get_pool();
    
    let row = sqlx::query("SELECT value FROM app_data WHERE key = ?")
        .bind(key)
        .fetch_optional(pool)
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
