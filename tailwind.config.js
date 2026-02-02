/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // IMPORTANTE: Ativa dark mode via classe CSS
    theme: {
        extend: {},
    },
    plugins: [],
}
