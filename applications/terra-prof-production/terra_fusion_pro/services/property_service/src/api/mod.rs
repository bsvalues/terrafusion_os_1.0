mod property_controller;

use actix_web::web;

/// Configure all routes for the API
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    property_controller::configure_routes(cfg);
}