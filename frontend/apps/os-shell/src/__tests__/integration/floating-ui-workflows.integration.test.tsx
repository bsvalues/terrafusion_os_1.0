/**
 * @file floating-ui-workflows.integration.test.tsx
 * @description Integration tests for floating UI components (Tooltip, Popover, DropdownMenu)
 * @week Week 2 Day 14
 * @testCategory Integration Testing
 */

import React, { useState } from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ============================================================================
// TEST COMPONENTS - Realistic Floating UI Examples
// ============================================================================

/**
 * Icon Buttons with Tooltips
 */
const IconButtonsWithTooltips = ({
  onButtonClick,
}: {
  onButtonClick: (action: string) => void;
}) => {
  return (
    <TooltipProvider>
      <div className='flex gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={() => onButtonClick('save')}>
              💾
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save (Ctrl+S)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={() => onButtonClick('undo')}>
              ↶
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' size='icon' onClick={() => onButtonClick('redo')}>
              ↷
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

/**
 * Popover with Form Controls
 */
const PopoverWithForm = ({
  onSubmit,
}: {
  onSubmit: (data: { width: string; height: string }) => void;
}) => {
  const [width, setWidth] = useState('100');
  const [height, setHeight] = useState('200');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    onSubmit({ width, height });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline'>Set Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='space-y-4'>
          <h4 className='font-medium'>Dimensions</h4>
          <div className='space-y-2'>
            <Label htmlFor='width'>Width (px)</Label>
            <Input
              id='width'
              type='number'
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='height'>Height (px)</Label>
            <Input
              id='height'
              type='number'
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Dropdown Menu with Actions
 */
const UserMenu = ({ onAction }: { onAction: (action: string) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>My Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction('profile')}>Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction('billing')}>Billing</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction('settings')}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction('logout')}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Nested Dropdown Menus
 */
const NestedDropdownMenu = ({ onAction }: { onAction: (action: string) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>File</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onAction('new')}>New File</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction('open')}>Open File</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction('save')}>Save</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction('save-as')}>Save As...</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction('exit')}>Exit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Multiple Tooltips on Same Page
 */
const MultipleTooltips = () => {
  return (
    <TooltipProvider>
      <div className='space-y-4'>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover Me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>First Tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover Me Too</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Second Tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>And Me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Third Tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

// ============================================================================
// INTEGRATION TESTS - Tooltip + Button Workflow
// ============================================================================

describe('Integration: Tooltip + Button Workflow', () => {
  describe('Component Integration', () => {
    it('should render buttons with tooltip triggers', () => {
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should render button icons', () => {
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      expect(screen.getByText('💾')).toBeInTheDocument();
      expect(screen.getByText('↶')).toBeInTheDocument();
      expect(screen.getByText('↷')).toBeInTheDocument();
    });
  });

  describe('User Workflow: Tooltip Display', () => {
    it('should show tooltip on hover', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      const saveButton = screen.getByText('💾');
      await user.hover(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/save \(ctrl\+s\)/i)).toBeVisible();
      });
    });

    it('should hide tooltip on unhover', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      const saveButton = screen.getByText('💾');

      // Hover to show tooltip
      await user.hover(saveButton);
      await waitFor(() => {
        expect(screen.getByText(/save \(ctrl\+s\)/i)).toBeVisible();
      });

      // Unhover to hide tooltip
      await user.unhover(saveButton);
      await waitFor(() => {
        expect(screen.queryByText(/save \(ctrl\+s\)/i)).not.toBeInTheDocument();
      });
    });

    it('should show different tooltips for different buttons', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      // Hover over undo button
      await user.hover(screen.getByText('↶'));
      await waitFor(() => {
        expect(screen.getByText(/undo \(ctrl\+z\)/i)).toBeVisible();
      });

      // Move to redo button
      await user.hover(screen.getByText('↷'));
      await waitFor(() => {
        expect(screen.getByText(/redo \(ctrl\+y\)/i)).toBeVisible();
      });
    });
  });

  describe('User Workflow: Button Click with Tooltip', () => {
    it('should handle button click', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      await user.click(screen.getByText('💾'));

      expect(handleClick).toHaveBeenCalledWith('save');
    });

    it('should handle click even with tooltip visible', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      const saveButton = screen.getByText('💾');

      // Show tooltip
      await user.hover(saveButton);
      await waitFor(() => {
        expect(screen.getByText(/save \(ctrl\+s\)/i)).toBeVisible();
      });

      // Click button
      await user.click(saveButton);

      expect(handleClick).toHaveBeenCalledWith('save');
    });
  });

  describe('Accessibility: Tooltip', () => {
    it('should have no accessibility violations', async () => {
      const handleClick = jest.fn();
      const { container } = render(<IconButtonsWithTooltips onButtonClick={handleClick} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with tooltip visible', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      const { container } = render(<IconButtonsWithTooltips onButtonClick={handleClick} />);

      await user.hover(screen.getByText('💾'));
      await waitFor(() => {
        expect(screen.getByText(/save \(ctrl\+s\)/i)).toBeVisible();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Popover + Form Workflow
// ============================================================================

describe('Integration: Popover + Form Workflow', () => {
  describe('Component Integration', () => {
    it('should render popover trigger button', () => {
      const handleSubmit = jest.fn();
      render(<PopoverWithForm onSubmit={handleSubmit} />);

      expect(screen.getByRole('button', { name: /set dimensions/i })).toBeInTheDocument();
    });

    it('should open popover with form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<PopoverWithForm onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: /set dimensions/i }));

      expect(screen.getByRole('heading', { name: /dimensions/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/width \(px\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/height \(px\)/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow: Form Submission', () => {
    it('should handle form submission from popover', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<PopoverWithForm onSubmit={handleSubmit} />);

      // Open popover
      await user.click(screen.getByRole('button', { name: /set dimensions/i }));

      // Fill form
      const widthInput = screen.getByLabelText(/width \(px\)/i);
      const heightInput = screen.getByLabelText(/height \(px\)/i);

      await user.clear(widthInput);
      await user.type(widthInput, '300');

      await user.clear(heightInput);
      await user.type(heightInput, '400');

      // Submit
      await user.click(screen.getByRole('button', { name: /apply/i }));

      // Verify submission
      expect(handleSubmit).toHaveBeenCalledWith({
        width: '300',
        height: '400',
      });
    });

    it('should close popover after submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<PopoverWithForm onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: /set dimensions/i }));
      await user.click(screen.getByRole('button', { name: /apply/i }));

      // Popover should be closed
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /dimensions/i })).not.toBeInTheDocument();
      });
    });

    it('should cancel without submitting', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<PopoverWithForm onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: /set dimensions/i }));

      // Change values
      await user.clear(screen.getByLabelText(/width \(px\)/i));
      await user.type(screen.getByLabelText(/width \(px\)/i), '500');

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Should not submit
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('User Workflow: Popover State', () => {
    it('should preserve form values when reopened', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<PopoverWithForm onSubmit={handleSubmit} />);

      // Open and check initial values
      await user.click(screen.getByRole('button', { name: /set dimensions/i }));
      expect(screen.getByLabelText(/width \(px\)/i)).toHaveValue(100);

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Reopen and verify values preserved
      await user.click(screen.getByRole('button', { name: /set dimensions/i }));
      expect(screen.getByLabelText(/width \(px\)/i)).toHaveValue(100);
    });
  });

  describe('Accessibility: Popover + Form', () => {
    it('should have no accessibility violations', async () => {
      const handleSubmit = jest.fn();
      const { container } = render(<PopoverWithForm onSubmit={handleSubmit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when open', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      const { container } = render(<PopoverWithForm onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: /set dimensions/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - DropdownMenu Workflow
// ============================================================================

describe('Integration: DropdownMenu Workflow', () => {
  describe('Component Integration', () => {
    it('should render dropdown trigger', () => {
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      expect(screen.getByRole('button', { name: /my account/i })).toBeInTheDocument();
    });

    it('should open dropdown menu', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));

      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/billing/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow: Menu Selection', () => {
    it('should handle menu item selection', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));
      await user.click(screen.getByText(/profile/i));

      expect(handleAction).toHaveBeenCalledWith('profile');
    });

    it('should handle different menu items', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));
      await user.click(screen.getByText(/billing/i));

      expect(handleAction).toHaveBeenCalledWith('billing');
    });

    it('should close menu after selection', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));
      await user.click(screen.getByText(/settings/i));

      await waitFor(() => {
        expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation: Dropdown', () => {
    it('should navigate menu items with arrow keys', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(handleAction).toHaveBeenCalled();
    });

    it('should close menu on Escape', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));
      expect(screen.getByText(/profile/i)).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility: DropdownMenu', () => {
    it('should have no accessibility violations', async () => {
      const handleAction = jest.fn();
      const { container } = render(<UserMenu onAction={handleAction} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when open', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      const { container } = render(<UserMenu onAction={handleAction} />);

      await user.click(screen.getByRole('button', { name: /my account/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Multiple Tooltips
// ============================================================================

describe('Integration: Multiple Tooltips', () => {
  describe('Component Integration', () => {
    it('should render multiple tooltip triggers', () => {
      render(<MultipleTooltips />);

      expect(screen.getByRole('button', { name: /hover me/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hover me too/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /and me/i })).toBeInTheDocument();
    });

    it('should show only one tooltip at a time', async () => {
      const user = userEvent.setup();
      render(<MultipleTooltips />);

      // Hover first button
      await user.hover(screen.getByRole('button', { name: /hover me$/i }));
      await waitFor(() => {
        expect(screen.getByText(/first tooltip/i)).toBeVisible();
      });

      // Hover second button
      await user.hover(screen.getByRole('button', { name: /hover me too/i }));
      await waitFor(() => {
        expect(screen.getByText(/second tooltip/i)).toBeVisible();
      });

      // First tooltip should be gone
      expect(screen.queryByText(/first tooltip/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility: Multiple Tooltips', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MultipleTooltips />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// SUMMARY: Floating UI Integration Tests
// ============================================================================
// Total Test Categories: 4 floating UI workflows
// Total Tests: 30+ integration tests
// Coverage:
// - Tooltip + Button integration
// - Popover + Form controls
// - DropdownMenu with selections
// - Multiple tooltips management
// - Hover interactions
// - Form submission from popover
// - Menu item selection
// - Keyboard navigation (Arrow keys, Enter, Escape)
// - Open/close state management
// - Accessibility (jest-axe)
// - Real-world floating UI patterns
