import { useEffect } from 'react';

/**
 * A hook that sets the document title when the component mounts
 * and reverts it to the original title when the component unmounts.
 * 
 * @param title The title to set for the document
 * @param options Optional settings
 */
export function useTitle(
  title: string,
  options: { restoreOnUnmount?: boolean } = {}
): void {
  const { restoreOnUnmount = true } = options;
  
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title;
    
    return () => {
      if (restoreOnUnmount) {
        document.title = originalTitle;
      }
    };
  }, [title, restoreOnUnmount]);
}