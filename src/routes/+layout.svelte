<script lang="ts">
    import Toaster from "$lib/components/Toaster.svelte";
    import "../app.css";
    import { onMount } from "svelte";
    import { onNavigate, invalidate } from "$app/navigation";

    export let data;
    $: ({ session, supabase } = data);

    onMount(() => {
        const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
            if (newSession?.expires_at !== session?.expires_at) {
                invalidate("supabase:auth");
            }
        });

        return () => data.subscription.unsubscribe();
    });

    onNavigate((navigation) => {
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<Toaster />

<slot />

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
        }
    }

    @keyframes fade-out {
        to {
            opacity: 0;
        }
    }

    @keyframes slide-from-top {
        from {
            transform: translateY(30px);
        }
    }

    @keyframes slide-to-bottom {
        to {
            transform: translateY(-30px);
        }
    }

    :root::view-transition-old(root) {
        animation:
            90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
            300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-bottom;
    }

    :root::view-transition-new(root) {
        animation:
            210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
            300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-top;
    }
</style>
