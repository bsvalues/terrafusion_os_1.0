import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        spin: {
          to: {
            transform: "rotate(360deg)",
          },
        },
        "pulse-opacity": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        "progress-bar": {
          "0%": {
            width: "0%",
          },
          "100%": {
            width: "100%",
          },
        },
        "progress-indeterminate": {
          "0%": {
            left: "-40%",
          },
          "100%": {
            left: "100%",
          },
        },
        breathe: {
          "0%, 100%": {
            transform: "scale(0.85)",
            opacity: "0.8",
          },
          "50%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        spin: "spin 1s linear infinite",
        "spin-slow": "spin 2s linear infinite",
        "spin-fast": "spin 0.5s linear infinite",
        "pulse-opacity": "pulse-opacity 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "progress-bar-slow": "progress-bar 3s ease-in-out",
        "progress-bar-medium": "progress-bar 1.5s ease-in-out",
        "progress-bar-fast": "progress-bar 0.8s ease-in-out",
        "progress-indeterminate-slow": "progress-indeterminate 3s ease-in-out infinite",
        "progress-indeterminate-medium": "progress-indeterminate 2s ease-in-out infinite",
        "progress-indeterminate-fast": "progress-indeterminate 1s ease-in-out infinite",
        "breathe-slow": "breathe 4s ease-in-out infinite",
        "breathe-medium": "breathe 2s ease-in-out infinite",
        "breathe-fast": "breathe 1.5s ease-in-out infinite",
        "shimmer-slow": "shimmer 5s infinite linear",
        "shimmer-medium": "shimmer 3s infinite linear",
        "shimmer-fast": "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
