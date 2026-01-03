import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Progress } from './progress';

expect.extend(toHaveNoViolations);

describe('Progress', () => {
  describe('Rendering', () => {
    it('renders progress bar', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies default styling', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('h-2', 'w-full', 'rounded-full', 'bg-primary/20');
    });

    it('renders with custom className', () => {
      render(<Progress value={50} className='custom-progress' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('custom-progress');
    });

    it('renders indicator element', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('data-state');
    });
  });

  describe('Value Handling', () => {
    it('renders with 0% progress', () => {
      render(<Progress value={0} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('renders with 25% progress', () => {
      render(<Progress value={25} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' });
    });

    it('renders with 50% progress', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
    });

    it('renders with 75% progress', () => {
      render(<Progress value={75} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
    });

    it('renders with 100% progress', () => {
      render(<Progress value={100} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(0%)' });
    });

    it('handles undefined value (defaults to 0)', () => {
      render(<Progress />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('handles null value', () => {
      render(<Progress value={null as any} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });
  });

  describe('Max Value', () => {
    it('uses default max value of 100', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('data-max', '100');
    });

    it('accepts custom max value', () => {
      render(<Progress value={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('data-max', '200');
    });

    it('calculates percentage with custom max', () => {
      // value=50 of max=200 = 25%
      render(<Progress value={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      // Should show 25% progress (translateX(-75%))
      expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' });
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has progressbar role', () => {
      render(<Progress value={50} aria-label='Loading' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('has aria-valuemin attribute', () => {
      render(<Progress value={50} aria-label='Loading' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax attribute', () => {
      render(<Progress value={50} aria-label='Loading' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has aria-valuenow attribute', () => {
      render(<Progress value={50} aria-label='Loading' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('updates aria-valuenow when value changes', () => {
      const { rerender } = render(<Progress value={25} aria-label='Loading' />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');

      rerender(<Progress value={75} aria-label='Loading' />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('supports aria-label', () => {
      render(<Progress value={50} aria-label='Upload progress' />);
      const progressBar = screen.getByRole('progressbar', { name: /upload progress/i });
      expect(progressBar).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <div>
          <div id='progress-label'>Loading content</div>
          <Progress value={50} aria-labelledby='progress-label' />
        </div>
      );
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-labelledby', 'progress-label');
    });

    it('has no accessibility violations at 0%', async () => {
      const { container } = render(<Progress value={0} aria-label='Progress' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations at 50%', async () => {
      const { container } = render(<Progress value={50} aria-label='Progress' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations at 100%', async () => {
      const { container } = render(<Progress value={100} aria-label='Progress' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Visual States', () => {
    it('shows empty state at 0%', () => {
      render(<Progress value={0} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('shows partial fill at mid values', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
    });

    it('shows full state at 100%', () => {
      render(<Progress value={100} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(0%)' });
    });

    it('has data-state attribute on indicator', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveAttribute('data-state');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom height', () => {
      render(<Progress value={50} className='h-4' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('h-4');
    });

    it('applies custom width', () => {
      render(<Progress value={50} className='w-1/2' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('w-1/2');
    });

    it('applies custom colors', () => {
      render(<Progress value={50} className='bg-slate-200' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-slate-200');
    });

    it('applies rounded variants', () => {
      render(<Progress value={50} className='rounded-lg' />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('rounded-lg');
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders file upload progress', () => {
      render(<Progress value={65} aria-label='File upload: 65%' />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '65');
    });

    it('renders loading indicator', () => {
      render(<Progress value={30} aria-label='Loading content' />);
      const progress = screen.getByRole('progressbar', { name: /loading content/i });
      expect(progress).toBeInTheDocument();
    });

    it('renders form completion progress', () => {
      render(<Progress value={75} aria-label='Form completion: 3 of 4 steps' />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
    });

    it('renders download progress', () => {
      render(<Progress value={42} aria-label='Downloading: 42%' />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '42');
    });
  });

  describe('Edge Cases', () => {
    it('handles negative values (treats as 0)', () => {
      render(<Progress value={-10} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      // Negative values should be clamped to 0
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('handles values over 100 (treats as 100)', () => {
      render(<Progress value={150} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      // Values over max should be clamped
      expect(indicator).toHaveStyle({ transform: 'translateX(0%)' });
    });

    it('handles decimal values', () => {
      render(<Progress value={33.33} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-66.67%)' });
    });

    it('handles very small values', () => {
      render(<Progress value={0.1} />);
      const progressBar = screen.getByRole('progressbar');
      const indicator = progressBar.firstElementChild;
      expect(indicator).toHaveStyle({ transform: 'translateX(-99.9%)' });
    });

    it('renders without crash when value is NaN', () => {
      render(<Progress value={NaN} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('has data-state attribute on root', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('data-state');
    });

    it('has data-value attribute', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('data-value', '50');
    });

    it('has data-max attribute', () => {
      render(<Progress value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('data-max', '100');
    });
  });
});
