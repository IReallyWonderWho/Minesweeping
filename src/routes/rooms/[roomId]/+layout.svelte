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
    <a
        class="ml-[-20px] mt-[10px] text-primary-100 tracking-[-0.14em] font-display text-lg z-10"
        href="/">Minesweeping</a
    >
</div>

<slot />
