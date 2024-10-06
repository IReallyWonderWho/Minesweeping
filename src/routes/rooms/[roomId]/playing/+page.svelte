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
        board,
        confetti,
        windowRect,
        type roomData,
        players,
        highlightedTile,
    } from "$lib/stores";
    import { clamp, decode, addSpace } from "$lib/utility";
    import { createTempBoard } from "$lib/boardUtils";
    import { Controller } from "$lib/components/Controller";

    export let data: roomData;

    const roomId = $page.params["roomId"];
    const channel = data.supabase.channel(`room:${roomId}`);

    // If the mouse distance moved is under 10 pixels, it's not worth sending
    // an update
    const CHANGE_THRESHOLD = 10;
    // Approximately 15 FPS
    const UPDATE_FPS = 66.667;
    const UNKNOWN_TILE = -2;

    const user_id = data.user.id;

    let previous_position: [number, number] = [0, 0];
    let last_call = Date.now();

    let element: any;
    let correctBoard:
        | {
              board: Array<Array<number>>;
              won: boolean;
          }
        | undefined;
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

    async function updateHighlight() {
        if (Controller.getKey(["leftMouse", "rightMouse"]) && $windowRect) {
            const { top, left } = $windowRect;
            const id = document
                .elementFromPoint(
                    previous_position[0] + left,
                    previous_position[1] + top,
                )
                ?.id?.split(",");

            if (id) {
                const [x, y] = [Number(id[0]), Number(id[1])];
                $highlightedTile = [x, y];
            }
        } else {
            $highlightedTile = [-999, -999];
        }
    }

    async function pressHighlightedTile(event: MouseEvent) {
        if ($windowRect && Controller.getKey(["leftMouse", "rightMouse"])) {
            const element = document.elementFromPoint(event.x, event.y);
            const id = element?.id?.split(",");

            if (id) {
                const [x, y, state] = [
                    Number(id[0]),
                    Number(id[1]),
                    Number(id[2]),
                ];
                let amount_of_flags = 0;

                for (let x_offsett = -1; x_offsett < 2; x_offsett++) {
                    for (let y_offsett = -1; y_offsett < 2; y_offsett++) {
                        if (x === 0 && y === 0) continue;

                        const id = `${x + x_offsett},${y + y_offsett}`;

                        if ($flags.get(id)) {
                            amount_of_flags++;
                        }
                    }
                }

                if (state === amount_of_flags) {
                    console.log("HELLO!!");
                    const { data: supabaseData, error } =
                        await data.supabase.auth.getSession();

                    if (error) return;

                    const accessToken = supabaseData.session?.access_token;

                    const tiles = [];

                    for (let x_offset = -1; x_offset < 2; x_offset++) {
                        for (let y_offset = -1; y_offset < 2; y_offset++) {
                            const row = $board[x + x_offset];

                            if (!row) continue;

                            const tile = row[y + y_offset];

                            if (tile === UNKNOWN_TILE) {
                                tiles.push([x + x_offset, y + y_offset]);
                            }
                        }
                    }

                    console.log(tiles);

                    const response = await fetch("/api/room/tiles", {
                        method: "POST",
                        body: JSON.stringify({
                            tiles,
                            roomId,
                        }),
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    });

                    const returned_tiles = await response.json();

                    console.log(returned_tiles);

                    for (const json_tile of returned_tiles) {
                        const tile = JSON.parse(json_tile);

                        if ("x" in tile) {
                            const { x, y, state } = tile;

                            $board[x][y] = state;
                        } else {
                            for (const [id, state] of new Map(
                                Object.entries(tile),
                            )) {
                                const [_x, _y] = id.split(",");
                                const [x, y] = [Number(_x), Number(_y)];

                                $board[x][y] = state as number;
                            }
                        }
                    }

                    $board = $board;
                }
            }
        }
    }

    $board = data.room.client_board || createTempBoard(data.room.rows_columns);

    onMount(() => {
        const room = data.room;

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

                    correctBoard = {
                        board: payload.board,
                        won,
                    };
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

        const keyPressed = (event: MouseEvent) => {
            if (event.button === 0) {
                Controller.keyPressed("leftMouse");
                pressHighlightedTile(event);
            } else if (event.button === 2) {
                Controller.keyPressed("rightMouse");
            }
        };
        const keyReleased = (event: MouseEvent) => {
            if (event.button === 0) {
                Controller.keyReleased("leftMouse");
            } else if (event.button === 2) {
                Controller.keyReleased("rightMouse");
            }
        };

        document.addEventListener("mousedown", keyPressed);
        document.addEventListener("mouseup", keyReleased);
        document.addEventListener("pointerdown", keyPressed);
        document.addEventListener("pointerup", keyReleased);

        const highlight = setInterval(() => {
            updateHighlight();
        });

        return () => {
            document.removeEventListener("mousedown", keyPressed);
            document.removeEventListener("mouseup", keyReleased);
            document.removeEventListener("pointerup", keyPressed);
            document.removeEventListener("pointerdown", keyReleased);

            clearInterval(highlight);
        };
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
            ratio={data.room.mine_ratio}
            shouldTimerStop={gameEnded}
        />
        <Board
            bind:element
            class="col-start-2 relative max-w-[70vh]"
            {roomId}
            {correctBoard}
            started={data.room.started}
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
