<script lang="ts">
    import { page } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";
    import { type roomData } from "$lib/stores";
    import { onMount } from "svelte";

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

                const hostId = (await data.roomPromise).host;

                if (playerData.user?.id === hostId) {
                    pingRoom();
                    event = setInterval(pingRoom, 60000);
                }
            });

        return () => {
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
