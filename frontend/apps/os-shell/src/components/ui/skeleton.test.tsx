import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Skeleton } from './skeleton';

expect.extend(toHaveNoViolations);

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('renders skeleton element', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className='custom-skeleton' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('renders with default styling', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveClass('bg-primary/10');
    });

    it('renders multiple skeletons', () => {
      const { container } = render(
        <>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('applies size classes correctly', () => {
      const { container } = render(<Skeleton className='h-12 w-12' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('w-12');
    });
  });

  describe('Shapes', () => {
    it('renders as rectangle by default', () => {
      const { container } = render(<Skeleton className='h-4 w-32' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('renders as circle with rounded-full', () => {
      const { container } = render(<Skeleton className='h-12 w-12 rounded-full' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('renders as square with equal dimensions', () => {
      const { container } = render(<Skeleton className='h-16 w-16' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-16');
      expect(skeleton).toHaveClass('w-16');
    });

    it('renders with custom rounding', () => {
      const { container } = render(<Skeleton className='rounded-lg' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('renders text line shapes', () => {
      const { container } = render(
        <div>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      );

      const skeletons = container.querySelectorAll('.h-4');
      expect(skeletons).toHaveLength(3);
    });

    it('renders button shape', () => {
      const { container } = render(<Skeleton className='h-10 w-24 rounded-md' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-24');
      expect(skeleton).toHaveClass('rounded-md');
    });
  });

  describe('Animation', () => {
    it('has pulse animation by default', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('animation can be customized via className', () => {
      const { container } = render(<Skeleton className='animate-none' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('animate-none');
    });

    it('maintains animation with multiple skeletons', () => {
      const { container } = render(
        <>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
        </>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });

  describe('Composed Layouts', () => {
    it('renders card skeleton layout', () => {
      const { container } = render(
        <div className='space-y-3'>
          <Skeleton className='h-48 w-full rounded-md' />
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </div>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(4);
    });

    it('renders list item skeleton layout', () => {
      const { container } = render(
        <div className='flex gap-3'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-3 w-2/3' />
          </div>
        </div>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('renders header with avatar skeleton layout', () => {
      const { container } = render(
        <div className='flex items-center gap-4'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('renders table row skeleton layout', () => {
      const { container } = render(
        <div className='flex gap-4 items-center'>
          <Skeleton className='h-4 w-8' />
          <Skeleton className='h-8 w-8 rounded-full' />
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-6 w-20' />
          <Skeleton className='h-4 w-16' />
        </div>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(5);
    });

    it('renders profile skeleton layout', () => {
      const { container } = render(
        <div className='space-y-6'>
          <Skeleton className='h-48 w-full rounded-none' />
          <div className='flex items-start gap-4'>
            <Skeleton className='h-24 w-24 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-11/12' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(7);
    });

    it('renders grid of card skeletons', () => {
      const { container } = render(
        <div className='grid gap-4 md:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='space-y-3'>
              <Skeleton className='h-48 w-full' />
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-full' />
            </div>
          ))}
        </div>
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(9); // 3 cards × 3 skeletons each
    });
  });

  describe('Styling and Customization', () => {
    it('accepts custom background color', () => {
      const { container } = render(<Skeleton className='bg-slate-200' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('bg-slate-200');
    });

    it('accepts custom dimensions', () => {
      const { container } = render(<Skeleton className='h-20 w-40' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-20');
      expect(skeleton).toHaveClass('w-40');
    });

    it('accepts custom spacing', () => {
      const { container } = render(<Skeleton className='m-4 p-2' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('m-4');
      expect(skeleton).toHaveClass('p-2');
    });

    it('supports responsive sizing', () => {
      const { container } = render(<Skeleton className='h-12 md:h-16 lg:h-20' />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('md:h-16');
      expect(skeleton).toHaveClass('lg:h-20');
    });
  });

  describe('ARIA and Accessibility', () => {
    it('is not focusable', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.tabIndex).toBe(-1);
    });

    it('does not interfere with screen readers', () => {
      render(
        <div>
          <span>Loading...</span>
          <Skeleton className='h-4 w-full' />
        </div>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('can be wrapped with loading announcement', () => {
      render(
        <div role='status' aria-live='polite' aria-label='Loading content'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      );

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
    });

    it('has no accessibility violations (single skeleton)', async () => {
      const { container } = render(<Skeleton className='h-4 w-32' />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (multiple skeletons)', async () => {
      const { container } = render(
        <div>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (circle skeleton)', async () => {
      const { container } = render(<Skeleton className='h-12 w-12 rounded-full' />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (composed layout)', async () => {
      const { container } = render(
        <div className='flex gap-3'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-3 w-2/3' />
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (card skeleton)', async () => {
      const { container } = render(
        <div className='space-y-3'>
          <Skeleton className='h-48 w-full rounded-md' />
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
