<script lang="ts">
    import { page } from "$app/stores";
    import { addToast } from "$lib/components/Toaster.svelte";
    import { decode, addSpace } from "$lib/utility";
    import { enhance } from "$app/forms";

    export let form: any;

    let roomId = $page.url.searchParams.get("roomId");
    const creatingRoom = $page.url.searchParams.get("creating");
    const title = addSpace(decode(Number(roomId)));

    let nickname = "";
    let pressed = false;

    $: if (form?.error) {
        addToast({
            data: {
                title: "Nickname submission",
                description: form.error,
                color: "red",
            },
        });
        pressed = false;
    }
</script>

<svelte:head>
    <title>{creatingRoom ? "Room" : title} › Nickname</title>
</svelte:head>

<div class="hero min-h-screen bg-background">
    <div class="hero-content flex-col text-center">
        <div class="card card-compact rounded-lg w-72 bg-primary-400">
            <form
                use:enhance
                method="POST"
                class="card-body"
                on:submit|preventDefault={() => (pressed = true)}
            >
                <h2
                    class="card-title text-xl text-primary-800 font-metropolis font-bold self-center text-center"
                >
                    Hello, my name is
                </h2>
                <input
                    name="nickname"
                    class="input focus:ring-2 focus:ring-gray-500 border-gray-500 bg-white text-gray-500 text-center font-metropolis font-bold"
                    placeholder="Bob"
                    required
                    bind:value={nickname}
                />
                <input class="hidden" name="creating" value={creatingRoom} />
                <input class="hidden" name="roomId" value={roomId} />
                <button
                    class="btn min-h-10 h-10 {pressed
                        ? 'btn-disabled'
                        : 'btn-neutral'}">Enter</button
                >
            </form>
        </div>
    </div>
</div>
