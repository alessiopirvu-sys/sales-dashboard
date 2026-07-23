import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(220 14% 90%)",
        input: "hsl(220 14% 90%)",
        ring: "hsl(262 83% 58%)",
        background: "hsl(210 20% 98%)",
        foreground: "hsl(222 22% 12%)",
        primary: {
          DEFAULT: "hsl(262 83% 58%)",
          foreground: "hsl(210 40% 98%)"
        },
        secondary: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222 22% 12%)"
        },
        muted: {
          DEFAULT: "hsl(220 20% 96%)",
          foreground: "hsl(215 14% 42%)"
        },
        accent: {
          DEFAULT: "hsl(270 100% 98%)",
          foreground: "hsl(262 83% 58%)"
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222 22% 12%)"
        }
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI Variable", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["Aptos Display", "Aptos", "Segoe UI Variable", "Helvetica Neue", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px -18px rgba(24, 24, 27, 0.16)",
        card: "0 6px 24px -18px rgba(15, 23, 42, 0.12)",
        float: "0 18px 40px -24px rgba(15, 23, 42, 0.16)",
        insetSoft: "inset 0 1px 0 rgba(255,255,255,0.75)"
      },
      borderRadius: {
        "4xl": "1.5rem",
        "5xl": "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
