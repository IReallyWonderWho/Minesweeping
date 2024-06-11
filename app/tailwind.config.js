const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Seymour One"],
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        metropolis: ["Metropolis", "sans-serif"],
      },
      colors: {
        primary: "#92cde6",
        background: "#091317",
        text: "#e7f5f9",
      },
    },
  },
  plugins: [],
};
