import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  displayLimit?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items',
  className,
  disabled = false,
  displayLimit = 3,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  
  // Handler for selecting/deselecting an option
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  
  // Handler for removing a selected item via badge
  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };
  
  // Handler for clearing all selected items
  const handleClear = () => {
    onChange([]);
    setOpen(false);
  };
  
  // Get labels for the selected values
  const selectedLabels = selected.map((value) => {
    const option = options.find((option) => option.value === value);
    return option ? option.label : value;
  });
  
  // Generate display text for the trigger button
  const displayText = React.useMemo(() => {
    if (selected.length === 0) {
      return placeholder;
    }
    
    if (selected.length <= displayLimit) {
      return selectedLabels.join(', ');
    }
    
    return `${selectedLabels.slice(0, displayLimit).join(', ')} and ${
      selected.length - displayLimit
    } more`;
  }, [selected, selectedLabels, placeholder, displayLimit]);
  
  return (
    <div className={cn('relative', className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search items..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selected.length > 0 && (
                <div className="border-t px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={handleClear}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((value) => {
            const label = options.find((option) => option.value === value)?.label || value;
            return (
              <Badge key={value} variant="secondary" className="px-2 py-1 text-xs">
                {label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(value)}
                  className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {label}</span>
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}