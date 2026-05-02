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
        clay:  '#E05540',
        ember: '#C94830',
        ink:   '#1E2240',
        mist:  '#8B8FA8',
        fog:   '#C8CAD8',
        line:  '#ECEDF5',
        card:  '#FFFFFF',
        shell: '#F7F6FF',   // inner app bg tint
      },
      boxShadow: {
        soft:    '0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
        lift:    '0 4px 16px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.05)',
        app:     '0 32px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
        sheet:   '0 -8px 40px rgba(0,0,0,0.14)',
        overlay: '0 24px 64px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        app: '1.75rem',
      },
    },
  },
  plugins: [],
}
