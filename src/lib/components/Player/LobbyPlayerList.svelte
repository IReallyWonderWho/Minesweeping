<script lang="ts">
    import { createScrollArea, createCollapsible, melt } from "@melt-ui/svelte";
    import { gsap } from "gsap/dist/gsap";
    import { Flip } from "gsap/dist/Flip";
    import { players } from "$lib/stores";

    export let roomPromise: Promise<{
        host: string;
    }>;

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

<aside class={`right-0 animate-lobby ml-auto flex flex-row ${$$props.class}`}>
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
                {#await roomPromise then room}
                    {#each $players as [id, { nickname }] (nickname)}
                        {#if id === room.host}
                            <span
                                class="flex flex-row text-center items-center justify-items-center"
                                ><p class="text-lg text-primary-100">
                                    {nickname}
                                </p>
                                <p class="p-2 text-xl">👑</p></span
                            >
                        {:else}
                            <p class="text-lg text-primary-100">{nickname}</p>
                        {/if}
                    {/each}
                {/await}
            </div>
        </div>
        <div
            use:melt={$scrollbarY}
            class="flex h-full w-2.5 touch-none select-none border-l border-l-transparent bg-primary-800/10 p-px transition-colors"
        >
            <div
                use:melt={$thumbY}
                class="relative flex-1 rounded-full bg-primary-600"
            />
        </div>
        <div
            use:melt={$scrollbarX}
            class="flex h-2.5 w-full touch-none select-none border-t border-t-transparent bg-primary-800/10 p-px"
        >
            <div
                use:melt={$thumbX}
                class="relative rounded-full bg-primary-600"
            />
        </div>
        <div use:melt={$corner} />
    </div>
</aside>
