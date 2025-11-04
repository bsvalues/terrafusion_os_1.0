import React, { createContext, useState, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext();

/**
 * Theme Provider Component
 * Manages theme state (light/dark/system) and applies theme to body element
 */
export const ThemeProvider = ({ children }) => {
  // Check if user has a saved preference, otherwise default to system
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'system'; // Default to system preference
  };
  
  const [theme, setTheme] = useState(getInitialTheme());
  
  // Determine actual theme based on system preference if needed
  const getComputedTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return theme;
  };
  
  // Apply theme to body element
  useEffect(() => {
    const computedTheme = getComputedTheme();
    
    // Apply theme to body element
    document.body.setAttribute('data-theme', computedTheme);
    
    // Save user preference
    localStorage.setItem('theme' /* , theme */);
    
    // Add theme class to body
    if (computedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);
  
  // Watch for system preference changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Initial check
      handleSystemThemeChange(mediaQuery);
      
      // Add listener for changes
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Cleanup
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme]);
  
  // Handle system theme change
  const handleSystemThemeChange = (mediaQuery) => {
    const computedTheme = mediaQuery.matches ? 'dark' : 'light';
    document.body.setAttribute('data-theme', computedTheme);
    
    if (computedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  };
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme,
        toggleTheme,
        computedTheme: getComputedTheme() 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;