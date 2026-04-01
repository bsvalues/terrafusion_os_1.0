/**
 * Date Range Picker
 * 
 * A date range picker component using DayPicker and Popover.
 * Allows selection of a date range.
 */

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  // Update date when value changes
  React.useEffect(() => {
    setDate(value);
  }, [value]);

  // Update value when date changes
  React.useEffect(() => {
    if (date?.from && (!value?.from || date.from !== value.from || date.to !== value.to)) {
      onChange(date);
    }
  }, [date, onChange, value]);

  // Format the date range as a string
  const formatDateRange = () => {
    if (!date?.from) return "Select date range";
    
    if (date.to) {
      return `${format(date.from, "MMM d, yyyy")} - ${format(date.to, "MMM d, yyyy")}`;
    }

    return format(date.from, "MMM d, yyyy");
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}