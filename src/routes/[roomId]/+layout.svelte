<script lang="ts">
    import Icon from "$lib/components/Icon.svelte";
</script>

<div class="navbar absolute">
    <Icon
        class="ml-5 -rotate-12"
        name="flag"
        height="1.25rem"
        width="1.25rem"
    />
    <a class="text-primary-100 font-metropolis font-bold text-lg ml-0" href="/"
        >Minesweeping</a
    >
</div>

<slot />
