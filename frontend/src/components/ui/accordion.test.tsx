import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

expect.extend(toHaveNoViolations);

describe('Accordion', () => {
  describe('Rendering (Single/Multiple)', () => {
    it('renders with single collapsible type', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    it('renders with multiple type', () => {
      render(
        <Accordion type='multiple'>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');
      expect(triggers).toHaveLength(2);
    });

    it('renders multiple items', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Q1</AccordionTrigger>
            <AccordionContent>A1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Q2</AccordionTrigger>
            <AccordionContent>A2</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>Q3</AccordionTrigger>
            <AccordionContent>A3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('applies custom className to AccordionItem', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1' className='custom-class'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const button = screen.getByRole('button');
      const item = button.closest('[data-state]');
      expect(item).toHaveClass('custom-class');
    });

    it('renders with default value open', () => {
      render(
        <Accordion type='single' defaultValue='item-1' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question 1');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('expands item when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('collapses item when clicking open trigger in single mode', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' defaultValue='item-1' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('closes previous item when opening new item in single mode', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');

      await user.click(trigger1);
      await waitFor(() => {
        expect(trigger1).toHaveAttribute('aria-expanded', 'true');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(trigger2).toHaveAttribute('aria-expanded', 'true');
        expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('allows multiple items open in multiple mode', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='multiple'>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');

      await user.click(trigger1);
      await user.click(trigger2);

      await waitFor(() => {
        expect(trigger1).toHaveAttribute('aria-expanded', 'true');
        expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('displays content when expanded', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer content here</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Answer content here')).toBeVisible();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('expands item with Space key', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      trigger.focus();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.keyboard(' ');

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('expands item with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      trigger.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('navigates between triggers with Tab', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');

      trigger1.focus();
      expect(document.activeElement).toBe(trigger1);

      await user.keyboard('{Tab}');

      expect(document.activeElement).toBe(trigger2);
    });

    it('navigates with ArrowDown between triggers', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');

      trigger1.focus();
      await user.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(trigger2);
    });

    it('navigates with ArrowUp between triggers', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');

      trigger2.focus();
      await user.keyboard('{ArrowUp}');

      expect(document.activeElement).toBe(trigger1);
    });

    it('focuses first trigger with Home key', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>Question 3</AccordionTrigger>
            <AccordionContent>Answer 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger3 = screen.getByText('Question 3');

      trigger3.focus();
      await user.keyboard('{Home}');

      expect(document.activeElement).toBe(trigger1);
    });

    it('focuses last trigger with End key', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>Question 3</AccordionTrigger>
            <AccordionContent>Answer 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger3 = screen.getByText('Question 3');

      trigger1.focus();
      await user.keyboard('{End}');

      expect(document.activeElement).toBe(trigger3);
    });
  });

  describe('Disabled Items', () => {
    it('renders disabled trigger', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1' disabled>
            <AccordionTrigger>Disabled Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Disabled Question');
      expect(trigger).toBeDisabled();
    });

    it('does not expand disabled item when clicked', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1' disabled>
            <AccordionTrigger>Disabled Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Disabled Question');
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('skips disabled items in keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2' disabled>
            <AccordionTrigger>Disabled Question</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>Question 3</AccordionTrigger>
            <AccordionContent>Answer 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger3 = screen.getByText('Question 3');

      trigger1.focus();
      await user.keyboard('{ArrowDown}');

      // Should skip disabled item and focus on trigger3
      expect(document.activeElement).toBe(trigger3);
    });
  });

  describe('Controlled State', () => {
    it('respects controlled value prop in single mode', () => {
      render(
        <Accordion type='single' value='item-2' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');

      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    });

    it('respects controlled value prop in multiple mode', () => {
      render(
        <Accordion type='multiple' value={['item-1', 'item-3']}>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>Question 3</AccordionTrigger>
            <AccordionContent>Answer 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      const trigger2 = screen.getByText('Question 2');
      const trigger3 = screen.getByText('Question 3');

      expect(trigger1).toHaveAttribute('aria-expanded', 'true');
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
      expect(trigger3).toHaveAttribute('aria-expanded', 'true');
    });

    it('calls onValueChange when item is toggled in single mode', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Accordion type='single' onValueChange={handleValueChange} collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      await user.click(trigger);

      await waitFor(() => {
        expect(handleValueChange).toHaveBeenCalledWith('item-1');
      });
    });

    it('calls onValueChange when item is toggled in multiple mode', async () => {
      const handleValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Accordion type='multiple' onValueChange={handleValueChange}>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByText('Question 1');
      await user.click(trigger1);

      await waitFor(() => {
        expect(handleValueChange).toHaveBeenCalledWith(['item-1']);
      });

      const trigger2 = screen.getByText('Question 2');
      await user.click(trigger2);

      await waitFor(() => {
        expect(handleValueChange).toHaveBeenCalledWith(['item-1', 'item-2']);
      });
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has proper ARIA roles and attributes', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      expect(trigger).toHaveAttribute('aria-expanded');
      expect(trigger).toHaveAttribute('aria-controls');
    });

    it('sets aria-expanded to false when collapsed', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets aria-expanded to true when expanded', () => {
      render(
        <Accordion type='single' defaultValue='item-1' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has data-state attribute on item', () => {
      render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      const item = trigger.closest('[data-state]');
      expect(item).toHaveAttribute('data-state', 'closed');
    });

    it('has data-state="open" when expanded', () => {
      render(
        <Accordion type='single' defaultValue='item-1' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Question');
      const item = trigger.closest('[data-state]');
      expect(item).toHaveAttribute('data-state', 'open');
    });

    it('has no accessibility violations (collapsed)', async () => {
      const { container } = render(
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (expanded)', async () => {
      const { container } = render(
        <Accordion type='single' defaultValue='item-1' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (multiple items)', async () => {
      const { container } = render(
        <Accordion type='multiple' defaultValue={['item-1', 'item-3']}>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Question 1</AccordionTrigger>
            <AccordionContent>Answer 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>Question 2</AccordionTrigger>
            <AccordionContent>Answer 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>Question 3</AccordionTrigger>
            <AccordionContent>Answer 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
