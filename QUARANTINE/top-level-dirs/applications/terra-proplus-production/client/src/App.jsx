import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropertyListPage from './pages/PropertyListPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyFormPage from './pages/PropertyFormPage';
import AppraisalFormPage from './pages/AppraisalFormPage';
import AppHeader from './components/AppHeader';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App min-h-screen bg-gray-50">
        <AppHeader />
        <div className="pt-16">
          <Switch>
            <Route path="/" exact component={PropertyListPage} />
            <Route path="/properties" exact component={PropertyListPage} />
            <Route path="/properties/new" exact component={PropertyFormPage} />
            <Route path="/properties/:id/edit" exact component={PropertyFormPage} />
            <Route path="/properties/:id" exact component={PropertyDetailPage} />
            <Route path="/properties/:propertyId/appraisals/new" exact component={AppraisalFormPage} />
            <Route path="/appraisals/:id/edit" exact component={AppraisalFormPage} />
          </Switch>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;