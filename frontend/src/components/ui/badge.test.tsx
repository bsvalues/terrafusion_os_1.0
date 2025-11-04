import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from './badge';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders badge with text content', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Badge className='custom-badge'>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-badge');
    });

    it('applies base badge styles', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-md',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold'
      );
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Badge variant='default'>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground', 'border-transparent');
    });

    it('renders secondary variant', () => {
      render(<Badge variant='secondary'>Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground', 'border-transparent');
    });

    it('renders destructive variant', () => {
      render(<Badge variant='destructive'>Destructive</Badge>);
      const badge = screen.getByText('Destructive');
      expect(badge).toHaveClass(
        'bg-destructive',
        'text-destructive-foreground',
        'border-transparent'
      );
    });

    it('renders outline variant', () => {
      render(<Badge variant='outline'>Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground');
    });

    it('uses default variant when not specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('Content', () => {
    it('renders text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('renders numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const Icon = () => <svg data-testid='test-icon' />;
      render(
        <Badge>
          <Icon />
          <span>With Icon</span>
        </Badge>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders empty badge', () => {
      const { container } = render(<Badge />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('HTML Attributes', () => {
    it('applies id attribute', () => {
      render(<Badge id='my-badge'>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveAttribute('id', 'my-badge');
    });

    it('applies data attributes', () => {
      render(
        <Badge data-testid='custom-badge' data-value='test'>
          Badge
        </Badge>
      );
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toHaveAttribute('data-value', 'test');
    });

    it('applies aria attributes', () => {
      render(<Badge aria-label='New notification'>1</Badge>);
      const badge = screen.getByText('1');
      expect(badge).toHaveAttribute('aria-label', 'New notification');
    });

    it('applies role attribute', () => {
      render(<Badge role='status'>Online</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Styling Combinations', () => {
    it('combines variant with custom classes', () => {
      render(
        <Badge variant='secondary' className='text-lg font-bold'>
          Custom
        </Badge>
      );
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('bg-secondary', 'text-lg', 'font-bold');
    });

    it('applies multiple custom classes', () => {
      render(<Badge className='m-2 p-4 shadow-lg'>Multi Class</Badge>);
      const badge = screen.getByText('Multi Class');
      expect(badge).toHaveClass('m-2', 'p-4', 'shadow-lg');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with default variant', async () => {
      const { container } = render(<Badge>Default</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with secondary variant', async () => {
      const { container } = render(<Badge variant='secondary'>Secondary</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with destructive variant', async () => {
      const { container } = render(<Badge variant='destructive'>Error</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with outline variant', async () => {
      const { container } = render(<Badge variant='outline'>Outline</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria-label for context', async () => {
      const { container } = render(<Badge aria-label='3 new notifications'>3</Badge>);
      const badge = screen.getByText('3');
      expect(badge).toHaveAttribute('aria-label', '3 new notifications');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports role attribute for semantic meaning', async () => {
      const { container } = render(
        <Badge role='status' aria-live='polite'>
          Processing...
        </Badge>
      );
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-live', 'polite');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders as status indicator', () => {
      render(<Badge variant='secondary'>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders as notification count', () => {
      render(<Badge variant='destructive'>99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders as tag/category', () => {
      render(<Badge variant='outline'>TypeScript</Badge>);
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders multiple badges in a group', () => {
      render(
        <div>
          <Badge variant='default'>New</Badge>
          <Badge variant='secondary'>Featured</Badge>
          <Badge variant='outline'>Sale</Badge>
        </div>
      );
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('Sale')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', () => {
      const longText = 'This is a very long badge text that might wrap';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters', () => {
      render(<Badge>v1.2.3-beta+build.123</Badge>);
      expect(screen.getByText('v1.2.3-beta+build.123')).toBeInTheDocument();
    });

    it('handles empty string', () => {
      render(<Badge>{''}</Badge>);
      const badge = screen.getByText('', { selector: 'div' });
      expect(badge).toBeInTheDocument();
    });

    it('handles zero as content', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
