/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        primary: {
          light: "#DCEEE8",
          DEFAULT: "#0F6E5D",
          dark: "#0B4F42",
        },
        accent: {
          light: "#FDECC8",
          DEFAULT: "#F2A93B",
          dark: "#B36B00",
        },
        coral: {
          light: "#FBE4E1",
          DEFAULT: "#E8604C",
        },
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(15, 30, 25, 0.06)",
        card: "0 10px 30px rgba(15, 30, 25, 0.09)",
        glow: "0 0 0 4px rgba(15, 110, 93, 0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease both",
        "scale-in": "scale-in 0.2s ease both",
      },
    },
  },
  plugins: [],
};
