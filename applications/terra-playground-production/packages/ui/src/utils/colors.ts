/**
 * Color utility functions and theme color definitions
 */

export const themeColors = {
  // Primary brand colors
  primary: {
    50: '#e6f5ff',
    100: '#b3e0ff',
    200: '#80ccff',
    300: '#4db8ff',
    400: '#1aa3ff',
    500: '#0090e6', // Main primary color
    600: '#0071b3',
    700: '#005380',
    800: '#00344d',
    900: '#00131a',
  },

  // Secondary brand colors
  secondary: {
    50: '#f0f9e8',
    100: '#d7eec5',
    200: '#bde3a2',
    300: '#a4d97f',
    400: '#8acf5b',
    500: '#70c438', // Main secondary color
    600: '#59a023',
    700: '#437b1b',
    800: '#2c5512',
    900: '#152f09',
  },

  // Neutral tones
  neutral: {
    50: '#f9f9f9',
    100: '#f1f1f1',
    200: '#e1e1e1',
    300: '#d1d1d1',
    400: '#adadad',
    500: '#8a8a8a',
    600: '#6a6a6a',
    700: '#5a5a5a',
    800: '#383838',
    900: '#1a1a1a',
  },

  // Semantic colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

/**
 * Adjusts a hex color to a different opacity
 *
 * @param hexColor Hex color string (3 or 6 characters)
 * @param opacity Opacity value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hexColor: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hexColor.replace('#', '');

  // Convert short hex to full hex
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map(c => c + c)
          .join('')
      : cleanHex;

  // Parse hex values to RGB
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Determines if a color is light or dark
 *
 * @param hexColor Hex color string
 * @returns True if color is light, false if dark
 */
export function isLightColor(hexColor: string): boolean {
  const cleanHex = hexColor.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map(c => c + c)
          .join('')
      : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  // Calculate perceived brightness using YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128;
}

/**
 * Returns a contrasting text color (black or white) based on background color
 *
 * @param backgroundColor Background color in hex
 * @returns '#ffffff' or '#000000' depending on contrast
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}
