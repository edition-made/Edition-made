/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow: {
          primary: '#fff500',
          hover: '#e6dc00',
        },
        beige: {
          light: '#dad5c7',
          DEFAULT: '#c8c2b0',
        },
        gray: {
          mid: '#b4b4b4',
          dark: '#555555',
        },
        brand: {
          black: '#000000',
          white: '#ffffff',
          yellow: '#fff500',
          beige: '#dad5c7',
          gray: '#b4b4b4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-yellow': 'pulseYellow 2s infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseYellow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 245, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 245, 0, 0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
