<script lang="ts">
    // @ts-ignore
    import { gsap } from "gsap/dist/gsap";
    // @ts-ignore
    import { Flip } from "gsap/dist/Flip";
    import { tick } from "svelte";
    import { windowRect } from "$lib/stores";

    gsap.registerPlugin(Flip);

    export let x: number;
    export let y: number;
    export let width: string = "32px";
    export let height: string = "32px";
    export let color: string = "#000000";

    let left: string;
    let top: string;

    async function flip(scaled_x: number, scaled_y: number) {
        const [x, y] = [
            scaled_x * $windowRect!.width,
            scaled_y * $windowRect!.height,
        ];
        const cursor = Flip.getState(".flip");

        left = `${x - 16}px`;
        top = `${y - 32}px`;

        await tick();

        Flip.from(cursor, {
            duration: 0.1,
        });
    }

    $: {
        flip(x, y);
    }
</script>

<svg
    class="flip absolute pointer-events-none"
    {width}
    {height}
    style="left: {left}; top: {top}"
    viewBox="0 0 46 63"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
>
    <path
        d="M23 63C23 63 -6.913 33.3015 1.48797 14.2721C9.88894 -4.75736 36.1111 -4.75736 44.512 14.2721C52.913 33.3015 23 63 23 63Z"
        fill={color}
    />
    <circle cx="23" cy="22" r="15" fill="#FFFFFF" />
</svg>
