/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dharma brand palette
        primary: {
          50:  '#F5F0FF',
          100: '#EDE5FF',
          200: '#D4BFFF',
          300: '#B794FF',
          400: '#9B6BFF',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },
        gold: {
          300: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        dark: {
          50:  '#1A1330',
          100: '#150F28',
          200: '#0F0A1E',
          300: '#080510',
        },
        surface: {
          DEFAULT: '#1E1535',
          raised: '#251A3E',
          overlay: '#2C2148',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        serif: ['Playfair Display', 'Georgia'],
      },
    },
  },
  plugins: [],
};