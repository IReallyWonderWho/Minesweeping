<script lang="ts">
    import { goto } from "$app/navigation";
    import { enhance } from "$app/forms";
    import Icon from "$lib/components/Icon.svelte";

    let roomId: string = "";

    async function createRoom() {
        await goto("/nickname?creating=true");
    }
</script>

<svelte:head>
    <title>Minesweeping</title>
    <meta
        name="description"
        content="Minesweeping is an online multiplayer minesweeper game. Play with other people online and clear minesweeper boards together!"
    />
</svelte:head>
<main class="hero min-h-screen">
    <div class="hero-content flex-col">
        <h1
            class="font-display m-8 h-10 text-3xl sm:text-5xl text-primary-100 tracking-[-0.14em] z-10 drop"
        >
            Minesweeping
        </h1>
        <Icon
            class="mt-[-175px] ml-[-225px] sm:ml-[-375px] absolute z-0 -rotate-12"
            name="flag"
            height="3rem"
            width="3rem"
        />

        <div class="card card-compact rounded-lg w-72 bg-primary-400">
            <form
                method="POST"
                action="/api/room?/join"
                class="card-body"
                use:enhance
            >
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

        <form on:submit|preventDefault={createRoom} class="absolute bottom-5">
            <button class="btn drop-shadow-xl">Create a room</button>
        </form>
    </div>
    <div class="fixed bottom-5 left-5">
        <a
            href="https://github.com/IReallyWonderWho/Minesweeping"
            class="fill-primary-100 hover:fill-primary-900 transition"
        >
            <svg
                height="26"
                aria-hidden="true"
                viewBox="0 0 16 16"
                version="1.1"
                width="26"
                data-view-component="true"
            >
                <path
                    fill-rule="evenodd"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                ></path>
            </svg>
        </a>
    </div>
</main>
