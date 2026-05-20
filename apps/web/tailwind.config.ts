import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        "card-foreground": "hsl(var(--card-foreground) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--accent-foreground) / <alpha-value>)",
        bark: "#243229",
        moss: "hsl(var(--moss) / <alpha-value>)",
        "moss-fg": "hsl(var(--moss-fg) / <alpha-value>)",
        fern: "#dcebd2",
        clay: "#b86f52",
        marigold: "#e7b84d",
        ink: "#15201a",
      },
      boxShadow: {
        panel: "0 10px 30px rgba(30, 42, 34, 0.08)",
        "panel-dark": "0 10px 30px rgba(0, 0, 0, 0.35)",
        glass: "0 8px 32px rgba(30, 42, 34, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      ringOffsetColor: {
        background: "hsl(var(--background) / <alpha-value>)",
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

