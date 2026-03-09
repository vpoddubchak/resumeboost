/** @type {import('tailwindcss').Config } */
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspectRatio from '@tailwindcss/aspect-ratio';

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#3b82f6',
          100: '#60a5fa',
          200: '#818cf8',
          300: '#c084fc',
          400: '#6366f1',
          500: '#4f46e5',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#9333ea',
          900: '#111827',
        },
        secondary: {
          50: '#e5e7eb',
          100: '#f3f4c3',
          200: '#d1d5db',
          300: '#fbbf24',
          400: '#f871c1',
          500: '#c2410c',
          600: '#a855f7',
          700: '#334155',
          800: '#6b7280',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
  darkMode: 'class',
}
