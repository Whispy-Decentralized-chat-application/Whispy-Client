/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Habilitar el soporte para el tema oscuro
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}", // Escanea todos los archivos en src/app
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};