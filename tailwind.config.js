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
        clay:   '#E05540',   // terra cotta primary
        ember:  '#C94830',   // terra cotta hover
        ink:    '#1A1A1A',   // near-black text
        mist:   '#888888',   // medium gray
        fog:    '#C4C4C4',   // light gray
        cream:  '#F5F0EB',   // warm page background
        card:   '#FFFFFF',
        line:   '#EAE5DF',   // warm border
      },
      boxShadow: {
        soft:    '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
        lift:    '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        sheet:   '0 -4px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.06)',
        overlay: '0 20px 60px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}
