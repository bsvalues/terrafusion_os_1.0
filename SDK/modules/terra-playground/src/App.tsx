import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlaygroundDashboard } from './components/PlaygroundDashboard';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <PlaygroundDashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;
