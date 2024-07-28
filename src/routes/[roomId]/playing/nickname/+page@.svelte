<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { addToast } from "$lib/components/Toaster.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { getRandomHSL } from "$lib/utility";

    export let form;

    const roomId = $page.params["roomId"];

    let nickname = "";

    function validatePlayerData(nickname: string) {
        const errors: { nickname: string; isValid: boolean } = {
            nickname: nickname,
            isValid: false,
        };

        if (!nickname || nickname.trim().length < 3) {
            errors.nickname = "Nickname must be at least 3 characters long";
        }
        if (nickname.trim().length > 20) {
            errors.nickname = "Nickname must not exceed 20 characters";
        }
        if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
            errors.nickname =
                "Nickname can only contain letters, numbers, and underscores";
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    $: if (form?.error) {
        addToast({
            data: {
                title: "Nickname submission",
                description: form.error,
                color: "red",
            },
        });
    }

    async function makePlayer() {
        const color = getRandomHSL();

        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            addToast({
                data: {
                    title: "Unable to sign in anonymously",
                    description:
                        "This may be a database issue, please try again",
                    color: "red",
                },
            });
            return;
        }

        const user_id = data.user?.id;
        const [{ error: joinError }, { data: roomData, error: roomError }] =
            await Promise.all([
                supabase.from("room_players").insert({
                    room_id: roomId,
                    user_id,
                    color,
                    nickname,
                }),
                supabase
                    .from("rooms")
                    .select("started")
                    .eq("id", roomId)
                    .single(),
            ]);

        if (joinError || roomError) {
            addToast({
                data: {
                    title: "Unable to create player",
                    description: "Your nickname might be invalid",
                    color: "red",
                },
            });
            return;
        }

        goto(roomData.started ? `/${roomId}/playing` : `/${roomId}`, {
            invalidateAll: true,
        });
    }
</script>

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
                <button class="btn btn-neutral min-h-10 h-10">Enter</button>
            </form>
        </div>
    </div>
</div>
