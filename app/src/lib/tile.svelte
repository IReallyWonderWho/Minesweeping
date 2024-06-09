<script lang="ts">
    export let postTile: (x: number, y: number) => void;
    export let flagTile: (x: number, y: number) => void;

    // !! Position starts at (0, 0) and goes up to (11, 11)
    export let position: { x: number; y: number };
    export let state: number | undefined;

    const UNKNOWN_TILE = -2;
    const FLAGGED_TILE = -3;

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
    $: flagged = state === FLAGGED_TILE;

    async function click() {
        if (flagged) return;

        postTile(position.x, position.y);
    }

    function flag() {
        flagTile(position.x, position.y);
    }
</script>

<!--Disable right click on the buttons by preventing default on contextmenu-->
<button
    class={`${color} justify-self-stretch`}
    on:contextmenu|preventDefault={flag}
    on:click|preventDefault={click}
>
    <!--Temporary icon-->
    {#if flagged}
        <i class="fa-brands fa-font-awesome"></i>
    {/if}
    <!--Show the number-->
    {#if state && state !== UNKNOWN_TILE && state !== FLAGGED_TILE}
        {state}
    {/if}
</button>
