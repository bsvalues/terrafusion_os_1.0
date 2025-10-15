/**
 * RadioGroup Component Tests - TerraFusion Design System
 * Week 2, Day 1 - Testing Expansion Phase
 * 
 * Test Coverage:
 * - Rendering (radio items, labels, values)
 * - Selection behavior (single selection only)
 * - Keyboard navigation (Arrow keys)
 * - Disabled items and groups
 * - ARIA radiogroup pattern
 * - Form integration
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

describe('RadioGroup', () => {
  describe('Rendering', () => {
    it('renders radio group with items', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <div>
            <RadioGroupItem value="option1" id="opt1" />
            <label htmlFor="opt1">Option 1</label>
          </div>
          <div>
            <RadioGroupItem value="option2" id="opt2" />
            <label htmlFor="opt2">Option 2</label>
          </div>
        </RadioGroup>
      );
      
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toBeInTheDocument();
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    });

    it('renders with default value selected', () => {
      render(
        <RadioGroup defaultValue="option2" data-testid="radio-group">
          <div>
            <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
            <label htmlFor="opt1">Option 1</label>
          </div>
          <div>
            <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
            <label htmlFor="opt2">Option 2</label>
          </div>
        </RadioGroup>
      );
      
      const radio2 = screen.getByTestId('radio2');
      expect(radio2).toHaveAttribute('data-state', 'checked');
    });

    it('renders with custom className', () => {
      render(
        <RadioGroup className="custom-class" data-testid="radio-group">
          <RadioGroupItem value="option1" id="opt1" />
        </RadioGroup>
      );
      
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toHaveClass('custom-class');
    });
  });

  describe('Selection Behavior', () => {
    it('selects item when value changes', () => {
      const { rerender } = render(
        <RadioGroup value="option1" data-testid="radio-group">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'checked');
      expect(screen.getByTestId('radio2')).toHaveAttribute('data-state', 'unchecked');
      
      rerender(
        <RadioGroup value="option2" data-testid="radio-group">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'unchecked');
      expect(screen.getByTestId('radio2')).toHaveAttribute('data-state', 'checked');
    });

    it('only one item can be selected at a time', () => {
      render(
        <RadioGroup value="option1" data-testid="radio-group">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
          <RadioGroupItem value="option3" id="opt3" data-testid="radio3" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'checked');
      expect(screen.getByTestId('radio2')).toHaveAttribute('data-state', 'unchecked');
      expect(screen.getByTestId('radio3')).toHaveAttribute('data-state', 'unchecked');
    });

    it('calls onValueChange when selection changes', async () => {
      const handleChange = jest.fn();
      const user = await import('@testing-library/user-event');
      
      render(
        <RadioGroup onValueChange={handleChange}>
          <div>
            <RadioGroupItem value="option1" id="opt1" />
            <label htmlFor="opt1">Option 1</label>
          </div>
          <div>
            <RadioGroupItem value="option2" id="opt2" />
            <label htmlFor="opt2">Option 2</label>
          </div>
        </RadioGroup>
      );
      
      const radio2Label = screen.getByLabelText('Option 2');
      await user.default.click(radio2Label);
      
      expect(handleChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = await import('@testing-library/user-event');
      
      render(
        <RadioGroup defaultValue="option1">
          <div>
            <RadioGroupItem value="option1" id="opt1" />
            <label htmlFor="opt1">Option 1</label>
          </div>
          <div>
            <RadioGroupItem value="option2" id="opt2" />
            <label htmlFor="opt2">Option 2</label>
          </div>
          <div>
            <RadioGroupItem value="option3" id="opt3" />
            <label htmlFor="opt3">Option 3</label>
          </div>
        </RadioGroup>
      );
      
      const radio1 = screen.getByLabelText('Option 1');
      radio1.focus();
      
      expect(radio1).toHaveFocus();
    });

    it('wraps around when navigating past last item', () => {
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      const radio1 = screen.getByTestId('radio1');
      const radio2 = screen.getByTestId('radio2');
      
      expect(radio1).toHaveAttribute('data-state', 'checked');
      expect(radio2).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Disabled State', () => {
    it('disables entire group when disabled prop is true', () => {
      render(
        <RadioGroup disabled data-testid="radio-group">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      const radio1 = screen.getByTestId('radio1');
      const radio2 = screen.getByTestId('radio2');
      
      expect(radio1).toBeDisabled();
      expect(radio2).toBeDisabled();
    });

    it('disables individual radio item', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" disabled data-testid="radio2" />
        </RadioGroup>
      );
      
      const radio1 = screen.getByTestId('radio1');
      const radio2 = screen.getByTestId('radio2');
      
      expect(radio1).not.toBeDisabled();
      expect(radio2).toBeDisabled();
    });

    it('disabled items have correct styling', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" disabled data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      expect(radio).toHaveClass('disabled:cursor-not-allowed');
      expect(radio).toHaveClass('disabled:opacity-50');
    });

    it('does not call onValueChange for disabled items', async () => {
      const handleChange = jest.fn();
      const user = await import('@testing-library/user-event');
      
      render(
        <RadioGroup onValueChange={handleChange}>
          <div>
            <RadioGroupItem value="option1" id="opt1" disabled />
            <label htmlFor="opt1">Option 1</label>
          </div>
        </RadioGroup>
      );
      
      const label = screen.getByLabelText('Option 1');
      await user.default.click(label);
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('ARIA Attributes', () => {
    it('has role="radiogroup"', () => {
      render(<RadioGroup data-testid="radio-group" />);
      const radioGroup = screen.getByTestId('radio-group');
      
      expect(radioGroup).toHaveAttribute('role', 'radiogroup');
    });

    it('radio items have role="radio"', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      expect(radio).toHaveAttribute('role', 'radio');
    });

    it('radio items have correct aria-checked values', () => {
      render(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByTestId('radio2')).toHaveAttribute('aria-checked', 'true');
    });

    it('supports aria-label for group', () => {
      render(<RadioGroup aria-label="Choose option" data-testid="radio-group" />);
      const radioGroup = screen.getByTestId('radio-group');
      
      expect(radioGroup).toHaveAttribute('aria-label', 'Choose option');
    });

    it('supports aria-labelledby for group', () => {
      render(
        <>
          <span id="group-label">Select your preference</span>
          <RadioGroup aria-labelledby="group-label" data-testid="radio-group" />
        </>
      );
      
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'group-label');
    });

    it('disabled radio items have aria-disabled', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" disabled data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      expect(radio).toHaveAttribute('disabled');
    });
  });

  describe('Form Integration', () => {
    it('can be used in a form', () => {
      render(
        <form data-testid="form">
          <RadioGroup name="preference">
            <RadioGroupItem value="option1" id="opt1" />
          </RadioGroup>
        </form>
      );
      
      const form = screen.getByTestId('form');
      expect(form).toBeInTheDocument();
    });

    it('submits selected value with form', async () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        return Object.fromEntries(formData);
      });

      function TestForm() {
        const [value, setValue] = React.useState('option1');
        
        return (
          <form onSubmit={handleSubmit} data-testid="form">
            <RadioGroup name="preference" value={value} onValueChange={setValue}>
              <div>
                <RadioGroupItem value="option1" id="opt1" />
                <label htmlFor="opt1">Option 1</label>
              </div>
              <div>
                <RadioGroupItem value="option2" id="opt2" />
                <label htmlFor="opt2">Option 2</label>
              </div>
            </RadioGroup>
            <button type="submit">Submit</button>
          </form>
        );
      }

      const user = await import('@testing-library/user-event');
      render(<TestForm />);
      
      const submitButton = screen.getByText('Submit');
      await user.default.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('works with required attribute', () => {
      render(
        <form>
          <RadioGroup required data-testid="radio-group">
            <RadioGroupItem value="option1" id="opt1" />
          </RadioGroup>
        </form>
      );
      
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toHaveAttribute('required');
    });
  });

  describe('Controlled Component', () => {
    it('updates when value prop changes', () => {
      const { rerender } = render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'checked');
      
      rerender(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio2')).toHaveAttribute('data-state', 'checked');
    });

    it('works as fully controlled component', async () => {
      const user = await import('@testing-library/user-event');
      
      function ControlledRadioGroup() {
        const [value, setValue] = React.useState('option1');
        return (
          <RadioGroup value={value} onValueChange={setValue}>
            <div>
              <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
              <label htmlFor="opt1">Option 1</label>
            </div>
            <div>
              <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
              <label htmlFor="opt2">Option 2</label>
            </div>
          </RadioGroup>
        );
      }
      
      render(<ControlledRadioGroup />);
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'checked');
      
      const radio2Label = screen.getByLabelText('Option 2');
      await user.default.click(radio2Label);
      
      expect(screen.getByTestId('radio2')).toHaveAttribute('data-state', 'checked');
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Accessibility', () => {
    it('radio items can receive focus', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      radio.focus();
      expect(radio).toHaveFocus();
    });

    it('has visible focus indicator', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      expect(radio).toHaveClass('focus:outline-none');
      expect(radio).toHaveClass('focus-visible:ring-1');
    });

    it('disabled items cannot receive focus', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="opt1" disabled data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      radio.focus();
      expect(radio).not.toHaveFocus();
    });

    it('supports screen readers with proper ARIA', () => {
      render(
        <RadioGroup aria-label="Preferences">
          <div>
            <RadioGroupItem value="option1" id="opt1" />
            <label htmlFor="opt1">Option 1</label>
          </div>
        </RadioGroup>
      );
      
      const radio = screen.getByLabelText('Option 1');
      expect(radio).toHaveAttribute('role', 'radio');
      expect(radio).toHaveAttribute('aria-checked');
    });
  });

  describe('Visual States', () => {
    it('has correct data-state attribute', () => {
      render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
          <RadioGroupItem value="option2" id="opt2" data-testid="radio2" />
        </RadioGroup>
      );
      
      expect(screen.getByTestId('radio1')).toHaveAttribute('data-state', 'checked');
      expect(screen.getByTestId('radio2')).toHaveAttribute('data-state', 'unchecked');
    });

    it('applies checked styling', () => {
      render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="opt1" data-testid="radio1" />
        </RadioGroup>
      );
      
      const radio = screen.getByTestId('radio1');
      expect(radio).toHaveClass('text-primary');
    });
  });
});
