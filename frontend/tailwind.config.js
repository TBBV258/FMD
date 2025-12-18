/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007BFF',
          dark: '#0056b3',
          light: '#4da3ff'
        },
        success: {
          DEFAULT: '#28A745',
          dark: '#1e7e34',
          light: '#5cb85c'
        },
        danger: {
          DEFAULT: '#DC3545',
          dark: '#bd2130',
          light: '#e4606d'
        },
        warning: {
          DEFAULT: '#FFC107',
          dark: '#e0a800',
          light: '#ffd454'
        },
        dark: {
          bg: '#121212',
          card: '#1E1E1E',
          border: '#333333',
          text: '#E8E8E8'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif']
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'skeleton': 'skeleton 1.5s ease-in-out infinite'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      }
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  },
  plugins: [],
}
