/** @type {import('tailwindcss').Config} */
// Web bilan bir xil palette — web/tailwind.config.js + index.css ga mos
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Web brand palette — yagona dizayn tili
        brand: {
          DEFAULT: "#0A5C45",
          dark:    "#083d2e",
          light:   "#12A87D",
          bright:  "#22c55e",
        },
        gold: "#d4a853",
        // POS / SAVDO dark theme (web bilan bir xil)
        pos: {
          bg:          "#0a1f12",
          card:        "#112920",
          surface:     "#0d2418",
          border:      "rgba(255, 255, 255, 0.08)",
          accent:      "#22c55e",
          accentHover: "#16A34A",
          text:        "#f0f7f2",
          muted:       "rgba(240, 247, 242, 0.6)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
