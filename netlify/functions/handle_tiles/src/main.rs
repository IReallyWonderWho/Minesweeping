use aws_lambda_events::apigw::ApiGatewayProxyRequest;
use aws_lambda_events::encodings::Body;
use aws_lambda_events::event::apigw::ApiGatewayProxyResponse;
use board::board::generate_solved_boards;
use http::header::HeaderMap;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use postgrest::Postgrest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{error, info};
use tracing_subscriber::FmtSubscriber;
use util::{decode, encode, get_session_id};

#[derive(Debug, Deserialize)]
struct Data {
    x: usize,
    y: usize,
    #[serde(rename = "roomId")]
    room_id: String,
}

#[derive(Debug, Deserialize)]
struct Room {
    client_board: Option<Vec<Vec<i32>>>,
    server_board: Option<Vec<Vec<i32>>>,
    revealed_tiles: u32,
    players: HashMap<String, Player>,
}

#[derive(Debug, Deserialize)]
struct Player {
    x: f32,
    y: f32,
    color: String,
}

fn quick_response(status_code: i64) -> ApiGatewayProxyResponse {
    ApiGatewayProxyResponse {
        status_code,
        headers: HeaderMap::new(),
        multi_value_headers: HeaderMap::new(),
        body: None,
        is_base64_encoded: false,
    }
}

fn create_board_for_room(
    client: &Postgrest,
    room_id: u64,
    number_of_rows_columns: u32,
    safe_row: usize,
    safe_column: usize,
) {
    info!("Generating boards!");

    let boards = generate_solved_boards(number_of_rows_columns, safe_row, safe_column);

    client.from("rooms").eq("id", room_id)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let service_fn = service_fn(my_handler);
    let func = service_fn;

    lambda_runtime::run(func).await?;

    Ok(())
}

pub(crate) async fn my_handler(
    event: LambdaEvent<ApiGatewayProxyRequest>,
) -> Result<ApiGatewayProxyResponse, Error> {
    let client = Postgrest::new("https://dsuftvbhcbtcwoqhfdgj.supabase.co/rest/v1")
        .insert_header("apikey", dotenv::var("SUPABASE_PUBLIC_API_KEY").unwrap());
    let cookies = event.payload.headers.get("cookie");
    let session_id_option = get_session_id(cookies);

    let body: Result<Data, serde_json::Error> =
        serde_json::from_str(&event.payload.body.unwrap_or("".to_string()));

    if body.is_err() || session_id_option.is_none() {
        let resp = quick_response(400);

        return Ok(resp);
    }

    let Data { room_id, x, y } = body.unwrap();
    let room_id = encode(&room_id.to_lowercase()).to_string();

    let data_result = client
        .from("rooms")
        .eq("id", room_id)
        .select("*")
        .single()
        .execute()
        .await;

    // Log any errors that may happen when fetching data from supabase
    if let Err(err) = data_result {
        error!(
            "An unexpected error occured while fetching room data: {:?}",
            err
        );

        let resp = quick_response(500);

        return Ok(resp);
    }

    let Room {
        players,
        client_board,
        server_board,
        revealed_tiles,
    } = serde_json::from_str(&data_result.unwrap().text().await.unwrap()).unwrap();
    let player = players.get(session_id_option.unwrap().value());

    if player.is_none() {
        let res = quick_response(404);

        return Ok(res);
    }

    let resp = ApiGatewayProxyResponse {
        status_code: 200,
        headers: HeaderMap::new(),
        multi_value_headers: HeaderMap::new(),
        body: Some(Body::Text(format!("Hello from {}", "HI"))),
        is_base64_encoded: false,
    };

    Ok(resp)
}
