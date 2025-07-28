/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3C2DDA",
        'primary-dark': "#2D1FB8",
      }
    },
  },
  plugins: [],
}
