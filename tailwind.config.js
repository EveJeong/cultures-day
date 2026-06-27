/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Black Han Sans"', 'sans-serif'],
        body: ['Jua', 'sans-serif'],
        head: ['"Do Hyeon"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
