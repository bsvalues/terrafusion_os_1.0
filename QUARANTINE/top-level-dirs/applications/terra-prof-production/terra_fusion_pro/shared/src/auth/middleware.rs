use std::future::{ready, Ready};
use std::rc::Rc;
use std::sync::Arc;

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use chrono::Utc;
use futures_util::future::LocalBoxFuture;

use super::replit_auth::ReplitAuth;
use super::session::SessionData;

/// Middleware for authentication check
pub struct AuthenticationMiddleware {
    auth: Arc<ReplitAuth>,
}

impl AuthenticationMiddleware {
    /// Create a new authentication middleware
    pub fn new(auth: Arc<ReplitAuth>) -> Self {
        Self { auth }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthenticationMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthenticationMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticationMiddlewareService {
            service: Rc::new(service),
            auth: self.auth.clone(),
        }))
    }
}

/// Authentication middleware service
pub struct AuthenticationMiddlewareService<S> {
    service: Rc<S>,
    auth: Arc<ReplitAuth>,
}

impl<S, B> Service<ServiceRequest> for AuthenticationMiddlewareService<S>
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
        let srv = self.service.clone();
        let auth = self.auth.clone();

        Box::pin(async move {
            // Get session data from the request
            let mut session_data = req
                .get_session()
                .get::<SessionData>("session_data")
                .unwrap_or_else(|_| Some(SessionData::new()))
                .unwrap_or_else(SessionData::new);

            // Check if the user is authenticated and the token is still valid
            if let Some(user_session) = &session_data.user_session {
                let now = Utc::now().timestamp();
                
                // If the token is expired, try to refresh it
                if now > user_session.expires_at {
                    // Refresh token logic would go here
                    // This is simplified for the example
                    if let Some(refresh_token) = session_data.user_session.as_ref().map(|s| &s.refresh_token) {
                        match auth.refresh_token(refresh_token).await {
                            Ok(tokens) => {
                                // Update session with new tokens
                                if let Some(user_session) = &mut session_data.user_session {
                                    user_session.access_token = tokens.access_token;
                                    user_session.refresh_token = tokens.refresh_token;
                                    user_session.expires_at = now + tokens.expires_in;
                                    
                                    // Save updated session
                                    req.get_session().insert("session_data", session_data.clone()).ok();
                                }
                            },
                            Err(_) => {
                                // If refresh fails, clear the session
                                session_data = SessionData::new();
                                req.get_session().remove("session_data");
                            }
                        }
                    }
                }
            }
            
            // Add session data to request extensions for use in handlers
            req.extensions_mut().insert(session_data);
            
            let res = srv.call(req).await?;
            Ok(res)
        })
    }
}

/// Extractor for requiring authentication
pub struct AuthenticationRequired;

impl<S, B> Transform<S, ServiceRequest> for AuthenticationRequired
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthenticationRequiredService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticationRequiredService {
            service: Rc::new(service),
        }))
    }
}

/// Authentication required middleware service
pub struct AuthenticationRequiredService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthenticationRequiredService<S>
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
        let srv = self.service.clone();

        Box::pin(async move {
            // Get session data from request extensions
            if let Some(session_data) = req.extensions().get::<SessionData>() {
                if session_data.is_authenticated() {
                    let res = srv.call(req).await?;
                    return Ok(res);
                }
            }
            
            // If not authenticated, redirect to login
            let res = req.into_response(
                actix_web::HttpResponse::Found()
                    .append_header(("Location", "/auth/login"))
                    .finish()
                    .into_body(),
            );
            
            Ok(res)
        })
    }
}