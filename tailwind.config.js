/** @type {import('tailwindcss').Config} */

// ─── Design system ───────────────────────────────────────────────────────────
// Primary accent : #0055FF  (CTAs and key accents only)
// Page background: #F8F8F8  (gray-50 / slate-50)
// Text primary   : #111111  (gray-900)
// Text secondary : #666666  (gray-600)
// Border/divider : #E5E5E5  (gray-200)
// Semantic       : success #16A34A · warning #D97706 · error #DC2626
//
// The gray/slate/blue scales below are pinned to these tokens so that every
// existing utility class (text-gray-900, border-gray-200, bg-blue-50 …)
// resolves to a design-system value. No random colors.

const neutral = {
  50:  '#F8F8F8',
  100: '#F0F0F0',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#999999',
  500: '#737373',
  600: '#666666',
  700: '#444444',
  800: '#222222',
  900: '#111111',
  950: '#0A0A0A',
}

const brandBlue = {
  50:  '#EEF4FF',
  100: '#DBE7FF',
  200: '#B8CFFF',
  300: '#85ADFF',
  400: '#4D85FF',
  500: '#1F66FF',
  600: '#0055FF',
  700: '#0044CC',
  800: '#003699',
  900: '#002B7A',
  950: '#001F57',
}

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // App design-system colors (used throughout existing pages)
        primary: {
          DEFAULT: '#0055FF',
          dark:    '#0044CC',
          darker:  '#003699',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger:  '#DC2626',

        // Pinned scales — keep all existing utility classes on-system
        gray:  neutral,
        slate: neutral,
        blue:  brandBlue,

        // shadcn/ui CSS-variable tokens
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
}
