/**
 * Utilities
 *
 * Utility functions for the offline-sync package.
 */

/**
 * Check if two values are deeply equal
 *
 * @param a First value
 * @param b Second value
 * @returns Whether the values are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  // Check if primitives or nullish
  if (a === b) {
    return true;
  }

  // Check if either is nullish
  if (a == null || b == null) {
    return false;
  }

  // Check if both are dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Check if both are arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  // Check if both are objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }

      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * Debounce a function
 *
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Retry a function
 *
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    retryCondition?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true, retryCondition = () => true } = options;

  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries || !retryCondition(error as Error)) {
        throw error;
      }

      retries++;

      const delayMs = backoff ? delay * Math.pow(2, retries - 1) : delay;

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Format date
 *
 * @param date Date to format
 * @param format Format to use
 * @returns Formatted date
 */
export function formatDate(date: Date | number | string, format: string = 'yyyy-MM-dd'): string {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Generate a UUID
 *
 * @returns UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
