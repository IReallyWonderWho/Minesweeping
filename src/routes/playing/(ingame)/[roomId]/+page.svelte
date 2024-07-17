<script lang="ts">
    import { page } from "$app/stores";
    import Board from "$lib/components/Board.svelte";
    import Cursor from "$lib/components/Cursor.svelte";
    import { onMount } from "svelte";
    import { addToast } from "$lib/components/Toaster.svelte";
    import PlayerList from "$lib/components/PlayerList.svelte";
    import BoardStats from "$lib/components/BoardStats.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { flags } from "$lib/stores";

    const UNKNOWN_TILE = -2;

    export let data: {
        board: Array<Array<number>> | undefined;
        time: string | undefined;
        flags:
            | {
                  [key: string]: boolean;
              }
            | undefined;
    };

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

    const user_id = supabase.auth.getUser().then((data) => data.data.user?.id);

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let domrect: DOMRect | undefined;

    // User id: { x, y, color, nickname }
    let player_positions: Map<
        string,
        { nickname: string; x: number; y: number; color: string }
    > = new Map();

    // This keeps the cursor inside the board even when the window size changes
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
            roomChannel.send({
                type: "broadcast",
                event: "mouseUpdate",
                payload: { x, y, user_id: await user_id },
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

    // Keep this outside the mount, so board can use it after mounting
    $flags = new Map(Object.entries(data.flags ?? {}));

    onMount(() => {
        // Set up database connections && presence
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

                    addToast({
                        data: {
                            title: won ? "You Won! 🥳" : "Game Over 💥",
                            description: won
                                ? "Congratulations, you finished!"
                                : `${player}'s mouse gained sentience and clicked on a mine`,
                            color: "red",
                        },
                    });
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

                const { data, error } = await supabase
                    .from("room_players")
                    .select("nickname, color")
                    .eq("user_id", await user_id)
                    .limit(1);

                if (error) return;

                const { nickname, color } = data[0];

                roomChannel.track({
                    nickname,
                    color,
                    user: await user_id,
                });
            });

        domrect = element.getBoundingClientRect();

        return () => {
            supabase.removeChannel(roomChannel);
        };
    });
</script>

<svelte:window on:resize={windowResized} />

<main
    class="h-[100vh] grid grid-cols-3 items-center justify-items-center overflow-hidden relative"
>
    {#if roomId}
        <!--If the board isn't created yet, make a temporary one just so the code works lol-->
        <!--This doesn't take into possibility different screen sizes, i'll deal with that later-->
        <BoardStats
            class="top-20 absolute text-center"
            time_started={data.time}
            board={data.board ?? createTempBoard()}
        />
        <Board
            bind:element
            class="col-start-2 relative"
            {roomId}
            board={data.board ?? createTempBoard()}
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
    {/if}

    <PlayerList players={player_positions} />
</main>
