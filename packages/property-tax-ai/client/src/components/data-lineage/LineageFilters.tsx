import * as React from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MultiSelect } from '@/components/multi-select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LineageFiltersState {
  startDate?: Date;
  endDate?: Date;
  sources?: string[];
  fields?: string[];
  users?: number[];
}

interface LineageFiltersProps {
  availableSources?: string[];
  availableFields?: string[];
  availableUsers?: { id: number; name: string }[];
  onChange: (filters: LineageFiltersState) => void;
  value: LineageFiltersState;
}

export function LineageFilters({
  availableSources = [],
  availableFields = [],
  availableUsers = [],
  onChange,
  value,
}: LineageFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [filters, setFilters] = React.useState<LineageFiltersState>(value || {});
  
  // Update filters when external value changes
  React.useEffect(() => {
    setFilters(value || {});
  }, [value]);
  
  // Handle filter changes and notify parent
  const handleFilterChange = (newFilters: Partial<LineageFiltersState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onChange(updatedFilters);
  };
  
  // Clear all filters
  const handleClearAll = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onChange(clearedFilters);
  };
  
  // Format date range for display
  const dateRangeText = React.useMemo(() => {
    if (filters.startDate && filters.endDate) {
      return `${format(filters.startDate, 'PP')} - ${format(filters.endDate, 'PP')}`;
    }
    if (filters.startDate) {
      return `From ${format(filters.startDate, 'PP')}`;
    }
    if (filters.endDate) {
      return `Until ${format(filters.endDate, 'PP')}`;
    }
    return 'All time';
  }, [filters.startDate, filters.endDate]);
  
  // Count applied filters
  const appliedFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.sources?.length) count++;
    if (filters.fields?.length) count++;
    if (filters.users?.length) count++;
    return count;
  }, [filters]);
  
  return (
    <Card className="mb-6">
      <CardHeader className="py-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {appliedFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {appliedFilterCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={cn(
        "grid grid-rows-[0fr] transition-all duration-300",
        isExpanded && "grid-rows-[1fr]"
      )}>
        <div className="overflow-hidden">
          <div className="space-y-6 pb-3">
            {/* Date Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Date Range</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ startDate: undefined, endDate: undefined })}
                  disabled={!filters.startDate && !filters.endDate}
                  className="h-8 px-2 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] mt-1 justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, 'PPP') : 'Pick a start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => handleFilterChange({ startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] mt-1 justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, 'PPP') : 'Pick an end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => handleFilterChange({ endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Data Sources */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Data Sources</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ sources: undefined })}
                  disabled={!filters.sources?.length}
                  className="h-8 px-2 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
              <MultiSelect
                options={availableSources.map(source => ({
                  label: source.charAt(0).toUpperCase() + source.slice(1),
                  value: source,
                }))}
                placeholder="Select sources..."
                selected={filters.sources || []}
                onChange={(selected) => handleFilterChange({ sources: selected })}
                className="w-full"
              />
            </div>
            
            <Separator />
            
            {/* Field Names */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ fields: undefined })}
                  disabled={!filters.fields?.length}
                  className="h-8 px-2 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
              <MultiSelect
                options={availableFields.map(field => ({
                  label: field,
                  value: field,
                }))}
                placeholder="Select fields..."
                selected={filters.fields || []}
                onChange={(selected) => handleFilterChange({ fields: selected })}
                className="w-full"
              />
            </div>
            
            <Separator />
            
            {/* Users */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Users</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ users: undefined })}
                  disabled={!filters.users?.length}
                  className="h-8 px-2 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
              <MultiSelect
                options={availableUsers.map(user => ({
                  label: user.name || `User #${user.id}`,
                  value: user.id.toString(),
                }))}
                placeholder="Select users..."
                selected={filters.users?.map(u => u.toString()) || []}
                onChange={(selected) => handleFilterChange({ 
                  users: selected.map(s => parseInt(s, 10)) 
                })}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClearAll}
                disabled={appliedFilterCount === 0}
              >
                Clear all filters
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}