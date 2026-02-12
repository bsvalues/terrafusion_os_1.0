import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarNav } from './sidebar-nav';
import * as wouter from 'wouter';

// Mock wouter
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: vi.fn(() => ['/dashboard', vi.fn()]),
  };
});

describe('SidebarNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sidebar navigation with all links', () => {
    render(<SidebarNav />);
    
    // Check if all navigation links are rendered
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/File Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Pipeline Builder/i)).toBeInTheDocument();
  });

  it('highlights the current active route', () => {
    // Mock current location as /dashboard
    const useLocationMock = vi.spyOn(wouter, 'useLocation');
    useLocationMock.mockReturnValue(['/dashboard', vi.fn()]);
    
    render(<SidebarNav />);
    
    // Get the Dashboard link element and check if it has active class/styling
    const dashboardLink = screen.getByText(/Dashboard/i).closest('a');
    expect(dashboardLink).toHaveClass('bg-accent');
    
    // Other links should not have active styling
    const fileExplorerLink = screen.getByText(/File Explorer/i).closest('a');
    expect(fileExplorerLink).not.toHaveClass('bg-accent');
  });

  it('navigates to the clicked route', () => {
    // Mock current location
    const navigateMock = vi.fn();
    const useLocationMock = vi.spyOn(wouter, 'useLocation');
    useLocationMock.mockReturnValue(['/dashboard', navigateMock]);
    
    render(<SidebarNav />);
    
    // Click on File Explorer link
    const fileExplorerLink = screen.getByText(/File Explorer/i);
    fireEvent.click(fileExplorerLink);
    
    // Check if navigation function was called with correct route
    expect(navigateMock).toHaveBeenCalledWith('/files');
  });

  it('renders correct icons for each navigation item', () => {
    render(<SidebarNav />);
    
    // Check if all navigation items have their respective icons
    const dashboardIcon = screen.getByTestId('dashboard-icon');
    expect(dashboardIcon).toBeInTheDocument();
    
    const filesIcon = screen.getByTestId('files-icon');
    expect(filesIcon).toBeInTheDocument();
    
    const sourcesIcon = screen.getByTestId('sources-icon');
    expect(sourcesIcon).toBeInTheDocument();
    
    const pipelineIcon = screen.getByTestId('pipeline-icon');
    expect(pipelineIcon).toBeInTheDocument();
  });

  it('includes a sign out button', () => {
    render(<SidebarNav />);
    
    // Check if sign out button is rendered
    const signOutButton = screen.getByText(/Sign Out/i);
    expect(signOutButton).toBeInTheDocument();
    
    // Check if sign out button has correct styling
    expect(signOutButton.closest('button')).toHaveClass('text-destructive');
  });

  it('handles sign out action', () => {
    const navigateMock = vi.fn();
    const useLocationMock = vi.spyOn(wouter, 'useLocation');
    useLocationMock.mockReturnValue(['/dashboard', navigateMock]);
    
    // Mock fetch for logout API call
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
    });
    
    render(<SidebarNav />);
    
    // Click on sign out button
    const signOutButton = screen.getByText(/Sign Out/i);
    fireEvent.click(signOutButton);
    
    // Check if logout API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object));
    
    // After successful logout, should navigate to login page
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});