/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fifa-green': '#00DF59',
        'fifa-blue': '#0052FF',
        'fifa-red': '#FF3040',
        'fifa-yellow': '#FFEA00',
        'fifa-orange': '#FF7B00',
        'fifa-purple': '#7B00FF',
      },
    },
  },
  plugins: [],
}
