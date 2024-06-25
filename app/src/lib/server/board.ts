import { getRandomInt } from "$lib/utility";

export const FLAGGED_TILE = -3;
export const UNKNOWN_TILE = -2;
const MINE_TILE = -1;
const ZERO_TILE = 0;
// 1 mine per 6 tiles
const TILE_TO_MINE_RATIO = 6;

function deepCopy(object: Object) {
  const copy = JSON.stringify(object);

  return JSON.parse(copy);
}

function isNeighbor(
  row: number,
  column: number,
  other_row: number,
  other_column: number,
) {
  if (Math.abs(row - other_row) <= 1 && Math.abs(column - other_column) <= 1) {
    return true;
  }
  return false;
}

function getNeighbors(
  board: Array<Array<number>>,
  row: number,
  column: number,
) {
  const neighbors = [];

  // I don't know how this works, it just does
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      // I won't forget my reaction to discovering this single conditional
      // that caused the board to not compute properly 🤫🧏
      if (x === 0 && y === 0) continue;

      const _row: undefined | Array<number> = board[row + x];

      if (_row === undefined) continue;

      const _column: undefined | number = _row[column + y];

      if (_column === undefined) continue;

      neighbors.push([_column, row + x, column + y]);
    }
  }

  return neighbors;
}

function computeBoard(
  board: Array<Array<number>>,
  number_of_rows_columns: number,
) {
  for (let x = 0; x < number_of_rows_columns; x++) {
    for (let y = 0; y < number_of_rows_columns; y++) {
      const tile = board[x][y];

      if (tile === MINE_TILE) continue;

      let surrounding_bombs = 0;

      for (const [neighbor] of getNeighbors(board, x, y)) {
        if (neighbor === MINE_TILE) {
          surrounding_bombs++;
        }
      }

      board[x][y] = surrounding_bombs;
    }
  }
}

// I just designed this after a previous
// minesweeper project of mine lol
export function generateSolvedBoard(
  number_of_rows_columns: number,
  safe_row: number,
  safe_column: number,
) {
  const server_board: Array<Array<number>> = [];
  const number_of_tiles = number_of_rows_columns ** 2;
  let number_of_mines = Math.floor(number_of_tiles / TILE_TO_MINE_RATIO);

  for (let x = 0; x < number_of_rows_columns; x++) {
    const row: Array<number> = [];
    for (let y = 0; y < number_of_rows_columns; y++) {
      row.push(UNKNOWN_TILE);
    }
    server_board.push(row);
  }

  const client_board = deepCopy(server_board);

  while (number_of_mines > 0) {
    const random_row = getRandomInt(0, number_of_rows_columns);
    const random_column = getRandomInt(0, number_of_rows_columns);

    // Check if the random tile is within a 3x3 radius of the inital spot the user
    // clicked on
    // If it isn't, we set it as a mine
    if (
      server_board[random_row][random_column] === UNKNOWN_TILE &&
      !(random_row === safe_row && random_column === safe_column) &&
      !isNeighbor(safe_row, safe_column, random_row, random_column)
    ) {
      server_board[random_row][random_column] = MINE_TILE;
      number_of_mines--;
    }
  }

  // Actually compute all the tile values for the minesweeper board
  computeBoard(server_board, number_of_rows_columns);

  // The first one we keep on the server and the second one is the board that is
  // sent to the client
  return [server_board, client_board];
}

// This function can either return a singular tile or a map of tiles indexed by an id
// generated based on the x and y (depending on if
//  the tile requested was a zero or not
//
// Array:
// [x, y, state]
//
// Map:
// Map<"x,y", state>
export function returnTile(
  player: string,
  server_board: Array<Array<number>>,
  client_board: Array<Array<number>>,
  row: number,
  column: number,
): { x: number; y: number; state: number } | Map<string, number> {
  const client_tile = client_board[row][column];
  const server_tile = server_board[row][column];

  // If the client board already has the answer, just return it
  if (client_tile !== UNKNOWN_TILE) {
    return {
      x: row,
      y: column,
      state: client_tile,
    };
  }

  switch (server_tile) {
    case ZERO_TILE: {
      const visited_tiles: Map<string, number> = new Map();

      massReveal(server_board, client_board, row, column, visited_tiles);

      return visited_tiles;
    }
  }

  client_board[row][column] = server_tile;

  return {
    x: row,
    y: column,
    state: server_tile,
  };
}

export function didGameEnd(
  board: Array<Array<number>>,
  number_of_revealed_tiles: number,
) {
  // Get the height of the board and since it's a square, just square it
  const number_of_tiles = board.length ** 2;
  // Should get us the same number of mines as when we first generated the board
  const number_of_mines = Math.floor(number_of_tiles / TILE_TO_MINE_RATIO);
  // The tiles that should be left when the game is completed;
  const number_of_remaining_tiles = number_of_tiles - number_of_mines;

  return number_of_remaining_tiles === number_of_revealed_tiles;
}

export function gameOver(
  caused_by_bomb: boolean,
  player: string,
  row: number,
  column: number,
) {
  return {
    caused_by_bomb,
    player,
    x: row,
    y: column,
  };
}

// Use recursion to do a mass reveal
function massReveal(
  server_board: Array<Array<number>>,
  client_board: Array<Array<number>>,
  row: number,
  column: number,
  visited_tiles: Map<string, number>,
) {
  let id = `${row},${column}`;

  // Base case: if the tile has already been visited, return
  if (visited_tiles.has(id)) return;
  if (client_board[row][column] !== UNKNOWN_TILE) return;

  // Mark the current tile as visited and update the client board
  visited_tiles.set(id, server_board[row][column]);
  client_board[row][column] = server_board[row][column];

  // If the current tile is not a zero tile, don't continue revealing
  if (server_board[row][column] !== ZERO_TILE) return;

  // Get all neighbors and reveal them
  for (const [_neighbor, x, y] of getNeighbors(server_board, row, column)) {
    if (!visited_tiles.has(`${x},${y}`)) {
      massReveal(server_board, client_board, x, y, visited_tiles);
    }
  }
}
