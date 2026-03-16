/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        virens: {
          green: '#1DB954',
          'green-dim': '#17a349',
          'green-glow': '#1DB95433',
          black: '#191414',
          'black-soft': '#1e1a1a',
          'black-card': '#242020',
          'black-glass': '#191414cc',
          white: '#FFFFFF',
          'white-dim': '#f0eded',
          'white-muted': '#a8a0a0',
          gray: '#2a2424',
          'gray-light': '#3d3535',
          'gray-muted': '#524848',
          error: '#e63b3b',
          warning: '#f5a623',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'green-glow':
          'radial-gradient(circle at center, #1DB95420 0%, transparent 70%)',
        'hero-mesh':
          'radial-gradient(at 40% 20%, #1DB95415 0px, transparent 50%), radial-gradient(at 80% 0%, #1DB95408 0px, transparent 50%), radial-gradient(at 0% 50%, #1DB95412 0px, transparent 50%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-hover': '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
        'green-glow': '0 0 40px rgba(29,185,84,0.15)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.6)',
        pin: '0 2px 16px rgba(0,0,0,0.5)',
        'pin-hover': '0 8px 32px rgba(0,0,0,0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite linear',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(29,185,84,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(29,185,84,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
}
