<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import Board from "$lib/board.svelte";
    import { connected, socket } from "$lib/webhook";
    import { onMount } from "svelte";

    export let data: {
        board: Array<Array<number>> | undefined;
    };

    const roomId = $page.params["roomId"];

    onMount(() => {
        if (roomId && !connected) {
            socket.emit("join_room", roomId);
        }
    });
</script>

{#if roomId}
    <Board {roomId} board={data.board} />
{/if}
