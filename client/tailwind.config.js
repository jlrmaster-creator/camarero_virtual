/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        table: {
          free: '#22c55e',
          occupied: '#ef4444',
          pending: '#f59e0b',
          partial: '#f97316',
          paid: '#6b7280',
        },
      },
    },
  },
  plugins: [],
};
