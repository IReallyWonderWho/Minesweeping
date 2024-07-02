use socketioxide::extract::{Data, SocketRef, State};
use tracing::info;

use crate::{redis_client::RedisClient, rooms::room_exists};

pub fn join_room(socket: &SocketRef) {
    socket.on(
        "join_room",
        |socket: SocketRef, Data::<String>(room_id), State::<RedisClient>(client)| async move {
            info!("HI!");
            info!("{:?}", room_id);
            let room = room_exists(&client, &room_id).await;

            info!("{:?}", room);
            if room {
                info!("You joined!");
                let _ = socket.join(format!("roomId/{}", room_id));
                let _ = socket.emit("joined_room", room_id);
                return;
            }

            let _ = socket.emit("error", "Room not found");
        },
    );
}
