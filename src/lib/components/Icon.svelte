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
        mine: {
            box: [70, 70],
            svg: `<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="35" r="28" fill="#696969"/>
          <rect x="30" width="10" height="30" rx="5" fill="#696969"/>
          <rect x="30" y="40" width="10" height="30" rx="5" fill="#696969"/>
          <rect x="40" y="40" width="10" height="30" rx="5" transform="rotate(-90 40 40)" fill="#696969"/>
          <rect x="7" y="14.0711" width="10" height="30" rx="5" transform="rotate(-45 7 14.0711)" fill="#696969"/>
          <rect x="35" y="42.0711" width="10" height="30" rx="5" transform="rotate(-45 35 42.0711)" fill="#696969"/>
          <rect x="56.2132" y="7" width="10" height="30" rx="5" transform="rotate(45 56.2132 7)" fill="#696969"/>
          <rect x="28.2132" y="35" width="10" height="30" rx="5" transform="rotate(45 28.2132 35)" fill="#696969"/>
          <rect y="40" width="10" height="30" rx="5" transform="rotate(-90 0 40)" fill="#696969"/>
          </svg>`,
        },
        clock: {
            box: [59, 59],
            svg: `<svg width="59" height="59" viewBox="0 0 59 59" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M29.5 59C45.7924 59 59 45.7924 59 29.5C59 13.2076 45.7924 0 29.5 0C13.2076 0 0 13.2076 0 29.5C0 45.7924 13.2076 59 29.5 59ZM29.5 56C44.1355 56 56 44.1355 56 29.5C56 14.8645 44.1355 3 29.5 3C14.8645 3 3 14.8645 3 29.5C3 44.1355 14.8645 56 29.5 56Z" fill="white"/>
            <rect x="28" y="8" width="4" height="28" rx="2" fill="#D9D9D9"/>
            <rect x="44.9532" y="24" width="4" height="19.0226" rx="2" transform="rotate(63.0262 44.9532 24)" fill="#D9D9D9"/>
            </svg>`,
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
