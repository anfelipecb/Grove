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
        "landing-ring-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "landing-dot": {
          "0%, 100%": { opacity: "0.35", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(-3px)" },
        },
        "landing-grow-badge": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.92" },
        },
        "landing-plant-soil": {
          "0%": { opacity: "0", transform: "scaleX(0.6)" },
          "8%, 100%": { opacity: "1", transform: "scaleX(1)" },
        },
        "landing-plant-root": {
          "0%, 6%": { opacity: "0", transform: "scale(0.7)" },
          "14%, 100%": { opacity: "1", transform: "scale(1)" },
        },
        "landing-plant-stem": {
          "0%, 12%": { opacity: "0", transform: "scaleY(0)" },
          "22%, 100%": { opacity: "1", transform: "scaleY(1)" },
        },
        "landing-plant-leaf-left": {
          "0%, 20%": { opacity: "0", transform: "scale(0.5) rotate(-8deg)" },
          "30%, 100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        "landing-plant-branch": {
          "0%, 28%": { opacity: "0", transform: "scaleX(0)" },
          "38%, 100%": { opacity: "1", transform: "scaleX(1)" },
        },
        "landing-plant-leaf-top": {
          "0%, 34%": { opacity: "0", transform: "scale(0.6)" },
          "44%, 100%": { opacity: "1", transform: "scale(1)" },
        },
        "landing-plant-node": {
          "0%, 42%": { opacity: "0", transform: "scale(0)" },
          "52%, 88%": { opacity: "1", transform: "scale(1)" },
          "94%, 100%": { opacity: "0.85", transform: "scale(0.96)" },
        },
        "landing-plant-sway": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(1.5deg)" },
        },
      },
      animation: {
        "landing-float": "landing-float 14s ease-in-out infinite",
        "landing-float-slow": "landing-float 22s ease-in-out infinite reverse",
        "landing-drift": "landing-drift 6s ease-in-out infinite",
        "landing-shine": "landing-shine 8s linear infinite",
        "landing-ring-spin": "landing-ring-spin 5s linear infinite",
        "landing-dot": "landing-dot 1s ease-in-out infinite",
        "landing-grow-badge": "landing-grow-badge 2.4s ease-in-out infinite",
        "landing-plant-soil": "landing-plant-soil 16s ease-out infinite",
        "landing-plant-root": "landing-plant-root 16s ease-out infinite",
        "landing-plant-stem": "landing-plant-stem 16s ease-out infinite",
        "landing-plant-leaf-left": "landing-plant-leaf-left 16s ease-out infinite",
        "landing-plant-branch": "landing-plant-branch 16s ease-out infinite",
        "landing-plant-leaf-top": "landing-plant-leaf-top 16s ease-out infinite",
        "landing-plant-node": "landing-plant-node 16s ease-in-out infinite",
        "landing-plant-sway": "landing-plant-sway 5s ease-in-out infinite",
        fadeIn: "fadeIn 0.35s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

