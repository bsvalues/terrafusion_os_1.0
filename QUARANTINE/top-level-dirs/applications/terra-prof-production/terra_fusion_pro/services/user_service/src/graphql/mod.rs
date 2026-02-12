use std::sync::Arc;

use actix_web::{web, HttpResponse};
use async_graphql::{EmptySubscription, Schema};
use async_graphql_actix_web::{GraphQLRequest, GraphQLResponse};

use shared::{db::Database, ReplitAuth};

mod query;
mod mutation;
mod types;

use query::QueryRoot;
use mutation::MutationRoot;

pub type UserSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

/// Create GraphQL schema with database connection
pub fn create_schema(db: Arc<Database>, auth: Arc<ReplitAuth>) -> UserSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(db)
        .data(auth)
        .finish()
}

/// Configure GraphQL routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("")
            .route(web::post().to(graphql_handler))
            .route(web::get().to(graphql_playground))
    );
}

/// Handle GraphQL requests
async fn graphql_handler(
    schema: web::Data<UserSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

/// GraphQL playground UI
async fn graphql_playground() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(
            async_graphql::http::playground_source(
                async_graphql::http::GraphQLPlaygroundConfig::new("/graphql")
            )
        )
}