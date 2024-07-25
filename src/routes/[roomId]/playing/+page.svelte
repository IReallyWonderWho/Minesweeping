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
    import { supabase } from "$lib/supabaseClient";
    import { flags, confetti, windowRect, type roomData } from "$lib/stores";
    import { clamp } from "$lib/utility";
    import { UNKNOWN_TILE } from "$lib/sharedExpectations";

    export let data: roomData;

    const roomId = $page.params["roomId"];
    const roomChannel = supabase.channel(`room:${roomId}`, {
        config: {
            presence: { key: roomId },
        },
    });

    // If the mouse distance moved is under 10 pixels, it's not worth sending
    // an update
    const CHANGE_THRESHOLD = 10;
    // Approximately 15 FPS
    const UPDATE_FPS = 66.667;

    const user_id = data.userPromise.then((data) => data.id);
    const temp_board = createTempBoard();

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let correctBoard: Array<Array<number>> | undefined;

    // User id: { x, y, color, nickname }
    let player_positions: Map<
        string,
        { nickname: string; x: number; y: number; color: string }
    > = new Map();

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

        if (distance >= CHANGE_THRESHOLD) {
            const scaled_x = x / width;
            const scaled_y = y / height;

            roomChannel.send({
                type: "broadcast",
                event: "mouseUpdate",
                payload: { x: scaled_x, y: scaled_y, user_id: await user_id },
            });
        }
    }

    function createTempBoard() {
        let real_board = [];

        for (let x = 0; x < 12; x++) {
            const row: Array<number> = [];
            for (let y = 0; y < 12; y++) {
                row.push(UNKNOWN_TILE);
            }
            real_board.push(row);
        }

        return real_board;
    }

    onMount(() => {
        data.roomPromise.then((room) => {
            $flags = new Map(Object.entries(room.flags ?? {}));
        });
        // Set up database connections && presence
        // This is really ugly but i'm too lazy to change it for now
        roomChannel
            .on("broadcast", { event: "mouseUpdate" }, ({ payload }) => {
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
                        $confetti = !$confetti;
                    }
                },
            )
            .on("presence", { event: "sync" }, () => {
                const newState = roomChannel.presenceState()[
                    roomId
                ] as unknown as Array<{
                    user: string;
                    nickname: string;
                    color: string;
                }>;
                const players = new Map();

                for (const { user, nickname, color } of newState ?? []) {
                    players.set(user, {
                        x: 0,
                        y: 0,
                        nickname,
                        color,
                    });
                }

                player_positions = players;
            })
            .on("presence", { event: "join" }, async ({ newPresences }) => {
                const { user, nickname, color } = newPresences[0];

                player_positions.set(user, {
                    x: 0,
                    y: 0,
                    nickname,
                    color,
                });
                player_positions = player_positions;
            })
            .on("presence", { event: "leave" }, async ({ leftPresences }) => {
                const { user } = leftPresences[0];

                player_positions.delete(user);
                player_positions = player_positions;
            })
            .subscribe(async (status) => {
                if (status !== "SUBSCRIBED") return;

                try {
                    const { nickname, color } = (await data.userPromise)
                        .playerData;

                    roomChannel.track({
                        nickname,
                        color,
                        user: await user_id,
                    });
                } catch {
                    goto("/");
                }
            });

        return () => {
            supabase.removeChannel(roomChannel);
        };
    });
</script>

<svelte:window on:resize={windowResized} />

<main
    class="h-[100vh] grid grid-cols-3 items-center justify-items-center overflow-hidden relative"
>
    <ConfettiStage />
    {#if roomId}
        {#await data.roomPromise}
            <Board
                bind:element
                class="col-start-2 relative"
                initalFlags={$flags}
                {roomId}
                {correctBoard}
                board={temp_board}
            />
        {:then room}
            <!--If the board isn't created yet, make a temporary one just so the code works lol-->
            <!--This doesn't take into possibility different screen sizes, i'll deal with that later-->
            <BoardStats
                class="top-[11vh] fixed text-center z-10"
                time_started={room.created_at}
                board={room.client_board ?? temp_board}
            />
            <Board
                bind:element
                class="col-start-2 relative"
                {roomId}
                {correctBoard}
                initalFlags={$flags}
                board={room.client_board ?? temp_board}
                on:mousemove={handleMouseMove}
            >
                <div slot="players">
                    {#each player_positions as [player_id, { x, y, color }] (player_id)}
                        {#await user_id then id}
                            <!--Don't let the users see their own cursor-->
                            {#if id !== player_id}
                                <Cursor
                                    height="32px"
                                    width="32px"
                                    {x}
                                    {y}
                                    {color}
                                />
                            {/if}
                        {/await}
                    {/each}
                </div>
            </Board>
        {/await}
    {/if}

    <PlayerList players={player_positions} />
</main>
