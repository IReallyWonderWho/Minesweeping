<script lang="ts" context="module">
    export type ToastData = {
        title: string;
        description: string;
        color: string;
    };

    const {
        elements: { content, title, description, close },
        helpers,
        states: { toasts },
        actions: { portal },
    } = createToaster<ToastData>();

    export const addToast = helpers.addToast;
</script>

<script lang="ts">
    import { createToaster, melt } from "@melt-ui/svelte";
    import { fly } from "svelte/transition";
</script>

<div class="toast items-end" use:portal>
    {#each $toasts as { id, data } (id)}
        <div use:melt={$content(id)}>
            <div
                class="alert indicator rounded-lg bg-base-100 p-4 pt-2"
                out:fly={{ duration: 150, x: "100%" }}
            >
                <div>
                    <h3
                        class="font-metropolis font-bold text-2xl mt-0 mb-1"
                        use:melt={$title(id)}
                    >
                        {data.title}
                        <span style:color={data.color} />
                    </h3>
                    <div
                        class="font-metropolis font-semibold text-base"
                        use:melt={$description(id)}
                    >
                        {data.description}
                    </div>
                </div>
                <button
                    class="indicator-item badge h-6 w-8 badge-primary text-lg"
                    use:melt={$close(id)}
                    aria-label="close notification"
                >
                    X
                </button>
            </div>
        </div>
    {/each}
</div>
