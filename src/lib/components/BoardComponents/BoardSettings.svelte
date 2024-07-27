<script lang="ts">
    import { createSlider, melt } from "@melt-ui/svelte";
    import { numberOfRowsColumns, mineRatio } from "$lib/stores";

    const {
        elements: { root, range, thumbs },
        states: { value },
    } = createSlider({
        value: numberOfRowsColumns,
        min: 6,
        max: 18,
        step: 1,
    });

    const { elements, states } = createSlider({
        value: mineRatio,
        min: 2,
        max: 10,
        step: 1,
    });

    const {
        root: ratioRoot,
        range: ratioRange,
        thumbs: ratioThumbs,
    } = elements;
    const { value: ratioValue } = states;
</script>

<div class="absolute left-10">
    <h2 class="text-base mb-1">Board size:</h2>
    <span
        use:melt={$root}
        class="relative flex h-[20px] w-[125px] items-center"
    >
        <span class="h-[3px] w-full bg-primary-900/40">
            <span
                use:melt={$range}
                class="h-[3px] bg-primary-700 rounded-full"
            />
        </span>

        <span
            use:melt={$thumbs[0]}
            class="h-5 w-5 rounded-full bg-primary-500 focus:ring-4 focus:!ring-black/40 text-primary-100 font-bold text-xs text-center"
            >{$value}</span
        >
    </span>

    <h2 class="mt-6 mb-1">Mine Ratio:</h2>
    <span
        use:melt={$ratioRoot}
        class="relative flex h-[20px] w-[125px] items-center"
    >
        <span class="h-[3px] w-full bg-primary-900/40">
            <span
                use:melt={$ratioRange}
                class="h-[3px] bg-primary-700 rounded-full"
            />
        </span>

        <span
            use:melt={$ratioThumbs[0]}
            class="h-5 w-5 rounded-full bg-primary-500 focus:ring-4 focus:!ring-black/40 text-primary-100 font-bold text-xs text-center"
            >{$ratioValue}</span
        >
    </span>
</div>
