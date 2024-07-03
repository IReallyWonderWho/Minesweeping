use serde_json::json;
use tracing::info;
use tracing_subscriber::FmtSubscriber;
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    run(handler).await
}

pub async fn handler(request: Request) -> Result<Response<Body>, Error> {
    let body = request.body();

    let a = serde_json::from_str(body);

    info!("{:?}", body);

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(json!("Chicken butt").to_string().into())?)
}
