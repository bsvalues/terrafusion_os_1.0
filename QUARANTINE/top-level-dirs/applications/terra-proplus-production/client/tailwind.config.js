// TerraFusion Government-Grade Tailwind CSS v4 Configuration
import { defineConfig } from '@tailwindcss/vite'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Government OS Color Palette
        'terra-blue': '#2a4365',
        'terra-blue-light': '#4299e1', 
        'terra-cyan': '#38b2ac',
        'terra-background': '#f8f9fa',
        'terra-text': '#333333',
        
        // Federal Compliance Colors
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "var(--secondary)", 
          dark: "var(--secondary-dark)",
          foreground: "#FFFFFF"
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "#f9fafb",
          foreground: "#111827",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)", 
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
})