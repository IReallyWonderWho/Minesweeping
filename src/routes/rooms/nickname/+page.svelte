<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { addToast } from "$lib/components/Toaster.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { getRandomHSL, decode, addSpace } from "$lib/utility";
    import { flags } from "$lib/stores.js";

    export let form: any;

    let roomId = $page.url.searchParams.get("roomId");
    const creatingRoom = $page.url.searchParams.get("creating");
    const title = addSpace(decode(Number(roomId)));

    let nickname = "";

    $: if (form?.error) {
        addToast({
            data: {
                title: "Nickname submission",
                description: form.error,
                color: "red",
            },
        });
    }

    type ValidateResult = [true, undefined] | [false, string];

    function validateNickname(nickname: string): ValidateResult {
        if (!nickname || nickname.trim().length < 3) {
            return [false, "Nickname must be at least 3 characters long"];
        }
        if (nickname.trim().length > 12) {
            return [false, "Nickname must not exceed 12 characters"];
        }
        if (!/^[a-zA-Z0-9_ ]+$/.test(nickname.trim())) {
            return [
                false,
                "Nickname can only contain letters, numbers, underscores, and spaces",
            ];
        }

        return [true, undefined];
    }

    let pressed = false;

    async function makePlayer() {
        if (pressed) return;
        pressed = true;

        const color = getRandomHSL();
        let { data: userData, error: playerError } =
            await supabase.auth.getUser();

        if (playerError) {
            const { data, error } = await supabase.auth.signInAnonymously();

            if (error) {
                if (error.message)
                    addToast({
                        data: {
                            title: "Unable to sign in anonymously",
                            description: `Supabase error: ${error.message}`,
                            color: "red",
                        },
                    });
                pressed = false;
                return;
            }

            userData = data;
        }

        const [valid, error] = validateNickname(nickname);

        if (!valid) {
            addToast({
                data: {
                    title: "Invalid nickname",
                    description: error,
                    color: "red",
                },
            });
            pressed = false;
            return;
        }

        const user_id = userData.user?.id;

        if (creatingRoom) {
            const response = await fetch("/api/room?/create", {
                method: "POST",
                body: JSON.stringify({
                    userId: user_id,
                }),
            });
            const json = await response.json();
            const data = JSON.parse(json.data);

            roomId = data[0];
        }

        const { error: joinError } = await supabase
            .from("room_players")
            .upsert({
                user_id,
                room_id: roomId,
                color,
                nickname,
            });

        if (joinError) {
            console.warn(joinError);
            addToast({
                data: {
                    title: "Unable to create player",
                    description: `Supabase error: ${joinError.message}`,
                    color: "red",
                },
            });
            pressed = false;
            return;
        }

        pressed = false;
        $flags = new Map();
        await goto(`/rooms/${roomId}`, {
            invalidateAll: true,
        });
    }
</script>

<svelte:head>
    <title>{creatingRoom ? "Room" : title} › Nickname</title>
</svelte:head>

<div class="hero min-h-screen bg-background">
    <div class="hero-content flex-col text-center">
        <div class="card card-compact rounded-lg w-72 bg-primary-400">
            <form class="card-body" on:submit|preventDefault={makePlayer}>
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
                <button
                    class="btn min-h-10 h-10 {pressed
                        ? 'btn-disabled'
                        : 'btn-neutral'}">Enter</button
                >
            </form>
        </div>
    </div>
</div>
