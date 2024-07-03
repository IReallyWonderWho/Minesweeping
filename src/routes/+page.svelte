<script lang="ts">
    import { onMount } from "svelte";
    import { enhance } from "$app/forms";
    import Icon from "$lib/components/Icon.svelte";

    let roomId: string = "";

    onMount(async () => {
        console.log(
            await fetch("/api/join_room", {
                roomId: "JOE MAMA",
            }),
        );
    });
</script>

<main class="h-[100vh] hero">
    <div class="hero-content flex-col">
        <h1
            class="font-display m-8 h-10 text-5xl text-primary-100 tracking-[-0.1em] z-10 drop"
        >
            Minesweeper
        </h1>
        <Icon
            class="mt-[-175px] ml-[-375px] absolute z-0 -rotate-45"
            name="flag"
            height="3rem"
            width="3rem"
        />

        <div class="card card-compact rounded-lg w-72 bg-primary-400">
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
    </div>
</main>
