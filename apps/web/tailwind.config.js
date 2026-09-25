/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0f",
        surface: "#15151c",
        border: "#26262f",
        accent: "#8b5cf6",
        accent2: "#22d3ee",
      },
    },
  },
  plugins: [],
};
