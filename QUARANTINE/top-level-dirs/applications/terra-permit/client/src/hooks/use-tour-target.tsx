import { useRef, useEffect } from 'react';
import { useTour } from '../contexts/TourContext';

/**
 * Custom hook to register a DOM element as a tour target
 * 
 * @param id The tour target identifier (without the # prefix)
 * @returns A ref to be attached to the target element
 * 
 * Example usage:
 * ```
 * const buttonRef = useTourTarget('tour-add-button');
 * 
 * return (
 *   <Button ref={buttonRef}>Add Item</Button>
 * );
 * ```
 */
export function useTourTarget(id: string) {
  const { registerTourTarget } = useTour();
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      registerTourTarget(id, ref.current);
    }
  }, [id, registerTourTarget, ref]);
  
  // This is an enhancement to make the hook handle data-tour automatically
  const props = {
    id, // Use the ID directly as an HTML id
  };
  
  // Return an enhanced ref that can be spread into the component
  return Object.assign(ref, props);
}