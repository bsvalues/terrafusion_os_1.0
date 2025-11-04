use async_graphql::{SimpleObject, InputObject};
use chrono::{DateTime, Utc};

/// GraphQL representation of a user
#[derive(SimpleObject)]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub profile_image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Input type for updating a user
#[derive(InputObject)]
pub struct UpdateUserInput {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

/// Conversion functions between GraphQL and domain model types
impl From<shared::models::user::User> for User {
    fn from(u: shared::models::user::User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            profile_image_url: u.profile_image_url,
            created_at: u.created_at,
            updated_at: u.updated_at,
        }
    }
}

impl From<UpdateUserInput> for shared::models::user::UpdateUserRequest {
    fn from(input: UpdateUserInput) -> Self {
        Self {
            first_name: input.first_name,
            last_name: input.last_name,
        }
    }
}