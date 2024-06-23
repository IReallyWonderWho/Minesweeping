<script lang="ts">
    import { page } from "$app/stores";
    import Board from "$lib/components/Board.svelte";
    import Player from "$lib/components/Player.svelte";
    import { connected, getSocket } from "$lib/webhook";
    import { onMount, type ComponentType, SvelteComponent } from "svelte";
    import { addToast } from "$lib/components/Toaster.svelte";

    export let data: {
        board: Array<Array<number>> | undefined;
    };

    const roomId = $page.params["roomId"];
    const socket = roomId ? getSocket(roomId) : undefined;

    // If the mouse distance moved is under 10 pixels, it's not worth sending
    // an update to the server
    const CHANGE_THRESHOLD = 10;
    // Approximately 15 FPS
    const UPDATE_FPS = 66.667;

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let domrect: DOMRect | undefined;

    // Nickname: [x, y]
    let player_positions: Map<string, [number, number]> = new Map();

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

        console.log(`x: ${x2}, y: ${y2}`);

        const [x, y] = [x2 - previous_position[0], y2 - previous_position[1]];
        // a^2 + b^2 = c^2
        const distance = Math.sqrt(x ** 2 + y ** 2);

        last_call = now;

        if (distance >= CHANGE_THRESHOLD) {
            socket?.emit("mouse_move", x, y);
        }
    }

    function windowResized() {
        domrect = element.getBoundingClientRect();
        console.log(domrect);
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

        socket?.on("update_player_mouse", ({ nickname, x, y }) => {
            player_positions.set(nickname, [x, y]);
            player_positions = player_positions;
            console.log(player_positions);
        });

        console.log(element);
        domrect = element.getBoundingClientRect();

        return () => {
            socket?.disconnect();
        };
    });
</script>

<svelte:window on:resize={windowResized} />

<main class="hero items-center justify-center overflow-hidden">
    {#if roomId && socket}
        <Board
            bind:element
            class="relative"
            {socket}
            board={data.board}
            on:mousemove={handleMouseMove}
        >
            <div slot="players">
                {#each player_positions as [nickname, [x, y]] (nickname)}
                    <Player height="32px" width="32px" {x} {y} />
                {/each}
            </div>
        </Board>
    {/if}
</main>
