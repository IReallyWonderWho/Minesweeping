<script lang="ts">
    import { createScrollArea, melt } from "@melt-ui/svelte";
    import { onMount } from "svelte";
    import Tile from "./Tile.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { addToast } from "$lib/components/Toaster.svelte";
    import { flags } from "$lib/stores";

    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;
    const MINE_TILE = -1;
    const FALSE_FLAG_TILE = -4;

    export let started: boolean;
    export let roomId: string;
    export let board: Array<Array<number>>;
    export let element: Element;
    export let correctBoard: Array<Array<number>> | undefined;
    export let isLobby: boolean = false;

    const channel = supabase.channel(`tile:${roomId}`);
    const {
        elements: {
            root,
            content,
            viewport,
            corner,
            scrollbarY,
            thumbY,
            thumbX,
            scrollbarX,
        },
    } = createScrollArea({
        type: "auto",
        dir: "rtl",
    });

    $: boardLength = board.length;

    $: {
        for (const [id] of $flags) {
            const [_x, _y] = id.split(",");
            const [x, y] = [Number(_x), Number(_y)];

            // Make sure the flag is within range
            if (
                x < 0 ||
                x > board.length - 1 ||
                y < 0 ||
                y > board.length - 1 ||
                board[x][y] >= MINE_TILE
            ) {
                $flags.delete(`${x},${y}`);

                supabase
                    .from("flags")
                    .update({
                        flags: Object.fromEntries($flags),
                    })
                    .eq("room_id", roomId);

                continue;
            }

            board[x][y] = FLAGGED_TILE;
        }
    }

    $: {
        // The game has ended and now we display where the mines were and any false flags
        if (correctBoard) {
            for (let x = 0; x < correctBoard.length; x++) {
                for (let y = 0; y < correctBoard.length; y++) {
                    const correctTile = correctBoard[x][y];
                    const clientTile = board[x][y];

                    if (
                        clientTile === FLAGGED_TILE &&
                        correctTile !== MINE_TILE
                    ) {
                        board[x][y] = FALSE_FLAG_TILE;
                    }
                }
            }
        }
    }

    async function postTile(x: number, y: number) {
        if ((board && board[x][y] !== UNKNOWN_TILE) || !started) return;

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

        const response = await fetch("/api/room/tiles", {
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
            (board &&
                board[x][y] !== UNKNOWN_TILE &&
                board[x][y] !== FLAGGED_TILE) ||
            !started
        )
            return;

        const id = `${x},${y}`;

        // Ok here me out, the logic should go like this, if tile isn't found, that means
        // it isn't flagged, so then we flag it by setting it to true
        // But if it was already flagged, it would exist as true and we can unflag it by setting
        // it to undefined which also has the benefit that the database has less data to keep track of
        const past_tile = $flags.get(id);

        if (past_tile) {
            $flags.delete(id);
        } else {
            $flags.set(id, true);
        }

        const new_tile = $flags.get(id);

        board[x][y] = new_tile ? FLAGGED_TILE : UNKNOWN_TILE;

        $flags = $flags;

        channel.send({
            type: "broadcast",
            event: "tileUpdated",
            payload: {
                tile: JSON.stringify({
                    x,
                    y,
                    state: new_tile ? FLAGGED_TILE : UNKNOWN_TILE,
                }),
            },
        });

        await supabase
            .from("flags")
            .update({
                flags: Object.fromEntries($flags),
            })
            .eq("room_id", roomId);
    }

    async function gameEnded(correctBoard: Array<Array<number>> | undefined) {
        if (!correctBoard) return;

        for (let x = 0; x < boardLength; x++) {
            for (let y = 0; y < boardLength; y++) {
                const correctTile = correctBoard[x][y];
                const originalTile = board[x][y];

                if (correctTile === MINE_TILE) {
                    if (originalTile !== FLAGGED_TILE) {
                        board[x][y] = MINE_TILE;
                    }
                }
            }
        }
    }

    $: {
        gameEnded(correctBoard);
    }

    onMount(() => {
        console.log(isLobby);
        if (isLobby) return;
        channel
            .on(
                "broadcast",
                {
                    event: "tileUpdated",
                },
                ({ payload }) => {
                    const returned_tile = JSON.parse(payload.tile);

                    if (!board) return;

                    if (returned_tile["x"] !== undefined) {
                        const { x, y, state } = returned_tile;

                        // If a tile is being flagged, make sure it's not in any invalid
                        // positions
                        if (
                            state === FLAGGED_TILE &&
                            board[x][y] === UNKNOWN_TILE
                        ) {
                            $flags.set(`${x},${y}`, true);
                            $flags = $flags;

                            board[x][y] = FLAGGED_TILE;
                        } else if (state !== FLAGGED_TILE) {
                            if (board[x][y] === FLAGGED_TILE) {
                                $flags.delete(`${x},${y}`);
                                $flags = $flags;
                            }

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
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                },
                (payload) => {
                    if (!payload.new.client_board) return;
                    // When the game first starts, a new board is formed which is full of unknown tiles,
                    // and then its evaluated, resulting in two update requests in that short time.
                    // To prevent showing the unknown board, we filter out the updates that don't have any revealed
                    // tiles
                    if (!payload.new.revealed_tiles || !payload.new.started)
                        return;

                    console.log("Updating board");
                    board = payload.new.client_board;
                },
            )
            .subscribe((status) => {
                console.log(status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    });
</script>

<div
    bind:this={element}
    class={`w-[100vw] aspect-square min-w-80 bg-black select-none ${$$props.class}`}
    on:mousemove
    use:melt={$root}
    role="main"
>
    <div use:melt={$viewport} class="h-full w-full">
        <div
            class="h-full w-full aspect-square grid justify-items-center"
            style="grid-template-columns: repeat({boardLength}, minmax(0, 1fr)); grid-template-rows: repeat({boardLength}, minmax(0, 1fr));"
        >
            <!--Row-->
            {#each { length: boardLength } as _, x}
                <!--Column-->
                {#each { length: boardLength } as _, y}
                    <Tile
                        position={{ x, y }}
                        state={board
                            ? board[x]
                                ? board[x][y]
                                : undefined
                            : undefined}
                        {postTile}
                        {flagTile}
                    />
                {/each}
            {/each}
            <slot name="players" />
        </div>
    </div>
    <div
        use:melt={$scrollbarY}
        class="flex h-full w-2.5 touch-none select-none border-l border-l-transparent bg-primary-800/10 p-px transition-colors"
    >
        <div
            use:melt={$thumbY}
            class="relative flex-1 rounded-full bg-primary-600"
        />
    </div>
    <div
        use:melt={$scrollbarX}
        class="flex h-2.5 w-full touch-none select-none border-t border-t-transparent bg-primary-800/10 p-px"
    >
        <div use:melt={$thumbX} class="relative rounded-full bg-primary-600" />
    </div>
    <div use:melt={$corner} />
</div>
