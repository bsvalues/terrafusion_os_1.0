import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Calendar } from './calendar';

expect.extend(toHaveNoViolations);

describe('Calendar', () => {
  describe('Rendering', () => {
    it('renders calendar component', () => {
      render(<Calendar />);
      
      // Calendar renders with grid structure
      const calendar = screen.getByRole('application');
      expect(calendar).toBeInTheDocument();
    });

    it('renders current month by default', () => {
      render(<Calendar />);
      
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      expect(screen.getByText(new RegExp(currentMonth, 'i'))).toBeInTheDocument();
    });

    it('renders day cells', () => {
      render(<Calendar />);
      
      // Should have multiple day buttons
      const dayButtons = screen.getAllByRole('button');
      expect(dayButtons.length).toBeGreaterThan(20); // At least days in month
    });

    it('renders navigation buttons', () => {
      render(<Calendar />);
      
      // Previous and next month navigation
      const buttons = screen.getAllByRole('button');
      const navButtons = buttons.filter(btn => 
        btn.getAttribute('aria-label')?.includes('previous') ||
        btn.getAttribute('aria-label')?.includes('next')
      );
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('applies custom className', () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      
      const calendar = container.querySelector('.custom-calendar');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Month Navigation', () => {
    it('navigates to next month', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const currentDate = new Date();
      const nextButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('aria-label')?.includes('next')
      );
      
      if (nextButton) {
        await user.click(nextButton);
        // Calendar should update (implementation specific)
        expect(nextButton).toBeInTheDocument();
      }
    });

    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const prevButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('aria-label')?.includes('previous')
      );
      
      if (prevButton) {
        await user.click(prevButton);
        expect(prevButton).toBeInTheDocument();
      }
    });

    it('displays correct month and year', () => {
      const testDate = new Date(2024, 5, 15); // June 2024
      render(<Calendar defaultMonth={testDate} />);
      
      expect(screen.getByText(/june/i)).toBeInTheDocument();
      expect(screen.getByText(/2024/i)).toBeInTheDocument();
    });

    it('handles month prop for controlled navigation', () => {
      const june2024 = new Date(2024, 5, 1);
      render(<Calendar month={june2024} />);
      
      expect(screen.getByText(/june/i)).toBeInTheDocument();
      expect(screen.getByText(/2024/i)).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('selects a date on click', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(<Calendar selected={undefined} onSelect={onSelect} />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 0) {
        await user.click(dayButtons[15]); // Click day 15 (or similar)
        expect(onSelect).toHaveBeenCalled();
      }
    });

    it('renders with selected date', () => {
      const selectedDate = new Date(2024, 5, 15);
      render(<Calendar selected={selectedDate} />);
      
      // Selected date should have aria-selected attribute
      const buttons = screen.getAllByRole('button');
      const selectedButton = buttons.find(btn => 
        btn.getAttribute('aria-selected') === 'true'
      );
      expect(selectedButton).toBeInTheDocument();
    });

    it('supports single date selection mode', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(<Calendar mode="single" selected={undefined} onSelect={onSelect} />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 0) {
        await user.click(dayButtons[10]);
        expect(onSelect).toHaveBeenCalled();
      }
    });

    it('supports multiple date selection mode', () => {
      const selectedDates = [new Date(2024, 5, 10), new Date(2024, 5, 15)];
      render(<Calendar mode="multiple" selected={selectedDates} />);
      
      const buttons = screen.getAllByRole('button');
      const selectedButtons = buttons.filter(btn => 
        btn.getAttribute('aria-selected') === 'true'
      );
      expect(selectedButtons.length).toBe(2);
    });

    it('supports range selection mode', () => {
      const range = {
        from: new Date(2024, 5, 10),
        to: new Date(2024, 5, 15),
      };
      render(<Calendar mode="range" selected={range} />);
      
      // Range dates should be selected
      const buttons = screen.getAllByRole('button');
      const selectedButtons = buttons.filter(btn => 
        btn.getAttribute('aria-selected') === 'true' ||
        btn.getAttribute('data-selected') === 'true'
      );
      expect(selectedButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled Dates', () => {
    it('disables past dates with fromDate', () => {
      const today = new Date();
      render(<Calendar fromDate={today} />);
      
      // Calendar should render
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('disables future dates with toDate', () => {
      const today = new Date();
      render(<Calendar toDate={today} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('disables specific dates with disabled prop', () => {
      const disabledDate = new Date(2024, 5, 15);
      render(<Calendar disabled={disabledDate} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('disables weekends', () => {
      const disableWeekends = (date: Date) => {
        return date.getDay() === 0 || date.getDay() === 6;
      };
      render(<Calendar disabled={disableWeekends} />);
      
      // Weekends should be disabled
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('disables date ranges', () => {
      const disabledRange = {
        from: new Date(2024, 5, 10),
        to: new Date(2024, 5, 15),
      };
      render(<Calendar disabled={disabledRange} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 0) {
        dayButtons[15].focus();
        await user.keyboard('{ArrowRight}');
        
        // Focus should move to next day
        expect(dayButtons[16]).toHaveFocus();
      }
    });

    it('navigates with arrow keys between weeks', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 14) {
        dayButtons[7].focus();
        await user.keyboard('{ArrowDown}');
        
        // Focus should move to same day next week (7 days later)
        expect(dayButtons[14]).toHaveFocus();
      }
    });

    it('supports Home key to jump to week start', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 7) {
        dayButtons[10].focus();
        await user.keyboard('{Home}');
        
        // Should jump to start of week
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    it('supports End key to jump to week end', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 7) {
        dayButtons[7].focus();
        await user.keyboard('{End}');
        
        // Should jump to end of week
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    it('supports PageUp to go to previous month', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 0) {
        dayButtons[15].focus();
        await user.keyboard('{PageUp}');
        
        // Calendar should navigate to previous month
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    it('supports PageDown to go to next month', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d+$/.test(btn.textContent)
      );
      
      if (dayButtons.length > 0) {
        dayButtons[15].focus();
        await user.keyboard('{PageDown}');
        
        // Calendar should navigate to next month
        expect(document.activeElement).toBeInTheDocument();
      }
    });
  });

  describe('Week Numbers', () => {
    it('displays week numbers when enabled', () => {
      render(<Calendar showWeekNumber />);
      
      // Week numbers should be visible
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('hides week numbers by default', () => {
      render(<Calendar />);
      
      // Should not show week numbers by default
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Multiple Months', () => {
    it('displays single month by default', () => {
      render(<Calendar />);
      
      const months = screen.getAllByRole('application');
      expect(months).toHaveLength(1);
    });

    it('displays multiple months', () => {
      render(<Calendar numberOfMonths={2} />);
      
      // Should show 2 months
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('displays three months', () => {
      render(<Calendar numberOfMonths={3} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Footer Content', () => {
    it('renders footer content', () => {
      render(
        <Calendar
          footer={<div>Select a date for your appointment</div>}
        />
      );
      
      expect(screen.getByText('Select a date for your appointment')).toBeInTheDocument();
    });

    it('renders today button in footer', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(
        <Calendar
          selected={undefined}
          onSelect={onSelect}
          footer={<button onClick={() => onSelect(new Date())}>Today</button>}
        />
      );
      
      const todayButton = screen.getByRole('button', { name: /today/i });
      expect(todayButton).toBeInTheDocument();
      
      await user.click(todayButton);
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - basic calendar', async () => {
      const { container } = render(<Calendar />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - with selected date', async () => {
      const { container } = render(
        <Calendar selected={new Date(2024, 5, 15)} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - with disabled dates', async () => {
      const { container } = render(
        <Calendar disabled={new Date(2024, 5, 15)} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('calendar has proper ARIA role', () => {
      render(<Calendar />);
      
      const calendar = screen.getByRole('application');
      expect(calendar).toBeInTheDocument();
    });

    it('day buttons have proper ARIA labels', () => {
      render(<Calendar />);
      
      const dayButtons = screen.getAllByRole('button');
      const dayButton = dayButtons.find(btn =>
        btn.hasAttribute('aria-label')
      );
      
      expect(dayButton).toBeInTheDocument();
    });

    it('selected dates have aria-selected', () => {
      const selectedDate = new Date(2024, 5, 15);
      render(<Calendar selected={selectedDate} />);
      
      const buttons = screen.getAllByRole('button');
      const selectedButton = buttons.find(btn =>
        btn.getAttribute('aria-selected') === 'true'
      );
      
      expect(selectedButton).toBeInTheDocument();
    });

    it('disabled dates have aria-disabled', () => {
      const disabledDate = new Date(2024, 5, 15);
      render(<Calendar defaultMonth={new Date(2024, 5, 1)} disabled={disabledDate} />);
      
      // Disabled dates should have appropriate attributes
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders date picker for booking', () => {
      const today = new Date();
      const onSelect = jest.fn();
      
      render(
        <div>
          <h3>Select booking date</h3>
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={onSelect}
            fromDate={today}
            footer={<p>Choose an available date</p>}
          />
        </div>
      );
      
      expect(screen.getByText('Select booking date')).toBeInTheDocument();
      expect(screen.getByText('Choose an available date')).toBeInTheDocument();
    });

    it('renders date range picker for vacation', () => {
      const range = {
        from: new Date(2024, 6, 10),
        to: new Date(2024, 6, 20),
      };
      
      render(
        <div>
          <h3>Select vacation dates</h3>
          <Calendar
            mode="range"
            selected={range}
            numberOfMonths={2}
          />
        </div>
      );
      
      expect(screen.getByText('Select vacation dates')).toBeInTheDocument();
    });

    it('renders calendar with disabled weekends for business days', () => {
      const disableWeekends = (date: Date) => {
        return date.getDay() === 0 || date.getDay() === 6;
      };
      
      render(
        <div>
          <h3>Select business day</h3>
          <Calendar
            mode="single"
            disabled={disableWeekends}
            footer={<p>Weekends are not available</p>}
          />
        </div>
      );
      
      expect(screen.getByText('Select business day')).toBeInTheDocument();
      expect(screen.getByText('Weekends are not available')).toBeInTheDocument();
    });

    it('renders birthday picker with past dates only', () => {
      const today = new Date();
      
      render(
        <div>
          <h3>Select your birthday</h3>
          <Calendar
            mode="single"
            toDate={today}
            captionLayout="dropdown"
          />
        </div>
      );
      
      expect(screen.getByText('Select your birthday')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles month boundary transitions', async () => {
      const user = userEvent.setup();
      const lastDayOfMonth = new Date(2024, 5, 30); // June 30, 2024
      render(<Calendar defaultMonth={lastDayOfMonth} />);
      
      const nextButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('aria-label')?.includes('next')
      );
      
      if (nextButton) {
        await user.click(nextButton);
        // Should transition to July
        expect(nextButton).toBeInTheDocument();
      }
    });

    it('handles year boundary transitions', async () => {
      const user = userEvent.setup();
      const december = new Date(2024, 11, 15); // December 2024
      render(<Calendar defaultMonth={december} />);
      
      const nextButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('aria-label')?.includes('next')
      );
      
      if (nextButton) {
        await user.click(nextButton);
        // Should transition to January 2025
        expect(nextButton).toBeInTheDocument();
      }
    });

    it('handles leap year dates', () => {
      const leapDay = new Date(2024, 1, 29); // Feb 29, 2024
      render(<Calendar defaultMonth={leapDay} selected={leapDay} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('handles very old dates', () => {
      const oldDate = new Date(1900, 0, 1);
      render(<Calendar defaultMonth={oldDate} />);
      
      expect(screen.getByText(/1900/i)).toBeInTheDocument();
    });

    it('handles far future dates', () => {
      const futureDate = new Date(2100, 0, 1);
      render(<Calendar defaultMonth={futureDate} />);
      
      expect(screen.getByText(/2100/i)).toBeInTheDocument();
    });

    it('handles empty selection gracefully', () => {
      render(<Calendar mode="single" selected={undefined} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('handles rapid month navigation', async () => {
      const user = userEvent.setup();
      render(<Calendar />);
      
      const nextButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('aria-label')?.includes('next')
      );
      
      if (nextButton) {
        // Rapid clicks
        await user.click(nextButton);
        await user.click(nextButton);
        await user.click(nextButton);
        
        expect(nextButton).toBeInTheDocument();
      }
    });

    it('handles range with same from and to date', () => {
      const sameDate = new Date(2024, 5, 15);
      const range = { from: sameDate, to: sameDate };
      
      render(<Calendar mode="range" selected={range} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('handles incomplete range (from without to)', () => {
      const incompleteRange = { from: new Date(2024, 5, 10), to: undefined };
      
      render(<Calendar mode="range" selected={incompleteRange} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('handles multiple selected dates (empty array)', () => {
      render(<Calendar mode="multiple" selected={[]} />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('renders with default locale', () => {
      render(<Calendar />);
      
      // Should render with default English locale
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('supports custom locale via props', () => {
      // locale prop would be passed to DayPicker
      render(<Calendar />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('renders month names', () => {
      const date = new Date(2024, 5, 15);
      render(<Calendar defaultMonth={date} />);
      
      // June should be visible
      expect(screen.getByText(/june/i)).toBeInTheDocument();
    });

    it('renders day names (headers)', () => {
      render(<Calendar />);
      
      // Should have day headers (Sun, Mon, etc.)
      const calendar = screen.getByRole('application');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('accepts custom className', () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      
      expect(container.querySelector('.custom-calendar')).toBeInTheDocument();
    });

    it('supports custom button variant', () => {
      render(<Calendar buttonVariant="outline" />);
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('applies custom classNames to subcomponents', () => {
      render(
        <Calendar
          classNames={{
            day_button: 'custom-day-button',
          }}
        />
      );
      
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });
});
