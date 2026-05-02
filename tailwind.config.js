/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        rausch: '#FF385C',   // Airbnb's primary red
        hof:    '#E31C5F',   // Airbnb's hover red
        foggy:  '#717171',   // medium gray
        babu:   '#222222',   // near-black text
        border: '#EBEBEB',   // light border
        page:   '#F7F7F7',   // page background
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.08)',
        overlay: '0 8px 28px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
