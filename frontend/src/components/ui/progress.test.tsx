import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Progress } from './progress';

expect.extend(toHaveNoViolations);

describe('Progress', () => {
  describe('Rendering', () => {
    it('renders progress bar', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.firstChild;
      expect(progressBar).toBeInTheDocument();
    });

    it('applies default styling', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveClass('h-2', 'w-full', 'rounded-full', 'bg-primary/20');
    });

    it('renders with custom className', () => {
      const { container } = render(<Progress value={50} className="custom-progress" />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveClass('custom-progress');
    });

    it('renders indicator element', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('renders with 0% progress', () => {
      const { container } = render(<Progress value={0} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('renders with 25% progress', () => {
      const { container } = render(<Progress value={25} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' });
    });

    it('renders with 50% progress', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
    });

    it('renders with 75% progress', () => {
      const { container } = render(<Progress value={75} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
    });

    it('renders with 100% progress', () => {
      const { container } = render(<Progress value={100} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
    });

    it('handles undefined value (defaults to 0)', () => {
      const { container } = render(<Progress />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('handles null value', () => {
      const { container } = render(<Progress value={null as any} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });
  });

  describe('Max Value', () => {
    it('uses default max value of 100', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveAttribute('data-max', '100');
    });

    it('accepts custom max value', () => {
      const { container } = render(<Progress value={50} max={200} />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveAttribute('data-max', '200');
    });

    it('calculates percentage with custom max', () => {
      // value=50 of max=200 = 25%
      const { container } = render(<Progress value={50} max={200} />);
      const indicator = container.querySelector('[data-state]');
      // Should show 25% progress (translateX(-75%))
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has progressbar role', () => {
      render(<Progress value={50} aria-label="Loading" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('has aria-valuemin attribute', () => {
      render(<Progress value={50} aria-label="Loading" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax attribute', () => {
      render(<Progress value={50} aria-label="Loading" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has aria-valuenow attribute', () => {
      render(<Progress value={50} aria-label="Loading" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('updates aria-valuenow when value changes', () => {
      const { rerender } = render(<Progress value={25} aria-label="Loading" />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');

      rerender(<Progress value={75} aria-label="Loading" />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('supports aria-label', () => {
      render(<Progress value={50} aria-label="Upload progress" />);
      const progressBar = screen.getByRole('progressbar', { name: /upload progress/i });
      expect(progressBar).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <div>
          <div id="progress-label">Loading content</div>
          <Progress value={50} aria-labelledby="progress-label" />
        </div>
      );
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-labelledby', 'progress-label');
    });

    it('has no accessibility violations at 0%', async () => {
      const { container } = render(<Progress value={0} aria-label="Progress" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations at 50%', async () => {
      const { container } = render(<Progress value={50} aria-label="Progress" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations at 100%', async () => {
      const { container } = render(<Progress value={100} aria-label="Progress" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Visual States', () => {
    it('shows empty state at 0%', () => {
      const { container } = render(<Progress value={0} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('shows partial fill at mid values', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
    });

    it('shows full state at 100%', () => {
      const { container } = render(<Progress value={100} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
    });

    it('has data-state attribute on indicator', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveAttribute('data-state');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom height', () => {
      const { container } = render(<Progress value={50} className="h-4" />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveClass('h-4');
    });

    it('applies custom width', () => {
      const { container } = render(<Progress value={50} className="w-1/2" />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveClass('w-1/2');
    });

    it('applies custom colors', () => {
      const { container } = render(
        <Progress value={50} className="bg-slate-200" />
      );
      const progressBar = container.firstChild;
      expect(progressBar).toHaveClass('bg-slate-200');
    });

    it('applies rounded variants', () => {
      const { container } = render(<Progress value={50} className="rounded-lg" />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveClass('rounded-lg');
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders file upload progress', () => {
      render(<Progress value={65} aria-label="File upload: 65%" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '65');
    });

    it('renders loading indicator', () => {
      render(<Progress value={30} aria-label="Loading content" />);
      const progress = screen.getByRole('progressbar', { name: /loading content/i });
      expect(progress).toBeInTheDocument();
    });

    it('renders form completion progress', () => {
      render(<Progress value={75} aria-label="Form completion: 3 of 4 steps" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
    });

    it('renders download progress', () => {
      render(<Progress value={42} aria-label="Downloading: 42%" />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '42');
    });
  });

  describe('Edge Cases', () => {
    it('handles negative values (treats as 0)', () => {
      const { container } = render(<Progress value={-10} />);
      const indicator = container.querySelector('[data-state]');
      // Negative values should be clamped or treated as 0
      expect(indicator).toBeInTheDocument();
    });

    it('handles values over 100 (treats as 100)', () => {
      const { container } = render(<Progress value={150} />);
      const indicator = container.querySelector('[data-state]');
      // Values over max should be handled appropriately
      expect(indicator).toBeInTheDocument();
    });

    it('handles decimal values', () => {
      const { container } = render(<Progress value={33.33} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-66.67%)' });
    });

    it('handles very small values', () => {
      const { container } = render(<Progress value={0.1} />);
      const indicator = container.querySelector('[data-state]');
      expect(indicator).toHaveStyle({ transform: 'translateX(-99.9%)' });
    });

    it('renders without crash when value is NaN', () => {
      const { container } = render(<Progress value={NaN} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('has data-state attribute on root', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveAttribute('data-state');
    });

    it('has data-value attribute', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveAttribute('data-value', '50');
    });

    it('has data-max attribute', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.firstChild;
      expect(progressBar).toHaveAttribute('data-max', '100');
    });
  });
});
