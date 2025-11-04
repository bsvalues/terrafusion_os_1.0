/**
 * Terrafusion Tailwind Plugin
 * This plugin extends the Tailwind config with our custom Terrafusion design tokens
 */

module.exports = function terrafusionPlugin() {
  return function ({ addUtilities, theme, variants, e, addComponents, config, addBase }) {
    // Add Terrafusion colors to Tailwind
    addComponents({
      // Primary colors
      '.text-primary-blue': { color: 'var(--color-primary-blue)' },
      '.text-primary-blue-light': { color: 'var(--color-primary-blue-light)' },
      '.text-primary-blue-dark': { color: 'var(--color-primary-blue-dark)' },
      '.text-primary-green': { color: 'var(--color-primary-green)' },
      '.text-primary-green-light': { color: 'var(--color-primary-green-light)' },
      '.text-primary-green-dark': { color: 'var(--color-primary-green-dark)' },
      '.text-primary-orange': { color: 'var(--color-primary-orange)' },
      '.text-primary-orange-light': { color: 'var(--color-primary-orange-light)' },
      '.text-primary-orange-dark': { color: 'var(--color-primary-orange-dark)' },
      '.text-primary-red': { color: 'var(--color-primary-red)' },
      '.text-primary-red-light': { color: 'var(--color-primary-red-light)' },
      '.text-primary-red-dark': { color: 'var(--color-primary-red-dark)' },

      // Background colors
      '.bg-primary-blue': { backgroundColor: 'var(--color-primary-blue)' },
      '.bg-primary-blue-light': { backgroundColor: 'var(--color-primary-blue-light)' },
      '.bg-primary-blue-dark': { backgroundColor: 'var(--color-primary-blue-dark)' },
      '.bg-primary-green': { backgroundColor: 'var(--color-primary-green)' },
      '.bg-primary-green-light': { backgroundColor: 'var(--color-primary-green-light)' },
      '.bg-primary-green-dark': { backgroundColor: 'var(--color-primary-green-dark)' },
      '.bg-primary-orange': { backgroundColor: 'var(--color-primary-orange)' },
      '.bg-primary-orange-light': { backgroundColor: 'var(--color-primary-orange-light)' },
      '.bg-primary-orange-dark': { backgroundColor: 'var(--color-primary-orange-dark)' },
      '.bg-primary-red': { backgroundColor: 'var(--color-primary-red)' },
      '.bg-primary-red-light': { backgroundColor: 'var(--color-primary-red-light)' },
      '.bg-primary-red-dark': { backgroundColor: 'var(--color-primary-red-dark)' },

      // Border colors
      '.border-primary-blue': { borderColor: 'var(--color-primary-blue)' },
      '.border-primary-blue-light': { borderColor: 'var(--color-primary-blue-light)' },
      '.border-primary-blue-dark': { borderColor: 'var(--color-primary-blue-dark)' },
      '.border-primary-green': { borderColor: 'var(--color-primary-green)' },
      '.border-primary-green-light': { borderColor: 'var(--color-primary-green-light)' },
      '.border-primary-green-dark': { borderColor: 'var(--color-primary-green-dark)' },
      '.border-primary-orange': { borderColor: 'var(--color-primary-orange)' },
      '.border-primary-orange-light': { borderColor: 'var(--color-primary-orange-light)' },
      '.border-primary-orange-dark': { borderColor: 'var(--color-primary-orange-dark)' },
      '.border-primary-red': { borderColor: 'var(--color-primary-red)' },
      '.border-primary-red-light': { borderColor: 'var(--color-primary-red-light)' },
      '.border-primary-red-dark': { borderColor: 'var(--color-primary-red-dark)' },

      // Accent colors
      '.text-primary-teal': { color: 'var(--color-accent-teal)' },
      '.text-primary-teal-dark': { color: 'hsl(180, 70%, 35%)' },
      '.text-primary-teal-light': { color: 'hsl(180, 70%, 55%)' },
      '.bg-primary-teal': { backgroundColor: 'var(--color-accent-teal)' },
      '.bg-primary-teal-dark': { backgroundColor: 'hsl(180, 70%, 35%)' },
      '.bg-primary-teal-light': { backgroundColor: 'hsl(180, 70%, 55%)' },
      '.border-primary-teal': { borderColor: 'var(--color-accent-teal)' },
      '.border-primary-teal-dark': { borderColor: 'hsl(180, 70%, 35%)' },
      '.border-primary-teal-light': { borderColor: 'hsl(180, 70%, 55%)' },
    });
  };
};
