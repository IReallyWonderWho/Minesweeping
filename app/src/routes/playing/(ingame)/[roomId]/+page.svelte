<script lang="ts">
    import { page } from "$app/stores";
    import Board from "$lib/Board.svelte";
    import { connected, getSocket } from "$lib/webhook";
    import { onMount } from "svelte";
    import { addToast } from "$lib/Toaster.svelte";

    export let data: {
        board: Array<Array<number>> | undefined;
    };

    const roomId = $page.params["roomId"];
    const socket = roomId ? getSocket(roomId) : undefined;

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

        return () => {
            socket?.disconnect();
        };
    });
</script>

{#if roomId && socket}
    <Board {socket} {roomId} board={data.board} />
{/if}
