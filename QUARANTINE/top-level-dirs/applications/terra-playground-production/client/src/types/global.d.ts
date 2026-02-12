// Global type declarations
declare global {
  interface String {
    /**
     * Generates a numeric hash code from a string
     * Used for consistent color selection in visualization components
     */
    hashCode(): number;
  }
}

export {};
