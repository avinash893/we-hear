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
        background: "#FAF8F5",
        surface: "#FFFFFF",
        "surface-muted": "#F4EFEA",
        border: "#E7E1D8",
        primary: {
          50: "#F2F7F4",
          100: "#E3EFE9",
          200: "#C4DFD1",
          300: "#96C5AE",
          400: "#65A588",
          500: "#3E8668",
          600: "#2F6B52",
          700: "#275543",
          800: "#224537",
          900: "#1E392E",
          950: "#0E2019",
          DEFAULT: "#2F6B52",
        },
        warm: {
          50: "#FAF7F2",
          100: "#F3EDE3",
          200: "#E6DBCB",
          300: "#D6C3AB",
          400: "#C3A686",
          500: "#B38C67",
          600: "#9D7453",
          700: "#7E5B42",
          800: "#674B39",
          900: "#543E31",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
