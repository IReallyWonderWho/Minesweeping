<script lang="ts">
    export let color: string;
    export let x: number;
    export let y: number;
    export let nickname: string;

    import Cursor from "./Cursor.svelte";
</script>

<div class="flex flex-row">
    <Cursor height="18px" width="26px" {color} {x} {y} />
    <p class="font-metropolis font-bold text-text-500 text-left">{nickname}</p>
</div>
