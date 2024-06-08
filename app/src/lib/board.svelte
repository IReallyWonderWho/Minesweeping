<script lang="ts">
    import { onMount } from "svelte";
    import Tile from "./tile.svelte";
    import { socket } from "./webhook";

    export let roomId: string;

    socket.on(
        "board_updated",
        (tile: [number, number, number] | Map<string, number>) => {
            console.log(tile);
            // This is [x, y, tile state]
            if (Array.isArray(tile)) {
                const [x, y, state] = tile;

                if (board) {
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

                    board[x][y] = state;
                }
            }
        },
    );

    let num_of_rows_columns = 12;
    let board: Array<Array<number>> | undefined;

    // BTW this function doesn't work in development mode so yeahhh
    // I can only test it in production 💀
    async function fetchBoard() {
        const response = await fetch(`/api/playing?roomId=${roomId}`);

        board = await response.json();
    }

    async function postTile(x: number, y: number) {
        const UNKNOWN_TILE = -2;

        console.log("hi");
        if (board && board[x][y] !== UNKNOWN_TILE) return;

        console.log("wow");
        const body = {
            x,
            y,
            roomId,
        };

        socket.emit("choose_tile", body);
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
    {#each { length: num_of_rows_columns } as _, x}
        <!--Column-->
        {#each { length: num_of_rows_columns } as _, y}
            <Tile
                position={{ x, y }}
                state={board ? board[x][y] : undefined}
                {postTile}
            />
        {/each}
    {/each}
</div>
