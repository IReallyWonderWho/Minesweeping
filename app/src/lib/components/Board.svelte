<script lang="ts">
    import { onMount } from "svelte";
    import type { Socket } from "socket.io-client";
    import Tile from "./Tile.svelte";
    import { addToast } from "./Toaster.svelte";

    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;
    const number_of_rows_columns = 12;

    export let board: Array<Array<number>> = createTempBoard();
    export let socket: Socket;
    export let element: Element;

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

    function postTile(x: number, y: number) {
        if (board && board[x][y] !== UNKNOWN_TILE) return;

        socket.emit("choose_tile", x, y);
    }

    function flagTile(x: number, y: number) {
        if (
            board &&
            board[x][y] !== UNKNOWN_TILE &&
            board[x][y] !== FLAGGED_TILE
        )
            return;

        socket.emit("flag_tile", x, y);
    }

    onMount(() => {
        socket.on(
            "board_updated",
            (
                tile:
                    | { x: number; y: number; state: number }
                    | Map<string, number>,
            ) => {
                console.log(board);
                // This is {x, y, tile state}
                if ("x" in tile) {
                    console.log(tile);
                    const { x, y, state } = tile as {
                        x: number;
                        y: number;
                        state: number;
                    };

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

                        console.log("bruh");
                        board[x][y] = state;
                    }
                }
            },
        );

        socket.on("game_ended", (lost: boolean, player: string) => {
            addToast({
                data: {
                    title: lost ? "Game Over 💥" : "Game Won 🥳",
                    description: lost
                        ? `${player}'s mouse gained sentience and clicked on a mine`
                        : "Congratulations on your win!",
                    color: "red",
                },
            });
        });

        return () => {
            socket.disconnect();
        };
    });
</script>

<div
    bind:this={element}
    class={`w-[500px] h-[500px] bg-black grid grid-cols-12 grid-rows-12 justify-items-stretch ${$$props.class}`}
    on:mousemove
    role="main"
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
    <slot name="players" />
</div>
