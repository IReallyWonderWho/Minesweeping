<script lang="ts">
    import { longpress } from "$lib/actions";
    import Icon from "$lib/components/Icon.svelte";

    export let postTile: (x: number, y: number) => void;
    export let flagTile: (x: number, y: number) => void;

    // !! Position starts at (0, 0) and goes up to (11, 11)
    export let position: { x: number; y: number };
    export let state: number | undefined = -2;

    const MINE_TILE = -1;
    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;

    const NUMBER_COLORS = {
        1: "text-[#3a8ae0]",
        2: "text-[#03913e]",
        3: "text-[#D0021B]",
        4: "text-[#000080]",
        5: "text-[#800000]",
        6: "text-[#008B8B]",
        7: "text-[#8B008B]",
        8: "text-[#A9A9A9]",
    };

    // As x is the row, everytime it incremenets we know 12 tiles have passed since
    // the last iteration
    // If we multiply by 12, we get straight lines and not the checkered pattern :(
    let is_darkened = (11 * position.x + position.y) % 2 === 0 ? true : false;
    $: color =
        state === UNKNOWN_TILE || state === FLAGGED_TILE
            ? is_darkened
                ? `bg-[#3cadf0]`
                : `bg-[#57c1ff]`
            : is_darkened
              ? `bg-[#d9ccb6]`
              : `bg-[#ede4d5]`;
    $: icon =
        state === FLAGGED_TILE ? "flag" : state === MINE_TILE ? "mine" : "none";
    $: text_color =
        state && state in NUMBER_COLORS ? NUMBER_COLORS[state as 1] : "#FFFFFF";

    async function click() {
        if (icon === "flag") return;

        postTile(position.x, position.y);
    }

    function flag() {
        flagTile(position.x, position.y);
    }
</script>

<!--Disable right click on the buttons by preventing default on contextmenu-->
<button
    class={`${color} ${text_color} flex justify-self-stretch items-center justify-center text-lg font-metropolis font-semibold`}
    style={$$props.style}
    use:longpress
    on:longpress={flag}
    on:contextmenu|preventDefault={flag}
    on:click|preventDefault={click}
>
    {#if icon === "flag"}
        <Icon name="flag" height="22.875px" width="25.5px" />
    {:else if icon === "mine"}
        <Icon name="mine" height="22.875px" width="25.5px" />
    {/if}
    <!--Show the number-->
    {#if state && state > 0}
        {state}
    {/if}
</button>
