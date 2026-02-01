// Shared Tailwind configuration for all ConsultKit apps
// Copy to each app's frontend/tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ConsultKit brand colors
        brand: {
          50: '#f5f7fa',
          100: '#ebeef3',
          200: '#d2dae5',
          300: '#aab9cd',
          400: '#7c94b1',
          500: '#5c7698',
          600: '#485f7e',
          700: '#3b4d66',
          800: '#344256',
          900: '#2f3a4a',
          950: '#1f2631',
        },
      },
    },
  },
  plugins: [],
}

export default config
