use axum::Extension;
use socketioxide::{
    extract::{Data, Extension, SocketRef},
    SocketIo,
};

pub fn join_room(socket: SocketRef, io: &SocketIo) {
    socket.on("join_room", |socket: SocketRef, Data::<String>(room)| {});
}
