<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import PlayerList from "$lib/components/Player/LobbyPlayerList.svelte";
    import { supabase } from "$lib/supabaseClient";
    import { players, type roomData } from "$lib/stores";

    export let data: roomData;

    const roomId = $page.params["roomId"];
    const roomChannel = supabase.channel(`room:${roomId}`, {
        config: {
            presence: { key: roomId },
        },
    });

    const user_id = data.userPromise.then((data) => data.id);

    onMount(() => {
        roomChannel
            .on("presence", { event: "sync" }, () => {
                const newState = roomChannel.presenceState()[
                    roomId
                ] as unknown as Array<{
                    user: string;
                    nickname: string;
                    color: string;
                }>;

                for (const { user, nickname, color } of newState ?? []) {
                    $players.set(user, {
                        x: 0,
                        y: 0,
                        nickname,
                        color,
                    });
                }

                $players = $players;
            })
            .on("presence", { event: "join" }, async ({ newPresences }) => {
                const { user, nickname, color } = newPresences[0];

                $players.set(user, {
                    x: 0,
                    y: 0,
                    nickname,
                    color,
                });
                $players = $players;
            })
            .on("presence", { event: "leave" }, async ({ leftPresences }) => {
                const { user } = leftPresences[0];

                $players.delete(user);
                $players = $players;
            })
            .subscribe(async (status) => {
                if (status !== "SUBSCRIBED") return;

                try {
                    const { nickname, color } = (await data.userPromise)
                        .playerData;

                    roomChannel.track({
                        nickname,
                        color,
                        user: await user_id,
                    });
                } catch {
                    goto("/");
                }
            });
    });
</script>

<main>
    <PlayerList players={$players} />
</main>
