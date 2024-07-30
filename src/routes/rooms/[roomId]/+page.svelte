<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import PlayerList from "$lib/components/Player/LobbyPlayerList.svelte";
    import { supabase } from "$lib/supabaseClient";
    import {
        players,
        numberOfRowsColumns,
        mineRatio,
        type roomData,
    } from "$lib/stores";
    import Board from "$lib/components/BoardComponents/Board.svelte";
    import { createTempBoard, UNKNOWN_TILE, MINE_TILE } from "$lib/boardUtils";
    import BoardSettings from "$lib/components/BoardComponents/BoardSettings.svelte";
    import { getRandomInt, decode } from "$lib/utility";

    export let data: roomData;

    const roomId = $page.params["roomId"];
    const roomChannel = supabase.channel(`room:${roomId}`, {
        config: {
            presence: { key: roomId },
        },
    });
    const user_id = data.userPromise.then((data) => data.id);

    let board: Array<Array<number>>;
    let previous_mine_ratio = 0;
    let previous_size = 0;

    $: {
        if (
            $numberOfRowsColumns[0] !== previous_size ||
            $mineRatio[0] !== previous_mine_ratio
        ) {
            const new_board = createTempBoard($numberOfRowsColumns[0]);
            let amount_of_mines = Math.floor(
                new_board.length ** 2 / $mineRatio[0],
            );

            previous_mine_ratio = $mineRatio[0];
            previous_size = $numberOfRowsColumns[0];

            while (amount_of_mines > 0) {
                const x = getRandomInt(0, $numberOfRowsColumns[0]);
                const y = getRandomInt(0, $numberOfRowsColumns[0]);

                if (new_board[x][y] === UNKNOWN_TILE) {
                    new_board[x][y] = MINE_TILE;
                    amount_of_mines -= 1;
                }
            }

            roomChannel.send({
                type: "broadcast",
                event: "settingsChanged",
                payload: {
                    settings: [$numberOfRowsColumns[0], $mineRatio[0]],
                },
            });

            board = new_board;
        }
    }

    let element: any;

    async function onStart() {
        // This is secured through postgres' RLS
        await supabase
            .from("rooms")
            .update({
                started: true,
                rows_columns: $numberOfRowsColumns[0],
                mine_ratio: $mineRatio[0],
                client_board: null,
                revealed_tiles: 0,
                flags: {},
                created_at: new Date().toISOString(),
            })
            .eq("id", roomId);
    }

    onMount(() => {
        data.roomPromise.then((room) => {
            if (room.started) {
                goto(`/rooms/${roomId}/playing/`);
            }
        });

        roomChannel
            .on("presence", { event: "sync" }, () => {
                const newState = roomChannel.presenceState()[
                    roomId
                ] as unknown as Array<{
                    user: string;
                    nickname: string;
                    color: string;
                }>;

                for (const { user, nickname, color } of newState ?? []) {
                    $players.set(user, {
                        x: 0,
                        y: 0,
                        nickname,
                        color,
                    });
                }

                $players = $players;
            })
            .on("presence", { event: "join" }, async ({ newPresences }) => {
                const { user, nickname, color } = newPresences[0];

                $players.set(user, {
                    x: 0,
                    y: 0,
                    nickname,
                    color,
                });
                $players = $players;
            })
            .on("presence", { event: "leave" }, async ({ leftPresences }) => {
                const { user } = leftPresences[0];

                $players.delete(user);
                $players = $players;
            })
            .on(
                "broadcast",
                { event: "settingsChanged" },
                async ({ payload }) => {
                    if ((await user_id) !== (await data.roomPromise).host) {
                        const newSize = payload.settings[0];
                        const newRatio = payload.settings[1];

                        $numberOfRowsColumns = [newSize];
                        $mineRatio = [newRatio];
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
                async (payload) => {
                    if (payload.new.started) {
                        await goto(`/rooms/${roomId}/playing/`, {
                            invalidateAll: true,
                        });
                    }
                },
            )
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
                    goto(`/rooms/${roomId}/playing/nickname`);
                }
            });
    });
</script>

<svelte:head>
    <title>{decode(Number(roomId))} › Playing</title>
</svelte:head>

<main class="flex justify-between h-[100vh]">
    <div class="flex-1 flex flex-col items-center justify-center">
        <div class="m-3 text-center">
            <h2 class="text-primary-900 mb-1 font-metropolis">Room code:</h2>
            <h1 class="text-primary-300 text-3xl font-bold font-metropolis">
                XF6 HG7
            </h1>
        </div>
        <Board
            bind:element
            class="max-h-[400px]"
            correctBoard={undefined}
            {board}
            started={false}
            {roomId}
        />
        <!--These are only for the room's host-->
        {#await data.roomPromise then room}
            {#await user_id then id}
                {#if room.host === id}
                    <BoardSettings />
                    <button
                        on:click={onStart}
                        class="btn btn-circle bg-primary-500 text-primary-900 w-[200px] h-[44px] font-metropolis font-bold text-lg m-5"
                        >Start</button
                    >
                {/if}
            {/await}
        {/await}
    </div>
    <PlayerList roomPromise={data.roomPromise} />
</main>
