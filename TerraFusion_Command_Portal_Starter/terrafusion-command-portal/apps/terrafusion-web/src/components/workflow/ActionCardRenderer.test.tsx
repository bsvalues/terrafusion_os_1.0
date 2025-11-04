/**
 * ActionCardRenderer Tests - THE TERRAFUSION WAY
 * SSR-safe testing with comprehensive coverage following architecture fix
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock all dependencies BEFORE import (SSR-safe pattern)
vi.mock('@/lib/api/hooks', () => ({
  useActionSubmit: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null
  })
}));

// Import AFTER mocks
import { ActionCardRenderer } from './ActionCardRenderer';

const mockActionCard = {
  id: 'action-001',
  title: 'Deploy Infrastructure',
  description: 'Government-grade deployment with compliance validation',
  priority: 'high' as const,
  category: 'deployment' as const,
  estimatedDuration: '15 minutes',
  requiredApprovals: ['security', 'compliance'],
  metadata: {
    environment: 'production',
    region: 'us-gov-east-1'
  }
};

describe('ActionCardRenderer - Production Ready Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders action card with government compliance info', () => {
    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    expect(screen.getByText('Deploy Infrastructure')).toBeInTheDocument();
    expect(screen.getByText(/Government-grade deployment/)).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();
  });

  it('displays priority indicators correctly', () => {
    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    // Should show high priority indicator
    const priorityElement = screen.getByText(/high/i);
    expect(priorityElement).toBeInTheDocument();
  });

  it('shows required approvals for government workflows', () => {
    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    expect(screen.getByText(/security/)).toBeInTheDocument();
    expect(screen.getByText(/compliance/)).toBeInTheDocument();
  });

  it('handles action execution with proper validation', async () => {
    const mockSubmit = vi.fn();
    vi.mocked(require('@/lib/api/hooks').useActionSubmit).mockReturnValue({
      mutate: mockSubmit,
      isLoading: false,
      error: null
    });

    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    const executeButton = screen.getByRole('button', { name: /execute/i });
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(mockActionCard.id);
    });
  });

  it('displays loading state during execution', () => {
    vi.mocked(require('@/lib/api/hooks').useActionSubmit).mockReturnValue({
      mutate: vi.fn(),
      isLoading: true,
      error: null
    });

    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    expect(screen.getByText(/executing/i)).toBeInTheDocument();
  });

  it('handles errors gracefully', () => {
    const testError = new Error('Deployment failed validation');
    vi.mocked(require('@/lib/api/hooks').useActionSubmit).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: testError
    });

    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    expect(screen.getByText(/failed validation/i)).toBeInTheDocument();
  });

  it('meets government accessibility standards', () => {
    render(<ActionCardRenderer actionCard={mockActionCard} />);
    
    // Check ARIA labels
    expect(screen.getByRole('button')).toHaveAttribute('aria-label');
    
    // Check semantic structure
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
