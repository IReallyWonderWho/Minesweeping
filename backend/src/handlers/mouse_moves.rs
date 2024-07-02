use serde::Serialize;
use serde_json::json;
use socketioxide::extract::{Data, SocketRef, State};

use crate::{
    redis_client::RedisClient,
    rooms::{get_player, Player},
};

use super::{get_session_id, Auth};

#[derive(Debug, Serialize)]
struct PlayerReturn {
    nickname: String,
    color: String,
    x: f32,
    y: f32,
}

pub fn mouse_moves(socket: &SocketRef, auth: Auth) {
    socket.on(
        "mouse_move",
        |socket: SocketRef, Data::<(f32, f32)>((x, y)), State::<RedisClient>(client)| async move {
            let room_option = auth.room_id;

            if let None = room_option {
                socket.emit("error", "Room Id not found").ok();
                return;
            }

            let room_id = room_option.unwrap();

            let cookies = socket.req_parts().headers.get("cookie");
            let session_id_option = get_session_id(cookies);

            if let None = session_id_option {
                socket.emit("error", "Session Id not found").ok();
                return;
            }

            let session_id = session_id_option.unwrap();
            let player = get_player(&client, &room_id, session_id.value()).await;

            if let Err(_) = player {
                socket.emit("error", "Player not found").ok();
                return;
            }

            let Player { nickname, color } = player.unwrap();

            socket
                .within(format!("roomId/{}", room_id))
                .emit(
                    "update_player_mouse",
                    json!(PlayerReturn {
                        nickname,
                        color,
                        x,
                        y
                    }),
                )
                .ok();
        },
    );
}
