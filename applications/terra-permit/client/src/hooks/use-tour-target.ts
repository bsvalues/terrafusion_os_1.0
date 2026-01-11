import { useEffect } from 'react';
import { useTour } from '@/contexts/TourContext';

/**
 * A hook that registers a component as a tour target
 * @param id The ID of the tour target
 * @returns An object with the data-tour attribute for the target element
 */
export function useTourTarget(id: string) {
  const { registerTourTarget } = useTour();

  useEffect(() => {
    // Only attempt to register if we have a valid DOM element
    const element = document.querySelector(`[data-tour="${id}"]`);
    if (element && registerTourTarget) {
      registerTourTarget(id, element as HTMLElement);
    }
    
    // No need for cleanup as the context doesn't track elements currently
  }, [id, registerTourTarget]);

  return {
    'data-tour': id
  };
}