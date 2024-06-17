<script lang="ts">
    import { enhance } from "$app/forms";
    import { socket } from "$lib/webhook";

    let roomId: string = "";

    function handleRoomJoin() {
        console.log(roomId);
        socket.emit("join_room", roomId);
    }
</script>

<main class="h-[100vh] flex text-center flex-col justify-center items-center">
    <h1 class="font-display m-8 h-10 text-5xl text-text-500 tracking-[-0.1em]">
        Minesweeper
    </h1>

    <div class="card card-compact rounded-lg w-72 bg-primary-600">
        <form method="POST" class="card-body" use:enhance>
            <input
                name="roomId"
                class="input focus:ring-2 focus:ring-gray-500 border-gray-500 bg-white text-gray-500 text-center font-metropolis font-bold"
                bind:value={roomId}
                placeholder="Input room code"
                required
            />
            <button class="btn btn-neutral min-h-10 h-10">Enter</button>
        </form>
    </div>
</main>
