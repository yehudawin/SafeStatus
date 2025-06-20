/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New design system colors
        'primary': '#FF9900',
        'accent': '#FF4500',
        'background': '#FFFFFF',
        'text-primary': '#000000',
        'text-secondary': '#555555',
        'warning': '#FF6600',
        'error': '#CC0000',
        
        // Status colors (updated)
        'shelter': '#FF6600',
        'safe': '#4CAF50',
        'no-update': '#CC0000',
        
        // Background colors
        'light-surface': '#F5F5F5',
        'card-background': '#FFFFFF',
        
        // Legacy dark colors (for gradual transition)
        'dark': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-card': '#272727'
      },
      fontFamily: {
        'heebo': ['Heebo', 'sans-serif'],
        'sf': ['San Francisco', 'Segoe UI', 'Arial', 'sans-serif'],
        'sans': ['San Francisco', 'Segoe UI', 'Arial', 'sans-serif']
      },
      spacing: {
        '10vh': '10vh',
      },
      borderRadius: {
        'design': '12px',
        'pill': '999px',
      },
      boxShadow: {
        'light': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
} 