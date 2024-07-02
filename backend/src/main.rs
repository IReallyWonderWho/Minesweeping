use handlers::authenticate_middleware;
use rooms::create_room;
use socketioxide::{handler::ConnectHandler, SocketIo};
use tower::ServiceBuilder;
use tower_cookies::CookieManagerLayer;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::FmtSubscriber;

mod board;
mod handlers;
mod redis_client;
mod rooms;

use handlers::on_connect;
use redis_client::RedisClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let client = RedisClient::new();

    create_room(&client, Some(String::from("Never going to give your ip"))).await;

    let (layer, io) = SocketIo::builder().with_state(client).build_layer();

    io.ns("/", on_connect.with(authenticate_middleware));

    let app = axum::Router::new().layer(CookieManagerLayer::new()).layer(
        ServiceBuilder::new()
            .layer(CorsLayer::very_permissive())
            .layer(layer),
    );

    info!("Starting server");

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
