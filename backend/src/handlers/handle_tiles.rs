use std::future::Future;

use http::HeaderValue;
use socketioxide::extract::{Data, SocketRef, State};
use tracing::info;

use crate::{
    board::board::{return_tile, Boards, TileOrHashmap},
    handlers::Auth,
    redis_client::RedisClient,
    rooms::{
        create_board_for_room, get_boards, get_player, get_revealed_tiles, get_room, room_exists,
        set_boards, set_revealed_tiles,
    },
};

use super::{get_session_id, is_session_valid};

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

            info!("{:?}", player);
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
            let increment_by = if let TileOrHashmap::Hashmap(map) = returned_tile {
                map.len()
            } else {
                1
            };

            // TODO add game over

            set_boards(&client, &room_id, &Boards {
                client_board,
                server_board,
            }).await;
            set_revealed_tiles(&client, &room_id, number_of_tiles + increment_by).await;

            // "x" in returned_tile ? returned_tile : Object.fromEntries(returned_tile),
            socket.broadcast().emit("board_updated", )
        },
    )
}
