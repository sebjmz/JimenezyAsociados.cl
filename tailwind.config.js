/** Compila solo las clases usadas en public/ (reemplaza cdn.tailwindcss.com). */
module.exports = {
  content: ['./public/**/*.html', './public/js/**/*.js'],
  theme: { extend: {} },
  plugins: [],
};
