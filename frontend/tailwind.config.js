/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EcoTrade Design System Colors
        background: '#f9f9ff',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'on-primary': '#ffffff',
        'on-primary-container': '#00422b',
        'on-primary-fixed': '#002113',
        'on-primary-fixed-variant': '#005236',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714e',
        'on-surface': '#151c27',
        'on-surface-variant': '#3c4a42',
        outline: '#6c7a71',
        'outline-variant': '#bbcabf',
        primary: '#006c49',
        'primary-container': '#10b981',
        'primary-fixed': '#6ffbbe',
        'primary-fixed-dim': '#4edea3',
        secondary: '#006c4a',
        'secondary-container': '#82f5c1',
        surface: '#f9f9ff',
        'surface-bright': '#f9f9ff',
        'surface-container': '#e7eefe',
        'surface-container-high': '#e2e8f8',
        'surface-container-highest': '#dce2f3',
        'surface-container-low': '#f0f3ff',
        'surface-container-lowest': '#ffffff',
        'surface-dim': '#d3daea',
        'surface-variant': '#dce2f3',
        tertiary: '#a43a3a',
        'tertiary-container': '#fc7c78',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-lg-mobile': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'label-uppercase': ['0.75rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '0.08em' }],
      },
      spacing: {
        'section-gap': '5rem',
        'margin-mobile': '1rem',
        'margin-desktop': '2.5rem',
        gutter: '1.25rem',
        unit: '0.5rem',
      },
      maxWidth: {
        'container-max-width': '1400px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        'apple': '0px 4px 20px rgba(0, 0, 0, 0.04)',
        'apple-md': '0px 8px 32px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        blob: "blob 7s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scale-up": "scaleUp 0.3s ease-out forwards",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        }
      },
    },
  },
  plugins: [],
}
