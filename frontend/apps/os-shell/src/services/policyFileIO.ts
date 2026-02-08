/**
 * Policy File I/O Adapter
 *
 * Injectable file reading adapter for deterministic testing.
 * Provides browser FileReader implementation with test-friendly DI seam.
 *
 * @module services/policyFileIO
 * @see Slice 24.2.1: Deterministic Import/Export Tests
 */

/**
 * File text reader adapter
 *
 * Default implementation uses FileReader.
 * Tests can inject synchronous stubs.
 */
export type ReadFileText = (file: File) => Promise<string>;

/**
 * Default FileReader implementation for browser usage
 *
 * @param file - File to read as text
 * @returns Promise resolving to file content as string
 */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
