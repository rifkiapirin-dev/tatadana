import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Electric Cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        aurora: {
          emerald: '#10b981',
          cyan: '#06b6d4',
          mint: '#34d399',
          slate: '#0f172a',
        },
        surface: {
          light: '#f8fafc',
          DEFAULT: '#ffffff',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'aurora-gradient-hover': 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
        'aurora-soft': 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -3px rgba(6, 182, 212, 0.35)',
        'aurora-card': '0 10px 30px -5px rgba(6, 182, 212, 0.12), 0 4px 12px -2px rgba(16, 185, 129, 0.08)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
