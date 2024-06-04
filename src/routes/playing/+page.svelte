<script lang="ts">
    import { page } from "$app/stores";
    import Board from "$lib/board.svelte";
    import { connected, socket } from "$lib/webhook";
    import { onMount } from "svelte";

    const roomId = $page.url.searchParams.get("roomId");

    onMount(() => {
        if (!connected && roomId) {
            socket.emit("join_room", roomId);
        }
    });
</script>

{#if roomId}
    <Board {roomId} />
{/if}
