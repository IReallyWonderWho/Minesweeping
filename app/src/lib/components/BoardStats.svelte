<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "./Icon.svelte";

    export let time_started: number | undefined;

    let current_time: number = Date.now();

    // Taken from
    // https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds/
    function prettyPrintTime(time: number) {
        const minutes = ~~((time % 3600) / 60);
        const seconds = ~~time % 60;

        let ret = "";

        ret += "" + minutes + ":" + (seconds < 10 ? "0" : "");
        ret += "" + seconds;

        return ret;
    }

    $: time = time_started ? ~~((current_time - time_started) * 0.001) : 0;

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
        <span class="flex flex-row">
            <Icon name="flag" />
            50
        </span>
        <span class="flex flex-row">
            <Icon name="flag" />
            {prettyPrintTime(time)}
        </span>
    </div>
</div>
