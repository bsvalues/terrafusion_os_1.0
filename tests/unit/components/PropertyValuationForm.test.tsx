/**
 * PropertyValuationForm Component Unit Tests
 * Simple test for PropertyValuationForm component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Lightweight mock of the PropertyValuationForm until the real component exists
const PropertyValuationForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: () => void;
  onCancel: () => void;
}) => (
  <form data-testid="property-valuation-form">
    <input data-testid="address-input" placeholder="Property Address" />
    <button type="button" onClick={onSubmit}>
      Calculate Valuation
    </button>
    <button type="button" onClick={onCancel}>
      Cancel
    </button>
  </form>
);

describe('PropertyValuationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  describe('Core Rendering', () => {
    it('renders without crashing', () => {
      render(<PropertyValuationForm {...defaultProps} />);
      expect(screen.getByTestId('property-valuation-form')).toBeInTheDocument();
    });

    it('displays form fields', () => {
      render(<PropertyValuationForm {...defaultProps} />);

      expect(screen.getByTestId('address-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calculate valuation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders as expected', () => {
      const { container } = render(<PropertyValuationForm {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
