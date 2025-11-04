/**
 * Main Application Component
 * Elite Power User - TrueAutomation/PACS Quantum AI UI
 */

// React 18+ doesn't require React import for JSX
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { AppLayout } from './components/AppLayout/AppLayout';
import { QuantumDashboard } from './components/QuantumDashboard/QuantumDashboard';
import { QueryBuilder } from './components/QueryBuilder/QueryBuilder';
import { DataExplorer } from './components/DataExplorer/DataExplorer';
import { WorkflowDesigner } from './components/WorkflowDesigner/WorkflowDesigner';
import { UserSettings } from './components/UserSettings/UserSettings';
import { createTheme } from './theme';

function App() {
  const theme = createTheme('dark'); // Default to dark theme for elite power users

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AppLayout>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<QuantumDashboard />} />
                  <Route path="/query" element={<QueryBuilder />} />
                  <Route path="/explorer" element={<DataExplorer />} />
                  <Route path="/workflow" element={<WorkflowDesigner />} />
                  <Route path="/settings" element={<UserSettings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </ErrorBoundary>
            </AppLayout>
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;

