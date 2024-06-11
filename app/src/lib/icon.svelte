<script lang="ts">
    export let name: keyof typeof icons;
    export let width = "1rem";
    export let height = "1rem";
    export let focusable: string | number | null | undefined = undefined;
    let icons = {
        flag: {
            box: [68, 77],
            svg: `<path d="M56.6901 19.7849C60.6326 21.3581 62.6038 22.1447 62.6038 23.5C62.6038 24.8553 60.6326 25.6419 56.6901 27.2151L20.4825 41.6638C17.9983 42.6551 16.7561 43.1508 15.8781 42.5558C15 41.9608 15 40.6234 15 37.9487V9.05132C15 6.37657 15 5.03919 15.8781 4.44419C16.7561 3.84919 17.9983 4.34486 20.4825 5.33621L56.6901 19.7849Z" fill="#F46363"/>
            <rect x="9" width="11" height="77" rx="6" fill="#8D745D"/>`,
        },
    } as const;
    let displayIcon = icons[name];
</script>

<svg
    class={$$props.class}
    {focusable}
    {width}
    {height}
    viewBox="0 0 {displayIcon.box[0]} {displayIcon.box[1]}"
    >{@html displayIcon.svg}</svg
>
