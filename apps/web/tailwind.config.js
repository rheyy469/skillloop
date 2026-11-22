/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        editorial: {
          cream: '#FAF1E6',
          paper: '#FFFFFF',
          sand: '#F3E7D8',
          forest: '#3D2317',
          forestLight: '#523223',
          sage: '#4EA674',
          terracotta: '#EE7838',
          mustard: '#F6C945',
          lime: '#F6C945',
          lavender: '#F4979C',
          sky: '#74A8F2',
          ink: '#3D2317',
          muted: '#8C7A70'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Poppins"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', '"Poppins"', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
