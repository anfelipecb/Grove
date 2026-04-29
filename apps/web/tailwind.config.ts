import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bark: "#243229",
        moss: "#4d7c55",
        fern: "#dcebd2",
        clay: "#b86f52",
        marigold: "#e7b84d",
        ink: "#15201a",
      },
      boxShadow: {
        panel: "0 10px 30px rgba(30, 42, 34, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

