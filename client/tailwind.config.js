export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: 'rgb(var(--bg-base-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--bg-elevated-rgb) / <alpha-value>)',
          raised: 'rgb(var(--bg-elevated-2-rgb) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover: 'var(--color-primary-hover)',
          muted: 'rgb(var(--color-primary-rgb) / 0.14)',
          soft: 'rgb(var(--color-primary-rgb) / 0.08)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
          muted: 'rgb(var(--color-accent-rgb) / 0.14)',
          soft: 'rgb(var(--color-accent-rgb) / 0.08)',
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        subtle: 'rgb(var(--border-subtle-rgb) / <alpha-value>)',
        success: {
          DEFAULT: 'rgb(var(--success-rgb) / <alpha-value>)',
          muted: 'rgb(var(--success-rgb) / 0.14)',
        },
        warning: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        danger: {
          DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
          muted: 'rgb(var(--danger-rgb) / 0.14)',
        },
      },
      boxShadow: {
        glow: '0 0 40px -8px rgb(var(--color-primary-rgb) / 0.35)',
        'glow-sm': '0 0 24px -6px rgb(var(--color-primary-rgb) / 0.28)',
        card: '0 0 0 1px rgb(var(--border-subtle) / 0.5), 0 8px 32px -8px rgb(0 0 0 / 0.45)',
        'accent-glow': '0 0 28px -6px rgb(var(--color-accent-rgb) / 0.4)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
