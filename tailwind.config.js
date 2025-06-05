/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", // For App.js/App.tsx in the root
    "./app/**/*.{js,jsx,ts,tsx}", // If using Expo Router with an 'app' directory
    "./components/**/*.{js,jsx,ts,tsx}", // For your components
    // Add any other directories/files where you use Tailwind classes
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
