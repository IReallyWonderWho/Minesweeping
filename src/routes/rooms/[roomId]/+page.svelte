<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import PlayerList from "$lib/components/Player/LobbyPlayerList.svelte";
    import {
        numberOfRowsColumns,
        mineRatio,
        type roomData,
        board,
    } from "$lib/stores";
    import Board from "$lib/components/BoardComponents/Board.svelte";
    import { createTempBoard, UNKNOWN_TILE, MINE_TILE } from "$lib/boardUtils";
    import BoardSettings from "$lib/components/BoardComponents/BoardSettings.svelte";
    import { getRandomInt, decode, addSpace } from "$lib/utility";

    export let data: roomData;

    const roomId = $page.params["roomId"];
    const stringRoomId = addSpace(decode(Number(roomId)));
    const user_id = data.user.id;
    const optionsChannel = data.supabase.channel(`room:${roomId}`);

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

            optionsChannel.send({
                type: "broadcast",
                event: "settingsChanged",
                payload: {
                    settings: [$numberOfRowsColumns[0], $mineRatio[0]],
                },
            });

            $board = new_board;
        }
    }

    let element: any;

    async function onStart() {
        // This is secured through postgres' RLS
        console.log("Hello!");
        await Promise.all([
            data.supabase
                .from("rooms")
                .update({
                    started: true,
                    rows_columns: $numberOfRowsColumns[0],
                    mine_ratio: $mineRatio[0],
                    client_board: null,
                    revealed_tiles: 0,
                    created_at: new Date().toISOString(),
                })
                .eq("id", roomId),
            data.supabase
                .from("flags")
                .update({
                    flags: {},
                })
                .eq("room_id", roomId),
        ]);
    }

    async function checkStarted() {
        const { data: roomData, error } = await data.supabase
            .from("rooms")
            .select("started")
            .eq("id", roomId)
            .single();

        if (error) return;

        console.log(roomData.started);
        if (roomData.started) {
            await goto(`/rooms/${roomId}/playing`, {
                invalidateAll: true,
            });
        }
    }

    onMount(() => {
        const room = data.room;
        if (room.started) {
            goto(`/rooms/${roomId}/playing/`);
        }

        const checkInterval = setInterval(checkStarted, 3000);

        const lobbyChannel = data.supabase.channel(`lobby:${roomId}`);

        lobbyChannel
            .on(
                "broadcast",
                { event: "settingsChanged" },
                async ({ payload }) => {
                    if (user_id !== data.room.host) {
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
                    console.log("BRUH");
                    if (payload.new.started) {
                        console.log("Redirecting");
                        await goto(`/rooms/${roomId}/playing/`, {
                            invalidateAll: true,
                        }).catch((reason) => {
                            console.warn(reason);
                        });
                    }
                },
            )
            .subscribe();

        return () => {
            console.log("Cleaning up");
            clearInterval(checkInterval);
            data.supabase.removeChannel(lobbyChannel);
        };
    });
</script>

<svelte:head>
    <title>{stringRoomId} › Lobby</title>
</svelte:head>

<main class="flex justify-between h-[100vh]">
    <div class="flex-1 flex flex-col items-center justify-center">
        <div class="m-3 text-center">
            <h2 class="text-primary-900 mb-1 font-metropolis">Room code:</h2>
            <h1 class="text-primary-300 text-3xl font-bold font-metropolis">
                {addSpace(stringRoomId)}
            </h1>
        </div>
        <Board
            bind:element
            class="max-w-[30vw]"
            correctBoard={undefined}
            started={false}
            {roomId}
            isLobby={true}
            supabase={data.supabase}
        />
        <!--These are only for the room's host-->
        {#if data.room.host === user_id}
            <BoardSettings />
            <button
                on:click={onStart}
                class="btn btn-circle bg-primary-500 text-primary-900 w-[200px] h-[44px] font-metropolis font-bold text-lg m-5"
                >Start</button
            >
        {/if}
    </div>
    <PlayerList class="hidden lg:flex" room={data.room} />
</main>
