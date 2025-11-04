/**
 * Utility functions for handling ol-ext library imports
 *
 * ol-ext is a powerful extension library for OpenLayers but can sometimes
 * be tricky to import due to its module structure. These utilities provide
 * a consistent way to import ol-ext components with proper error handling.
 */

/**
 * Safely import an ol-ext component with error handling
 *
 * @param importPath The path to the component within ol-ext
 * @returns A promise resolving to the imported component or null if import fails
 */
export async function importOlExt(importPath: string): Promise<any | null> {
  try {
    // First try the direct import path
    return await import(`ol-ext/${importPath}`);
  } catch (error) {
    console.error(`Failed to import ol-ext/${importPath}:`, error);

    try {
      // Try with the /dist path as a fallback
      return await import(`ol-ext/dist/${importPath}`);
    } catch (fallbackError) {
      console.error(`Failed to import ol-ext/dist/${importPath}:`, fallbackError);

      // Final fallback - try to import the entire ol-ext module
      try {
        const olExt = await import('ol-ext');
        // Try to navigate through the object structure based on the path
        const parts = importPath.split('/');
        // Start with the default export
        let result: any = olExt.default || olExt;

        for (const part of parts) {
          if (result && typeof result === 'object' && part in result) {
            result = result[part as keyof typeof result];
          } else {
            console.error(`Could not find '${part}' in ol-ext object path`);
            return null;
          }
        }

        return result;
      } catch (finalError) {
        console.error('Failed to import ol-ext as a whole module:', finalError);
        return null;
      }
    }
  }
}

/**
 * Check if ol-ext is available and correctly loaded
 *
 * @returns A promise resolving to a boolean indicating if ol-ext is available
 */
export async function isOlExtAvailable(): Promise<boolean> {
  try {
    const olExt = await import('ol-ext');
    return !!(olExt.default || olExt);
  } catch (error) {
    console.error('ol-ext is not available:', error);
    return false;
  }
}
