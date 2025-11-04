pub mod auth;
pub mod models;
pub mod error;
pub mod db;
pub mod config;
pub mod repository;
pub mod utils;

// Re-export common types for convenience
pub use auth::replit_auth::ReplitAuth;
pub use db::Database;
pub use error::{AppError, AppResult};
pub use config::Config;