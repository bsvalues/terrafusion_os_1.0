mod api;
mod service;
mod repository;
mod graphql;
mod auth;

use std::sync::Arc;

use actix_cors::Cors;
use actix_session::CookieSession;
use actix_web::{web, App, HttpServer, middleware};

use shared::{
    auth::{
        middleware::AuthenticationMiddleware,
        replit_auth::ReplitAuth,
    },
    db::Database,
    config::Config,
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");
    
    // Initialize database
    let db = Arc::new(Database::connect(&config.database_url).await.expect("Failed to connect to database"));
    log::info!("Connected to database");
    
    // Initialize Replit Auth
    let replit_auth_config = shared::auth::replit_auth::ReplitAuthConfig {
        client_id: config.replit_auth.client_id.clone(),
        domain: config.replit_auth.domain.clone(),
        discovery_url: "https://replit.com/oidc".to_string(),
    };
    let replit_auth = Arc::new(ReplitAuth::new(replit_auth_config));
    log::info!("Initialized Replit Auth");
    
    // Create GraphQL schema
    let schema = web::Data::new(graphql::create_schema(db.clone(), replit_auth.clone()));
    
    // Start HTTP server
    log::info!("Starting user service on {}:{}", config.host, config.port);
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
            
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .wrap(middleware::NormalizePath::trim())
            .wrap(CookieSession::signed(&[0; 32]) // In production, use a proper key
                .secure(false)) // In production, set to true for HTTPS
            .wrap(AuthenticationMiddleware::new(replit_auth.clone()))
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(replit_auth.clone()))
            .app_data(schema.clone())
            .service(
                web::scope("/auth")
                    .configure(auth::auth_controller::configure_routes)
            )
            .service(
                web::scope("/api")
                    .configure(api::configure_routes)
            )
            .service(
                web::scope("/graphql")
                    .configure(graphql::configure_routes)
            )
            .service(
                web::resource("/health")
                    .route(web::get().to(|| async { "User service is healthy" }))
            )
    })
    .bind((config.host.as_str(), config.port))?
    .run()
    .await
}