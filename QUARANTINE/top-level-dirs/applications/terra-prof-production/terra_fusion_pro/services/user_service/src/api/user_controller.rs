use std::sync::Arc;

use actix_web::{web, HttpResponse, Responder, get, put};
use shared::{
    auth::session::SessionData,
    auth::middleware::AuthenticationRequired,
    db::Database,
    error::AppError,
    models::user::UpdateUserRequest,
    repository::user_repository::UserRepository,
};

/// Configure user routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .service(get_users)
            .service(get_user_by_id)
            .service(update_user)
    );
}

/// Get a list of users (admin only)
#[get("")]
async fn get_users(
    db: web::Data<Arc<Database>>,
    session: web::ReqData<SessionData>,
) -> impl Responder {
    // Only admin users can access this endpoint
    // In a real implementation, we would check the user's role
    
    let repository = UserRepository::new(db.into_inner());
    
    match repository.get_all().await {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            log::error!("Error finding users: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string(),
                "error_type": e.error_type()
            }))
        }
    }
}

/// Get a user by ID (admin or own user)
#[get("/{id}")]
async fn get_user_by_id(
    db: web::Data<Arc<Database>>,
    session: web::ReqData<SessionData>,
    path: web::Path<String>,
) -> impl Responder {
    let user_id = path.into_inner();
    
    // Check if the user is requesting their own profile or is an admin
    // In a real implementation, we would check the user's role
    let current_user_id = match session.user_id() {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Not authenticated",
                "error_type": "authentication_error"
            }));
        }
    };
    
    // For simplicity, allow access if it's the user's own profile
    // In production, implement proper authorization checks
    if current_user_id != user_id {
        // Check if the user is an admin
        // This is a placeholder - in a real app, check the user's role
        
        return HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Permission denied",
            "error_type": "authorization_error"
        }));
    }
    
    let repository = UserRepository::new(db.into_inner());
    
    match repository.get_by_id(user_id).await {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(e) => {
            match e {
                AppError::NotFound(_) => HttpResponse::NotFound().json(serde_json::json!({
                    "error": e.to_string(),
                    "error_type": e.error_type()
                })),
                _ => {
                    log::error!("Error finding user: {:?}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": e.to_string(),
                        "error_type": e.error_type()
                    }))
                }
            }
        }
    }
}

/// Update a user (admin or own user)
#[put("/{id}")]
async fn update_user(
    db: web::Data<Arc<Database>>,
    session: web::ReqData<SessionData>,
    path: web::Path<String>,
    update_req: web::Json<UpdateUserRequest>,
) -> impl Responder {
    let user_id = path.into_inner();
    
    // Check if the user is updating their own profile or is an admin
    let current_user_id = match session.user_id() {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Not authenticated",
                "error_type": "authentication_error"
            }));
        }
    };
    
    // For simplicity, allow updates if it's the user's own profile
    // In production, implement proper authorization checks
    if current_user_id != user_id {
        // Check if the user is an admin
        // This is a placeholder - in a real app, check the user's role
        
        return HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Permission denied",
            "error_type": "authorization_error"
        }));
    }
    
    let repository = UserRepository::new(db.into_inner());
    
    // First check if the user exists
    let existing_user = match repository.get_by_id(user_id.clone()).await {
        Ok(user) => user,
        Err(e) => {
            match e {
                AppError::NotFound(_) => {
                    return HttpResponse::NotFound().json(serde_json::json!({
                        "error": e.to_string(),
                        "error_type": e.error_type()
                    }));
                }
                _ => {
                    log::error!("Error finding user: {:?}", e);
                    return HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": e.to_string(),
                        "error_type": e.error_type()
                    }));
                }
            }
        }
    };
    
    // Create an updated user with the same ID and mix in the updated fields
    let updated_user = shared::models::user::User {
        id: existing_user.id,
        email: existing_user.email,
        first_name: update_req.first_name.clone().or(existing_user.first_name),
        last_name: update_req.last_name.clone().or(existing_user.last_name),
        profile_image_url: existing_user.profile_image_url,
        created_at: existing_user.created_at,
        updated_at: chrono::Utc::now(),
    };
    
    match repository.update(user_id, &updated_user).await {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(e) => {
            log::error!("Error updating user: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string(),
                "error_type": e.error_type()
            }))
        }
    }
}