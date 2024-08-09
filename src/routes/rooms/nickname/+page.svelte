<script lang="ts">
    import { page } from "$app/stores";
    import { goto, invalidateAll } from "$app/navigation";
    import { addToast } from "$lib/components/Toaster.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { getRandomHSL, decode, addSpace } from "$lib/utility";

    export let form;

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

    async function makePlayer() {
        const color = getRandomHSL();
        let { data: userData, error: playerError } =
            await supabase.auth.getUser();

        if (playerError) {
            const { data, error } = await supabase.auth.signInAnonymously({
                options: {
                    data: {
                        room_id: roomId,
                    },
                },
            });

            if (error) {
                addToast({
                    data: {
                        title: "Unable to sign in anonymously",
                        description: `Supabase error: ${error}`,
                        color: "red",
                    },
                });
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

        const [{ error: joinError }, { data: roomData, error: roomError }] =
            await Promise.all([
                supabase.from("room_players").upsert({
                    user_id,
                    room_id: roomId,
                    color,
                    nickname,
                }),
                supabase
                    .from("rooms")
                    .select("started")
                    .eq("id", roomId)
                    .single(),
            ]);

        if (joinError) {
            console.warn(joinError);
            addToast({
                data: {
                    title: "Unable to create player",
                    description: `Supabase error: ${joinError.message}`,
                    color: "red",
                },
            });
            return;
        }
        if (roomError) {
            console.warn(roomError);
            addToast({
                data: {
                    title: "Unable to fetch room",
                    description: `Supabase error: ${roomError.message}`,
                    color: "red,",
                },
            });
            return;
        }

        await goto(
            roomData.started ? `/rooms/${roomId}/playing` : `/rooms/${roomId}`,
            {
                invalidateAll: true,
            },
        );
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
                <button class="btn btn-neutral min-h-10 h-10">Enter</button>
            </form>
        </div>
    </div>
</div>
