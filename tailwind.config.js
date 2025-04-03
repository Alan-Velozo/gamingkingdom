/** @type {import('tailwindcss').Config} */
export default {
  // content lleva un array que indica qué archivos deben ser observados para encontrar las
  // clases de Tailwind que se están usando.
  content: [
    "./index.html",
    "./src/**/*.{vue,js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      height: {
        'footer': '100px',
      },
      gridTemplateRows: {
        'layout': '60px 1fr 100px',
      }
    },
  },
  plugins: [],
}

