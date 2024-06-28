import { writable } from "svelte/store";
import {
  NUMBER_OF_ROWS_COLUMNS,
  TILE_TO_MINE_RATIO,
} from "./sharedExpectations";

export const flags = writable(NUMBER_OF_ROWS_COLUMNS ** 2 / TILE_TO_MINE_RATIO);
