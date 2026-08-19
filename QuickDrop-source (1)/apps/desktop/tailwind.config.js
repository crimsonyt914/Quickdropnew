/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#F7F8FA",
          panel: "#FFFFFF",
          dark: "#12141C",
          "dark-panel": "#191C26",
        },
        ink: {
          DEFAULT: "#14171F",
          muted: "#6B7280",
          dark: "#E7E9F0",
          "dark-muted": "#8A8FA3",
        },
        border: {
          DEFAULT: "#E4E7EC",
          dark: "#262A38",
        },
        accent: {
          DEFAULT: "#3654F4",
          hover: "#2A44D6",
          soft: "#EEF1FE",
        },
        success: {
          DEFAULT: "#12B76A",
          soft: "#E7F9F0",
        },
        danger: {
          DEFAULT: "#E5484D",
          soft: "#FDEEEE",
        },
      },
      borderRadius: {
        card: "14px",
      },
      keyframes: {
        "check-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "check-pop": "check-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
