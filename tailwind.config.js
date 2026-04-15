/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#0D0C0B',
          surface: '#141312',
          border: '#2A2825',
          text: '#F0EDE8',
          muted: '#8A8480',
          accent: '#C8B89A',
          danger: '#7A4A3A',
          highlight: '#4A6A5A',
        }
      },
      fontFamily: {
        serif: ['"IM Fell English"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', '"Suisse Intl"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        cinema: '0.15em',
      }
    },
  },
  plugins: [],
}
