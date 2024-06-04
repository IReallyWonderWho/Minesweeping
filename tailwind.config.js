const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Seymour One"],
      },
      colors: {
        primary: "#006ba8",
        background: "#07031b",
        text: "#e7e2fc",
        secondary: "#7f158b",
        accent: "#7aa4b4",
      },
    },
  },
  plugins: [],
};
