/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669', // Emerald Green Brand
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        amber: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706', // Warm Amber
          700: '#b45309'
        },
        slate: {
          850: '#151f33',
          900: '#0f172a', // Slate Dark
          950: '#090d16'
        }
      }
    },
  },
  plugins: [],
}
