use actix_web::{web, HttpResponse, Responder, get, post, put, delete};
use shared::{models::property::{Property, CreatePropertyRequest, PropertyQuery}, error::AppError};
use std::sync::Arc;
use uuid::Uuid;

use crate::service::property_service::PropertyService;
use crate::repository::property_repository::PropertyRepository;
use shared::db::Database;

/// Configure property routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/properties")
            .service(get_properties)
            .service(get_property_by_id)
            .service(create_property)
            .service(update_property)
            .service(delete_property)
    );
}

/// Get a list of properties
#[get("")]
async fn get_properties(
    db: web::Data<Arc<Database>>,
    query: web::Query<PropertyQuery>,
) -> impl Responder {
    let repo = PropertyRepository::new(db.clone());
    let service = PropertyService::new(repo);
    
    match service.find_properties(query.into_inner()).await {
        Ok(properties) => HttpResponse::Ok().json(properties),
        Err(err) => {
            log::error!("Error finding properties: {:?}", err);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": err.to_string(),
                "error_type": err.error_type()
            }))
        }
    }
}

/// Get a property by ID
#[get("/{id}")]
async fn get_property_by_id(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid property ID format",
                "error_type": "validation_error"
            }));
        }
    };
    
    let repo = PropertyRepository::new(db.clone());
    let service = PropertyService::new(repo);
    
    match service.find_property_by_id(id).await {
        Ok(property) => HttpResponse::Ok().json(property),
        Err(err) => {
            match err {
                AppError::NotFound(_) => HttpResponse::NotFound().json(serde_json::json!({
                    "error": err.to_string(),
                    "error_type": err.error_type()
                })),
                _ => {
                    log::error!("Error finding property: {:?}", err);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": err.to_string(),
                        "error_type": err.error_type()
                    }))
                }
            }
        }
    }
}

/// Create a new property
#[post("")]
async fn create_property(
    db: web::Data<Arc<Database>>,
    property_req: web::Json<CreatePropertyRequest>,
) -> impl Responder {
    let repo = PropertyRepository::new(db.clone());
    let service = PropertyService::new(repo);
    
    match service.create_property(property_req.into_inner()).await {
        Ok(property) => HttpResponse::Created().json(property),
        Err(err) => {
            log::error!("Error creating property: {:?}", err);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": err.to_string(),
                "error_type": err.error_type()
            }))
        }
    }
}

/// Update a property
#[put("/{id}")]
async fn update_property(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>,
    property_req: web::Json<CreatePropertyRequest>,
) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid property ID format",
                "error_type": "validation_error"
            }));
        }
    };
    
    let repo = PropertyRepository::new(db.clone());
    let service = PropertyService::new(repo);
    
    match service.update_property(id, property_req.into_inner()).await {
        Ok(property) => HttpResponse::Ok().json(property),
        Err(err) => {
            match err {
                AppError::NotFound(_) => HttpResponse::NotFound().json(serde_json::json!({
                    "error": err.to_string(),
                    "error_type": err.error_type()
                })),
                _ => {
                    log::error!("Error updating property: {:?}", err);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": err.to_string(),
                        "error_type": err.error_type()
                    }))
                }
            }
        }
    }
}

/// Delete a property
#[delete("/{id}")]
async fn delete_property(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid property ID format",
                "error_type": "validation_error"
            }));
        }
    };
    
    let repo = PropertyRepository::new(db.clone());
    let service = PropertyService::new(repo);
    
    match service.delete_property(id).await {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(err) => {
            match err {
                AppError::NotFound(_) => HttpResponse::NotFound().json(serde_json::json!({
                    "error": err.to_string(),
                    "error_type": err.error_type()
                })),
                _ => {
                    log::error!("Error deleting property: {:?}", err);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": err.to_string(),
                        "error_type": err.error_type()
                    }))
                }
            }
        }
    }
}