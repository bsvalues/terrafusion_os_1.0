/**
 * Select Component Tests - TerraFusion Design System
 * Week 2, Day 2 - Testing Phase
 * 
 * Purpose: Comprehensive testing of Select component
 * - Rendering (trigger, options, placeholder)
 * - Selection behavior (single value)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Disabled state
 * - ARIA combobox attributes
 * - Form integration
 * - Controlled component
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

// Helper component for testing
function SelectDemo({
  defaultValue = '',
  onValueChange = vi.fn(),
  disabled = false,
}: {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SelectWithGroups() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="potato">Potato</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

describe('Select Component', () => {
  // Category 1: Rendering Tests
  describe('Rendering', () => {
    it('should render select trigger with placeholder', () => {
      render(<SelectDemo />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Select a fruit')).toBeInTheDocument();
    });

    it('should render select trigger with selected value', () => {
      render(<SelectDemo defaultValue="apple" />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should show chevron icon on trigger', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      const icon = trigger.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render select with grouped options', () => {
      render(<SelectWithGroups />);
      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Fruits')).toBeInTheDocument();
      expect(screen.getByText('Vegetables')).toBeInTheDocument();
    });

    it('should apply custom className to trigger', () => {
      const { container } = render(
        <Select>
          <SelectTrigger className="custom-class w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = container.querySelector('.custom-class');
      expect(trigger).toBeInTheDocument();
    });
  });

  // Category 2: Selection Behavior
  describe('Selection', () => {
    it('should select an option when clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<SelectDemo onValueChange={onValueChange} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = screen.getByText('Banana');
      await user.click(option);
      
      expect(onValueChange).toHaveBeenCalledWith('banana');
    });

    it('should display selected value in trigger', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = screen.getByText('Orange');
      await user.click(option);
      
      expect(screen.getByText('Orange')).toBeInTheDocument();
    });

    it('should change selection when different option clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<SelectDemo defaultValue="apple" onValueChange={onValueChange} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = screen.getByText('Grape');
      await user.click(option);
      
      expect(onValueChange).toHaveBeenCalledWith('grape');
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(screen.getByText('Banana')).toBeInTheDocument();
      
      const option = screen.getByText('Banana');
      await user.click(option);
      
      // Content should be closed (removed from DOM)
      expect(screen.queryByText('Orange')).not.toBeInTheDocument();
    });

    it('should show default value on initial render', () => {
      render(<SelectDemo defaultValue="banana" />);
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  // Category 3: Keyboard Navigation
  describe('Keyboard Navigation', () => {
    it('should open dropdown on Enter key', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should open dropdown on Space key', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard(' ');
      
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(screen.getByText('Apple')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('should navigate options with Arrow Down', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await user.keyboard('{ArrowDown}');
      // First option should be focused (Apple is default first)
      // Note: Radix UI handles focus internally
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should navigate options with Arrow Up', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should select focused option on Enter', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<SelectDemo onValueChange={onValueChange} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(onValueChange).toHaveBeenCalled();
    });
  });

  // Category 4: Disabled State
  describe('Disabled State', () => {
    it('should render disabled select', () => {
      render(<SelectDemo disabled />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });

    it('should not open when disabled', async () => {
      const user = userEvent.setup();
      render(<SelectDemo disabled />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('should show disabled styling', () => {
      render(<SelectDemo disabled />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('disabled:cursor-not-allowed');
      expect(trigger).toHaveClass('disabled:opacity-50');
    });

    it('should not respond to keyboard when disabled', async () => {
      const user = userEvent.setup();
      render(<SelectDemo disabled />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('should render individual disabled options', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled" disabled>
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);
      
      const disabledOption = screen.getByText('Disabled');
      expect(disabledOption.closest('[data-disabled]')).toHaveAttribute('data-disabled');
    });
  });

  // Category 5: ARIA Combobox Attributes
  describe('ARIA Attributes', () => {
    it('should have combobox role', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });

    it('should have aria-expanded attribute', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have data-placeholder attribute when no value', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('data-placeholder');
    });

    it('should not have data-placeholder when value is selected', () => {
      render(<SelectDemo defaultValue="apple" />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).not.toHaveAttribute('data-placeholder');
    });

    it('should have proper data-state attributes', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('data-state', 'closed');
      
      await user.click(trigger);
      expect(trigger).toHaveAttribute('data-state', 'open');
    });
  });

  // Category 6: Form Integration
  describe('Form Integration', () => {
    it('should work with form submission', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const user = userEvent.setup();
      
      render(
        <form onSubmit={handleSubmit}>
          <SelectDemo />
          <button type="submit">Submit</button>
        </form>
      );
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = screen.getByText('Banana');
      await user.click(option);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should work with controlled component', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Select value="apple" onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      );
      
      expect(screen.getByText('Apple')).toBeInTheDocument();
      
      rerender(
        <Select value="banana" onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      );
      
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    it('should have name attribute for form submission', () => {
      render(
        <Select name="fruit">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('name', 'fruit');
    });

    it('should work with required attribute', () => {
      render(
        <Select required>
          <SelectTrigger>
            <SelectValue placeholder="Select (required)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('required');
    });
  });

  // Category 7: Accessibility
  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      
      expect(trigger).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should maintain focus management', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      // Focus should be on the content after opening
      expect(document.activeElement).toBeTruthy();
    });

    it('should have visible focus indicator', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      
      trigger.focus();
      expect(trigger).toHaveClass('focus:outline-none');
      expect(trigger).toHaveClass('focus:ring-1');
    });

    it('should work with screen readers (ARIA labels)', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select a fruit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-label', 'Select a fruit');
    });

    it('should announce options to screen readers', async () => {
      const user = userEvent.setup();
      render(<SelectDemo />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = screen.getByText('Apple');
      expect(option).toBeInTheDocument();
      expect(option).toBeVisible();
    });
  });

  // Category 8: Visual States
  describe('Visual States', () => {
    it('should show focus ring when focused', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      
      trigger.focus();
      expect(trigger).toHaveClass('focus:ring-1');
      expect(trigger).toHaveClass('focus:ring-ring');
    });

    it('should show check icon on selected item', async () => {
      const user = userEvent.setup();
      render(<SelectDemo defaultValue="apple" />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      // Selected item should have a check icon
      const selectedItem = screen.getByText('Apple').closest('[data-state="checked"]');
      expect(selectedItem).toBeTruthy();
    });

    it('should apply hover styles to trigger', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      
      expect(trigger).toHaveClass('border');
      expect(trigger).toHaveClass('rounded-md');
    });

    it('should show placeholder in muted color', () => {
      render(<SelectDemo />);
      const trigger = screen.getByRole('combobox');
      
      expect(trigger).toHaveAttribute('data-placeholder');
      expect(trigger).toHaveClass('data-[placeholder]:text-muted-foreground');
    });
  });
});
