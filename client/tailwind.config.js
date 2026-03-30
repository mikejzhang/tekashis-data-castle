/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "Impact", "system-ui", "sans-serif"],
        body: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        castle: {
          red: "#e11d48",
          crimson: "#9f1239",
          gold: "#facc15",
          navy: "#1e3a8a",
          midnight: "#0f172a",
        },
      },
      boxShadow: {
        show: "0 10px 40px -10px rgba(225, 29, 72, 0.45)",
        card: "0 8px 0 0 rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
