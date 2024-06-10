<script lang="ts">
    import { onMount } from "svelte";
    import Tile from "./tile.svelte";
    import { socket } from "./webhook";

    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;

    export let roomId: string;

    socket.on(
        "board_updated",
        (tile: [number, number, number] | Map<string, number>) => {
            // This is [x, y, tile state]
            if (Array.isArray(tile)) {
                const [x, y, state] = tile;

                if (board) {
                    console.log(state);
                    board[x][y] = state;
                }
            } else {
                // The ids are just "x,y" and the tile state
                for (const [id, state] of new Map<string, number>(
                    Object.entries(tile),
                )) {
                    const [_x, _y] = id.split(",");
                    const [x, y] = [Number(_x), Number(_y)];

                    if (!board) return;

                    console.log("bruh");
                    board[x][y] = state;
                }
            }
        },
    );

    let number_of_rows_columns = 12;
    let board: Array<Array<number>> = createTempBoard();

    function createTempBoard() {
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

    async function fetchBoard() {
        const response = await fetch(`/api/playing?roomId=${roomId}`);

        board = await response.json();
    }

    function postTile(x: number, y: number) {
        if (board && board[x][y] !== UNKNOWN_TILE) return;

        const body = {
            x,
            y,
            roomId,
        };

        socket.emit("choose_tile", body);
    }

    function flagTile(x: number, y: number) {
        if (
            board &&
            board[x][y] !== UNKNOWN_TILE &&
            board[x][y] !== FLAGGED_TILE
        )
            return;

        const body = {
            x,
            y,
            roomId,
        };

        socket.emit("flag_tile", body);
    }

    // Congrats!! Websockets broke my previously working get request!!
    // Can't wait to actually have to build an express server just to fix it!!
    // And also I had to write a whole vite plugin to make it for for development
    // Why can't sveltekit just support webhooks out of the box....
    onMount(() => {
        fetchBoard();
    });
</script>

<div
    class="w-[500px] h-[500px] bg-black grid grid-cols-12 grid-rows-12 justify-items-stretch"
>
    <!--Row-->
    {#each { length: number_of_rows_columns } as _, x}
        <!--Column-->
        {#each { length: number_of_rows_columns } as _, y}
            <Tile
                position={{ x, y }}
                state={board ? board[x][y] : undefined}
                {postTile}
                {flagTile}
            />
        {/each}
    {/each}
</div>
