/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",   // Ocean Professional primary
        secondary: "#F59E0B", // Ocean Professional secondary
        error: "#EF4444",
        surface: "#ffffff",
        text: "#111827",
        background: "#f9fafb",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
