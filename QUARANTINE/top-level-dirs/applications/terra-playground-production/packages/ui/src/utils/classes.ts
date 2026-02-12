/**
 * Utility functions for working with CSS classes
 */

/**
 * Combines multiple class names into a single string, filtering out falsy values
 *
 * @param classes Array of class names or conditional class expressions
 * @returns Combined class string
 */
export function cx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a class name with a variant
 *
 * @param base Base class name
 * @param variant Variant name
 * @returns Combined class name with variant
 */
export function variantClass(base: string, variant?: string): string {
  return variant ? `${base} ${base}--${variant}` : base;
}

/**
 * Creates a BEM modifier class
 *
 * @param block Block name
 * @param element Element name
 * @param modifier Modifier name
 * @returns BEM class name
 */
export function bem(block: string, element?: string, modifier?: string): string {
  const baseClass = element ? `${block}__${element}` : block;
  return modifier ? `${baseClass} ${baseClass}--${modifier}` : baseClass;
}
