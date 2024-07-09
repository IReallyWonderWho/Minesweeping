<script lang="ts">
    import { page } from "$app/stores";
    import Board from "$lib/components/Board.svelte";
    import Cursor from "$lib/components/Cursor.svelte";
    import { connected, getSocket } from "$lib/webhook";
    import { onMount } from "svelte";
    import { addToast } from "$lib/components/Toaster.svelte";
    import PlayerList from "$lib/components/PlayerList.svelte";
    import BoardStats from "$lib/components/BoardStats.svelte";
    import { supabase } from "$lib/supabaseClient";
    import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

    export let data: {
        board: Array<Array<number>> | undefined;
        players: Array<{ nickname: string; color: string; user_id: string }>;
        time: number | undefined;
    };

    const roomId = $page.params["roomId"];
    const socket = roomId ? getSocket(roomId) : undefined;

    // TODO, move mouse logic to cursor when possible
    // If the mouse distance moved is under 10 pixels, it's not worth sending
    // an update to the server
    const CHANGE_THRESHOLD = 10;
    // Approximately 15 FPS
    const UPDATE_FPS = 66.667;

    // Remove self broadcast later once done testing
    const channel = supabase.channel(roomId, {
        config: {
            broadcast: { self: true },
        },
    });
    const user_id = supabase.auth.getUser().then((data) => data.data.user?.id);

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let domrect: DOMRect | undefined;

    // Nickname: [x, y, hsl color]
    let player_positions: Map<
        string,
        { nickname: string; x: number; y: number; color: string }
    > = new Map();

    function windowResized() {
        domrect = element.getBoundingClientRect();
    }

    function clamp(num: number, min: number, max: number) {
        return Math.min(Math.max(num, min), max);
    }

    async function handleMouseMove(event: MouseEvent) {
        const now = Date.now();

        if (now - last_call < UPDATE_FPS) return;
        if (!domrect) return;

        const { pageX, pageY } = event;
        const { top, right, bottom, left } = domrect;
        const [x2, y2] = [
            clamp(pageX - left, 0, right - left),
            clamp(pageY - top, 0, bottom - top),
        ];

        const [x, y] = [x2 - previous_position[0], y2 - previous_position[1]];
        // a^2 + b^2 = c^2
        const distance = Math.sqrt(x ** 2 + y ** 2);

        last_call = now;

        if (distance >= CHANGE_THRESHOLD) {
            channel.send({
                type: "broadcast",
                event: "mouseUpdate",
                payload: { x, y, user_id: await user_id },
            });
        }
    }

    onMount(() => {
        channel.on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "room_players",
                filter: `room_id=eq.${roomId}`,
            },
            (
                payload: RealtimePostgresInsertPayload<{
                    user_id: string;
                    nickname: string;
                    color: string;
                }>,
            ) => {
                player_positions.set(payload.new.user_id, {
                    x: 0,
                    y: 0,
                    color: payload.new.color,
                    nickname: payload.new.nickname,
                });
                player_positions = player_positions;
            },
        );

        channel.on("broadcast", { event: "mouseUpdate" }, ({ payload }) => {
            const data = player_positions.get(payload.user_id);

            if (!data) return;

            const { color, nickname } = data;

            player_positions.set(payload.user_id, {
                x: payload.x,
                y: payload.y,
                color,
                nickname,
            });
            player_positions = player_positions;
        });

        domrect = element.getBoundingClientRect();

        for (const { nickname, color, user_id } of data["players"]) {
            player_positions.set(user_id, { x: 0, y: 0, color, nickname });
            player_positions = player_positions;
        }

        if (roomId && !connected) {
            channel.subscribe((status) => {
                if (status !== "SUBSCRIBED") {
                    addToast({
                        data: {
                            title: "Unable to connect",
                            description: "Unable to join room channel",
                            color: "red",
                        },
                    });
                    return;
                }
            });
        }

        return () => {
            supabase.removeChannel(channel);
        };
    });
</script>

<svelte:window on:resize={windowResized} />

<main
    class="h-[100vh] grid grid-cols-3 items-center justify-items-center overflow-hidden"
>
    {#if roomId && channel}
        <BoardStats time_started={data.time} />
        <Board
            bind:element
            class="col-start-2 relative"
            {roomId}
            {channel}
            board={data.board}
            on:mousemove={handleMouseMove}
        >
            <div slot="players">
                {#each player_positions as [nickname, { x, y, color }] (nickname)}
                    <Cursor height="32px" width="32px" {x} {y} {color} />
                {/each}
            </div>
        </Board>
    {/if}

    <PlayerList players={player_positions} />
</main>
