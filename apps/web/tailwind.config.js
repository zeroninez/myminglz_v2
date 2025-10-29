/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f0ff',
          100: '#bfd8ff',
          200: '#99c0ff',
          300: '#73a8ff',
          400: '#4d90ff',
          500: '#2678ff',
          600: '#1a5cd9',
          700: '#1042b3',
          800: '#082b8c',
          900: '#031666',
        },
        primary: {
          DEFAULT: '#4C6FFF',
          50: '#FFFFFF',
          100: '#F5F7FF',
          200: '#E6EBFF',
          300: '#D6DEFF',
          400: '#C7D2FF',
          500: '#4C6FFF',
          600: '#1B45FF',
          700: '#0031E7',
          800: '#0026B4',
          900: '#001B81'
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}



