<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "./Icon.svelte";
    import { flags } from "$lib/stores";

    export let time_started: string | undefined;
    export let board: Array<Array<number>>;

    const RATIO = 6;

    $: number_of_flags = board.length ** 2 / RATIO;

    let current_time: number = Date.now();

    // Taken from
    // https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds/
    function prettyPrintTime(time: number) {
        // Hours, minutes and seconds
        const hrs = ~~(time / 3600);
        const minutes = ~~((time % 3600) / 60);
        const seconds = ~~time % 60;

        // Output like "1:01" or "4:03:59" or "123:03:59"
        let ret = "";

        if (hrs > 0) {
            ret += "" + hrs + ":" + (minutes < 10 ? "0" : "");
        }

        ret += "" + minutes + ":" + (seconds < 10 ? "0" : "");
        ret += "" + seconds;

        return ret;
    }

    $: time = time_started
        ? ~~((current_time - new Date(time_started).getTime()) * 0.001)
        : 0;

    onMount(() => {
        const event = setInterval(() => {
            current_time = Date.now();
        }, 1000);

        return () => {
            clearInterval(event);
        };
    });
</script>

<div class={`${$$props["class"]}`}>
    <div class="flex flex-row">
        <span class="flex flex-row mr-3">
            <Icon class="mr-1" name="flag" />
            {number_of_flags - $flags.size}
        </span>
        <span class="flex flex-row">
            <Icon class="mr-1" name="clock" />
            {prettyPrintTime(time)}
        </span>
    </div>
</div>
