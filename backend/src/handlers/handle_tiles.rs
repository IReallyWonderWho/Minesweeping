use serde_json::json;
use socketioxide::extract::{Data, SocketRef, State};

use crate::{
    board::board::{return_tile, Boards, TileOrHashmap},
    handlers::Auth,
    redis_client::RedisClient,
    rooms::{
        create_board_for_room, get_boards, get_player, get_revealed_tiles, get_room, room_exists,
        set_boards, set_revealed_tiles,
    },
};

use super::get_session_id;

pub fn handle_tiles(socket: &SocketRef, auth: Auth) {
    socket.on(
        "choose_tile",
        |socket: SocketRef,
         Data::<(usize, usize)>((x, y)),
         State::<RedisClient>(client)| async move {
            let room_option = auth.room_id;

            if let None = room_option {
                socket.emit("error", "Room Id not found").ok();
                return;
            }

            let room_id = room_option.unwrap();
            let room_result = room_exists(&client, &room_id).await;

            if !room_result {
                socket.emit("error", "Room not found").ok();
                return;
            }

            let cookies = socket.req_parts().headers.get("cookie");
            let session_id_option = get_session_id(cookies);

            if session_id_option.is_none() {
                socket.emit("error", "Session Id not found").ok();
                return;
            }

            let session_id = session_id_option.unwrap();
            let player = get_player(&client, &room_id, session_id.value()).await;

            if player.is_err() {
                socket.emit("error", "Player not found").ok();
                return;
            }

            let (boards_result, number_of_tiles_result) = tokio::join!(get_boards(&client, &room_id), get_revealed_tiles(&client, &room_id));
            let mut boards = boards_result.ok();
            let number_of_tiles = number_of_tiles_result.ok().unwrap_or(0);

            if boards.is_none() {
                boards = Some(create_board_for_room(&client, &room_id, 12, x, y).await);
            }

            let Boards { server_board, mut client_board } = boards.unwrap();

            let returned_tile = return_tile(&server_board, &mut client_board, x, y);

            let increment_by = match &returned_tile {
                TileOrHashmap::Hashmap(map) => {
                    map.len()
                }
                TileOrHashmap::Tile(_) => {
                    1
                }
            };

            // TODO add game over

            let new_boards = Boards {
                client_board,
                server_board
            };

            tokio::join!(set_boards(&client, &room_id, &new_boards), set_revealed_tiles(&client, &room_id, number_of_tiles + increment_by));

            socket.within(format!("roomId/{}", room_id)).emit("board_updated", json!(returned_tile)).ok();
        },
    )
}
