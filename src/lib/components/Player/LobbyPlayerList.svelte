<script lang="ts">
    import { createScrollArea, createCollapsible, melt } from "@melt-ui/svelte";
    import { gsap } from "gsap/dist/gsap";
    import { Flip } from "gsap/dist/Flip";
    import Player from "$lib/components/Player/Player.svelte";

    export let players: Map<string, { color: string; nickname: string }>;

    gsap.registerPlugin(Flip);

    const {
        elements: {
            root,
            content,
            viewport,
            corner,
            scrollbarY,
            thumbY,
            thumbX,
            scrollbarX,
        },
    } = createScrollArea({
        type: "hover",
        dir: "ltr",
    });
</script>

<aside class="right-0 animate-lobby ml-auto flex flex-row">
    <div
        use:melt={$root}
        class="flex flex-col h-[100vh] max-w-[327px] w-[327px] overflow-y-hidden bg-neutral-900"
    >
        <div use:melt={$viewport} class="h-full w-full">
            <div class="p-7 py-6" use:melt={$content}>
                <h3
                    class="mb-5 text-primary-300 font-metropolis font-bold text-xl"
                >
                    Players
                </h3>
                {#each players as [_, { nickname }] (nickname)}
                    <p class="text-lg text-primary-100">{nickname}</p>
                {/each}
            </div>
        </div>
    </div>
</aside>
