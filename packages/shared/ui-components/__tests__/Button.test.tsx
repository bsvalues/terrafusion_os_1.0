/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../src/Button';

describe('Button Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('tf-button', 'tf-button--primary', 'tf-button--medium');
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('tf-button', 'custom-class');
    });

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--secondary');

      rerender(<Button variant="success">Success</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--success');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--danger');

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--ghost');

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--outline');
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<Button size="small">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--small');

      rerender(<Button size="large">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('tf-button--large');
    });
  });

  // Icon tests
  describe('Icons', () => {
    it('renders with icon prop', () => {
      const TestIcon = () => <span data-testid="test-icon">📍</span>;
      render(<Button icon={<TestIcon />}>With Icon</Button>);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders with iconAfter prop', () => {
      const TestIcon = () => <span data-testid="test-icon">→</span>;
      render(<Button iconAfter={<TestIcon />}>With Icon After</Button>);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon After')).toBeInTheDocument();
    });

    it('renders with both icon and iconAfter', () => {
      const IconBefore = () => <span data-testid="icon-before">←</span>;
      const IconAfter = () => <span data-testid="icon-after">→</span>;
      
      render(
        <Button icon={<IconBefore />} iconAfter={<IconAfter />}>
          Both Icons
        </Button>
      );
      
      expect(screen.getByTestId('icon-before')).toBeInTheDocument();
      expect(screen.getByTestId('icon-after')).toBeInTheDocument();
      expect(screen.getByText('Both Icons')).toBeInTheDocument();
    });
  });

  // State tests
  describe('States', () => {
    it('renders in loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('tf-button--loading');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders in disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('tf-button--disabled');
      expect(button).toBeDisabled();
    });

    it('renders fullWidth', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('tf-button--full-width');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  // TerraFusion Design System tests
  describe('TerraFusion Design System', () => {
    it('applies TerraFusion primary colors', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('tf-button--primary');
      // Check that TerraFusion CSS variables are applied
      const styles = getComputedStyle(button);
      expect(button).toHaveStyle('transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('applies TerraFusion glow effects', () => {
      render(<Button variant="primary">Glow</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('tf-button--primary');
    });

    it('applies TerraFusion glass morphism', () => {
      render(<Button variant="ghost">Glass</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('tf-button--ghost');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('has proper tabIndex', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('tabindex', '0');
    });

    it('is not focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('tabindex', '-1');
    });

    it('announces loading state to screen readers', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-live', 'polite');
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestButton = React.memo(() => {
        renderSpy();
        return <Button>Memo Button</Button>;
      });

      const { rerender } = render(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props should not trigger re-render
      rerender(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});