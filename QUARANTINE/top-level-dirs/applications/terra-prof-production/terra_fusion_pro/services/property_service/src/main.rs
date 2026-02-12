mod api;
mod repository;
mod service;
mod graphql;

use actix_web::{web, App, HttpServer, middleware, HttpResponse};
use dotenv::dotenv;
use shared::{config::Config, db::Database};
use std::sync::Arc;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize environment
    dotenv().ok();
    env_logger::init();
    let config = Config::from_env();
    
    // Initialize database connection
    let database = Database::new(&config.database.url)
        .await
        .expect("Failed to connect to database");
        
    if config.database.run_migrations {
        database.run_migrations()
            .await
            .expect("Failed to run database migrations");
    }
    
    let db = Arc::new(database);
    
    // Set up GraphQL schema
    let schema = graphql::create_schema(db.clone());
    
    // Create and start the HTTP server
    log::info!("Starting Property Service on {}:{}", config.server.host, config.server.port);
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(schema.clone()))
            // Add logging middleware
            .wrap(middleware::Logger::default())
            // Add health check endpoint
            .route("/health", web::get().to(health_check))
            // Add API routes
            .service(
                web::scope("/api/v1")
                    .configure(api::configure_routes)
            )
            // Add GraphQL endpoint
            .service(
                web::scope("/graphql")
                    .configure(graphql::configure_routes)
            )
    })
    .bind((config.server.host, config.server.port))?
    .run()
    .await
}

/// Health check endpoint
async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "property-service"
    }))
}
