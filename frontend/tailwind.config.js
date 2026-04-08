/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fce8e9",
          100: "#f9d2d3",
          200: "#f4a4a7",
          300: "#ee777b",
          400: "#e9494f",
          500: "#e31c23",
          600: "#b6161c",
          700: "#881115",
          800: "#5b0b0e",
          900: "#2d0607",
          950: "#200405"
        },
        success: { 50: "#f0fdf4", 500: "#22c55e", 600: "#16a34a", 700: "#15803d" },
        danger:  { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
        warning: { 50: "#fffbeb", 200: "#fcd34d", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" },
      }
    }
  },
  plugins: []
}