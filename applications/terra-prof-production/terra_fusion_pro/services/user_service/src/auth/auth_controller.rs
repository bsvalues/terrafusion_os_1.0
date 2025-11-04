use std::sync::Arc;

use actix_session::Session;
use actix_web::{web, HttpResponse, get, post, Responder, HttpRequest};
use rand::Rng;
use shared::{
    auth::{
        replit_auth::{ReplitAuth, UserSession},
        session::{SessionData, SessionExt2},
    },
    db::Database,
    error::{AppError, AppResult},
    repository::user_repository::UserRepository,
};
use uuid::Uuid;

/// Configure auth routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(login)
        .service(callback)
        .service(logout)
        .service(get_user)
        .service(get_user_profile);
}

/// Login route - redirects to Replit Auth login
#[get("/login")]
async fn login(
    replit_auth: web::Data<Arc<ReplitAuth>>,
    session: Session,
) -> impl Responder {
    // Generate a random state parameter for CSRF protection
    let state = uuid::Uuid::new_v4().to_string();
    
    // Store the state parameter in the session
    if let Err(e) = session.insert("auth_state", state.clone()) {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Session error: {}", e)
        }));
    }
    
    // Redirect to Replit Auth login
    let auth_url = replit_auth.config.auth_url(&state);
    
    HttpResponse::Found()
        .append_header(("Location", auth_url))
        .finish()
}

/// Callback route - handles the response from Replit Auth
#[get("/callback")]
async fn callback(
    req: HttpRequest,
    replit_auth: web::Data<Arc<ReplitAuth>>,
    db: web::Data<Arc<Database>>,
    session: Session,
    query: web::Query<CallbackQuery>,
) -> impl Responder {
    // Check for errors in the auth response
    if let Some(error) = &query.error {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": format!("Authentication error: {}", error),
            "error_description": query.error_description.clone().unwrap_or_default()
        }));
    }
    
    // Verify the authorization code is present
    let code = match &query.code {
        Some(code) => code,
        None => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Missing authorization code"
            }));
        }
    };
    
    // Verify the state parameter matches what we stored in the session
    let session_state: Option<String> = session.get("auth_state").unwrap_or(None);
    
    if session_state.is_none() || session_state.unwrap() != query.state {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid state parameter"
        }));
    }
    
    // Exchange the code for tokens
    let tokens = match replit_auth.exchange_code(code).await {
        Ok(tokens) => tokens,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Token exchange error: {}", e)
            }));
        }
    };
    
    // Decode and validate the ID token
    let claims = match replit_auth.decode_id_token(&tokens.id_token) {
        Ok(claims) => claims,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("ID token validation error: {}", e)
            }));
        }
    };
    
    // Create a user session
    let user_session = UserSession {
        claims: claims.clone(),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Utc::now().timestamp() + tokens.expires_in,
    };
    
    // Store the user session in the session data
    let mut session_data = SessionData::new();
    session_data.user_session = Some(user_session);
    
    if let Err(e) = session.store_session_data(&session_data) {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Session error: {}", e)
        }));
    }
    
    // Upsert the user in the database
    let user_repository = UserRepository::new(db.into_inner());
    let upsert_user = replit_auth.claims_to_user(&claims);
    
    match user_repository.upsert_user(&upsert_user).await {
        Ok(_) => {
            // Redirect to the original URL or default to the home page
            let redirect_url = session.get::<String>("original_url")
                .unwrap_or_else(|_| Some(String::from("/")))
                .unwrap_or_else(|| String::from("/"));
                
            HttpResponse::Found()
                .append_header(("Location", redirect_url))
                .finish()
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Database error: {}", e)
            }))
        }
    }
}

/// Logout route - clears the session and redirects to Replit Auth logout
#[get("/logout")]
async fn logout(
    replit_auth: web::Data<Arc<ReplitAuth>>,
    session: Session,
) -> impl Responder {
    // Clear the session
    if let Err(e) = session.clear_session_data() {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Session error: {}", e)
        }));
    }
    
    // Redirect to Replit Auth logout
    let redirect_uri = format!("https://{}", replit_auth.config.domain);
    let logout_url = replit_auth.config.end_session_url(&redirect_uri);
    
    HttpResponse::Found()
        .append_header(("Location", logout_url))
        .finish()
}

/// Get the current user
#[get("/user")]
async fn get_user(
    session: Session,
) -> impl Responder {
    // Get the session data
    let session_data = session.get::<SessionData>("session_data")
        .unwrap_or_else(|_| Some(SessionData::new()))
        .unwrap_or_else(SessionData::new);
        
    // Check if the user is authenticated
    if !session_data.is_authenticated() {
        return HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "Not authenticated"
        }));
    }
    
    // Return the user session
    HttpResponse::Ok().json(session_data.user_session)
}

/// Get the user profile
#[get("/profile")]
async fn get_user_profile(
    session: Session,
    db: web::Data<Arc<Database>>,
) -> impl Responder {
    // Get the session data
    let session_data = session.get::<SessionData>("session_data")
        .unwrap_or_else(|_| Some(SessionData::new()))
        .unwrap_or_else(SessionData::new);
        
    // Check if the user is authenticated
    if !session_data.is_authenticated() {
        return HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "Not authenticated"
        }));
    }
    
    // Get the user from the database
    let user_id = session_data.user_id().unwrap();
    let user_repository = UserRepository::new(db.into_inner());
    
    match user_repository.get_by_id(user_id).await {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(e) => {
            match e {
                AppError::NotFound(_) => HttpResponse::NotFound().json(serde_json::json!({
                    "error": "User not found"
                })),
                _ => HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Database error: {}", e)
                }))
            }
        }
    }
}

/// Callback query parameters
#[derive(serde::Deserialize)]
struct CallbackQuery {
    code: Option<String>,
    state: String,
    error: Option<String>,
    error_description: Option<String>,
}