mod board;
mod handlers;
mod redis_client;
mod rooms;

use board::board::{compute_board, flood_reveal};
use redis::Commands;
use redis_client::RedisClient;
use redis_macros::FromRedisValue;
use rooms::get_boards;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;
use tracing_subscriber::FmtSubscriber;

#[cfg(test)]
mod tests {
    use redis::RedisError;

    use super::*;

    #[derive(Debug, Serialize, Deserialize, FromRedisValue)]
    struct Room {
        boards: Option<(Vec<Vec<i32>>, Vec<Vec<i32>>)>,
        number_of_revealed_tiles: u32,
        time_started: u64,
    }

    #[test]
    fn compute_board_works() {
        let mut uncomputed_board = vec![
            vec![-2, -1, -2, -1, -2, -2, -2, -1, -1, -2, -2, -2],
            vec![-2, -1, -1, -2, -2, -2, -1, -2, -2, -2, -1, -1],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -1, -2, -2, -2, -1, -1, -2],
            vec![-2, -1, -2, -2, -2, -2, -2, -2, -2, -2, -2, -1],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-1, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -1, -1, -2, -2, -2, -2, -2, -2, -2, -1],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -1, -2, -2, -2, -2, -1, -2, -2],
            vec![-2, -1, -2, -2, -2, -2, -2, -2, -2, -2, -1, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -1, -2, -2, -1],
        ];

        // Calculated using a working version of the compute board function
        let computed_board = vec![
            vec![2, -1, 4, -1, 1, 1, 2, -1, -1, 2, 2, 2],
            vec![2, -1, -1, 2, 1, 1, -1, 3, 2, 2, -1, -1],
            vec![1, 2, 2, 1, 1, 2, 2, 1, 1, 3, 4, 3],
            vec![1, 1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 2],
            vec![1, -1, 1, 0, 1, 1, 1, 0, 1, 2, 3, -1],
            vec![2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
            vec![-1, 2, 2, 2, 1, 0, 0, 0, 0, 0, 1, 1],
            vec![1, 2, -1, -1, 1, 0, 0, 0, 0, 0, 1, -1],
            vec![0, 1, 2, 3, 2, 1, 0, 0, 1, 1, 2, 1],
            vec![1, 1, 1, 1, -1, 1, 0, 0, 1, -1, 2, 1],
            vec![1, -1, 1, 1, 1, 1, 0, 1, 2, 3, -1, 2],
            vec![1, 1, 1, 0, 0, 0, 0, 1, -1, 2, 2, -1],
        ];

        compute_board(&mut uncomputed_board, 12);

        // Compute board directly modifys the uncomputed board to match
        // the computed board
        assert_eq!(uncomputed_board, computed_board);
    }

    #[test]
    fn flood_reveal_works() {
        let mut client_board = vec![
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
        ];
        let server_board = vec![
            vec![0, 0, 1, -1, -1, 2, 1, 1, 1, 1, 1, 1],
            vec![1, 1, 2, 3, -1, 2, 1, -1, 1, 1, -1, 1],
            vec![1, -1, 1, 1, 1, 1, 2, 3, 3, 2, 2, 2],
            vec![1, 1, 2, 1, 2, 1, 2, -1, -1, 2, 3, -1],
            vec![0, 0, 1, -1, 2, -1, 2, 2, 3, -1, 3, -1],
            vec![0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1],
            vec![1, 1, 2, 1, 1, 1, -1, 2, -1, 1, 0, 0],
            vec![1, -1, 3, -1, 2, 2, 2, 2, 1, 1, 0, 0],
            vec![2, 3, -1, 2, 2, -1, 2, 1, 0, 0, 0, 0],
            vec![-1, 3, 2, 2, 1, 2, -1, 1, 0, 1, 1, 1],
            vec![1, 2, -1, 1, 1, 2, 2, 1, 0, 1, -1, 1],
            vec![0, 1, 1, 1, 1, -1, 1, 0, 0, 1, 1, 1],
        ];
        let test_client = vec![
            vec![0, 0, 1, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![1, 1, 2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
            vec![-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
        ];
        let mut computed_visited: HashMap<String, i32> = HashMap::new();

        computed_visited.insert(String::from("0,0"), 0);
        computed_visited.insert(String::from("0,1"), 0);
        computed_visited.insert(String::from("0,2"), 1);
        computed_visited.insert(String::from("1,0"), 1);
        computed_visited.insert(String::from("1,1"), 1);
        computed_visited.insert(String::from("1,2"), 2);

        let mut result: HashMap<String, i32> = HashMap::new();

        flood_reveal(&server_board, &mut client_board, 0, 0, &mut result);

        assert_eq!(result, computed_visited);
        assert_eq!(client_board, test_client);
    }

    #[tokio::test]
    async fn what_does_redis_do() {
        let client = RedisClient::new();

        let a: Result<Room, RedisError> = client.get(&String::from("Banana")).await;

        println!("HI {:?}", a);

        let b: u32 = client.hget("roomId/Wow", "time_started").await.unwrap();

        println!("BYE {:?}", b);
    }
}
