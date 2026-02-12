use std::sync::Arc;

use chrono::Utc;
use sqlx::{postgres::PgRow, Row};

use crate::{
    db::Database,
    error::{AppError, AppResult},
    models::user::{User, UpsertUser},
};

/// Repository for user operations
pub struct UserRepository {
    db: Arc<Database>,
}

impl UserRepository {
    /// Create a new user repository
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
    
    /// Get a user by ID
    pub async fn get_by_id(&self, id: String) -> AppResult<User> {
        let query = "SELECT * FROM users WHERE id = $1";
        
        let row = sqlx::query(query)
            .bind(id.clone())
            .fetch_optional(&self.db.pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to fetch user: {}", e)))?;
            
        match row {
            Some(row) => self.row_to_user(&row),
            None => Err(AppError::NotFound(format!("User not found with ID: {}", id))),
        }
    }
    
    /// Find a user by email
    pub async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let query = "SELECT * FROM users WHERE email = $1";
        
        let row = sqlx::query(query)
            .bind(email)
            .fetch_optional(&self.db.pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to fetch user by email: {}", e)))?;
            
        match row {
            Some(row) => Ok(Some(self.row_to_user(&row)?)),
            None => Ok(None),
        }
    }
    
    /// Get all users
    pub async fn get_all(&self) -> AppResult<Vec<User>> {
        let query = "SELECT * FROM users ORDER BY created_at DESC";
        
        let rows = sqlx::query(query)
            .fetch_all(&self.db.pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to fetch users: {}", e)))?;
            
        let mut users = Vec::with_capacity(rows.len());
        for row in rows {
            users.push(self.row_to_user(&row)?);
        }
        
        Ok(users)
    }
    
    /// Create a new user
    pub async fn create(&self, user: &User) -> AppResult<User> {
        let query = "
            INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        ";
        
        let row = sqlx::query(query)
            .bind(&user.id)
            .bind(&user.email)
            .bind(&user.first_name)
            .bind(&user.last_name)
            .bind(&user.profile_image_url)
            .bind(user.created_at)
            .bind(user.updated_at)
            .fetch_one(&self.db.pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to create user: {}", e)))?;
            
        self.row_to_user(&row)
    }
    
    /// Update an existing user
    pub async fn update(&self, id: String, user: &User) -> AppResult<User> {
        let query = "
            UPDATE users
            SET email = $1, first_name = $2, last_name = $3, profile_image_url = $4, updated_at = $5
            WHERE id = $6
            RETURNING *
        ";
        
        let row = sqlx::query(query)
            .bind(&user.email)
            .bind(&user.first_name)
            .bind(&user.last_name)
            .bind(&user.profile_image_url)
            .bind(Utc::now())
            .bind(id)
            .fetch_one(&self.db.pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to update user: {}", e)))?;
            
        self.row_to_user(&row)
    }
    
    /// Upsert a user (insert or update)
    pub async fn upsert_user(&self, user: &UpsertUser) -> AppResult<User> {
        let query = "
            INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) 
            DO UPDATE SET 
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                profile_image_url = EXCLUDED.profile_image_url,
                updated_at = EXCLUDED.updated_at
            RETURNING *
        ";
        
        let now = Utc::now();
        
        let row = sqlx::query(query)
            .bind(&user.id)
            .bind(&user.email)
            .bind(&user.first_name)
            .bind(&user.last_name)
            .bind(&user.profile_image_url)
            .bind(now)
            .bind(now)
            .fetch_one(&self.db.pool)
            .await
            .map_err(|e| AppError::Database(format!("Failed to upsert user: {}", e)))?;
            
        self.row_to_user(&row)
    }
    
    /// Convert a database row to a user model
    fn row_to_user(&self, row: &PgRow) -> AppResult<User> {
        Ok(User {
            id: row.try_get("id")
                .map_err(|e| AppError::Database(format!("Failed to read user ID: {}", e)))?,
            email: row.try_get("email")
                .map_err(|e| AppError::Database(format!("Failed to read user email: {}", e)))?,
            first_name: row.try_get("first_name")
                .map_err(|e| AppError::Database(format!("Failed to read user first name: {}", e)))?,
            last_name: row.try_get("last_name")
                .map_err(|e| AppError::Database(format!("Failed to read user last name: {}", e)))?,
            profile_image_url: row.try_get("profile_image_url")
                .map_err(|e| AppError::Database(format!("Failed to read user profile image URL: {}", e)))?,
            created_at: row.try_get("created_at")
                .map_err(|e| AppError::Database(format!("Failed to read user created at: {}", e)))?,
            updated_at: row.try_get("updated_at")
                .map_err(|e| AppError::Database(format!("Failed to read user updated at: {}", e)))?,
        })
    }
}