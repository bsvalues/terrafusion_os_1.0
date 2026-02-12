use actix_session::{Session, SessionGetError};
use serde::{Deserialize, Serialize};

use super::replit_auth::UserSession;

/// Session data stored in cookies or database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    /// User session with tokens and claims
    pub user_session: Option<UserSession>,
    /// Original URL for post-login redirect
    pub original_url: Option<String>,
}

impl SessionData {
    /// Create a new empty session data
    pub fn new() -> Self {
        Self {
            user_session: None,
            original_url: None,
        }
    }
    
    /// Check if the user is authenticated
    pub fn is_authenticated(&self) -> bool {
        self.user_session.is_some()
    }
    
    /// Get the user ID from the session
    pub fn user_id(&self) -> Option<String> {
        self.user_session.as_ref().map(|s| s.claims.sub.clone())
    }
}

/// Session extension methods
pub trait SessionExt {
    /// Store session data
    fn store_session_data(&self, data: &SessionData) -> Result<(), SessionGetError>;
    
    /// Clear session data
    fn clear_session_data(&self) -> Result<(), SessionGetError>;
}

/// Session extension methods for Actix session
pub trait SessionExt2 {
    /// Get user from session
    fn user(&self) -> Result<Option<UserSession>, SessionGetError>;
    
    /// Set user in session
    fn set_user(&self, user: UserSession) -> Result<(), SessionGetError>;
    
    /// Remove user from session
    fn remove_user(&self) -> Result<(), SessionGetError>;
}

impl SessionExt for Session {
    fn store_session_data(&self, data: &SessionData) -> Result<(), SessionGetError> {
        self.insert("session_data", data)
    }
    
    fn clear_session_data(&self) -> Result<(), SessionGetError> {
        self.remove("session_data");
        Ok(())
    }
}

impl SessionExt2 for Session {
    fn user(&self) -> Result<Option<UserSession>, SessionGetError> {
        let data: Option<SessionData> = self.get("session_data")?;
        Ok(data.and_then(|d| d.user_session))
    }
    
    fn set_user(&self, user: UserSession) -> Result<(), SessionGetError> {
        let mut data = self.get::<SessionData>("session_data")?
            .unwrap_or_else(SessionData::new);
        data.user_session = Some(user);
        self.insert("session_data", data)
    }
    
    fn remove_user(&self) -> Result<(), SessionGetError> {
        let mut data = self.get::<SessionData>("session_data")?
            .unwrap_or_else(SessionData::new);
        data.user_session = None;
        self.insert("session_data", data)
    }
}