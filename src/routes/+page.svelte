<script lang="ts">
    import { goto } from "$app/navigation";
    import { socket } from "$lib/webhook";

    let roomId: string = "";

    function handleRoomJoin() {
        console.log(roomId);
        socket.emit("join_room", roomId);
    }
</script>

<main
    class="h-[100vh] flex text-center flex-col justify-center items-center bg-[#3278a1]"
>
    <h1 class="font-display m-8 h-10 text-7xl text-text">Minesweeper</h1>
    <h2>I'll make this look better eventually 😭</h2>
    <form on:submit|preventDefault={handleRoomJoin}>
        <input
            bind:value={roomId}
            name="room code"
            placeholder="Enter room code"
        />
        <button>Enter</button>
    </form>
</main>
