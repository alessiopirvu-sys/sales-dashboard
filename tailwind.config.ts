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
        border: "hsl(214 32% 91%)",
        input: "hsl(214 32% 91%)",
        ring: "hsl(219 86% 59%)",
        background: "hsl(210 40% 98%)",
        foreground: "hsl(220 30% 18%)",
        primary: {
          DEFAULT: "hsl(219 86% 59%)",
          foreground: "hsl(210 40% 98%)"
        },
        secondary: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(220 30% 18%)"
        },
        muted: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(215 20% 45%)"
        },
        accent: {
          DEFAULT: "hsl(215 100% 96%)",
          foreground: "hsl(219 86% 59%)"
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(220 30% 18%)"
        }
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI Variable", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["Aptos Display", "Aptos", "Segoe UI Variable", "Helvetica Neue", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 60px -32px rgba(58, 106, 222, 0.22)",
        card: "0 30px 80px -38px rgba(22, 51, 108, 0.18)",
        float: "0 40px 120px -58px rgba(33, 71, 148, 0.26)",
        insetSoft: "inset 0 1px 0 rgba(255,255,255,0.75)"
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at 10% 10%, rgba(77, 132, 255, 0.18), transparent 30%), radial-gradient(circle at 85% 5%, rgba(175, 211, 255, 0.45), transparent 24%), linear-gradient(180deg, #fbfdff 0%, #f3f7fc 100%)"
      }
    }
  },
  plugins: []
};

export default config;
