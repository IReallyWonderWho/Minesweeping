<script lang="ts">
    import { page } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";
    import { roomChannel, players, type roomData } from "$lib/stores";
    import type { RealtimeChannel } from "@supabase/supabase-js";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    export let data: roomData;

    const roomId = $page.params["roomId"];

    let event: NodeJS.Timeout;

    async function pingRoom() {
        const { error } = await data.supabase.rpc("update_room_ping", {
            room_id: roomId,
        });

        if (error) throw error;
        console.log("Room ping updated successfully");
    }

    onMount(() => {
        data.supabase.auth
            .getUser()
            .then(async ({ data: playerData, error }) => {
                if (error) return;

                const hostId = data.room.host;

                if (playerData.user?.id === hostId) {
                    pingRoom();
                    event = setInterval(pingRoom, 60000);
                }

                const user_id = playerData.user.id;

                if (!$roomChannel) {
                    const channel = data.supabase.channel(`players:${roomId}`);

                    channel
                        .on("presence", { event: "sync" }, () => {
                            const newState = channel!.presenceState()[
                                roomId
                            ] as unknown as Array<{
                                user: string;
                                nickname: string;
                                color: string;
                            }>;

                            console.log(newState);
                            for (const { user, nickname, color } of newState ??
                                []) {
                                $players.set(user, {
                                    x: 0,
                                    y: 0,
                                    nickname,
                                    color,
                                });
                            }

                            $players = $players;
                        })
                        .on(
                            "presence",
                            { event: "join" },
                            async ({ newPresences }) => {
                                const { user, nickname, color } =
                                    newPresences[0];

                                console.log("HEHE");
                                console.log(user);
                                $players.set(user, {
                                    x: 0,
                                    y: 0,
                                    nickname,
                                    color,
                                });
                                $players = $players;
                            },
                        )
                        .on(
                            "presence",
                            { event: "leave" },
                            async ({ leftPresences }) => {
                                const { user } = leftPresences[0];

                                $players.delete(user);
                                $players = $players;
                            },
                        )
                        .subscribe(async (status) => {
                            if (status !== "SUBSCRIBED") {
                                console.warn(status);
                                return;
                            }
                            console.log("Connected!");

                            $roomChannel = channel;

                            const { nickname, color } = data.user.playerData;

                            channel!.track({
                                nickname,
                                color,
                                user: user_id,
                            });
                        });
                }
            });

        return () => {
            if ($roomChannel) {
                data.supabase.removeChannel($roomChannel);
                $roomChannel = undefined;
            }
            clearInterval(event);
        };
    });
</script>

<div class="navbar absolute z-10 minesweeper-navbar">
    <Icon
        class="ml-5 -rotate-12"
        name="flag"
        height="1.25rem"
        width="1.25rem"
    />
    <a
        class="ml-[-20px] mt-[10px] text-primary-100 tracking-[-0.14em] font-display text-lg z-10"
        href="/">Minesweeping</a
    >
</div>

<slot />

<style>
    .minesweeper-navbar {
        view-transition-name: minesweeper-navbar;
    }
</style>
