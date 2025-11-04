use std::future::{ready, Ready};
use std::rc::Rc;

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header,
    Error, HttpMessage,
};
use futures_util::future::LocalBoxFuture;

use super::jwt::JwtUtil;

/// Middleware for service-to-service authentication
pub struct ServiceAuthMiddleware {
    jwt_util: Rc<JwtUtil>,
    service_name: String,
}

impl ServiceAuthMiddleware {
    /// Create a new service auth middleware
    pub fn new(jwt_util: JwtUtil, service_name: String) -> Self {
        Self {
            jwt_util: Rc::new(jwt_util),
            service_name,
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for ServiceAuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = ServiceAuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(ServiceAuthMiddlewareService {
            service: Rc::new(service),
            jwt_util: self.jwt_util.clone(),
            service_name: self.service_name.clone(),
        }))
    }
}

/// Service auth middleware service
pub struct ServiceAuthMiddlewareService<S> {
    service: Rc<S>,
    jwt_util: Rc<JwtUtil>,
    service_name: String,
}

impl<S, B> Service<ServiceRequest> for ServiceAuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let jwt_util = self.jwt_util.clone();
        let service_name = self.service_name.clone();

        Box::pin(async move {
            // Check for Authorization header
            let auth_header = req
                .headers()
                .get(header::AUTHORIZATION)
                .ok_or_else(|| ErrorUnauthorized("Missing Authorization header"))?;
                
            let auth_str = auth_header
                .to_str()
                .map_err(|_| ErrorUnauthorized("Invalid Authorization header"))?;
                
            if !auth_str.starts_with("Bearer ") {
                return Err(ErrorUnauthorized("Invalid Authorization scheme"));
            }
            
            let token = &auth_str[7..];
            
            // Validate token for this service
            let claims = jwt_util
                .validate_token_for_audience(token, &service_name)
                .map_err(|e| ErrorUnauthorized(format!("Invalid token: {}", e)))?;
                
            // Add service claims to request extensions
            req.extensions_mut().insert(claims);
            
            // Call the next service
            service.call(req).await
        })
    }
}