<script lang="ts">
    import { onMount } from "svelte";
    import type { RealtimeChannel } from "@supabase/supabase-js";
    import { supabase } from "$lib/supabaseClient";
    import Tile from "./Tile.svelte";
    import { generateSolvedBoard, returnTile } from "$lib/boardUtils";
    import { addToast } from "./Toaster.svelte";

    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;
    const number_of_rows_columns = 12;

    export let roomId: string;
    export let channel: RealtimeChannel;
    export let board: Array<Array<number>> = createTempBoard();
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

    // This should be handled server sided, but due to the poor performance of making database calls
    // and the unability to cache stuff on serverless functions, this is the best solution
    // unless this becomes popular enough to justify hosting an actual server
    async function postTile(x: number, y: number) {
        if (board && board[x][y] !== UNKNOWN_TILE) return;

        console.log(`x: ${x}, y: ${y}`);
        const a = Date.now();

        const response = await fetch("/.netlify/functions/handletiles", {
            method: "POST",
            body: JSON.stringify({
                x,
                y,
                roomId,
            }),
        });

        if (response.status === 200) {
            const returned_tile = await response.json();

            console.log(returned_tile);

            if (!board) return;

            if ("x" in returned_tile) {
                const { x, y, state } = returned_tile;

                board[x][y] = state;
            } else {
                for (const [id, state] of new Map(
                    Object.entries(returned_tile),
                )) {
                    const [_x, _y] = id.split(",");
                    const [x, y] = [Number(_x), Number(_y)];

                    board[x][y] = state as number;
                }
            }
        }
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
        /* socket.on(
            "board_updated",
            (
                tile:
                    | { Tile: { x: number; y: number; state: number } }
                    | { Hashmap: Map<string, number> },
            ) => {
                // This is {x, y, tile state}
                console.log(tile);
                if ("Tile" in tile) {
                    console.log(tile);
                    const { x, y, state } = tile.Tile as {
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
                        Object.entries(tile.Hashmap),
                    )) {
                        const [_x, _y] = id.split(",");
                        const [x, y] = [Number(_x), Number(_y)];

                        if (!board) return;

                        console.log(`x: ${x}, y: ${y}`);
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
            }; */
    });
</script>

<div
    bind:this={element}
    class={`h-[70vh] min-h-80 aspect-square bg-black grid grid-cols-12 grid-rows-12 justify-items-stretch ${$$props.class}`}
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
