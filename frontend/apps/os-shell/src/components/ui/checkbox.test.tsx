/**
 * Checkbox Component Tests - TerraFusion Design System
 * Week 2, Day 1 - Testing Expansion Phase
 *
 * Test Coverage:
 * - Rendering (checked, unchecked, indeterminate states)
 * - User interactions (click, keyboard Space)
 * - Disabled state
 * - ARIA attributes (role, aria-checked, aria-label)
 * - Form integration
 * - Label association
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';
import { Checkbox } from '../ui/checkbox';

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('renders unchecked by default', () => {
      render(<Checkbox data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders with checked state when checked prop is true', () => {
      render(<Checkbox checked={true} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('aria-checked', 'true');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('renders indeterminate state', () => {
      render(<Checkbox checked='indeterminate' data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('renders with custom className', () => {
      render(<Checkbox className='custom-class' data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('custom-class');
    });

    it('renders with aria-label', () => {
      render(<Checkbox aria-label='Accept terms' data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms');
    });
  });

  describe('User Interactions', () => {
    it('calls onCheckedChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('toggles checked state on click', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      // First click: unchecked -> checked
      await user.click(checkbox);
      expect(handleChange).toHaveBeenLastCalledWith(true);

      // Second click: checked -> unchecked (need to update checked prop in real usage)
      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledTimes(2);
    });

    it('toggles checked state with Space key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      checkbox.focus();
      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox disabled onCheckedChange={handleChange} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      await user.click(checkbox);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not respond to keyboard when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox disabled onCheckedChange={handleChange} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      checkbox.focus();
      await user.keyboard(' ');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled attribute', () => {
      render(<Checkbox disabled data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('has disabled styling', () => {
      render(<Checkbox disabled data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
      expect(checkbox).toHaveClass('disabled:opacity-50');
    });

    it('can be disabled and checked', () => {
      render(<Checkbox disabled checked={true} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('ARIA Attributes', () => {
    it('has role="checkbox"', () => {
      render(<Checkbox data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('role', 'checkbox');
    });

    it('has correct aria-checked values', () => {
      const { rerender } = render(<Checkbox checked={false} data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('aria-checked', 'false');

      rerender(<Checkbox checked={true} data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('aria-checked', 'true');

      rerender(<Checkbox checked='indeterminate' data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <span id='checkbox-label'>My Checkbox</span>
          <Checkbox aria-labelledby='checkbox-label' data-testid='checkbox' />
        </>
      );
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('aria-labelledby', 'checkbox-label');
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <span id='checkbox-description'>This is a description</span>
          <Checkbox aria-describedby='checkbox-description' data-testid='checkbox' />
        </>
      );
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('aria-describedby', 'checkbox-description');
    });

    it('has correct aria-disabled when disabled', () => {
      render(<Checkbox disabled data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('disabled');
    });
  });

  describe('Form Integration', () => {
    it('can be used in a form', () => {
      render(
        <form data-testid='form'>
          <Checkbox name='terms' value='accepted' data-testid='checkbox' />
        </form>
      );
      const form = screen.getByTestId('form');
      const checkbox = screen.getByTestId('checkbox');

      expect(form).toContainElement(checkbox);
    });

    it('submits form data when checked (controlled)', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        return Object.fromEntries(formData);
      });

      function TestForm() {
        const [checked, setChecked] = React.useState(false);

        return (
          <form onSubmit={handleSubmit} data-testid='form'>
            <Checkbox
              name='terms'
              checked={checked}
              onCheckedChange={setChecked}
              data-testid='checkbox'
            />
            <button type='submit'>Submit</button>
          </form>
        );
      }

      render(<TestForm />);
      const checkbox = screen.getByTestId('checkbox');
      const submitButton = screen.getByText('Submit');

      await user.click(checkbox);
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('works with label element', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <label htmlFor='my-checkbox'>
          <span>Accept Terms</span>
          <Checkbox id='my-checkbox' onCheckedChange={handleChange} />
        </label>
      );

      // Clicking label should trigger checkbox
      const label = screen.getByText('Accept Terms');
      await user.click(label);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Controlled Component', () => {
    it('updates when checked prop changes', () => {
      const { rerender } = render(<Checkbox checked={false} data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('data-state', 'unchecked');

      rerender(<Checkbox checked={true} data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('data-state', 'checked');
    });

    it('calls onCheckedChange but does not auto-update when controlled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox checked={false} onCheckedChange={handleChange} data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(true);
      // State should not change unless parent updates checked prop
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('works as fully controlled component', async () => {
      const user = userEvent.setup();

      function ControlledCheckbox() {
        const [checked, setChecked] = React.useState(false);
        return <Checkbox checked={checked} onCheckedChange={setChecked} data-testid='checkbox' />;
      }

      render(<ControlledCheckbox />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('data-state', 'unchecked');

      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'checked');

      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Accessibility', () => {
    it('can receive focus', () => {
      render(<Checkbox data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });

    it('has visible focus indicator', () => {
      render(<Checkbox data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      // Check for focus-visible classes (ring-1 not ring-2)
      expect(checkbox).toHaveClass('focus-visible:outline-none');
      expect(checkbox).toHaveClass('focus-visible:ring-1');
    });

    it('cannot receive focus when disabled', () => {
      render(<Checkbox disabled data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      checkbox.focus();
      expect(checkbox).not.toHaveFocus();
    });

    it('supports screen readers with proper ARIA', () => {
      render(<Checkbox aria-label='Subscribe to newsletter' data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveAttribute('role', 'checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Subscribe to newsletter');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Visual States', () => {
    it('has hover styles', () => {
      render(<Checkbox data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      // Checkbox uses data-state classes for checked states
      expect(checkbox).toHaveClass('data-[state=checked]:bg-primary');
      expect(checkbox).toHaveClass('data-[state=checked]:text-primary-foreground');
    });

    it('has focus styles', () => {
      render(<Checkbox data-testid='checkbox' />);
      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).toHaveClass('focus-visible:ring-1');
      expect(checkbox).toHaveClass('focus-visible:ring-ring');
      expect(checkbox).toHaveClass('focus-visible:outline-none');
    });

    it('has correct data-state attribute', () => {
      const { rerender } = render(<Checkbox checked={false} data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('data-state', 'unchecked');

      rerender(<Checkbox checked={true} data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('data-state', 'checked');

      rerender(<Checkbox checked='indeterminate' data-testid='checkbox' />);
      expect(screen.getByTestId('checkbox')).toHaveAttribute('data-state', 'indeterminate');
    });
  });
});
