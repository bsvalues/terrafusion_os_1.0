/**
 * Switch Component Tests
 * 
 * Tests for the Switch toggle component.
 * Switch allows users to toggle between on/off states.
 * Built on @radix-ui/react-switch.
 * 
 * MILESTONE: This is the FINAL test file to achieve 100% Shadcn coverage! 🎯
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Switch } from './switch';
import { Label } from './label';

expect.extend(toHaveNoViolations);

describe('Switch', () => {
  /**
   * 1. RENDERING TESTS
   * Test that Switch renders correctly in various states
   */
  describe('Rendering', () => {
    it('renders switch in unchecked state', () => {
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).not.toBeChecked();
    });

    it('renders switch in checked state', () => {
      render(<Switch defaultChecked aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
    });

    it('renders with label', () => {
      render(
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" />
          <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
      );

      expect(screen.getByText('Airplane Mode')).toBeInTheDocument();
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Switch className="custom-switch" aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-switch');
    });

    it('has data-state attribute reflecting checked state', () => {
      const { rerender } = render(<Switch defaultChecked={false} aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      rerender(<Switch defaultChecked={true} aria-label="Toggle" />);
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });
  });

  /**
   * 2. TOGGLE ON/OFF (CLICK) TESTS
   * Test clicking to toggle the switch
   */
  describe('Toggle On/Off (Click)', () => {
    it('toggles from off to on when clicked', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();

      await user.click(switchElement);

      await waitFor(() => {
        expect(switchElement).toBeChecked();
      });
    });

    it('toggles from on to off when clicked', async () => {
      const user = userEvent.setup();
      render(<Switch defaultChecked aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();

      await user.click(switchElement);

      await waitFor(() => {
        expect(switchElement).not.toBeChecked();
      });
    });

    it('toggles multiple times', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');

      // Off -> On
      await user.click(switchElement);
      await waitFor(() => expect(switchElement).toBeChecked());

      // On -> Off
      await user.click(switchElement);
      await waitFor(() => expect(switchElement).not.toBeChecked());

      // Off -> On again
      await user.click(switchElement);
      await waitFor(() => expect(switchElement).toBeChecked());
    });

    it('can be toggled by clicking associated label', async () => {
      const user = userEvent.setup();
      render(
        <div className="flex items-center space-x-2">
          <Switch id="notifications" />
          <Label htmlFor="notifications">Enable notifications</Label>
        </div>
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();

      const label = screen.getByText('Enable notifications');
      await user.click(label);

      await waitFor(() => {
        expect(switchElement).toBeChecked();
      });
    });

    it('updates data-state when toggled', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      await user.click(switchElement);

      await waitFor(() => {
        expect(switchElement).toHaveAttribute('data-state', 'checked');
      });
    });
  });

  /**
   * 3. KEYBOARD ACTIVATION TESTS
   * Test Space and Enter key activation
   */
  describe('Keyboard Activation', () => {
    it('toggles with Space key', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      expect(switchElement).not.toBeChecked();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(switchElement).toBeChecked();
      });
    });

    it('toggles off with Space key when checked', async () => {
      const user = userEvent.setup();
      render(<Switch defaultChecked aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      expect(switchElement).toBeChecked();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(switchElement).not.toBeChecked();
      });
    });

    it('toggles with Enter key', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      expect(switchElement).not.toBeChecked();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(switchElement).toBeChecked();
      });
    });

    it('can be focused with Tab key', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Switch aria-label="Toggle" />
          <button>After</button>
        </div>
      );

      await user.tab();
      expect(screen.getByText('Before')).toHaveFocus();

      await user.tab();
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveFocus();

      await user.tab();
      expect(screen.getByText('After')).toHaveFocus();
    });
  });

  /**
   * 4. CONTROLLED STATE TESTS
   * Test controlled switch with external state management
   */
  describe('Controlled State', () => {
    it('respects controlled checked prop', () => {
      render(<Switch checked={true} aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
    });

    it('calls onCheckedChange when toggled', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(<Switch onCheckedChange={handleCheckedChange} aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('calls onCheckedChange with false when unchecking', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(
        <Switch defaultChecked onCheckedChange={handleCheckedChange} aria-label="Toggle" />
      );

      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);

      expect(handleCheckedChange).toHaveBeenCalledWith(false);
    });

    it('updates controlled state externally', async () => {
      const ControlledSwitch = () => {
        const [checked, setChecked] = React.useState(false);

        return (
          <div>
            <button onClick={() => setChecked(true)}>Turn On</button>
            <button onClick={() => setChecked(false)}>Turn Off</button>
            <Switch checked={checked} onCheckedChange={setChecked} aria-label="Toggle" />
          </div>
        );
      };

      const user = userEvent.setup();
      render(<ControlledSwitch />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();

      // Turn on via button
      const turnOnButton = screen.getByText('Turn On');
      await user.click(turnOnButton);

      await waitFor(() => {
        expect(switchElement).toBeChecked();
      });

      // Turn off via button
      const turnOffButton = screen.getByText('Turn Off');
      await user.click(turnOffButton);

      await waitFor(() => {
        expect(switchElement).not.toBeChecked();
      });
    });

    it('maintains controlled state after multiple changes', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(
        <Switch defaultChecked={false} onCheckedChange={handleCheckedChange} aria-label="Toggle" />
      );

      const switchElement = screen.getByRole('switch');

      // Toggle on
      await user.click(switchElement);
      // Toggle off
      await user.click(switchElement);
      // Toggle on again
      await user.click(switchElement);

      expect(handleCheckedChange).toHaveBeenCalledTimes(3);
      expect(handleCheckedChange).toHaveBeenNthCalledWith(1, true);
      expect(handleCheckedChange).toHaveBeenNthCalledWith(2, false);
      expect(handleCheckedChange).toHaveBeenNthCalledWith(3, true);
    });
  });

  /**
   * 5. DISABLED STATE TESTS
   * Test disabled switch behavior
   */
  describe('Disabled State', () => {
    it('renders with disabled attribute', () => {
      render(<Switch disabled aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    it('does not toggle when clicked if disabled', async () => {
      const user = userEvent.setup();
      render(<Switch disabled aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();

      await user.click(switchElement);

      // Should remain unchecked
      expect(switchElement).not.toBeChecked();
    });

    it('does not toggle with keyboard if disabled', async () => {
      const user = userEvent.setup();
      render(<Switch disabled aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      expect(switchElement).not.toBeChecked();

      await user.keyboard(' ');

      // Should remain unchecked
      expect(switchElement).not.toBeChecked();
    });

    it('does not call onCheckedChange if disabled', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(<Switch disabled onCheckedChange={handleCheckedChange} aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);

      expect(handleCheckedChange).not.toHaveBeenCalled();
    });

    it('applies disabled opacity styles', () => {
      render(<Switch disabled aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      // Should have disabled:opacity-50 class from Switch styles
      expect(switchElement.className).toContain('disabled:opacity-50');
    });

    it('shows not-allowed cursor when disabled', () => {
      render(<Switch disabled aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      // Should have disabled:cursor-not-allowed class
      expect(switchElement.className).toContain('disabled:cursor-not-allowed');
    });
  });

  /**
   * 6. ARIA AND ACCESSIBILITY TESTS
   * Test ARIA switch role and accessibility compliance
   */
  describe('ARIA and Accessibility', () => {
    it('has role="switch"', () => {
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('has aria-checked attribute', () => {
      const { rerender } = render(<Switch defaultChecked={false} aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      rerender(<Switch defaultChecked={true} aria-label="Toggle" />);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('updates aria-checked when toggled', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);

      await waitFor(() => {
        expect(switchElement).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('supports aria-label for accessibility', () => {
      render(<Switch aria-label="Enable dark mode" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-label', 'Enable dark mode');
    });

    it('supports aria-labelledby for external labels', () => {
      render(
        <div>
          <div id="switch-label">Notifications</div>
          <Switch aria-labelledby="switch-label" />
        </div>
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-labelledby', 'switch-label');
    });

    it('has aria-disabled when disabled', () => {
      render(<Switch disabled aria-label="Toggle" />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('has no accessibility violations (unchecked)', async () => {
      const { container } = render(
        <div>
          <Switch id="test-switch" />
          <Label htmlFor="test-switch">Test Switch</Label>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (checked)', async () => {
      const { container } = render(
        <div>
          <Switch id="test-switch" defaultChecked />
          <Label htmlFor="test-switch">Test Switch</Label>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (disabled)', async () => {
      const { container } = render(
        <div>
          <Switch id="test-switch" disabled />
          <Label htmlFor="test-switch">Test Switch</Label>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
