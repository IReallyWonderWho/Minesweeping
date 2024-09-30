<script lang="ts">
    import { longpress } from "$lib/actions";
    import { ZERO_TILE } from "$lib/boardUtils";
    import Icon from "$lib/components/Icon.svelte";
    import { flags, board, highlightedTile } from "$lib/stores";
    import type {
        RealtimeChannel,
        SupabaseClient,
    } from "@supabase/supabase-js";

    export let position: { x: number; y: number };
    export let state: number | undefined = -2;
    export let supabase: SupabaseClient;
    export let roomId: string;
    export let channel: RealtimeChannel;

    const MINE_TILE = -1;
    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;
    const FALSE_FLAG_TILE = -4;

    const NUMBER_COLORS = {
        1: "#3a8ae0",
        2: "#03913e",
        3: "#D0021B",
        4: "#000080",
        5: "#800000",
        6: "#008B8B",
        7: "#8B008B",
        8: "#A9A9A9",
    };
    const HIGHLIGHT_COLORS = {
        1: "#7ccdfc",
        2: "#f0e9df",
        3: "#72c6f7",
    };

    let is_darkened = (11 * position.x + position.y) % 2 === 0 ? true : false;
    $: backgroundColor =
        state === UNKNOWN_TILE ||
        state === FLAGGED_TILE ||
        state === FALSE_FLAG_TILE
            ? is_darkened
                ? "bg-[#3cadf0]"
                : "bg-[#57c1ff]"
            : is_darkened
              ? "bg-[#d9ccb6]"
              : "bg-[#eddfc7]";
    $: icon =
        state === FLAGGED_TILE
            ? "flag"
            : state === MINE_TILE
              ? "mine"
              : state === FALSE_FLAG_TILE
                ? "false"
                : "none";
    $: textColor =
        state && state in NUMBER_COLORS ? NUMBER_COLORS[state as 1] : "#FFFFFF";
    $: hoverColor =
        state !== ZERO_TILE
            ? state === UNKNOWN_TILE || state === FLAGGED_TILE
                ? HIGHLIGHT_COLORS[1]
                : HIGHLIGHT_COLORS[2]
            : backgroundColor;

    $: {
        if ($highlightedTile) {
            const [x, y] = $highlightedTile;
            if (
                Math.abs(position.x - x) <= 1 &&
                Math.abs(position.y - y) <= 1
            ) {
                backgroundColor =
                    state === UNKNOWN_TILE || state === FLAGGED_TILE
                        ? is_darkened
                            ? "bg-[#8ecff5]"
                            : "bg-[#9dd5f5]"
                        : backgroundColor;
            } else {
                backgroundColor =
                    state === UNKNOWN_TILE ||
                    state === FLAGGED_TILE ||
                    state === FALSE_FLAG_TILE
                        ? is_darkened
                            ? "bg-[#3cadf0]"
                            : "bg-[#57c1ff]"
                        : is_darkened
                          ? "bg-[#d9ccb6]"
                          : "bg-[#eddfc7]";
            }
        }
    }

    async function postTile() {
        const { x, y } = position;

        if ($board && $board[x][y] !== UNKNOWN_TILE) return;

        const { data, error } = await supabase.auth.getSession();

        if (error) return;

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
            const returned_tile = JSON.parse((await response.json())[0]);

            console.log(returned_tile);

            if (!$board) return;

            if ("x" in returned_tile) {
                const { x, y, state } = returned_tile;

                $board[x][y] = state;
            } else {
                for (const [id, state] of new Map(
                    Object.entries(returned_tile),
                )) {
                    const [_x, _y] = id.split(",");
                    const [x, y] = [Number(_x), Number(_y)];

                    $board[x][y] = state as number;
                }
            }

            $board = $board;
        }
    }

    async function flagTile() {
        const { x, y } = position;

        if (
            $board &&
            $board[x][y] !== UNKNOWN_TILE &&
            $board[x][y] !== FLAGGED_TILE
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

        $board[x][y] = new_tile ? FLAGGED_TILE : UNKNOWN_TILE;
        $board = $board;

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
</script>

<!--Disable right click on the buttons by preventing default on contextmenu-->
<button
    id={`${position.x},${position.y},${state}`}
    class="{state !== 0
        ? 'tile'
        : ''} flex {backgroundColor} justify-self-stretch items-center justify-center text-lg font-metropolis font-semibold"
    style="color: {textColor}; --hover-color: {hoverColor};"
    use:longpress
    on:longpress={flagTile}
    on:contextmenu|preventDefault={flagTile}
    on:click|preventDefault={postTile}
>
    {#if icon === "flag"}
        <Icon name="flag" height="22.875px" width="25.5px" />
    {:else if icon === "mine"}
        <Icon name="mine" height="22.875px" width="25.5px" />
    {:else if icon === "false"}
        <Icon name="false" height="22.875px" width="25.5px" />
    {/if}
    <!--Show the number-->
    {#if state && state > 0}
        {state}
    {/if}
</button>
