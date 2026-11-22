/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Luxury Foundation
        ivory: '#FAF8F5',
        'soft-white': '#FFFFFF',
        linen: '#F4EFEA',
        'linen-light': '#FBF9F6',
        'linen-subtle': '#EDE6DC',

        // Signature Forest Green
        forest: '#1B3B2B',
        'forest-dark': '#12281D',
        'forest-light': '#254E3A',
        'forest-soft': '#EAF2EC',

        // Rich Espresso / Charcoal Typography
        espresso: '#211D1A',
        'espresso-soft': '#544E48',
        'espresso-light': '#78726A',
        charcoal: '#211D1A',
        'charcoal-soft': '#544E48',
        'charcoal-light': '#78726A',

        // Muted Terracotta Accent
        terracotta: '#B85D43',
        'terracotta-dark': '#964731',
        'terracotta-soft': '#F8ECE8',
        clay: '#B85D43', // Backward compatibility alias

        // Antique Brass Highlights
        brass: '#C29F58',
        'brass-dark': '#9E7F3D',
        'brass-light': '#D8B875',
        'brass-soft': '#F9F5EC',
        butter: '#E8D5A0', // Backward compatibility alias

        // Supporting Stone & Sage Surfaces
        'stone-warm': '#EAE4DA',
        'stone-light': '#F2EFEA',
        sage: '#6B7F6E',
        'sage-soft': '#EEF3EF',
        'sage-border': '#CFD9D0',
        'sage-dark': '#4D5F50',

        // Refined Borders
        border: '#E6DFC',
        'border-subtle': 'rgba(33, 29, 26, 0.08)',
        'border-medium': 'rgba(33, 29, 26, 0.16)',

        // Preserved compatibility aliases
        cream: '#FAF8F5',
        ink: '#211D1A',
        'ink-soft': '#544E48',
        'ink-light': '#78726A',
        peach: '#B85D43',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-badge': 'pulseBadge 0.4s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up-fade': 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'drawer-in': 'drawerIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-out': 'toastOut 0.25s ease-in both',
        'wiggle': 'wiggle 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseBadge: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        drawerIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(16px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
};
