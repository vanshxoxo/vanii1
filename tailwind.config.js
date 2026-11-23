/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Luxury Foundation Tokens (Refined Palette)
        ivory: '#F6F2E9',
        'soft-white': '#FFFFFF',
        linen: '#EDE7DE',
        'linen-light': '#F9F6F0',
        'linen-subtle': '#E5DDD1',

        // Signature Forest Green
        forest: '#263D32',
        'forest-dark': '#1A2B23',
        'forest-light': '#365445',
        'forest-soft': '#E8EDE9',

        // Rich Espresso / Charcoal Typography
        espresso: '#302821',
        'espresso-soft': '#574C42',
        'espresso-light': '#7C7167',
        charcoal: '#302821',
        'charcoal-soft': '#574C42',
        'charcoal-light': '#7C7167',

        // Muted Terracotta Accent
        terracotta: '#B96F55',
        'terracotta-dark': '#97553F',
        'terracotta-soft': '#F8ECE8',
        clay: '#B96F55', // Backward compatibility alias

        // Antique Brass Highlights
        brass: '#B08A52',
        'brass-dark': '#8E6C3A',
        'brass-light': '#C7A56E',
        'brass-soft': '#F7F2E8',
        butter: '#D6B87A', // Backward compatibility alias

        // Supporting Stone & Sage Surfaces
        'stone-warm': '#DED6C9',
        'stone-light': '#EAE4D9',
        'stone-dark': '#B5AB9C',
        sage: '#A7AD97',
        'sage-soft': '#EFF1EC',
        'sage-border': '#D0D6C7',
        'sage-dark': '#6B735B',

        // Refined Borders
        border: 'rgba(48, 40, 33, 0.12)',
        'border-subtle': 'rgba(48, 40, 33, 0.08)',
        'border-medium': 'rgba(48, 40, 33, 0.18)',

        // Preserved compatibility aliases
        cream: '#F6F2E9',
        ink: '#302821',
        'ink-soft': '#574C42',
        'ink-light': '#7C7167',
        peach: '#B96F55',
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
