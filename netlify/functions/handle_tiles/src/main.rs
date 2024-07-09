use aws_lambda_events::apigw::ApiGatewayProxyRequest;
use aws_lambda_events::event::apigw::ApiGatewayProxyResponse;
use board::board::{generate_solved_boards, return_tile, Boards, TileOrHashmap};
use http::HeaderMap;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use postgrest::Postgrest;
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;
use std::sync::OnceLock;

static SUPABASE_CLIENT: OnceLock<Postgrest> = OnceLock::new();

fn get_supabase_client() -> &'static Postgrest {
    SUPABASE_CLIENT.get_or_init(|| {
        Postgrest::new("https://dsuftvbhcbtcwoqhfdgj.supabase.co/rest/v1")
            .insert_header(
                "Authorization",
                format!(
                    "Bearer {}",
                    dotenv::var("SUPABASE_PRIVATE_API_KEY")
                        .expect("SUPABASE_PRIVATE_API_KEY must be set")
                ),
            )
            .insert_header(
                "apikey",
                dotenv::var("SUPABASE_PRIVATE_API_KEY")
                    .expect("SUPABASE_PRIVATE_API_KEY must be set"),
            )
    })
}

#[derive(Debug, Deserialize)]
struct Data {
    x: usize,
    y: usize,
    #[serde(rename = "roomId")]
    room_id: String,
}

#[derive(Debug, Deserialize)]
struct ServerBoard {
    id: u64,
    server_board: Option<Vec<Vec<i32>>>,
}

#[derive(Debug, Deserialize)]
struct Room {
    client_board: Option<Vec<Vec<i32>>>,
    serverboard: Option<ServerBoard>,
    revealed_tiles: usize,
}

async fn create_board_for_room(
    client: &Postgrest,
    room_id: &str,
    number_of_rows_columns: u32,
    safe_row: usize,
    safe_column: usize,
) -> (Vec<Vec<i32>>, Vec<Vec<i32>>) {
    let Boards {
        client_board,
        server_board,
    } = generate_solved_boards(number_of_rows_columns, safe_row, safe_column);

    let (_res1, _res2) = tokio::join!(
        client
            .from("rooms")
            .update(
                json!({
                    "client_board": client_board,
                })
                .to_string(),
            )
            .eq("id", room_id)
            .execute(),
        client
            .from("serverboard")
            .upsert(
                json!({
                    "server_board": server_board,
                    "id": room_id,
                })
                .to_string()
            )
            .eq("id", room_id)
            .execute()
    );

    (server_board, client_board)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv::dotenv().ok();

    let service_fn = service_fn(my_handler);
    let func = service_fn;

    lambda_runtime::run(func).await?;

    Ok(())
}

pub(crate) async fn my_handler(
    event: LambdaEvent<ApiGatewayProxyRequest>,
) -> Result<ApiGatewayProxyResponse, Error> {
    let body: Data = serde_json::from_str(&event.payload.body.unwrap_or_default())
        .map_err(|e| Error::from(format!("Failed to parse body: {}", e)))?;

    let Data { room_id, x, y } = body;

    let client = get_supabase_client();

    let response = client
        .from("rooms")
        .eq("id", &room_id)
        .select("client_board, serverboard(id, server_board), revealed_tiles")
        .single()
        .execute()
        .await?;

    let room: Room = serde_json::from_str(&response.text().await?)?;

    let Room {
        mut client_board,
        serverboard,
        revealed_tiles,
    } = room;
    let mut server_board = serverboard.and_then(|a| a.server_board);
    /* let player = players.is_some_and(|map| map.get(session_id_option.unwrap().value()).is_some());

    if !player {
        let res = quick_response(404);

        return Ok(res);
        } */
    if server_board.is_none() || client_board.is_none() {
        let (server, client) = create_board_for_room(&client, &room_id, 12, x, y).await;

        server_board = Some(server);
        client_board = Some(client);
    }
    let mut client_board = client_board.unwrap();

    let returned_tile = return_tile(&server_board.unwrap(), &mut client_board, x, y);

    let increment_by = match &returned_tile {
        TileOrHashmap::Hashmap(map) => map.len(),
        TileOrHashmap::Tile(_) => 1,
    };

    /* client
    .from("rooms")
    .update(
        json!({
            "revealed_tiles": revealed_tiles + increment_by,
            "client_board": client_board,
        })
        .to_string(),
    )
    .eq("id", &room_id)
    .execute()
    .await?; */

    let resp = ApiGatewayProxyResponse {
        status_code: 200,
        headers: HeaderMap::new(),
        multi_value_headers: HeaderMap::new(),
        body: None,
        is_base64_encoded: false,
    };

    Ok(resp)
}
