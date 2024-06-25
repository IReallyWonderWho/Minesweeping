<script lang="ts">
    import { tick } from "svelte";

    export let x: number;
    export let y: number;
    export let width: string = "32px";
    export let height: string = "32px";
    export let color: string = "#000000";

    let element: SVGElement;
    let left: string;
    let top: string;

    async function flip(x: number, y: number) {
        const first = element.getBoundingClientRect();

        left = `${x - 16}px`;
        top = `${y - 32}px`;

        await tick();

        const last = element.getBoundingClientRect();

        const invert_left = first.left - last.left;
        const invert_top = first.top - last.top;

        element.animate(
            [
                { transform: `translate(${invert_left}px, ${invert_top}px)` },
                { transform: `translate(0px, 0px)` },
            ],
            {
                duration: 100,
                easing: "ease-out",
            },
        );
    }

    $: {
        if (element) {
            flip(x, y);
        }
    }
</script>

<svg
    bind:this={element}
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
