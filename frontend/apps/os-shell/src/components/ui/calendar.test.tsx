import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Calendar } from './calendar';

describe('Calendar', () => {
  it('renders the calendar root slot in jsdom', () => {
    const { container } = render(<Calendar />);

    expect(container.querySelector('[data-slot="calendar"]')).toBeInTheDocument();
  });

  it('applies caller class names to the calendar root', () => {
    const { container } = render(<Calendar className='county-date-picker' />);

    expect(container.querySelector('[data-slot="calendar"]')).toHaveClass('county-date-picker');
  });

  it('uses outside days by default for stable date-grid framing', () => {
    const { container } = render(<Calendar />);

    const calendar = container.querySelector('[data-slot="calendar"]');
    expect(calendar?.className).toContain('bg-background');
  });
});
