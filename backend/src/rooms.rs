use crate::{
    board::board::{generate_solved_boards, Boards},
    redis_client::RedisClient,
};
use chrono::{DateTime, Utc};
use rand::Rng;
use redis::RedisError;
use redis_macros::FromRedisValue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use tracing::info;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRedisValue)]
pub struct Room {
    boards: Option<(Vec<Vec<i32>>, Vec<Vec<i32>>)>,
    number_of_revealed_tiles: u32,
    time_started: u64,
}

#[derive(Debug, Serialize, Deserialize, FromRedisValue)]
pub struct Player {
    pub nickname: String,
    pub color: String,
}

fn get_random_hsl() -> String {
    let h = rand::thread_rng().gen_range(1..360);
    let s = rand::thread_rng().gen_range(30..100);
    let l = rand::thread_rng().gen_range(30..60);

    format!("hsl({},{},{})", h, s, l)
}

fn generate_random_string(length: usize) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();

    (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

pub async fn create_room(client: &RedisClient, custom_room_id: Option<String>) -> String {
    let room_id = custom_room_id.unwrap_or_else(|| generate_random_string(8));
    let redis_player_key = format!("roomId/{}/players", room_id);
    let redis_room_key = format!("roomId/{}", room_id);

    let del1 = client.del(&redis_player_key);
    let del2 = client.del(&redis_room_key);

    let (_1, _2) = tokio::join!(del1, del2);

    set_revealed_tiles(client, &room_id.to_string(), 0).await;

    room_id
}

pub async fn create_board_for_room(
    client: &RedisClient,
    room_id: &str,
    number_of_rows_columns: u32,
    safe_row: usize,
    safe_column: usize,
) -> Boards {
    info!("Generating boards!");

    let boards = generate_solved_boards(number_of_rows_columns, safe_row, safe_column);

    tokio::join!(
        set_boards(client, room_id, &boards),
        set_time(client, room_id, Utc::now())
    );

    boards
}

pub async fn set_boards(client: &RedisClient, room_id: &str, boards: &Boards) {
    client
        .hset(&format!("roomId/{}", room_id), "boards", boards)
        .await
        .unwrap();
}

pub async fn get_boards(client: &RedisClient, room_id: &str) -> Result<Boards, RedisError> {
    client.hget(&format!("roomId/{}", room_id), "boards").await
}

pub async fn set_revealed_tiles(
    client: &RedisClient,
    room_id: &str,
    number_of_revealed_tiles: usize,
) {
    client
        .hset(
            &format!("roomId/{}", room_id),
            "number_of_revealed_tiles",
            number_of_revealed_tiles,
        )
        .await
        .unwrap();
}

pub async fn get_revealed_tiles(client: &RedisClient, room_id: &str) -> Result<usize, RedisError> {
    client
        .hget(&format!("roomId/{}", room_id), "number_of_revealed_tiles")
        .await
}

pub async fn add_player(client: RedisClient, room_id: String, nickname: String) -> Uuid {
    let session_id = Uuid::new_v4();

    let color = get_random_hsl();

    let mut player = HashMap::new();

    player.insert("nickname", nickname);
    player.insert("color", color);

    client
        .hset(
            &format!("roomId/{}/players", room_id),
            &session_id.to_string(),
            player,
        )
        .await
        .unwrap();

    session_id
}

pub async fn get_player(
    client: &RedisClient,
    room_id: &str,
    session_id: &str,
) -> Result<Player, RedisError> {
    client
        .hget(&format!("roomId/{}/players", room_id), session_id)
        .await
}

pub async fn get_all_players(
    client: &RedisClient,
    room_id: &str,
) -> Result<HashMap<String, HashMap<String, String>>, RedisError> {
    client.hgetall(room_id).await
}

pub async fn player_exists(client: &RedisClient, room_id: &str, session_id: &str) -> bool {
    client
        .hexists(&format!("roomId/{}/players", room_id), session_id)
        .await
        .unwrap()
}

pub fn sync_player_exists(client: &RedisClient, room_id: &str, session_id: &str) -> bool {
    client
        .sync_hexists(&format!("roomId/{}/players", room_id), session_id)
        .unwrap()
}

pub async fn get_time(client: &RedisClient, room_id: &str) -> Result<u64, RedisError> {
    client
        .hget(&format!("roomId/{}", room_id), "time_started")
        .await
}

pub async fn set_time(client: &RedisClient, room_id: &str, time: DateTime<Utc>) {
    client
        .hset(
            &format!("roomId/{}", room_id),
            "time_started",
            time.timestamp_millis(),
        )
        .await
        .unwrap();
}

pub async fn get_room(client: &RedisClient, room_id: &str) -> Result<Room, RedisError> {
    client.hgetall(&format!("roomId/{}", room_id)).await
}

pub async fn room_exists(client: &RedisClient, room_id: &str) -> bool {
    client.exists(&format!("roomId/{}", room_id)).await.unwrap()
}
