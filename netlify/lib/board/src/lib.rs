pub mod board {
    use rand::Rng;
    use serde::{Deserialize, Serialize};

    use std::collections::HashMap;

    pub const FLAGGED_TILE: i32 = -3;
    pub const UNKNOWN_TILE: i32 = -2;
    const MINE_TILE: i32 = -1;
    const ZERO_TILE: i32 = 0;

    const TILE_TO_MINE_RATIO: f64 = 6.0;

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Tile {
        pub x: usize,
        pub y: usize,
        pub state: i32,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Boards {
        pub client_board: Vec<Vec<i32>>,
        pub server_board: Vec<Vec<i32>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub enum TileOrHashmap {
        Tile(Tile),
        Hashmap(HashMap<String, i32>),
    }

    fn is_neighbor(row1: usize, column1: usize, row2: usize, column2: usize) -> bool {
        if row1.abs_diff(row2) <= 1 && column1.abs_diff(column2) <= 1 {
            return true;
        }

        false
    }

    fn get_neighbors(board: &Vec<Vec<i32>>, row: isize, column: isize) -> Vec<(i32, usize, usize)> {
        let mut neighbors: Vec<(i32, usize, usize)> = vec![];

        for _x in -1..2 {
            for _y in -1..2 {
                if _x == 0 && _y == 0 {
                    continue;
                }

                let x_option = usize::try_from(row + _x);

                if let Ok(x) = x_option {
                    let _row = &board.get(x);

                    if let None = _row {
                        continue;
                    }

                    let y_option = usize::try_from(column + _y);

                    if let Ok(y) = y_option {
                        let state = _row.unwrap().get(y);

                        if let None = state {
                            continue;
                        }

                        neighbors.push((*state.unwrap(), x, y));
                    }
                }
            }
        }

        neighbors
    }

    pub fn compute_board(board: &mut Vec<Vec<i32>>, number_of_rows_columns: usize) {
        for x in 0..number_of_rows_columns {
            for y in 0..number_of_rows_columns {
                let tile = board[x][y];

                if tile == MINE_TILE {
                    continue;
                }

                let mut surrounding_bombs = 0;

                for (neighbor, _x, _y) in get_neighbors(
                    board,
                    isize::try_from(x).unwrap(),
                    isize::try_from(y).unwrap(),
                ) {
                    if neighbor == MINE_TILE {
                        surrounding_bombs += 1;
                    }
                }

                board[x][y] = surrounding_bombs;
            }
        }
    }

    pub fn generate_solved_boards(
        number_of_rows_columns: u32,
        safe_row: usize,
        safe_column: usize,
    ) -> Boards {
        let mut server_board: Vec<Vec<i32>> = vec![];
        let number_of_tiles: f64 = f64::from(number_of_rows_columns.pow(2));
        let mut number_of_mines = (number_of_tiles / TILE_TO_MINE_RATIO).floor();

        for _x in 0..number_of_rows_columns {
            let mut row: Vec<i32> = vec![];
            for _y in 0..number_of_rows_columns {
                row.push(UNKNOWN_TILE);
            }
            server_board.push(row);
        }

        let client_board = server_board.to_vec();

        while number_of_mines > 0.0 {
            let random_row: usize =
                usize::try_from(rand::thread_rng().gen_range(0..number_of_rows_columns)).unwrap();
            let random_column: usize =
                usize::try_from(rand::thread_rng().gen_range(0..number_of_rows_columns)).unwrap();

            // Check if the random tile is within a 3x3 radius of the inital spot
            // If it isn't, set it as a mine
            if server_board[random_row][random_column] == UNKNOWN_TILE
                && !(random_row == safe_row && random_column == safe_column)
                && !is_neighbor(safe_row, safe_column, random_row, random_column)
            {
                server_board[random_row][random_column] = MINE_TILE;
                number_of_mines -= 1.0;
            }
        }

        // Compute the tile values for the minesweeper board
        compute_board(
            &mut server_board,
            usize::try_from(number_of_rows_columns).unwrap(),
        );

        // Have two versions of the board, one for the server that
        // holds the answers and the client one which is sent to the
        // clients
        Boards {
            server_board,
            client_board,
        }
    }

    pub fn flood_reveal(
        server_board: &Vec<Vec<i32>>,
        client_board: &mut Vec<Vec<i32>>,
        row: usize,
        column: usize,
        visited_tiles: &mut HashMap<String, i32>,
    ) {
        let id = format!("{},{}", row, column);

        // If the tile has been visited before, return back
        if visited_tiles.contains_key(&id) {
            return;
        }
        if client_board[row][column] != UNKNOWN_TILE {
            return;
        }

        // Mark the current tile as visited and update client board
        visited_tiles.insert(id, server_board[row][column]);
        client_board[row][column] = server_board[row][column];

        // If the tile isn't a zero tile, we don't have to continue
        if server_board[row][column] != ZERO_TILE {
            return;
        }
        // Get all neighbors and reveal them
        for (_neighbor, x, y) in get_neighbors(
            server_board,
            isize::try_from(row).unwrap(),
            isize::try_from(column).unwrap(),
        ) {
            if !visited_tiles.contains_key(&format!("{},{}", x, y)) {
                flood_reveal(server_board, client_board, x, y, visited_tiles)
            }
        }
    }

    pub fn return_tile(
        server_board: &Vec<Vec<i32>>,
        client_board: &mut Vec<Vec<i32>>,
        row: usize,
        column: usize,
    ) -> TileOrHashmap {
        let client_tile = client_board[row][column];
        let server_tile = server_board[row][column];

        // Return the client board's answer if it has already
        // been returned before
        if client_tile != UNKNOWN_TILE {
            return TileOrHashmap::Hashmap(HashMap::new());
        }

        if server_tile == ZERO_TILE {
            let mut visited_tiles = HashMap::new();

            flood_reveal(&server_board, client_board, row, column, &mut visited_tiles);

            return TileOrHashmap::Hashmap(visited_tiles);
        }

        client_board[row][column] = server_tile;

        return TileOrHashmap::Tile(Tile {
            x: row,
            y: column,
            state: server_tile,
        });
    }
}

#[cfg(test)]
mod tests {
    use board::board::{compute_board, flood_reveal};
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;

    use super::*;

    #[derive(Debug, Serialize, Deserialize)]
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
}
