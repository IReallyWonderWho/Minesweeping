<script lang="ts">
    import Icon from "$lib/icon.svelte";
    import { socket } from "$lib/webhook";

    let roomId: string = "";

    function handleRoomJoin() {
        console.log(roomId);
        socket.emit("join_room", roomId);
    }
</script>

<main class="h-[100vh] flex text-center flex-col justify-center items-center">
    <h1 class="font-display m-8 h-10 text-5xl text-text tracking-[-0.1em]">
        Minesweeper
    </h1>
    <div
        class="flex flex-col justify-center items-center w-72 bg-[#92CDE6] rounded-lg"
    >
        <form on:submit|preventDefault={handleRoomJoin}>
            <input
                class="w-64 h-11 text-center text-[#797979] font-sans font-bold rounded-lg border-[#797979] bg-white border-[3px] mt-4 mb-[9px]"
                bind:value={roomId}
                placeholder="Input room code"
            />
            <button
                class="w-56 h-11 text-text font-sans font-extrabold text-xl bg-[#5A8293] rounded-lg mb-4"
                >Enter</button
            >
        </form>
    </div>
</main>
