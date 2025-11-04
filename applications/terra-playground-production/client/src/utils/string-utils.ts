/**
 * Extensions to the String prototype to add utility methods
 */

// Add hashCode method to the String prototype
declare global {
  interface String {
    /**
     * Generates a simple hash code for a string
     *
     * @returns A number representing the string hash
     */
    hashCode(): number;
  }
}

// Implementation of the hashCode method
String.prototype.hashCode = function (): number {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Truncate a string to a maximum length with an ellipsis
 *
 * @param str The string to truncate
 * @param maxLength The maximum length of the string
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Convert a string to title case (first letter of each word capitalized)
 *
 * @param str The string to convert
 * @returns The converted string
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

// Export an empty object to make the file a module
export {};
