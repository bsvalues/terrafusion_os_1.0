import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // TerraFusion Design System Integration
      colors: {
        // TerraSphere Primary Colors
        terra: {
          50: "var(--tf-color-terra-primary-50)",
          100: "var(--tf-color-terra-primary-100)",
          200: "var(--tf-color-terra-primary-200)",
          300: "var(--tf-color-terra-primary-300)",
          400: "var(--tf-color-terra-primary-400)",
          500: "var(--tf-color-terra-primary-500)",
          600: "var(--tf-color-terra-primary-600)",
          700: "var(--tf-color-terra-primary-700)",
          800: "var(--tf-color-terra-primary-800)",
          900: "var(--tf-color-terra-primary-900)",
        },
        // Earth Geological Colors
        earth: {
          50: "var(--tf-color-terra-earth-50)",
          100: "var(--tf-color-terra-earth-100)",
          200: "var(--tf-color-terra-earth-200)",
          300: "var(--tf-color-terra-earth-300)",
          400: "var(--tf-color-terra-earth-400)",
          500: "var(--tf-color-terra-earth-500)",
          600: "var(--tf-color-terra-earth-600)",
          700: "var(--tf-color-terra-earth-700)",
          800: "var(--tf-color-terra-earth-800)",
          900: "var(--tf-color-terra-earth-900)",
        },
        // Forest Vegetation Colors
        forest: {
          50: "var(--tf-color-terra-forest-50)",
          100: "var(--tf-color-terra-forest-100)",
          200: "var(--tf-color-terra-forest-200)",
          300: "var(--tf-color-terra-forest-300)",
          400: "var(--tf-color-terra-forest-400)",
          500: "var(--tf-color-terra-forest-500)",
          600: "var(--tf-color-terra-forest-600)",
          700: "var(--tf-color-terra-forest-700)",
          800: "var(--tf-color-terra-forest-800)",
          900: "var(--tf-color-terra-forest-900)",
        },
        // Semantic Colors for UI States
        success: {
          50: "var(--tf-color-semantic-success-50)",
          500: "var(--tf-color-semantic-success-500)",
          700: "var(--tf-color-semantic-success-700)",
        },
        warning: {
          50: "var(--tf-color-semantic-warning-50)",
          500: "var(--tf-color-semantic-warning-500)",
          700: "var(--tf-color-semantic-warning-700)",
        },
        error: {
          50: "var(--tf-color-semantic-error-50)",
          500: "var(--tf-color-semantic-error-500)",
          700: "var(--tf-color-semantic-error-700)",
        },
        info: {
          50: "var(--tf-color-semantic-info-50)",
          500: "var(--tf-color-semantic-info-500)",
          700: "var(--tf-color-semantic-info-700)",
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        mono: ["JetBrains Mono", "Fira Code", ...fontFamily.mono],
      },
      fontSize: {
        xs: "var(--tf-typography-fontSize-xs)",
        sm: "var(--tf-typography-fontSize-sm)",
        base: "var(--tf-typography-fontSize-base)",
        lg: "var(--tf-typography-fontSize-lg)",
        xl: "var(--tf-typography-fontSize-xl)",
        "2xl": "var(--tf-typography-fontSize-2xl)",
        "3xl": "var(--tf-typography-fontSize-3xl)",
        "4xl": "var(--tf-typography-fontSize-4xl)",
        "5xl": "var(--tf-typography-fontSize-5xl)",
        "6xl": "var(--tf-typography-fontSize-6xl)",
      },
      spacing: {
        1: "var(--tf-spacing-1)",
        2: "var(--tf-spacing-2)",
        3: "var(--tf-spacing-3)",
        4: "var(--tf-spacing-4)",
        5: "var(--tf-spacing-5)",
        6: "var(--tf-spacing-6)",
        8: "var(--tf-spacing-8)",
        10: "var(--tf-spacing-10)",
        12: "var(--tf-spacing-12)",
        16: "var(--tf-spacing-16)",
        20: "var(--tf-spacing-20)",
        24: "var(--tf-spacing-24)",
      },
      borderRadius: {
        sm: "var(--tf-borderRadius-sm)",
        base: "var(--tf-borderRadius-base)",
        md: "var(--tf-borderRadius-md)",
        lg: "var(--tf-borderRadius-lg)",
        xl: "var(--tf-borderRadius-xl)",
        "2xl": "var(--tf-borderRadius-2xl)",
        "3xl": "var(--tf-borderRadius-3xl)",
        full: "var(--tf-borderRadius-full)",
      },
      boxShadow: {
        sm: "var(--tf-shadow-sm)",
        base: "var(--tf-shadow-base)",
        md: "var(--tf-shadow-md)",
        lg: "var(--tf-shadow-lg)",
        xl: "var(--tf-shadow-xl)",
        inner: "var(--tf-shadow-inner)",
      },
      animation: {
        "terra-spin": "terra-spin var(--tf-animation-duration-slower) var(--tf-animation-easing-terra) infinite",
        "terra-pulse": "terra-pulse var(--tf-animation-duration-slow) var(--tf-animation-easing-easeInOut) infinite alternate",
        "terra-float": "terra-float var(--tf-animation-duration-slower) var(--tf-animation-easing-easeInOut) infinite alternate",
      },
      keyframes: {
        "terra-spin": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        "terra-pulse": {
          "0%": { opacity: "0.7", transform: "scale(1)" },
          "100%": { opacity: "1", transform: "scale(1.05)" },
        },
        "terra-float": {
          "0%": { transform: "translateY(0px)" },
          "100%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;