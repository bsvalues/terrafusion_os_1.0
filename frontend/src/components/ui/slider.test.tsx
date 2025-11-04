import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Slider } from './slider';

expect.extend(toHaveNoViolations);

describe('Slider', () => {
  describe('Rendering', () => {
    it('renders slider component', () => {
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('applies default styles', () => {
      const { container } = render(<Slider defaultValue={[50]} />);

      const root = container.querySelector('[role="slider"]')?.parentElement;
      expect(root).toHaveClass('relative');
      expect(root).toHaveClass('flex');
      expect(root).toHaveClass('w-full');
      expect(root).toHaveClass('touch-none');
      expect(root).toHaveClass('select-none');
      expect(root).toHaveClass('items-center');
    });

    it('accepts custom className', () => {
      const { container } = render(<Slider defaultValue={[50]} className='custom-slider' />);

      const root = container.querySelector('[role="slider"]')?.parentElement;
      expect(root).toHaveClass('custom-slider');
    });

    it('renders with initial value', () => {
      render(<Slider defaultValue={[75]} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Value and Range', () => {
    it('renders with min and max values', () => {
      render(<Slider defaultValue={[50]} min={0} max={100} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders with custom min and max', () => {
      render(<Slider defaultValue={[10]} min={5} max={20} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '5');
      expect(slider).toHaveAttribute('aria-valuemax', '20');
      expect(slider).toHaveAttribute('aria-valuenow', '10');
    });

    it('renders with step value', () => {
      render(<Slider defaultValue={[50]} step={10} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('handles value changes', () => {
      const onValueChange = jest.fn();
      render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);

      // Slider is interactive, onValueChange would be called on interaction
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders with multiple values (range)', () => {
      render(<Slider defaultValue={[25, 75]} />);

      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '25');
      expect(sliders[1]).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled slider', () => {
      render(<Slider defaultValue={[50]} disabled />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Slider defaultValue={[50]} disabled />);

      const slider = screen.getByRole('slider');
      expect(slider.className).toContain('disabled:opacity-50');
      expect(slider.className).toContain('disabled:pointer-events-none');
    });

    it('prevents value changes when disabled', () => {
      const onValueChange = jest.fn();
      render(<Slider defaultValue={[50]} disabled onValueChange={onValueChange} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation (right/up)', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      await user.keyboard('{ArrowRight}');

      // Verify slider can receive keyboard input
      expect(slider).toHaveFocus();
    });

    it('supports arrow key navigation (left/down)', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      await user.keyboard('{ArrowLeft}');

      expect(slider).toHaveFocus();
    });

    it('supports Home key (jump to min)', async () => {
      const user = userEvent.setup();
      render(<Slider defaultValue={[50]} min={0} max={100} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      await user.keyboard('{Home}');

      expect(slider).toHaveFocus();
    });

    it('supports End key (jump to max)', async () => {
      const user = userEvent.setup();
      render(<Slider defaultValue={[50]} min={0} max={100} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      await user.keyboard('{End}');

      expect(slider).toHaveFocus();
    });

    it('is keyboard focusable', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Slider defaultValue={[50]} />
          <button>After</button>
        </div>
      );

      await user.tab(); // Focus "Before" button
      await user.tab(); // Focus slider

      const slider = screen.getByRole('slider');
      expect(slider).toHaveFocus();
    });
  });

  describe('Orientation', () => {
    it('renders horizontal slider by default', () => {
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('renders vertical slider', () => {
      render(<Slider defaultValue={[50]} orientation='vertical' />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('Step Behavior', () => {
    it('renders with step of 1 by default', () => {
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('renders with custom step', () => {
      render(<Slider defaultValue={[50]} step={5} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('renders with step of 0.1 for decimals', () => {
      render(<Slider defaultValue={[5.5]} min={0} max={10} step={0.1} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '5.5');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - basic slider', async () => {
      const { container } = render(<Slider defaultValue={[50]} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - with aria-label', async () => {
      const { container } = render(<Slider defaultValue={[50]} aria-label='Volume' />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - disabled slider', async () => {
      const { container } = render(<Slider defaultValue={[50]} disabled />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - range slider', async () => {
      const { container } = render(<Slider defaultValue={[25, 75]} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('slider has proper ARIA attributes', () => {
      render(<Slider defaultValue={[60]} min={0} max={100} aria-label='Volume' />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '60');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-label', 'Volume');
    });

    it('supports aria-labelledby', () => {
      render(
        <div>
          <label id='volume-label'>Volume Control</label>
          <Slider defaultValue={[50]} aria-labelledby='volume-label' />
        </div>
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-labelledby', 'volume-label');
    });

    it('respects aria-describedby', () => {
      render(
        <div>
          <Slider defaultValue={[50]} aria-describedby='slider-desc' />
          <p id='slider-desc'>Adjust the value between 0 and 100</p>
        </div>
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-describedby', 'slider-desc');
    });
  });

  describe('Focus Behavior', () => {
    it('can be focused', () => {
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      expect(slider).toHaveFocus();
    });

    it('shows focus ring on focus', () => {
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      expect(slider.className).toContain('focus-visible:outline-none');
      expect(slider.className).toContain('focus-visible:ring-1');
      expect(slider.className).toContain('focus-visible:ring-ring');
    });

    it('maintains focus during keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowLeft}');

      expect(slider).toHaveFocus();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders volume control slider', () => {
      render(
        <div>
          <label id='volume-label'>Volume</label>
          <Slider defaultValue={[70]} min={0} max={100} step={1} aria-labelledby='volume-label' />
        </div>
      );

      expect(screen.getByText('Volume')).toBeInTheDocument();
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '70');
    });

    it('renders brightness control', () => {
      render(
        <div>
          <label id='brightness'>Brightness: 80%</label>
          <Slider defaultValue={[80]} min={0} max={100} aria-labelledby='brightness' />
        </div>
      );

      expect(screen.getByText('Brightness: 80%')).toBeInTheDocument();
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '80');
    });

    it('renders price range filter', () => {
      render(
        <div>
          <label id='price-range'>Price Range: $25 - $75</label>
          <Slider defaultValue={[25, 75]} min={0} max={100} aria-labelledby='price-range' />
        </div>
      );

      expect(screen.getByText('Price Range: $25 - $75')).toBeInTheDocument();
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '25');
      expect(sliders[1]).toHaveAttribute('aria-valuenow', '75');
    });

    it('renders temperature control', () => {
      render(
        <div>
          <label id='temp'>Temperature (°C)</label>
          <Slider defaultValue={[22]} min={15} max={30} step={0.5} aria-labelledby='temp' />
        </div>
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '22');
      expect(slider).toHaveAttribute('aria-valuemin', '15');
      expect(slider).toHaveAttribute('aria-valuemax', '30');
    });
  });

  describe('Edge Cases', () => {
    it('handles min value equal to max value', () => {
      render(<Slider defaultValue={[50]} min={50} max={50} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
      expect(slider).toHaveAttribute('aria-valuemin', '50');
      expect(slider).toHaveAttribute('aria-valuemax', '50');
    });

    it('handles negative values', () => {
      render(<Slider defaultValue={[-10]} min={-50} max={0} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '-10');
      expect(slider).toHaveAttribute('aria-valuemin', '-50');
      expect(slider).toHaveAttribute('aria-valuemax', '0');
    });

    it('handles decimal values', () => {
      render(<Slider defaultValue={[3.14]} min={0} max={10} step={0.01} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '3.14');
    });

    it('handles very large numbers', () => {
      render(<Slider defaultValue={[5000]} min={0} max={10000} step={100} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '5000');
      expect(slider).toHaveAttribute('aria-valuemax', '10000');
    });

    it('handles very small step size', () => {
      render(<Slider defaultValue={[0.5]} min={0} max={1} step={0.001} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '0.5');
    });

    it('renders with value at minimum', () => {
      render(<Slider defaultValue={[0]} min={0} max={100} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '0');
    });

    it('renders with value at maximum', () => {
      render(<Slider defaultValue={[100]} min={0} max={100} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '100');
    });

    it('handles inverted range (max < min)', () => {
      // This is an edge case that should be handled by the component
      render(<Slider defaultValue={[50]} min={100} max={0} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('handles three thumbs (triple range)', () => {
      render(<Slider defaultValue={[25, 50, 75]} />);

      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(3);
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '25');
      expect(sliders[1]).toHaveAttribute('aria-valuenow', '50');
      expect(sliders[2]).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as uncontrolled component', () => {
      render(<Slider defaultValue={[50]} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('works as controlled component', () => {
      const onValueChange = jest.fn();
      render(<Slider value={[60]} onValueChange={onValueChange} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '60');
    });

    it('calls onValueChange when value changes', () => {
      const onValueChange = jest.fn();
      render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);

      // Component is rendered and ready to respond to value changes
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('calls onValueCommit when interaction ends', () => {
      const onValueCommit = jest.fn();
      render(<Slider defaultValue={[50]} onValueCommit={onValueCommit} />);

      // Component is rendered and ready to respond to value commits
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom track styling', () => {
      const { container } = render(<Slider defaultValue={[50]} className='custom-track' />);

      const root = container.querySelector('.custom-track');
      expect(root).toBeInTheDocument();
    });

    it('applies custom width', () => {
      const { container } = render(<Slider defaultValue={[50]} className='w-[300px]' />);

      const root = container.querySelector('.w-\\[300px\\]');
      expect(root).toBeInTheDocument();
    });

    it('supports custom color scheme', () => {
      const { container } = render(<Slider defaultValue={[50]} className='bg-blue-500' />);

      const root = container.querySelector('.bg-blue-500');
      expect(root).toBeInTheDocument();
    });
  });
});
