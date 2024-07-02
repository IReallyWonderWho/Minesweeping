use cookie::Cookie;
use http::HeaderValue;
use serde::Deserialize;
use socketioxide::extract::{Data, SocketRef, State};
use std::error::Error;

use crate::{
    redis_client::RedisClient,
    rooms::{player_exists, room_exists, sync_player_exists},
};

pub mod handle_tiles;
pub mod join_room;

#[derive(Debug, Deserialize)]
pub struct Auth {
    #[serde(rename = "roomId")]
    pub room_id: Option<String>,
}

pub fn on_connect(socket: SocketRef, Data(auth): Data<Auth>) {
    join_room::join_room(&socket);
    handle_tiles::handle_tiles(&socket, auth);
}

pub fn get_session_id(cookies: Option<&HeaderValue>) -> Option<Cookie> {
    if cookies.is_none() {
        return None;
    }

    let cookie_result = Cookie::parse(cookies.unwrap().to_str().unwrap());

    if cookie_result.is_err() {
        return None;
    }

    Some(cookie_result.unwrap())
}

pub async fn is_session_valid<'a>(
    client: &RedisClient,
    session_id: &Option<Cookie<'a>>,
    room_id: &str,
) -> bool {
    if let Some(session_id) = session_id {
        let room_exists = room_exists(client, room_id).await;

        if !room_exists {
            return false;
        }

        return player_exists(client, room_id, session_id.value()).await;
    }

    false
}

pub fn authenticate_middleware(
    socket: SocketRef,
    Data(auth): Data<Auth>,
    State(client): State<RedisClient>,
) -> Result<(), String> {
    let cookies = socket.req_parts().headers.get("cookie");

    if let Some(cookies) = cookies {
        let session_id = Cookie::parse(cookies.to_str().unwrap());

        if let Ok(id) = session_id {
            if let Some(room_id) = auth.room_id {
                let player_result = sync_player_exists(&client, &room_id, id.value());

                if player_result {
                    return Ok(());
                }
            }
        }
    }

    Err(String::from("Invalid session id"))
}
