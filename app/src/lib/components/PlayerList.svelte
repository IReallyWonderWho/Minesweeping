<script lang="ts">
    import { createScrollArea, createCollapsible, melt } from "@melt-ui/svelte";
    import { fly } from "svelte/transition";
    import { gsap } from "gsap/dist/gsap";
    import { Flip } from "gsap/dist/Flip";
    import Player from "./Player.svelte";

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

    let scrollElement: HTMLDivElement;

    $: right = $open
        ? scrollElement
            ? `calc(${scrollElement.getBoundingClientRect().width}px + 0.5rem)`
            : "0rem"
        : "0rem";
    $: rotation = $open ? "180deg" : "360deg";

    function flip({ next }: { curr: boolean; next: boolean }) {
        const state = Flip.getState(".animate-button");

        requestAnimationFrame(() => {
            Flip.from(state, {
                duration: 0.5,
            });
        });

        return next;
    }

    const {
        elements,
        states: { open },
    } = createCollapsible({
        defaultOpen: true,
        onOpenChange: flip,
    });

    const [collapsibleRoot, collapsibleContent, trigger] = [
        elements.root,
        elements.content,
        elements.trigger,
    ];
</script>

<aside
    use:melt={$collapsibleRoot}
    class="flex relative items-center flex-row ml-auto mr-3"
>
    <button
        use:melt={$trigger}
        class="animate-button absolute flex justify-center items-center rounded-full bg-neutral-900 h-12 w-12"
        style="right: {right}"
    >
        <svg
            style="rotate: {rotation}"
            width="25"
            height="21"
            viewBox="0 0 49 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M16.5 21.366C15.8333 20.9811 15.8333 20.0189 16.5 19.634L38.25 7.07661C38.9167 6.69171 39.75 7.17283 39.75 7.94263V33.0574C39.75 33.8272 38.9167 34.3083 38.25 33.9234L16.5 21.366Z"
                fill="#E7F5F9"
            />
            <path
                d="M1.5 21.366C0.833332 20.9811 0.833333 20.0189 1.5 19.634L29.25 3.6125C29.9167 3.2276 30.75 3.70873 30.75 4.47853V36.5215C30.75 37.2913 29.9167 37.7724 29.25 37.3875L1.5 21.366Z"
                fill="#E7F5F9"
            />
        </svg>
    </button>
    {#if $open}
        <div
            bind:this={scrollElement}
            use:melt={$root}
            in:fly={{ x: 300, opacity: 1, duration: 600 }}
            out:fly={{ x: 200, opacity: 1, duration: 600 }}
            class="flex flex-col max-w-[218px] max-h-[100vh] overflow-y-hidden rounded-lg bg-neutral-900"
        >
            <div use:melt={$viewport} class="h-full w-full rounded-[inherit]">
                <div use:melt={$collapsibleContent}>
                    <div class="p-4 px-[26px] mr-0" use:melt={$content}>
                        <h3
                            class="mb-4 text-text-500 font-metropolis font-bold text-base"
                        >
                            Players
                        </h3>
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                        <Player color="#8a601e" nickname="Rick Ashely" />
                    </div>
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
    {/if}
</aside>
