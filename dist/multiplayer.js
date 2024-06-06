// src/lib/server/board.ts
var UNKNOWN_TILE = -2;
var MINE_TILE = -1;
var ZERO_TILE = 0;
var TILE_TO_MINE_RATIO = 6;
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
function deepCopy(object) {
  const copy = JSON.stringify(object);
  return JSON.parse(copy);
}
function isNeighbor(row, column, other_row, other_column) {
  if (Math.abs(row - other_row) <= 1 && Math.abs(column - other_column) <= 1) {
    return true;
  }
  return false;
}
function getNeighbors(board, row, column) {
  const neighbors = [];
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      if (x === 0 && y === 0)
        continue;
      const _row = board[row + x];
      if (_row === void 0)
        continue;
      const _column = _row[column + y];
      if (_column === void 0)
        continue;
      neighbors.push([_column, row + x, column + y]);
    }
  }
  return neighbors;
}
function computeBoard(board, number_of_rows_columns) {
  for (let x = 0; x < number_of_rows_columns; x++) {
    for (let y = 0; y < number_of_rows_columns; y++) {
      const tile = board[x][y];
      if (tile !== UNKNOWN_TILE)
        continue;
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
function generateSolvedBoard(number_of_rows_columns, safe_row, safe_column) {
  const server_board = [];
  const number_of_tiles = number_of_rows_columns ** 2;
  let number_of_mines = Math.floor(number_of_tiles / TILE_TO_MINE_RATIO);
  for (let x = 0; x < number_of_rows_columns; x++) {
    const row = [];
    for (let y = 0; y < number_of_rows_columns; y++) {
      row.push(UNKNOWN_TILE);
    }
    server_board.push(row);
  }
  const client_board = deepCopy(server_board);
  while (number_of_mines > 0) {
    const random_row = getRandomInt(0, number_of_rows_columns);
    const random_column = getRandomInt(0, number_of_rows_columns);
    if (server_board[random_row][random_column] === UNKNOWN_TILE && !(random_row === safe_row && random_column === safe_column) && !isNeighbor(safe_row, safe_column, random_row, random_column)) {
      server_board[random_row][random_column] = MINE_TILE;
      number_of_mines--;
    }
  }
  computeBoard(server_board, number_of_rows_columns);
  return [server_board, client_board];
}
function returnTile(player, server_board, client_board, row, column) {
  const client_tile = client_board[row][column];
  const server_tile = server_board[row][column];
  if (client_tile !== UNKNOWN_TILE) {
    return [row, column, client_tile];
  }
  client_board[row][column] = server_tile;
  switch (server_tile) {
    case ZERO_TILE: {
      const visited_tiles = /* @__PURE__ */ new Map();
      massReveal(server_board, client_board, row, column, visited_tiles);
      console.log("HI");
      return visited_tiles;
    }
    case MINE_TILE: {
      gameOver(true, player, row, column);
    }
  }
  if (didGameEnd()) {
    gameOver(true, player, row, column);
  }
  return [row, column, server_tile];
}
function didGameEnd() {
  console.log("TBA");
  return false;
}
function gameOver(caused_by_bomb, player, row, column) {
  console.log("I think the game is over ngl");
}
function massReveal(server_board, client_board, row, column, visited_tiles) {
  let id = `${row},${column}`;
  if (visited_tiles.has(id))
    return;
  visited_tiles.set(id, server_board[row][column]);
  client_board[row][column] = server_board[row][column];
  if (server_board[row][column] !== ZERO_TILE)
    return;
  for (const [_neighbor, x, y] of getNeighbors(server_board, row, column)) {
    if (!visited_tiles.has(`${x},${y}`)) {
      massReveal(server_board, client_board, x, y, visited_tiles);
    }
  }
}

// src/lib/server/rooms.ts
var rooms = /* @__PURE__ */ new Map();
function createRoom(number_of_rows_columns, safe_row, safe_column) {
  const roomId = "Never going to give your ip";
  const [server_board, client_board] = generateSolvedBoard(
    number_of_rows_columns,
    safe_row,
    safe_column
  );
  rooms.set(roomId, { server_board, client_board });
  return { server_board, client_board };
}
function getRoom(roomId) {
  return rooms.get(roomId);
}

// src/lib/server/multiplayer.ts
createRoom(12, 0, 0);
function multiplayer(io) {
  io.on("connection", (socket) => {
    socket.on("join_room", (roomId) => {
      console.log(roomId);
      const room = getRoom(roomId);
      if (room) {
        socket.join(roomId);
        socket.emit("joined_room", roomId);
        return;
      }
      socket.emit("error", "Room not found");
    });
    socket.on("choose_tile", ({ x, y, roomId }) => {
      const room = getRoom(roomId);
      console.log(room);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      const { server_board, client_board } = room;
      const tile = returnTile("Rick Ashley", server_board, client_board, x, y);
      io.to(roomId).emit(
        "board_updated",
        Array.isArray(tile) ? tile : Object.fromEntries(tile)
      );
    });
    socket.on("flag_tile", ({ x, y }) => {
    });
  });
}
export {
  multiplayer as default
};
