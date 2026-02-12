import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Separator } from './separator';
expect.extend(toHaveNoViolations);
describe('Separator', () => {
  describe('Rendering Orientations', () => {
    it('renders horizontal separator by default', () => {
      const {
        container
      } = render(<Separator />);
      const separator = container.firstChild;
      expect(separator).toBeInTheDocument();
    });
    it('renders horizontal separator explicitly', () => {
      const {
        container
      } = render(<Separator orientation="horizontal" />);
      const separator = container.firstChild;
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });
    it('renders vertical separator', () => {
      const {
        container
      } = render(<Separator orientation="vertical" />);
      const separator = container.firstChild;
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });
    it('applies horizontal orientation styles', () => {
      const {
        container
      } = render(<Separator orientation="horizontal" />);
      const separator = container.firstChild as HTMLElement;
      expect(separator.className).toContain('h-[1px]');
      expect(separator.className).toContain('w-full');
    });
    it('applies vertical orientation styles', () => {
      const {
        container
      } = render(<Separator orientation="vertical" />);
      const separator = container.firstChild as HTMLElement;
      expect(separator.className).toContain('h-full');
      expect(separator.className).toContain('w-[1px]');
    });
    it('applies custom className', () => {
      const {
        container
      } = render(<Separator className="custom-separator" />);
      const separator = container.firstChild;
      expect(separator).toHaveClass('custom-separator');
    });
  });
  describe('Decorative Attribute', () => {
    it('is decorative by default', () => {
      const {
        container
      } = render(<Separator />);
      const separator = container.firstChild;
      // Decorative separators should not have role="separator"
      expect(separator).not.toHaveAttribute('role', 'separator');
    });
    it('renders as decorative when decorative=true', () => {
      const {
        container
      } = render(<Separator decorative={true} />);
      const separator = container.firstChild;
      expect(separator).not.toHaveAttribute('role', 'separator');
    });
    it('renders as semantic when decorative=false', () => {
      const {
        container
      } = render(<Separator decorative={false} />);
      const separator = container.firstChild;
      expect(separator).toHaveAttribute('role', 'separator');
    });
    it('applies aria-orientation when semantic horizontal', () => {
      const {
        container
      } = render(<Separator decorative={false} orientation="horizontal" />);
      const separator = container.firstChild;
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    });
    it('applies aria-orientation when semantic vertical', () => {
      const {
        container
      } = render(<Separator decorative={false} orientation="vertical" />);
      const separator = container.firstChild;
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });
    it('does not apply aria-orientation when decorative', () => {
      const {
        container
      } = render(<Separator decorative={true} orientation="horizontal" />);
      const separator = container.firstChild;
      expect(separator).not.toHaveAttribute('aria-orientation');
    });
  });
  describe('ARIA Separator Role', () => {
    it('has role="separator" when semantic', () => {
      const {
        container
      } = render(<Separator decorative={false} />);
      const separator = container.firstChild;
      expect(separator).toHaveAttribute('role', 'separator');
    });
    it('does not have role when decorative', () => {
      const {
        container
      } = render(<Separator decorative={true} />);
      const separator = container.firstChild;
      expect(separator).not.toHaveAttribute('role');
    });
    it('combines with other ARIA attributes when semantic', () => {
      const {
        container
      } = render(<Separator decorative={false} aria-label="Section divider" />);
      const separator = container.firstChild;
      expect(separator).toHaveAttribute('role', 'separator');
      expect(separator).toHaveAttribute('aria-label', 'Section divider');
    });
    it('supports aria-labelledby when semantic', () => {
      render(<div>
          <h3 id="section-title">Section Title</h3>
          <Separator decorative={false} aria-labelledby="section-title" />
        </div>);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveAttribute('aria-labelledby', 'section-title');
    });
  });
  describe('Visual Styling', () => {
    it('applies base border styling', () => {
      const {
        container
      } = render(<Separator />);
      const separator = container.firstChild as HTMLElement;
      expect(separator.className).toContain('bg-border');
    });
    it('applies shrink-0 class', () => {
      const {
        container
      } = render(<Separator />);
      const separator = container.firstChild as HTMLElement;
      expect(separator.className).toContain('shrink-0');
    });
    it('applies custom styles', () => {
      const {
        container
      } = render(<Separator style={{
        backgroundColor: 'red',
        height: '2px'
      }} />);
      const separator = container.firstChild as HTMLElement;
      expect(separator.style.backgroundColor).toBe('red');
      expect(separator.style.height).toBe('2px');
    });
    it('applies custom height via className', () => {
      const {
        container
      } = render(<Separator className="h-[2px]" />);
      const separator = container.firstChild;
      expect(separator).toHaveClass('h-[2px]');
    });
    it('applies custom width via className', () => {
      const {
        container
      } = render(<Separator orientation="vertical" className="w-[2px]" />);
      const separator = container.firstChild;
      expect(separator).toHaveClass('w-[2px]');
    });
    it('applies custom color via className', () => {
      const {
        container
      } = render(<Separator className="bg-blue-500" />);
      const separator = container.firstChild;
      expect(separator).toHaveClass('bg-blue-500');
    });
  });
  describe('Layout Integration', () => {
    it('renders in flex container with horizontal orientation', () => {
      render(<div className="flex items-center">
          <span>Left</span>
          <Separator orientation="vertical" style={{
          height: '20px'
        }} data-testid="separator" />
          <span>Right</span>
        </div>);
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
    it('renders between content blocks', () => {
      render(<div>
          <div data-testid="content-1">Content 1</div>
          <Separator data-testid="separator" />
          <div data-testid="content-2">Content 2</div>
        </div>);
      expect(screen.getByTestId('content-1')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
    });
    it('renders multiple separators', () => {
      const {
        container
      } = render(<div>
          <div>Section 1</div>
          <Separator />
          <div>Section 2</div>
          <Separator />
          <div>Section 3</div>
        </div>);
      const separators = container.querySelectorAll('[data-orientation]');
      expect(separators).toHaveLength(2);
    });
    it('works in card layout', () => {
      render(<div data-testid="card">
          <div data-testid="header">Header</div>
          <Separator data-testid="separator-1" />
          <div data-testid="body">Body</div>
          <Separator data-testid="separator-2" />
          <div data-testid="footer">Footer</div>
        </div>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('separator-1')).toBeInTheDocument();
      expect(screen.getByTestId('body')).toBeInTheDocument();
      expect(screen.getByTestId('separator-2')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });
  describe('Accessibility', () => {
    it('has no accessibility violations (decorative horizontal)', async () => {
      const {
        container
      } = render(<div>
          <div>Content above</div>
          <Separator />
          <div>Content below</div>
        </div>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations (decorative vertical)', async () => {
      const {
        container
      } = render(<div className="flex items-center">
          <span>Left</span>
          <Separator orientation="vertical" style={{
          height: '20px'
        }} />
          <span>Right</span>
        </div>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations (semantic horizontal)', async () => {
      const {
        container
      } = render(<div>
          <div>Content above</div>
          <Separator decorative={false} />
          <div>Content below</div>
        </div>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations (semantic vertical)', async () => {
      const {
        container
      } = render(<div className="flex items-center">
          <span>Left</span>
          <Separator decorative={false} orientation="vertical" style={{
          height: '20px'
        }} />
          <span>Right</span>
        </div>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations (with aria-label)', async () => {
      const {
        container
      } = render(<Separator decorative={false} aria-label="Content divider" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('is hidden from screen readers when decorative', () => {
      const {
        container
      } = render(<Separator decorative={true} />);
      const separator = container.firstChild;
      // Decorative separators don't have role="separator", so they're not announced
      expect(separator).not.toHaveAttribute('role');
    });
    it('is announced to screen readers when semantic', () => {
      const {
        container
      } = render(<Separator decorative={false} aria-label="Section divider" />);
      const separator = screen.getByRole('separator');
      expect(separator).toHaveAccessibleName('Section divider');
    });
  });
  describe('Edge Cases', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Separator ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
    it('applies data attributes', () => {
      const {
        container
      } = render(<Separator data-testid="my-separator" data-state="visible" />);
      const separator = screen.getByTestId('my-separator');
      expect(separator).toHaveAttribute('data-state', 'visible');
    });
    it('handles undefined orientation gracefully', () => {
      const {
        container
      } = render(<Separator orientation={undefined} />);
      const separator = container.firstChild;
      expect(separator).toBeInTheDocument();
    });
    it('handles undefined decorative gracefully', () => {
      const {
        container
      } = render(<Separator decorative={undefined} />);
      const separator = container.firstChild;
      expect(separator).toBeInTheDocument();
    });
    it('combines multiple classNames', () => {
      const {
        container
      } = render(<Separator className="custom-class-1 custom-class-2" />);
      const separator = container.firstChild;
      expect(separator).toHaveClass('custom-class-1');
      expect(separator).toHaveClass('custom-class-2');
    });
    it('applies id attribute', () => {
      const {
        container
      } = render(<Separator id="unique-separator" />);
      const separator = container.firstChild;
      expect(separator).toHaveAttribute('id', 'unique-separator');
    });
  });
});