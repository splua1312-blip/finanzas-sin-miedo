import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f2",
          100: "#d6ece0",
          200: "#aedcc3",
          300: "#7fc6a2",
          400: "#4faa7f",
          500: "#2f8d63",
          600: "#22714f",
          700: "#1d5a41",
          800: "#194835",
          900: "#153b2d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
