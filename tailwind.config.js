/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", // Look for Tailwind classes in all HTML files in the root directory
    "./public/**/*.html", // If you decide to put HTML in public/ later
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}