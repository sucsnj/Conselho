/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
          glow: '#F59E0B'
        },
        royal: {
          950: '#14060B',
          900: '#2A0813',
          850: '#3D0B1C',
          800: '#4C0D23',
          700: '#6B1232',
          600: '#8E1B44',
          500: '#B8265B'
        },
        obsidian: {
          950: '#0B0A0D',
          900: '#121117',
          850: '#1A1822',
          800: '#23202E',
          750: '#2C293A',
          700: '#3A364B'
        },
        parchment: {
          100: '#FBF7EE',
          200: '#F5EDD6',
          300: '#ECE0BC',
          400: '#DFCFA1',
          500: '#CFBC84',
          800: '#383020',
          900: '#221C11'
        }
      },
      fontFamily: {
        medieval: ['"Cinzel Decorative"', 'serif'],
        heading: ['Cinzel', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(234, 179, 8, 0.35)',
        'gold-glow-lg': '0 0 45px -5px rgba(234, 179, 8, 0.5)',
        'royal-glow': '0 0 30px -5px rgba(142, 27, 68, 0.4)',
        'parchment-border': 'inset 0 0 15px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'royal-radial': 'radial-gradient(circle at 50% 0%, rgba(107, 18, 50, 0.4) 0%, rgba(11, 10, 13, 0.95) 75%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(253, 224, 71, 0.2), transparent)',
      }
    },
  },
  plugins: [],
}
