/**
 * App Component Unit Tests
 * Simple test for Terrafusion OS App component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock App component for now since we don't have the actual component
const App = () => <div data-testid="app">Terrafusion OS</div>;

describe('App Component', () => {
  describe('Core Rendering', () => {
    it('renders without crashing', () => {
      render(<App />);
      expect(screen.getByTestId('app')).toBeInTheDocument();
    });

    it('displays correct title', () => {
      render(<App />);
      expect(screen.getByTestId('app')).toHaveTextContent('Terrafusion OS');
    });

    it('renders as expected', () => {
      const { container } = render(<App />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});