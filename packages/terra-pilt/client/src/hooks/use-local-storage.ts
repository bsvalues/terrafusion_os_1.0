import { useState, useEffect } from 'react';

// Define a custom hook for managing state with local storage
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get stored value from localStorage
  const readValue = (): T => {
    try {
      // Check if we have a browser environment
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      // Try to parse the stored item
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  // Set state based on stored value
  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  // Update localStorage when the state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Listen for changes to the stored value across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);
  
  return [storedValue, setValue];
}