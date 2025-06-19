/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'shelter': '#FF9800',
        'safe': '#4CAF50',
        'no-update': '#F44336',
        'dark': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-card': '#272727'
      },
      fontFamily: {
        'heebo': ['Heebo', 'sans-serif'],
        'sans': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
} 