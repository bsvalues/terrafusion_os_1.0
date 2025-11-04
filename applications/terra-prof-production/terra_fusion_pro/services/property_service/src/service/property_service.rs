use chrono::Utc;
use shared::error::AppResult;
use shared::models::property::{Property, CreatePropertyRequest, PropertyQuery};
use uuid::Uuid;

use crate::repository::property_repository::PropertyRepository;

/// Property service for handling business logic
pub struct PropertyService {
    repository: PropertyRepository,
}

impl PropertyService {
    /// Create a new property service
    pub fn new(repository: PropertyRepository) -> Self {
        Self { repository }
    }
    
    /// Find properties based on search criteria
    pub async fn find_properties(&self, query: PropertyQuery) -> AppResult<Vec<Property>> {
        self.repository.find_properties(query).await
    }
    
    /// Find a property by ID
    pub async fn find_property_by_id(&self, id: Uuid) -> AppResult<Property> {
        self.repository.get_by_id(id).await
    }
    
    /// Create a new property
    pub async fn create_property(&self, request: CreatePropertyRequest) -> AppResult<Property> {
        let now = Utc::now();
        let id = Uuid::new_v4();
        
        let property = Property {
            id,
            address: request.address,
            characteristics: request.characteristics,
            valuation: request.valuation,
            created_at: now,
            updated_at: now,
        };
        
        self.repository.create(&property).await
    }
    
    /// Update an existing property
    pub async fn update_property(&self, id: Uuid, request: CreatePropertyRequest) -> AppResult<Property> {
        // First check if the property exists
        let existing = self.repository.get_by_id(id).await?;
        
        // Create updated property with same ID and creation time
        let property = Property {
            id,
            address: request.address,
            characteristics: request.characteristics,
            valuation: request.valuation,
            created_at: existing.created_at,
            updated_at: Utc::now(),
        };
        
        self.repository.update(id, &property).await
    }
    
    /// Delete a property
    pub async fn delete_property(&self, id: Uuid) -> AppResult<()> {
        // Check if the property exists first (will return NotFound error if it doesn't)
        self.repository.get_by_id(id).await?;
        
        self.repository.delete(id).await
    }
    
    /// Get all properties
    pub async fn get_all_properties(&self) -> AppResult<Vec<Property>> {
        self.repository.get_all().await
    }
}