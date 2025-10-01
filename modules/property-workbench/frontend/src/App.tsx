import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';
import { 
  TerraFusionGlobalStyles,
  TFContainer,
  TFHeading,
  TFFlex
} from '@terrafusion';

// Import components
import { PropertyDashboard } from './components/PropertyDashboard';
import { PropertySearch } from './components/PropertySearch';
import { PropertyDetails } from './components/PropertyDetails';
import { PropertyAssessment } from './components/PropertyAssessment';
import { PropertyGIS } from './components/PropertyGIS';
import { PropertyReports } from './components/PropertyReports';
import { Navigation } from './components/Navigation';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--tf-color-dark) 0%, var(--tf-color-dark-lighter) 100%);
`;

const Header = styled.header`
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const MainContent = styled.main`
  flex: 1;
  padding: var(--tf-spacing-lg) 0;
`;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TerraFusionGlobalStyles />
        <AppContainer>
          <Header>
            <TFContainer maxWidth="1400px" center>
              <TFFlex align="center" justify="space-between">
                <TFFlex align="center" gap="var(--tf-spacing-md)">
                  <div style={{
                    fontSize: '2rem',
                    background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    🏘️
                  </div>
                  <div>
                    <TFHeading level={3} gradient style={{ margin: 0 }}>
                      Property Workbench
                    </TFHeading>
                    <p style={{ 
                      color: 'var(--tf-color-gray)', 
                      fontSize: '0.875rem',
                      margin: 0 
                    }}>
                      County Property Management Suite
                    </p>
                  </div>
                </TFFlex>
                <Navigation />
              </TFFlex>
            </TFContainer>
          </Header>

          <MainContent>
            <TFContainer maxWidth="1400px" center>
              <Routes>
                <Route path="/" element={<PropertyDashboard />} />
                <Route path="/search" element={<PropertySearch />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/assessment" element={<PropertyAssessment />} />
                <Route path="/gis" element={<PropertyGIS />} />
                <Route path="/reports" element={<PropertyReports />} />
              </Routes>
            </TFContainer>
          </MainContent>
        </AppContainer>
      </Router>
    </QueryClientProvider>
  );
}

export default App;