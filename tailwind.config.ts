import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1DB954",
          dark: "#169941",
          light: "#4bdf7f"
        },
        surface: {
          DEFAULT: "#121212",
          raised: "#181818",
          hover: "#282828",
          border: "#2a2a2a"
        }
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
