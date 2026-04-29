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
        glass: "0 8px 32px rgba(30, 42, 34, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
      },
      keyframes: {
        "landing-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(2%, -3%) scale(1.02)" },
          "66%": { transform: "translate(-2%, 2%) scale(0.98)" },
        },
        "landing-drift": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.55" },
        },
        "landing-shine": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "landing-float": "landing-float 14s ease-in-out infinite",
        "landing-float-slow": "landing-float 22s ease-in-out infinite reverse",
        "landing-drift": "landing-drift 6s ease-in-out infinite",
        "landing-shine": "landing-shine 8s linear infinite",
        fadeIn: "fadeIn 0.35s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

