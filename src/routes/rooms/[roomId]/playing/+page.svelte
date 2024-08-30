<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Board from "$lib/components/BoardComponents/Board.svelte";
    import Cursor from "$lib/components/Cursor.svelte";
    import { onMount } from "svelte";
    import { addToast } from "$lib/components/Toaster.svelte";
    import PlayerList from "$lib/components/Player/PlayerList.svelte";
    import BoardStats from "$lib/components/BoardComponents/BoardStats.svelte";
    import ConfettiStage from "$lib/components/Confetti/ConfettiStage.svelte";
    import {
        flags,
        confetti,
        windowRect,
        type roomData,
        players,
    } from "$lib/stores";
    import { clamp, decode, addSpace } from "$lib/utility";
    import { createTempBoard } from "$lib/boardUtils";

    export let data: roomData;

    const roomId = $page.params["roomId"];
    const channel = data.supabase.channel(`room:${roomId}`);

    // If the mouse distance moved is under 10 pixels, it's not worth sending
    // an update
    const CHANGE_THRESHOLD = 10;
    // Approximately 15 FPS
    const UPDATE_FPS = 66.667;

    const user_id = data.user.id;

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let correctBoard: Array<Array<number>> | undefined;
    let gameEnded: boolean = false;

    $: {
        if (element) {
            $windowRect = element.getBoundingClientRect();
        }
    }

    // This keeps the cursor inside the board even when the window size changes
    function windowResized() {
        $windowRect = element.getBoundingClientRect();
    }

    async function handleMouseMove(event: MouseEvent) {
        const now = Date.now();

        if (now - last_call < UPDATE_FPS) return;
        if (!$windowRect) return;

        const { pageX, pageY } = event;
        const { top, right, bottom, left, width, height } = $windowRect;
        const [x2, y2] = [
            clamp(pageX - left, 0, right - left),
            clamp(pageY - top, 0, bottom - top),
        ];

        const [x, y] = [x2 - previous_position[0], y2 - previous_position[1]];
        // a^2 + b^2 = c^2
        const distance = Math.sqrt(x ** 2 + y ** 2);

        last_call = now;

        console.log(distance);

        if (distance >= CHANGE_THRESHOLD) {
            const scaled_x = x2 / width;
            const scaled_y = y2 / height;

            previous_position = [x2, y2];

            await channel.send({
                type: "broadcast",
                event: "mouseUpdate",
                payload: { x: scaled_x, y: scaled_y, user_id: user_id },
            });
        }
    }

    onMount(() => {
        const room = data.room;
        console.log(room.started);
        if (!room.started)
            return goto(`/rooms/${roomId}`, { invalidateAll: true });
        $flags = new Map(Object.entries(room.flags.flags ?? {}));

        channel
            .on("broadcast", { event: "mouseUpdate" }, ({ payload }) => {
                const data = $players.get(payload.user_id);

                console.log(data);

                if (!data) return;

                const { color, nickname } = data;

                $players.set(payload.user_id, {
                    x: payload.x,
                    y: payload.y,
                    color,
                    nickname,
                });
                $players = $players;
            })
            .on(
                "broadcast",
                {
                    event: "gameOver",
                },
                ({ payload }) => {
                    const won = payload.won;
                    const player = payload.player;

                    correctBoard = payload.board;
                    gameEnded = true;

                    addToast({
                        data: {
                            title: won ? "You Won! 🥳" : "Game Over 💥",
                            description: won
                                ? "Congratulations, you finished!"
                                : `${player}'s mouse gained sentience and clicked on a mine`,
                            color: "red",
                        },
                    });

                    if (won) {
                        $confetti = [true];
                    }

                    setTimeout(() => {
                        $confetti = [false];
                        goto(`/rooms/${roomId}/`, { invalidateAll: true });
                        $flags = new Map();
                    }, 5500);
                },
            )
            .subscribe();
    });
</script>

<svelte:head>
    <title>{addSpace(decode(Number(roomId)))} › Playing</title>
</svelte:head>
<svelte:window on:resize={windowResized} />

<main
    class="h-[100vh] grid grid-cols-3 items-center justify-items-center overflow-hidden relative"
>
    <ConfettiStage />
    {#if roomId}
        <!--If the board isn't created yet, make a temporary one just so the code works-->
        <!--This doesn't take into possibility different screen sizes, i'll deal with that later-->
        <BoardStats
            class="top-[11vh] left-1/2 absolute z-10"
            style="transform: translateX(-50%)"
            time_started={data.room.created_at}
            board={data.room.client_board ??
                createTempBoard(data.room.rows_columns)}
            ratio={data.room.mine_ratio}
            shouldTimerStop={gameEnded}
        />
        <Board
            bind:element
            class="col-start-2 relative max-w-[70vh]"
            {roomId}
            {correctBoard}
            started={data.room.started}
            board={data.room.client_board ??
                createTempBoard(data.room.rows_columns)}
            on:mousemove={handleMouseMove}
            supabase={data.supabase}
        >
            <div slot="players">
                {#each $players as [player_id, { x, y, color }] (player_id)}
                    <!--Don't let the users see their own cursor-->
                    {#if user_id !== player_id}
                        <Cursor height="32px" width="32px" {x} {y} {color} />
                    {/if}
                {/each}
            </div>
        </Board>
    {/if}

    <PlayerList />
</main>
