<script lang="ts">
    import { getRandom, getRandomHSL, clamp } from "$lib/utility";

    let length = getRandom(10, 20);
    let width = length * getRandom(0.4, 0.6);
    let color = getRandomHSL();

    export let x: number;
    export let y: number;
    export let rotation: number;
    export let lifetime: number;

    $: transparency = 1 - clamp(lifetime, 0, 1);
</script>

<div
    style="left: {x}px; top: {y}px; rotate: {rotation}deg; opacity: {transparency}; color: ${color}; height: {width}; width: {length}"
></div>
