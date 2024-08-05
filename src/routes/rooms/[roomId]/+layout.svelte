<script lang="ts">
    import { page } from "$app/stores";
    import { supabase } from "$lib/supabaseClient";
    import Icon from "$lib/components/Icon.svelte";
    import { isHost, type roomData } from "$lib/stores";
    import { onMount } from "svelte";

    const roomId = $page.params["roomId"];

    let event: NodeJS.Timeout;

    async function pingRoom() {
        const { data: playerData } = await supabase.auth.getUser();
        if (!playerData) throw new Error("User not authenticated");

        const { error } = await supabase.rpc("update_room_ping", {
            room_id: roomId,
        });

        if (error) throw error;
        console.log("Room ping updated successfully");
    }

    /*onMount(() => {
        supabase.auth.getUser().then(async ({ data: playerData, error }) => {
            if (error) return;

            const hostId = (await data.roomPromise).host;

            if (playerData.user?.id === hostId) {
            }
        });
    }); */
</script>

<div class="navbar absolute">
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
