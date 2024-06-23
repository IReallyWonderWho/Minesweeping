<script>
    import { page } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";
</script>

<main class="flex h-[100vh] flex-col justify-center items-center">
    <Icon class="rotate-[25deg]" name="flag" width="2rem" height="2rem" />
    <h1 class="text-text text-center text-4xl font-metropolis font-semibold">
        {$page.status}
    </h1>
    {#if $page.error}
        <h2
            class="text-text text-center text-2xl font-metropolis font-semibold"
        >
            {$page.error.message}
        </h2>
    {/if}
</main>
