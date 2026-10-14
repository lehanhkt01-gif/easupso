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
        heritage: {
          cream: "#FAF7F2",
          50: "#FAF7F2",
          100: "#F3EDE1",
          200: "#E6DAC4",
          300: "#D5C3A1",
        },
        forest: {
          DEFAULT: "#1B4332",
          50: "#E8F5EE",
          100: "#D1EBDD",
          200: "#A3D7BB",
          300: "#75C399",
          400: "#47AF77",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#143326",
          800: "#0D221A",
          900: "#07130E",
        },
        basalt: {
          DEFAULT: "#C85A32",
          50: "#FAEEE9",
          100: "#F4DDD3",
          200: "#EBBAA7",
          300: "#E1977C",
          400: "#D77550",
          500: "#C85A32",
          600: "#A44725",
          700: "#7F371D",
          800: "#5B2715",
          900: "#36170C",
        },
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FCF8EC",
          100: "#F9F2D9",
          200: "#F3E4B3",
          300: "#ECD78D",
          400: "#E5C967",
          500: "#D4AF37",
          600: "#AA8C2C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        heritage: "0 4px 20px -2px rgba(27, 67, 50, 0.08)",
        "heritage-lg": "0 10px 30px -4px rgba(27, 67, 50, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
