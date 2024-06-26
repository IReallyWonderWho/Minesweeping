<script lang="ts">
    export let color: string;
    export let nickname: string;
</script>

<div class="flex flex-row mb-2 items-center">
    <svg
        class="mr-2"
        width="18px"
        height="26px"
        viewBox="0 0 46 63"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M23 63C23 63 -6.913 33.3015 1.48797 14.2721C9.88894 -4.75736 36.1111 -4.75736 44.512 14.2721C52.913 33.3015 23 63 23 63Z"
            fill={color}
        />
        <circle cx="23" cy="22" r="15" fill="#FFFFFF" />
    </svg>
    <p class="font-metropolis font-normal text-text-700 text-left truncate">
        {nickname}
    </p>
</div>
