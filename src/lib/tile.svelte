<script lang="ts">
    export let postTile: (x: number, y: number) => Promise<void>;

    // !! Position starts at (0, 0) and goes up to (11, 11)
    export let position: { x: number; y: number };
    export let state: number | undefined;

    // As x is the row, everytime it incremenets we know 12 tiles have passed since
    // the last iteration
    // If we multiply by 12, we get straight lines and not the checkered pattern :(
    let is_darkened = (11 * position.x + position.y) % 2 === 0 ? true : false;
    $: color =
        state === -2
            ? is_darkened
                ? `bg-[#3cadf0]`
                : `bg-[#57c1ff]`
            : is_darkened
              ? `bg-[#d9ccb6]`
              : `bg-[#ede4d5]`;
    let flagged = false;

    async function click() {
        if (flagged) return;

        const response = await postTile(position.x, position.y);
    }

    function flag() {
        console.log(state);
        if (!state || state !== -2) return;
        flagged = !flagged;
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
    {#if state}
        {state}
    {/if}
</button>
