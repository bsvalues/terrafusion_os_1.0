/**
 * TerraFusionPro Web Client - Theme Context
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check for stored theme preference
  const storedTheme = localStorage.getItem('terraFusionTheme');
  const initialTheme = storedTheme || 'light';
  
  // Theme state
  const [theme, setTheme] = useState(initialTheme);
  const [colors, setColors] = useState({
    primary: '#2563eb',     // Default blue
    secondary: '#10b981',   // Default green
    accent: '#f59e0b'       // Default amber
  });
  
  // Function to toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('terraFusionTheme', newTheme);
  };
  
  // Function to update theme colors
  const updateColors = (newColors) => {
    setColors({ ...colors, ...newColors });
    localStorage.setItem('terraFusionColors', JSON.stringify({ ...colors, ...newColors }));
  };
  
  // Set CSS variables based on theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class to HTML
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      
      // Apply dark theme variables
      root.style.setProperty('--text-color', '#e5e7eb');
      root.style.setProperty('--light-gray', '#1f2937');
      root.style.setProperty('--gray', '#374151');
      root.style.setProperty('--dark-gray', '#9ca3af');
      root.style.setProperty('--card-bg', '#111827');
    } else {
      document.body.classList.remove('dark-theme');
      
      // Reset to light theme variables
      root.style.setProperty('--text-color', '#333');
      root.style.setProperty('--light-gray', '#f9fafb');
      root.style.setProperty('--gray', '#e5e7eb');
      root.style.setProperty('--dark-gray', '#4b5563');
      root.style.setProperty('--card-bg', '#ffffff');
    }
    
    // Apply primary and secondary colors
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--primary-dark', adjustColor(colors.primary, -20));
    root.style.setProperty('--primary-light', adjustColor(colors.primary, 20));
    root.style.setProperty('--secondary-color', colors.secondary);
  }, [theme, colors]);
  
  // Helper to darken/lighten a color
  const adjustColor = (color, percent) => {
    // Simple color adjustment function for demo
    // Would use a proper color library in production
    try {
      const hex = color.replace('#', '');
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);
      
      r = Math.min(255, Math.max(0, r + percent));
      g = Math.min(255, Math.max(0, g + percent));
      b = Math.min(255, Math.max(0, b + percent));
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error adjusting color:', error);
      return color;
    }
  };
  
  // Create the theme context value
  const value = {
    theme,
    toggleTheme,
    colors,
    updateColors,
    isDark: theme === 'dark'
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;