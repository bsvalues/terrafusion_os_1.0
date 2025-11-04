use async_graphql::{Context, Object, Result};
use std::sync::Arc;
use uuid::Uuid;

use shared::db::Database;

use crate::repository::property_repository::PropertyRepository;
use crate::service::property_service::PropertyService;
use super::types::{Property, PropertyInput};

/// GraphQL mutation root
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Create a new property
    async fn create_property(&self, ctx: &Context<'_>, input: PropertyInput) -> Result<Property> {
        let db = ctx.data::<Arc<Database>>().unwrap();
        let repository = PropertyRepository::new(db.clone());
        let service = PropertyService::new(repository);
        
        match service.create_property(input.into()).await {
            Ok(property) => Ok(property.into()),
            Err(e) => Err(e.into()),
        }
    }
    
    /// Update an existing property
    async fn update_property(&self, ctx: &Context<'_>, id: Uuid, input: PropertyInput) -> Result<Property> {
        let db = ctx.data::<Arc<Database>>().unwrap();
        let repository = PropertyRepository::new(db.clone());
        let service = PropertyService::new(repository);
        
        match service.update_property(id, input.into()).await {
            Ok(property) => Ok(property.into()),
            Err(e) => Err(e.into()),
        }
    }
    
    /// Delete a property
    async fn delete_property(&self, ctx: &Context<'_>, id: Uuid) -> Result<bool> {
        let db = ctx.data::<Arc<Database>>().unwrap();
        let repository = PropertyRepository::new(db.clone());
        let service = PropertyService::new(repository);
        
        match service.delete_property(id).await {
            Ok(_) => Ok(true),
            Err(e) => Err(e.into()),
        }
    }
}