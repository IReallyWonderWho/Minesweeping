export const FLAGGED_TILE = -3;
export const UNKNOWN_TILE = -2;
export const MINE_TILE = -1;
export const ZERO_TILE = 0;
export const MINE_TO_TILE_RATIO = 6;

export function createTempBoard(number_of_rows_columns: number = 12) {
  let real_board = [];

  for (let x = 0; x < number_of_rows_columns; x++) {
    const row: Array<number> = [];
    for (let y = 0; y < number_of_rows_columns; y++) {
      row.push(UNKNOWN_TILE);
    }
    real_board.push(row);
  }

  return real_board;
}
