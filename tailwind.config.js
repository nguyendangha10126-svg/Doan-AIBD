/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FFF9F0',
          50: '#FFFFFF',
          100: '#FFFDF9',
          200: '#FFF9F0',
          300: '#FDF1E0',
        },
        peach: {
          DEFAULT: '#FFD6BA',
          light: '#FFEBDC',
          dark: '#F5B892',
        },
        mint: {
          DEFAULT: '#C9F0DD',
          light: '#E5FAF0',
          dark: '#9FE2C0',
        },
        sky: {
          DEFAULT: '#CDE7FF',
          light: '#EAF4FF',
          dark: '#A6D3FF',
        },
        lavender: {
          DEFAULT: '#E3D9FF',
          light: '#F3EFFF',
          dark: '#C8B6FF',
        },
        butter: {
          DEFAULT: '#FFF1B8',
          light: '#FFF9DC',
          dark: '#FFE485',
        },
        main: {
          DEFAULT: '#4A3F55',
          light: '#726480',
          muted: '#9284A1',
          subtle: '#B8ACB2',
        },
        primary: {
          DEFAULT: '#FF8FA3',
          hover: '#FF758F',
          light: '#FFEBF0',
          dark: '#E86B83',
        },
        accent: {
          DEFAULT: '#7C6CF0',
          hover: '#6856EA',
          light: '#ECE9FF',
          dark: '#5B47DC',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Quicksand', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 8px 30px -4px rgba(74, 63, 85, 0.08), 0 4px 12px -2px rgba(74, 63, 85, 0.04)',
        'soft-lg': '0 20px 40px -10px rgba(74, 63, 85, 0.12), 0 8px 16px -4px rgba(74, 63, 85, 0.06)',
        'soft-inner': 'inset 0 2px 4px 0 rgba(74, 63, 85, 0.06)',
        'glow-primary': '0 0 25px -2px rgba(255, 143, 163, 0.45)',
        'glow-accent': '0 0 25px -2px rgba(124, 108, 240, 0.45)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

