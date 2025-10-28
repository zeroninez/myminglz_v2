/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
          blue: '#4C6FFF',
          background: '#4C6FFF',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}



