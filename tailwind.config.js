/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        swu: {
          950: '#020617', // Deep space background
          900: '#0f172a', // Card background
          800: '#1e293b', // Lighter element background
          primary: '#6694ce', // Base Blue (User requested)
          secondary: '#446eab', // Darker shade of base
          accent: '#89b3e6', // Lighter variation for accents
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

