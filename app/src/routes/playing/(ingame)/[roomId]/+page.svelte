<script lang="ts">
    import { page } from "$app/stores";
    import Board from "$lib/components/Board.svelte";
    import Cursor from "$lib/components/Cursor.svelte";
    import { connected, getSocket } from "$lib/webhook";
    import { onMount } from "svelte";
    import { addToast } from "$lib/components/Toaster.svelte";
    import PlayerList from "$lib/components/PlayerList.svelte";
    import BoardStats from "$lib/components/BoardStats.svelte";

    export let data: {
        board: Array<Array<number>> | undefined;
        players: Array<{ nickname: string; color: string }>;
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

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let domrect: DOMRect | undefined;

    // Nickname: [x, y, hsl color]
    let player_positions: Map<string, [number, number, string]> = new Map();

    function windowResized() {
        domrect = element.getBoundingClientRect();
    }

    function clamp(num: number, min: number, max: number) {
        return Math.min(Math.max(num, min), max);
    }

    function handleMouseMove(event: MouseEvent) {
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
            socket?.emit("mouse_move", x, y);
        }
    }

    onMount(() => {
        if (roomId && !connected) {
            socket?.emit("join_room", roomId);
        }

        socket?.on("connect_error", (error) => {
            addToast({
                data: {
                    title: error.name,
                    description: error.message,
                    color: "red",
                },
            });
        });

        socket?.on("update_player_mouse", ({ nickname, color, x, y }) => {
            player_positions.set(nickname, [x, y, color]);
            player_positions = player_positions;
        });

        domrect = element.getBoundingClientRect();

        for (const { nickname, color } of data["players"]) {
            player_positions.set(nickname, [0, 0, color]);
            player_positions = player_positions;
        }

        return () => {
            socket?.disconnect();
        };
    });
</script>

<svelte:window on:resize={windowResized} />

<main
    class="h-[100vh] grid grid-cols-3 items-center justify-items-center overflow-hidden"
>
    {#if roomId && socket}
        <BoardStats time_started={data.time} />
        <Board
            bind:element
            class="col-start-2 relative"
            {socket}
            board={data.board}
            on:mousemove={handleMouseMove}
        >
            <div slot="players">
                {#each player_positions as [nickname, [x, y, color]] (nickname)}
                    <Cursor height="32px" width="32px" {x} {y} {color} />
                {/each}
            </div>
        </Board>
    {/if}

    <PlayerList players={player_positions} />
</main>
