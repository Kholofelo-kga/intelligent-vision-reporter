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
          500: '#1e3a8a', // deep municipal blue
          600: '#172b63',
        },
        accent: {
          500: '#facc15', // service-warning yellow
        },
      },
    },
  },
  plugins: [],
};
