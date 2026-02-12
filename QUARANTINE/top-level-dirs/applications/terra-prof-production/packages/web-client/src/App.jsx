import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import routes
import AppRoutes from './routes/AppRoutes';

/**
 * Main App component
 * Wraps the application with required providers and context
 */
const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;