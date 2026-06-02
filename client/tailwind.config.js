/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#2d3d60',
          DEFAULT: '#1B2A4A',
          dark: '#0f1b32',
        },
        gold: {
          light: '#e5c077',
          DEFAULT: '#D4A853',
          dark: '#b68835',
        },
        cream: {
          light: '#ffffff',
          DEFAULT: '#FAF8F5',
          dark: '#f0ede6',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
