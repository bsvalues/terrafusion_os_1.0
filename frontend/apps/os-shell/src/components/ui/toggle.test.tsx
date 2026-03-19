import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Bold } from 'lucide-react';
import React from 'react';
import { vi } from 'vitest';
import { Toggle } from './toggle';

expect.extend(toHaveNoViolations);

describe('Toggle', () => {
  describe('Rendering', () => {
    it('renders with text label', () => {
      render(<Toggle>Toggle</Toggle>);

      expect(screen.getByRole('button', { name: /toggle/i })).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(
        <Toggle aria-label='Bold'>
          <Bold className='h-4 w-4' />
        </Toggle>
      );

      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    });

    it('renders with icon and text', () => {
      render(
        <Toggle>
          <Bold className='mr-2 h-4 w-4' />
          Bold
        </Toggle>
      );

      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Toggle className='custom-toggle'>Toggle</Toggle>);

      expect(screen.getByRole('button')).toHaveClass('custom-toggle');
    });

    it('applies default variant by default', () => {
      render(<Toggle>Toggle</Toggle>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
    });

    it('applies outline variant', () => {
      render(<Toggle variant='outline'>Toggle</Toggle>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
    });
  });

  describe('Pressed State', () => {
    it('has aria-pressed="false" when not pressed', () => {
      render(<Toggle>Toggle</Toggle>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('has aria-pressed="true" when pressed', () => {
      render(<Toggle pressed={true}>Toggle</Toggle>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggles pressed state on click', async () => {
      const user = userEvent.setup();

      render(<Toggle>Toggle</Toggle>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');

      await user.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('applies data-state="on" when pressed', () => {
      render(<Toggle pressed={true}>Toggle</Toggle>);

      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'on');
    });

    it('applies data-state="off" when not pressed', () => {
      render(<Toggle pressed={false}>Toggle</Toggle>);

      expect(screen.getByRole('button')).toHaveAttribute('data-state', 'off');
    });

    it('calls onPressedChange when clicked', async () => {
      const onPressedChange = vi.fn();
      const user = userEvent.setup();

      render(<Toggle onPressedChange={onPressedChange}>Toggle</Toggle>);

      await user.click(screen.getByRole('button'));

      expect(onPressedChange).toHaveBeenCalledWith(true);
    });

    it('calls onPressedChange with false when unpressing', async () => {
      const onPressedChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Toggle pressed={true} onPressedChange={onPressedChange}>
          Toggle
        </Toggle>
      );

      await user.click(screen.getByRole('button'));

      expect(onPressedChange).toHaveBeenCalledWith(false);
    });

    it('supports controlled pressed state', async () => {
      const ControlledToggle = () => {
        const [pressed, setPressed] = React.useState(false);

        return (
          <div>
            <Toggle pressed={pressed} onPressedChange={setPressed}>
              Toggle
            </Toggle>
            <div data-testid='state'>State: {String(pressed)}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<ControlledToggle />);

      expect(screen.getByTestId('state')).toHaveTextContent('State: false');

      await user.click(screen.getByRole('button'));

      expect(screen.getByTestId('state')).toHaveTextContent('State: true');
    });
  });

  describe('Variants and Sizes', () => {
    it('renders default variant', () => {
      render(<Toggle variant='default'>Toggle</Toggle>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
    });

    it('renders outline variant', () => {
      render(<Toggle variant='outline'>Toggle</Toggle>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      expect(button.className).toContain('bg-transparent');
    });

    it('renders small size', () => {
      render(<Toggle size='sm'>Toggle</Toggle>);

      const button = screen.getByRole('button');
      // Component uses h-8 for sm size
      expect(button.className).toContain('h-8');
    });

    it('renders default size', () => {
      render(<Toggle size='default'>Toggle</Toggle>);

      const button = screen.getByRole('button');
      // Component uses h-9 for default size
      expect(button.className).toContain('h-9');
    });

    it('renders large size', () => {
      render(<Toggle size='lg'>Toggle</Toggle>);

      const button = screen.getByRole('button');
      // Component uses h-10 for lg size
      expect(button.className).toContain('h-10');
    });

    it('combines variant and size', () => {
      render(
        <Toggle variant='outline' size='sm'>
          Toggle
        </Toggle>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      // Component uses h-8 for sm size
      expect(button.className).toContain('h-8');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled toggle', () => {
      render(<Toggle disabled>Toggle</Toggle>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not toggle when disabled', async () => {
      const onPressedChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Toggle disabled onPressedChange={onPressedChange}>
          Toggle
        </Toggle>
      );

      await user.click(screen.getByRole('button'));

      expect(onPressedChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      render(<Toggle disabled>Toggle</Toggle>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
      expect(button.className).toContain('disabled:opacity-50');
    });

    it('can be disabled in pressed state', () => {
      render(
        <Toggle disabled pressed={true}>
          Toggle
        </Toggle>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Keyboard Interaction', () => {
    it('toggles on Space key', async () => {
      const user = userEvent.setup();

      render(<Toggle>Toggle</Toggle>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');

      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggles on Enter key', async () => {
      const user = userEvent.setup();

      render(<Toggle>Toggle</Toggle>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onPressedChange on Space key', async () => {
      const onPressedChange = vi.fn();
      const user = userEvent.setup();

      render(<Toggle onPressedChange={onPressedChange}>Toggle</Toggle>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');

      expect(onPressedChange).toHaveBeenCalledWith(true);
    });

    it('calls onPressedChange on Enter key', async () => {
      const onPressedChange = vi.fn();
      const user = userEvent.setup();

      render(<Toggle onPressedChange={onPressedChange}>Toggle</Toggle>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(onPressedChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle on other keys', async () => {
      const onPressedChange = vi.fn();
      const user = userEvent.setup();

      render(<Toggle onPressedChange={onPressedChange}>Toggle</Toggle>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('a');
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');

      expect(onPressedChange).not.toHaveBeenCalled();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has role="button"', () => {
      render(<Toggle>Toggle</Toggle>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has aria-pressed attribute', () => {
      render(<Toggle>Toggle</Toggle>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed');
    });

    it('supports aria-label', () => {
      render(<Toggle aria-label='Toggle bold formatting'>Toggle</Toggle>);

      expect(screen.getByRole('button', { name: /toggle bold formatting/i })).toBeInTheDocument();
    });

    it('has accessible name from content', () => {
      render(<Toggle>Bold Text</Toggle>);

      expect(screen.getByRole('button', { name: /bold text/i })).toBeInTheDocument();
    });

    it('has accessible name from aria-label when icon only', () => {
      render(
        <Toggle aria-label='Bold'>
          <Bold className='h-4 w-4' />
        </Toggle>
      );

      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    });

    it('is keyboard focusable', () => {
      render(<Toggle>Toggle</Toggle>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('has no accessibility violations (default)', async () => {
      const { container } = render(<Toggle>Toggle</Toggle>);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (pressed)', async () => {
      const { container } = render(<Toggle pressed={true}>Toggle</Toggle>);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (disabled)', async () => {
      const { container } = render(<Toggle disabled>Toggle</Toggle>);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (outline variant)', async () => {
      const { container } = render(<Toggle variant='outline'>Toggle</Toggle>);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (with icon)', async () => {
      const { container } = render(
        <Toggle aria-label='Bold'>
          <Bold className='h-4 w-4' />
        </Toggle>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (icon and text)', async () => {
      const { container } = render(
        <Toggle>
          <Bold className='mr-2 h-4 w-4' />
          Bold
        </Toggle>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
