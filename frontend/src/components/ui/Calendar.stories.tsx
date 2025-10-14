/**
 * Calendar Component Stories - TerraFusion Design System
 * Week 2, Day 2 - Form Components Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Calendar/Date Picker component
 * - Single date selection
 * - Date range selection
 * - Date presets (Today, Yesterday, Last 7 days, etc.)
 * - Disabled dates
 * - Min/max date constraints
 * - Multiple months display
 * - Custom date formatting
 * - Real-world booking scenarios
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '../ui/calendar';
import { useState } from 'react';
import { format, subDays, addDays, startOfMonth, endOfMonth } from 'date-fns';

const meta = {
  title: 'Design System/Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Calendar / Date Picker Component

An accessible calendar component for date selection built on react-day-picker with full keyboard support.

## Features
- ✅ Single date selection
- ✅ Date range selection (start/end)
- ✅ Multiple date selection
- ✅ Date presets (Today, Last 7 days, etc.)
- ✅ Disabled dates (past, weekends, specific dates)
- ✅ Min/max date constraints
- ✅ Multiple months display
- ✅ Custom date formatting
- ✅ Keyboard navigation (Arrow keys, Enter, Space, Page Up/Down)
- ✅ Touch-friendly
- ✅ ARIA calendar attributes
- ✅ Built on react-day-picker primitives
- ✅ Full TypeScript support

## Usage
\`\`\`tsx
import { Calendar } from '@/components/ui/calendar';

// Single date
const [date, setDate] = useState<Date>();
<Calendar 
  mode="single"
  selected={date}
  onSelect={setDate}
/>

// Date range
const [range, setRange] = useState<{ from: Date; to?: Date }>();
<Calendar 
  mode="range"
  selected={range}
  onSelect={setRange}
/>

// With disabled dates
<Calendar 
  mode="single"
  disabled={(date) => date < new Date()}
/>
\`\`\`

## Props (from react-day-picker)
- \`mode\`: 'single' | 'multiple' | 'range'
- \`selected\`: Selected date(s)
- \`onSelect\`: Callback when date changes
- \`disabled\`: Disable specific dates (function or date array)
- \`fromDate\`: Minimum selectable date
- \`toDate\`: Maximum selectable date
- \`numberOfMonths\`: Number of months to display
- \`defaultMonth\`: Initial month to display
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Single Date Selection
 * Basic date picker for selecting a single date
 */
export const SingleDate: Story = {
  render: () => {
    function SingleDateDemo() {
      const [date, setDate] = useState<Date | undefined>(new Date());

      return (
        <div className="space-y-8">
          <div className="max-w-fit">
            <h3 className="text-lg font-bold mb-4">Single Date Selection</h3>
            <Calendar 
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            {date && (
              <p className="text-sm text-muted-foreground mt-4">
                Selected: <strong>{format(date, 'PPP')}</strong>
              </p>
            )}
          </div>

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Single Date Use Cases:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Birth date selection</li>
              <li>Appointment booking</li>
              <li>Event date</li>
              <li>Deadline picker</li>
              <li>Report date</li>
            </ul>
          </div>
        </div>
      );
    }

    return <SingleDateDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic single date selection with formatted output.',
      },
    },
  },
};

/**
 * Story 2: Date Range Selection
 * Select start and end dates
 */
export const DateRange: Story = {
  render: () => {
    function DateRangeDemo() {
      const [range, setRange] = useState<{ from: Date; to?: Date } | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
      });

      return (
        <div className="space-y-8">
          <div className="max-w-fit">
            <h3 className="text-lg font-bold mb-4">Date Range Selection</h3>
            <Calendar 
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              className="rounded-md border"
            />
            {range?.from && (
              <div className="text-sm text-muted-foreground mt-4 space-y-1">
                <p>From: <strong>{format(range.from, 'PPP')}</strong></p>
                {range.to && (
                  <p>To: <strong>{format(range.to, 'PPP')}</strong></p>
                )}
                {range.to && (
                  <p className="text-primary font-medium">
                    {Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))} days selected
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Date Range Use Cases:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Hotel/vacation booking</li>
              <li>Report date ranges</li>
              <li>Analytics periods</li>
              <li>Billing cycles</li>
              <li>Project timelines</li>
            </ul>
          </div>
        </div>
      );
    }

    return <DateRangeDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Date range selection with start and end dates displayed across two months.',
      },
    },
  },
};

/**
 * Story 3: Date Presets
 * Quick date selection with presets
 */
export const DatePresets: Story = {
  render: () => {
    function PresetsDemo() {
      const [date, setDate] = useState<Date | undefined>(new Date());

      const presets = [
        { label: 'Today', date: new Date() },
        { label: 'Tomorrow', date: addDays(new Date(), 1) },
        { label: 'In 3 days', date: addDays(new Date(), 3) },
        { label: 'In 7 days', date: addDays(new Date(), 7) },
        { label: 'In 14 days', date: addDays(new Date(), 14) },
      ];

      return (
        <div className="space-y-8">
          <div className="flex gap-6 flex-wrap">
            <div className="max-w-fit">
              <h3 className="text-lg font-bold mb-4">Date with Presets</h3>
              <Calendar 
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
              {date && (
                <p className="text-sm text-muted-foreground mt-4">
                  Selected: <strong>{format(date, 'PPP')}</strong>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Quick Select</h4>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setDate(preset.date)}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-md border ${
                    date && format(date, 'yyyy-MM-dd') === format(preset.date, 'yyyy-MM-dd')
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {preset.label}
                  <span className="block text-xs opacity-70 mt-0.5">
                    {format(preset.date, 'MMM d, yyyy')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Preset Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Faster selection for common dates</li>
              <li>Reduced clicks for users</li>
              <li>Clear relative date understanding</li>
              <li>Better UX for mobile users</li>
            </ul>
          </div>
        </div>
      );
    }

    return <PresetsDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Date picker with preset buttons for quick selection of common dates.',
      },
    },
  },
};

/**
 * Story 4: Disabled Dates
 * Prevent selection of specific dates
 */
export const DisabledDates: Story = {
  render: () => {
    function DisabledDatesDemo() {
      const [date1, setDate1] = useState<Date | undefined>();
      const [date2, setDate2] = useState<Date | undefined>();
      const [date3, setDate3] = useState<Date | undefined>();

      // Disable past dates
      const disablePast = (date: Date) => date < new Date();

      // Disable weekends
      const disableWeekends = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      };

      // Disable specific dates (holidays)
      const holidays = [
        new Date(2024, 11, 25), // Christmas
        new Date(2025, 0, 1),   // New Year
      ];
      const disableHolidays = (date: Date) => {
        return holidays.some(holiday => 
          format(holiday, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
      };

      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Disable Past Dates</h3>
            <div className="flex gap-6 flex-wrap">
              <Calendar 
                mode="single"
                selected={date1}
                onSelect={setDate1}
                disabled={disablePast}
                className="rounded-md border"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Only future dates can be selected
                </p>
                {date1 && (
                  <p className="text-sm">
                    Selected: <strong>{format(date1, 'PPP')}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Disable Weekends</h3>
            <div className="flex gap-6 flex-wrap">
              <Calendar 
                mode="single"
                selected={date2}
                onSelect={setDate2}
                disabled={disableWeekends}
                className="rounded-md border"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Weekends (Saturday & Sunday) are disabled
                </p>
                {date2 && (
                  <p className="text-sm">
                    Selected: <strong>{format(date2, 'EEEE, MMM d')}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Disable Specific Dates (Holidays)</h3>
            <div className="flex gap-6 flex-wrap">
              <Calendar 
                mode="single"
                selected={date3}
                onSelect={setDate3}
                disabled={disableHolidays}
                className="rounded-md border"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Holidays are disabled:
                </p>
                <ul className="text-sm space-y-1">
                  {holidays.map((holiday, i) => (
                    <li key={i}>• {format(holiday, 'PPP')}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 Disabled Dates Patterns:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Past dates:</strong> Booking systems, future planning</li>
              <li><strong>Weekends:</strong> Business day selection</li>
              <li><strong>Holidays:</strong> Service availability, office scheduling</li>
              <li><strong>Specific dates:</strong> Blackout dates, maintenance windows</li>
            </ul>
          </div>
        </div>
      );
    }

    return <DisabledDatesDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Examples of disabling past dates, weekends, and specific dates (holidays).',
      },
    },
  },
};

/**
 * Story 5: Min/Max Date Constraints
 * Restrict date selection to a specific range
 */
export const MinMaxDates: Story = {
  render: () => {
    function MinMaxDemo() {
      const [date1, setDate1] = useState<Date | undefined>();
      const [date2, setDate2] = useState<Date | undefined>();

      const today = new Date();
      const oneWeekFromNow = addDays(today, 7);
      const oneMonthFromNow = addDays(today, 30);

      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Next 7 Days Only</h3>
            <div className="flex gap-6 flex-wrap">
              <Calendar 
                mode="single"
                selected={date1}
                onSelect={setDate1}
                fromDate={today}
                toDate={oneWeekFromNow}
                className="rounded-md border"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Can only select dates within the next 7 days
                </p>
                <p className="text-xs text-muted-foreground">
                  From: {format(today, 'MMM d')}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  To: {format(oneWeekFromNow, 'MMM d')}
                </p>
                {date1 && (
                  <p className="text-sm">
                    Selected: <strong>{format(date1, 'PPP')}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Next 30 Days Only</h3>
            <div className="flex gap-6 flex-wrap">
              <Calendar 
                mode="single"
                selected={date2}
                onSelect={setDate2}
                fromDate={today}
                toDate={oneMonthFromNow}
                className="rounded-md border"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Can only select dates within the next 30 days
                </p>
                <p className="text-xs text-muted-foreground">
                  From: {format(today, 'MMM d')}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  To: {format(oneMonthFromNow, 'MMM d')}
                </p>
                {date2 && (
                  <p className="text-sm">
                    Selected: <strong>{format(date2, 'PPP')}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Min/Max Use Cases:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Short-term booking:</strong> Same-day or next-week only</li>
              <li><strong>Promotion periods:</strong> Limited-time offers</li>
              <li><strong>Expiration dates:</strong> Cards, subscriptions</li>
              <li><strong>Historical data:</strong> Report date ranges</li>
            </ul>
          </div>
        </div>
      );
    }

    return <MinMaxDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Restrict date selection to specific ranges using fromDate and toDate.',
      },
    },
  },
};

/**
 * Story 6: Multiple Months
 * Display multiple months side by side
 */
export const MultipleMonths: Story = {
  render: () => {
    function MultipleMonthsDemo() {
      const [range, setRange] = useState<{ from: Date; to?: Date } | undefined>();

      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Two Months (Default for Ranges)</h3>
            <Calendar 
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              className="rounded-md border"
            />
            {range?.from && range?.to && (
              <p className="text-sm text-muted-foreground mt-4">
                {format(range.from, 'MMM d')} → {format(range.to, 'MMM d, yyyy')} 
                ({Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))} days)
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Three Months</h3>
            <Calendar 
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={3}
              className="rounded-md border"
            />
          </div>

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 Multiple Months Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Better visibility for range selection</li>
              <li>Reduced navigation clicks</li>
              <li>Easier to compare dates across months</li>
              <li>Desktop-optimized experience</li>
            </ul>
          </div>
        </div>
      );
    }

    return <MultipleMonthsDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Display 2 or 3 months side by side for better range selection visibility.',
      },
    },
  },
};

/**
 * Story 7: Custom Formatting
 * Different date display formats
 */
export const CustomFormatting: Story = {
  render: () => {
    function FormattingDemo() {
      const [date, setDate] = useState<Date | undefined>(new Date());

      return (
        <div className="space-y-8">
          <div className="max-w-fit">
            <h3 className="text-lg font-bold mb-4">Calendar</h3>
            <Calendar 
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>

          {date && (
            <div>
              <h3 className="text-lg font-bold mb-4">Date Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Full Date (PPP)</p>
                  <p className="text-sm font-medium">{format(date, 'PPP')}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Short Date (P)</p>
                  <p className="text-sm font-medium">{format(date, 'P')}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">ISO Format</p>
                  <p className="text-sm font-medium">{format(date, 'yyyy-MM-dd')}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">US Format</p>
                  <p className="text-sm font-medium">{format(date, 'MM/dd/yyyy')}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Long Format</p>
                  <p className="text-sm font-medium">{format(date, 'EEEE, MMMM do, yyyy')}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Relative</p>
                  <p className="text-sm font-medium">
                    {date.toDateString() === new Date().toDateString()
                      ? 'Today'
                      : format(date, 'MMM d, yyyy')}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Month & Year</p>
                  <p className="text-sm font-medium">{format(date, 'MMMM yyyy')}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Custom</p>
                  <p className="text-sm font-medium">{format(date, 'do of MMMM, yyyy')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-2xl bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">📅 Format Recommendations:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Full (PPP):</strong> User-facing displays</li>
              <li><strong>ISO (yyyy-MM-dd):</strong> API, database storage</li>
              <li><strong>Short (P):</strong> Tables, compact displays</li>
              <li><strong>Long:</strong> Confirmation screens, important dates</li>
            </ul>
          </div>
        </div>
      );
    }

    return <FormattingDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Various date formatting options using date-fns format function.',
      },
    },
  },
};

/**
 * Story 8: Real-World Booking Example
 * Complete booking flow with calendar
 */
export const BookingExample: Story = {
  render: () => {
    function BookingDemo() {
      const [checkIn, setCheckIn] = useState<Date | undefined>();
      const [checkOut, setCheckOut] = useState<Date | undefined>();
      const [guests, setGuests] = useState(2);
      const [submitted, setSubmitted] = useState(false);

      const today = new Date();
      const maxDate = addDays(today, 365); // Can book up to 1 year in advance

      // Disable past dates and booked dates (mock)
      const bookedDates = [
        addDays(today, 5),
        addDays(today, 6),
        addDays(today, 12),
      ];

      const disableDate = (date: Date) => {
        // Past dates
        if (date < today) return true;
        
        // Booked dates
        return bookedDates.some(booked => 
          format(booked, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
      };

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      };

      const nights = checkIn && checkOut 
        ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const pricePerNight = 150;
      const total = nights * pricePerNight;

      return (
        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6 border rounded-lg p-6">
            <h3 className="text-2xl font-bold">Book Your Stay</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Check-in Date</label>
                <Calendar 
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={disableDate}
                  fromDate={today}
                  toDate={maxDate}
                  className="rounded-md border"
                />
                {checkIn && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Check-in: <strong>{format(checkIn, 'EEEE, MMM d')}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Check-out Date</label>
                <Calendar 
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) => {
                    if (disableDate(date)) return true;
                    if (!checkIn) return false;
                    return date <= checkIn; // Must be after check-in
                  }}
                  fromDate={checkIn ? addDays(checkIn, 1) : today}
                  toDate={maxDate}
                  className="rounded-md border"
                />
                {checkOut && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Check-out: <strong>{format(checkOut, 'EEEE, MMM d')}</strong>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="guests" className="text-sm font-medium mb-2 block">
                Number of Guests
              </label>
              <select 
                id="guests"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            {checkIn && checkOut && nights > 0 && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Booking Summary</h4>
                <div className="flex justify-between text-sm">
                  <span>{nights} {nights === 1 ? 'night' : 'nights'} × ${pricePerNight}</span>
                  <span>${total}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${total}</span>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!checkIn || !checkOut}
              className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!checkIn || !checkOut ? 'Select Dates' : 'Confirm Booking'}
            </button>

            {submitted && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-800 dark:text-green-200">
                ✓ Booking confirmed! Check-in: {checkIn && format(checkIn, 'MMM d')}, 
                Check-out: {checkOut && format(checkOut, 'MMM d')}, 
                Guests: {guests}, Total: ${total}
              </div>
            )}
          </form>

          <div className="mt-6 bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🏨 Booking Features:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Past dates are disabled</li>
              <li>Booked dates are shown as unavailable (mock)</li>
              <li>Check-out must be after check-in</li>
              <li>Real-time price calculation</li>
              <li>Clear booking summary</li>
            </ul>
          </div>
        </div>
      );
    }

    return <BookingDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete hotel booking example with check-in/check-out dates, guest selection, and price calculation.',
      },
    },
  },
};

/**
 * Story 9: Usage Guidelines
 * Best practices and patterns
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Calendar / Date Picker Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using calendar and date picker components effectively.
        </p>
      </div>

      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✓ Show selected date clearly
            </p>
            <p className="text-sm text-muted-foreground">
              Display formatted selected date so users can confirm
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✓ Disable invalid dates
            </p>
            <p className="text-sm text-muted-foreground">
              Prevent selection of past dates, weekends, or unavailable dates
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✓ Provide date presets
            </p>
            <p className="text-sm text-muted-foreground">
              Quick buttons for Today, Tomorrow, Next Week, etc.
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✓ Use range for bookings
            </p>
            <p className="text-sm text-muted-foreground">
              Range mode works better for check-in/check-out scenarios
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✓ Format dates appropriately
            </p>
            <p className="text-sm text-muted-foreground">
              Use full format for display, ISO for storage
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✓ Show 2 months for ranges
            </p>
            <p className="text-sm text-muted-foreground">
              Easier to select start and end dates across months
            </p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
              ✗ Don't allow invalid dates
            </p>
            <p className="text-sm text-muted-foreground">
              Always disable dates that cannot be selected
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
              ✗ Don't hide selected date
            </p>
            <p className="text-sm text-muted-foreground">
              Always show what date is currently selected
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
              ✗ Don't use for time selection
            </p>
            <p className="text-sm text-muted-foreground">
              Use separate time picker for hours/minutes
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
              ✗ Don't forget mobile users
            </p>
            <p className="text-sm text-muted-foreground">
              Ensure calendar is touch-friendly and responsive
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Single Date</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [date, setDate] = useState<Date>();

<Calendar 
  mode="single"
  selected={date}
  onSelect={setDate}
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Date Range</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [range, setRange] = useState<{from: Date; to?: Date}>();

<Calendar 
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={2}
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Disable Past Dates</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Calendar 
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={(date) => date < new Date()}
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Min/Max Dates</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Calendar 
  mode="single"
  selected={date}
  onSelect={setDate}
  fromDate={new Date()}
  toDate={addDays(new Date(), 30)}
/>`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Checklist</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Keyboard navigation</strong> - Arrow keys, Enter, Space, Page Up/Down work correctly</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>ARIA calendar role</strong> - Automatic via react-day-picker</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Date announcements</strong> - Screen readers announce selected dates</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Focus visible</strong> - Clear focus indicator on current date</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Touch-friendly</strong> - Adequate spacing between dates</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Labels</strong> - Associate label with calendar for context</p>
          </div>
        </div>
      </div>

      {/* When to Use */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">When to Use Calendar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">✓ Good Use Cases</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Booking systems (hotels, flights)</li>
              <li>Appointment scheduling</li>
              <li>Event date selection</li>
              <li>Date range reports</li>
              <li>Birthday / anniversary input</li>
              <li>Deadline selection</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-600 mb-2">✗ Poor Use Cases</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Time selection (use time picker)</li>
              <li>Very far past dates (type input better)</li>
              <li>Recurring events (need recurrence UI)</li>
              <li>Multiple disjointed dates (use list)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive guidelines with best practices, code examples, accessibility checklist, and use case guidance.',
      },
    },
  },
};
