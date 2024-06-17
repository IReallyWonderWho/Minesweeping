const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  daisyui: {
    themes: [
      {
        dark: {
          primary: "#92cde6",
          secondary: "#511e87",
          accent: "#c632d1",
          neutral: "#0c4a6e",
          "base-100": "#27292e",
          info: "#0284c7",
          success: "#9ed100",
          warning: "#b03500",
          error: "#ff5d68",
        },
      },
    ],
  },
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Seymour One"],
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        metropolis: ["Metropolis", "sans-serif"],
      },
      colors: {
        "primary-50": "#eff8fb",
        "primary-100": "#e9f5fa",
        "primary-200": "#e4f3f9",
        "primary-300": "#d3ebf5",
        "primary-400": "#b3dcee",
        "primary-500": "#92cde6",
        "primary-600": "#83b9cf",
        "primary-700": "#6e9aad",
        "primary-800": "#587b8a",
        "primary-900": "#486471",
        background: "#091317",
        "text-50": "#fbfefe",
        "text-100": "#fafdfe",
        "text-200": "#f9fdfe",
        "text-300": "#f5fbfd",
        "text-400": "#eef8fb",
        "text-500": "#e7f5f9",
        "text-600": "#d0dde0",
        "text-700": "#adb8bb",
        "text-800": "#8b9395",
        "text-900": "#71787a",
      },
    },
  },
  plugins: [require("daisyui")],
};
