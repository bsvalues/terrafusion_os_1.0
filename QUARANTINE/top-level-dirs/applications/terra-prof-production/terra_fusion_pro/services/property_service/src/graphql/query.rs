use async_graphql::{Context, Object, Result};
use std::sync::Arc;
use uuid::Uuid;

use shared::db::Database;
use shared::error::AppError;

use crate::repository::property_repository::PropertyRepository;
use crate::service::property_service::PropertyService;
use super::types::{Property, PropertyQueryInput};

/// GraphQL query root
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get a property by ID
    async fn property(&self, ctx: &Context<'_>, id: Uuid) -> Result<Property> {
        let db = ctx.data::<Arc<Database>>().unwrap();
        let repository = PropertyRepository::new(db.clone());
        let service = PropertyService::new(repository);
        
        match service.find_property_by_id(id).await {
            Ok(property) => Ok(property.into()),
            Err(e) => Err(e.into()),
        }
    }
    
    /// Search for properties
    async fn properties(&self, ctx: &Context<'_>, query: PropertyQueryInput) -> Result<Vec<Property>> {
        let db = ctx.data::<Arc<Database>>().unwrap();
        let repository = PropertyRepository::new(db.clone());
        let service = PropertyService::new(repository);
        
        match service.find_properties(query.into()).await {
            Ok(properties) => Ok(properties.into_iter().map(|p| p.into()).collect()),
            Err(e) => Err(e.into()),
        }
    }
    
    /// Get all properties
    async fn all_properties(&self, ctx: &Context<'_>) -> Result<Vec<Property>> {
        let db = ctx.data::<Arc<Database>>().unwrap();
        let repository = PropertyRepository::new(db.clone());
        let service = PropertyService::new(repository);
        
        match service.get_all_properties().await {
            Ok(properties) => Ok(properties.into_iter().map(|p| p.into()).collect()),
            Err(e) => Err(e.into()),
        }
    }
}

/// Convert application errors to GraphQL errors
impl From<AppError> for async_graphql::Error {
    fn from(err: AppError) -> Self {
        async_graphql::Error::new(err.to_string())
            .extend_with(|_, e| {
                e.set("type", err.error_type());
                e.set("status", err.status_code());
            })
    }
}