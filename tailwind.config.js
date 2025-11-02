/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#007A33', // Polokwane green
          600: '#00662B',
        },
        accent: {
          500: '#FDB913', // service-delivery gold
        },
        background: {
          100: '#F4F4F4', // light page background
        },
        textc: {
          100: '#1E1E1E', // dark readable text
        },
      },
    },
  },
  plugins: [],
};
