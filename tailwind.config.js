/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Storybook Tokens
        bg: '#FFF9F0',
        surface: '#FFFFFF',
        'surface-2': '#FFF3E6',
        
        // Inks (WCAG compliant)
        ink: {
          DEFAULT: '#2E2540',
          soft: '#5E5370',
          faint: '#8A7F99',
        },
        // Backward-compatible alias for existing code
        main: {
          DEFAULT: '#2E2540',
          light: '#5E5370',
          muted: '#8A7F99',
          subtle: '#A499B3',
        },

        // Brand Palette
        brand: {
          100: '#FFE3EA',
          400: '#F0607F',
          600: '#D13A5E',
          700: '#B92F51',
        },
        primary: {
          DEFAULT: '#D13A5E',
          hover: '#B92F51',
          light: '#FFE3EA',
          dark: '#B92F51',
        },

        // Magic AI
        magic: {
          DEFAULT: '#6C5CE7',
          600: '#6C5CE7',
          700: '#5B4BD6',
        },
        accent: {
          DEFAULT: '#6C5CE7',
          hover: '#5B4BD6',
          light: '#ECE9FF',
          dark: '#4834D4',
        },

        // Pastel Decorative (backgrounds only, text always ink)
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
        peach: {
          DEFAULT: '#FFD6BA',
          light: '#FFEBDC',
          dark: '#F5B892',
        },

        // Status pairs
        status: {
          'success-bg': '#DDF6E9',
          'success-text': '#1F8A5B',
          'warning-bg': '#FFF1B8',
          'warning-text': '#8A5A00',
          'danger-bg': '#FFE3EA',
          'danger-text': '#B42343',
          'info-bg': '#CDE7FF',
          'info-text': '#1F5FA8',
        },

        cream: {
          DEFAULT: '#FFF9F0',
          50: '#FFFFFF',
          100: '#FFFDF9',
          200: '#FFF9F0',
          300: '#FFF3E6',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Quicksand', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        story: ['Baloo 2', 'Quicksand', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '28px',
        input: '16px',
        pill: '9999px',
        '3xl': '1.5rem',
        '4xl': '28px',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(46,37,64,.06), 0 12px 32px -12px rgba(46,37,64,.16)',
        pop: '0 24px 48px -16px rgba(46,37,64,.28)',
        // Alias existing soft to modern soft card
        soft: '0 1px 2px rgba(46,37,64,.06), 0 12px 32px -12px rgba(46,37,64,.16)',
        'soft-lg': '0 24px 48px -16px rgba(46,37,64,.28)',
        'soft-inner': 'inset 0 2px 4px 0 rgba(46, 37, 64, 0.06)',
        'btn-primary': '0 8px 20px -8px rgba(209, 58, 94, 0.5)',
        'btn-magic': '0 8px 20px -8px rgba(108, 92, 231, 0.5)',
        'glow-primary': '0 0 25px -2px rgba(209, 58, 94, 0.35)',
        'glow-accent': '0 0 25px -2px rgba(108, 92, 231, 0.35)',
      },
      backgroundImage: {
        'magic-gradient': 'linear-gradient(135deg, #8B7CF6, #F472B6)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
