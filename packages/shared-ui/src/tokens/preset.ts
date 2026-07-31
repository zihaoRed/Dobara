/** Dobara Tailwind CSS Preset — Commercial Edition */
const preset = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        terracotta: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          500: 'var(--color-accent-500)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-low)',
          card: 'var(--color-surface-container)',
          elevated: 'var(--color-surface-container)',
          dark: '#1b1f1c',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          strong: 'var(--color-border-strong)',
        },
        /* Backward-compat aliases — all use CSS variables */
        primary: {
          '50': 'var(--color-primary-50)', '100': 'var(--color-primary-100)',
          '500': 'var(--color-primary-500)', '600': 'var(--color-primary-600)',
          '700': 'var(--color-primary-700)',
        },
        accent: {
          '50': 'var(--color-accent-50)', '100': 'var(--color-accent-100)',
          '500': 'var(--color-accent-500)',
        },
        dobara: {
          success: 'var(--color-success)', 'success-light': 'var(--color-success-light)',
          info: 'var(--color-info)', 'info-light': 'var(--color-info-light)',
          warning: 'var(--color-warning)', 'warning-light': 'var(--color-warning-light)',
          error: 'var(--color-error)', 'error-light': 'var(--color-error-light)',
        },
        'surface-container': 'var(--color-surface-container)',
        'surface-low': 'var(--color-surface-low)',
        'surface-high': 'var(--color-surface-high)',
      },
      textColor: {
        DEFAULT: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        body: 'var(--color-text-body)',
        muted: 'var(--color-text-muted)',
        placeholder: 'var(--color-text-placeholder)',
        inverse: '#f9faf9',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-body': 'var(--color-text-body)',
        'text-muted': 'var(--color-text-muted)',
      },
      fontFamily: {
        display: ["'DM Serif Display'", 'Georgia', 'serif'],
        heading: ["'DM Serif Display'", 'Georgia', 'serif'],
        body: ["'DM Sans'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 5vw, 3.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h1: ['clamp(2rem, 3.5vw, 2.75rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h2: ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.2' }],
        h3: ['clamp(1.25rem, 2vw, 1.5rem)', { lineHeight: '1.3' }],
        h4: ['1.25rem', { lineHeight: '1.35' }],
        lead: ['1.125rem', { lineHeight: '1.6' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        eyebrow: ['0.6875rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }],
        mono: ['0.875rem', { lineHeight: '1.6' }],
      },
      spacing: {
        0.5: '2px', 1: '4px', 1.5: '6px', 2: '8px', 2.5: '10px',
        3: '12px', 3.5: '14px', 4: '16px', 5: '20px', 6: '24px',
        7: '32px', 8: '40px', 9: '48px', 10: '56px', 11: '64px', 12: '80px', 14: '96px',
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px', full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0,0,0,0.03)',
        sm: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
        card: 'var(--shadow-card)',
        'card-hover': '0 8px 24px -4px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        float: 'var(--shadow-elevated)',
        modal: '0 24px 48px -6px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        overlay: '0 32px 64px -8px rgba(0,0,0,0.16)',
        inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.04)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-low) 100%)',
        'gradient-emerald': 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)',
        'gradient-terracotta': 'linear-gradient(135deg, var(--color-accent-500) 0%, #d1662d 100%)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};

export default preset;
