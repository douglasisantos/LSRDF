/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        league: {
          navy: '#151853',
          red: '#c91921',
          green: '#046434',
          gold: '#e5bd17',
          ink: '#1f1f24',
          paper: '#f6f7fb'
        }
      },
      boxShadow: {
        panel: '0 16px 40px rgba(21, 24, 83, 0.11)'
      }
    }
  },
  plugins: []
};
