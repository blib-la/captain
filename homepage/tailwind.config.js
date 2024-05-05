/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class", 'html[class~="dark"]'],
	content: ["./components/**/*.{ts,tsx}", "./pages/**/*.{md,mdx}", "./theme.config.jsx"],
};
