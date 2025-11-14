//! TerraFusion OS Core Library
//! Elite Government Operating System Components

pub mod config;
pub mod database;
pub mod auth;
pub mod handlers;
pub mod models;
pub mod services;
pub mod middleware;

pub use config::Config;
pub use database::DatabaseService;
pub use auth::{Claims, AuthService};
pub use models::*;
pub use services::*;

/// TerraFusion OS Core Library Constants
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const NAME: &str = env!("CARGO_PKG_NAME");
pub const DESCRIPTION: &str = env!("CARGO_PKG_DESCRIPTION");

/// Championship exports for government applications
pub mod prelude {
    pub use crate::{
        Config, DatabaseService, Claims, AuthService,
        CountyService, PropertyService, AssessmentService,
        County, Property, PropertyAssessment, SystemHealth,
    };
}
