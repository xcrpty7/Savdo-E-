/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        savdo: {
          50:  '#F5F8F3',
          100: '#EAF3E5',
          200: '#C6DEC0',
          300: '#7AAA7C',
          400: '#44AB4C',
          500: '#2D8B35',
          600: '#1D5E24',
          700: '#0C1410',
          800: '#162018',
          900: '#0C1410',
        },
        pos: {
          bg:      '#0F172A',
          card:    '#1E293B',
          border:  '#334155',
          accent:  '#22C55E',
          accentHover: '#16A34A',
          text:    '#FFFFFF',
          muted:   '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};
