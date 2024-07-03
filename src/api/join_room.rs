use serde::Deserialize;
use serde_json::json;
use tracing::info;
use tracing_subscriber::FmtSubscriber;
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};

#[derive(Debug, Deserialize)]
struct Data {
    #[serde(rename = "room_id")]
    pub room_id: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    run(handler).await
}

pub async fn handler(request: Request) -> Result<Response<Body>, Error> {
    let body = if let Body::Text(body) = request.body() {
        Some(body)
    } else {
        None
    };

    if let None = body {
        return Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .body(json!("Body not found").to_string().into())?);
    }

    let body: Result<Data, _> = serde_json::from_str(body.unwrap());

    info!("{:?}", body);

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(json!("Chicken butt").to_string().into())?)
}
