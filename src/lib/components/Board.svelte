<script lang="ts">
    import { onMount } from "svelte";
    import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
    import Tile from "./Tile.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { addToast } from "./Toaster.svelte";

    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;
    const number_of_rows_columns = 12;

    export let roomId: string;
    export let board: Array<Array<number>> = createTempBoard();
    export let element: Element;

    const channel = supabase.channel(`room:${roomId}:tile`, {
        config: {
            broadcast: {
                self: true,
            },
        },
    });

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

        const { data, error } = await supabase.auth.getSession();

        if (error) {
            addToast({
                data: {
                    title: "Unable to get current session",
                    description:
                        "You're likely logged out, please try rejoining the room with a new nickname",
                    color: "red",
                },
            });

            return;
        }

        const accessToken = data.session?.access_token;

        const response = await fetch("/.netlify/functions/handletiles", {
            method: "POST",
            body: JSON.stringify({
                x,
                y,
                roomId,
            }),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status === 200) {
            const returned_tile = await response.json();

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

    async function flagTile(x: number, y: number) {
        if (
            board &&
            board[x][y] !== UNKNOWN_TILE &&
            board[x][y] !== FLAGGED_TILE
        )
            return;

        // This may be wrong as the client may have slightly different information
        board[x][y] =
            board[x][y] === FLAGGED_TILE ? UNKNOWN_TILE : FLAGGED_TILE;

        const { data, error } = await supabase
            .from("rooms")
            .select("flags")
            .eq("id", roomId)
            .single();

        if (error) {
            addToast({
                data: {
                    title: "A database error occured",
                    description: "Unable to get flag information",
                    color: "red",
                },
            });

            return;
        }

        const flags = data.flags;
        const id = `${x},${y}`;

        flags[id] = flags[id] === undefined ? true : !flags[id];
        // Just in case the client is out of sync, place the correct information
        board[x][y] = flags[id] ? FLAGGED_TILE : UNKNOWN_TILE;

        channel.send({
            type: "broadcast",
            event: "tileUpdated",
            payload: {
                tile: JSON.stringify({
                    x,
                    y,
                    state: flags[id] ? FLAGGED_TILE : UNKNOWN_TILE,
                }),
            },
        });

        await supabase
            .from("rooms")
            .update({
                flags,
            })
            .eq("id", roomId);
    }

    onMount(() => {
        channel
            .on(
                "broadcast",
                {
                    event: "tileUpdated",
                },
                ({ payload }) => {
                    console.log(payload.tile);
                    const returned_tile = JSON.parse(payload.tile);
                    console.log(returned_tile);

                    if (!board) return;

                    if (returned_tile["x"] !== undefined) {
                        const { x, y, state } = returned_tile;

                        // If a tile is being flagged, make sure it's not in any invalid
                        // positions
                        if (
                            state === FLAGGED_TILE &&
                            (board[x][y] === UNKNOWN_TILE ||
                                board[x][y] !== FLAGGED_TILE)
                        ) {
                            board[x][y] = state;
                        } else if (state !== FLAGGED_TILE) {
                            board[x][y] = state;
                        }
                    } else {
                        for (const [id, state] of new Map(
                            Object.entries(returned_tile),
                        )) {
                            const [_x, _y] = id.split(",");
                            const [x, y] = [Number(_x), Number(_y)];

                            board[x][y] = state as number;
                        }
                    }
                },
            )
            .subscribe();

        return async () => {
            await supabase.removeChannel(channel);
        };
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
