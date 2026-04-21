import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CountyStudyPage } from '../CountyStudyPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CountyStudyPage', () => {
  it('renders the studio header', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByText(/TerraForge County Studio/i)).toBeInTheDocument();
  });

  it('shows ATLAS DISCONNECTED badge when no study open', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByText(/DISCONNECTED/i)).toBeInTheDocument();
  });

  it('renders the three-column layout regions', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByTestId('cs-left-rail')).toBeInTheDocument();
    expect(screen.getByTestId('cs-center')).toBeInTheDocument();
    expect(screen.getByTestId('cs-right-rail')).toBeInTheDocument();
  });
});
