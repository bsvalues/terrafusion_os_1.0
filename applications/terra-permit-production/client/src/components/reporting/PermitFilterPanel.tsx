import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isAfter, isBefore, isEqual, parse, startOfDay, endOfDay } from 'date-fns';
import { Permit } from '@/types';
import { Search, 
  Calendar as CalendarIcon, 
  X, 
  Filter,
  RefreshCcw
 } from '@mui/icons-material';

interface PermitFilterPanelProps {
  permits: Permit[];
  onFilteredPermitsChange: (filteredPermits: Permit[]) => void;
}

export function PermitFilterPanel({ permits, onFilteredPermitsChange }: PermitFilterPanelProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [valueRange, setValueRange] = useState<[number, number]>([0, 0]);
  const [neighborhoodCodes, setNeighborhoodCodes] = useState<Set<string>>(new Set());
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set());
  const [permitStatuses, setPermitStatuses] = useState<{
    enter: boolean;
    skip: boolean;
  }>({ enter: true, skip: true });
  
  // Initialize filter values based on permits data
  useEffect(() => {
    if (permits.length > 0) {
      // Find min and max values
      const values = permits.map(p => {
        const value = parseFloat(p.value.replace(/[^0-9.-]+/g, ""));
        return isNaN(value) ? 0 : value;
      }).filter(v => !isNaN(v) && v > 0);
      
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      
      setMinValue(minVal);
      setMaxValue(maxVal);
      setValueRange([minVal, maxVal]);
      
      // Extract unique neighborhood codes
      const uniqueNeighborhoods = new Set<string>();
      permits.forEach(p => {
        if (p.neighborhoodCode) {
          uniqueNeighborhoods.add(p.neighborhoodCode);
        }
      });
      
      setNeighborhoodCodes(uniqueNeighborhoods);
      setSelectedNeighborhoods(uniqueNeighborhoods);
    }
  }, [permits]);
  
  // Apply filters
  useEffect(() => {
    if (permits.length === 0) return;
    
    const filtered = permits.filter(permit => {
      // Search term filter
      const matchesSearchTerm = !searchTerm || 
        permit.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permit.permitDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permit.neighborhoodCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date range filter
      const permitDate = new Date(permit.issueDate);
      const matchesDateRange = (!startDate || isAfter(permitDate, startOfDay(startDate)) || isEqual(permitDate, startDate)) &&
                              (!endDate || isBefore(permitDate, endOfDay(endDate)) || isEqual(permitDate, endDate));
      
      // Value range filter
      const permitValue = parseFloat(permit.value.replace(/[^0-9.-]+/g, ""));
      const matchesValueRange = isNaN(permitValue) || 
        (permitValue >= valueRange[0] && permitValue <= valueRange[1]);
      
      // Neighborhood filter
      const matchesNeighborhood = selectedNeighborhoods.has(permit.neighborhoodCode);
      
      // Status filter
      const matchesStatus = (permit.enterPermit && permitStatuses.enter) || 
                          (!permit.enterPermit && permitStatuses.skip);
      
      return matchesSearchTerm && matchesDateRange && matchesValueRange && 
             matchesNeighborhood && matchesStatus;
    });
    
    onFilteredPermitsChange(filtered);
  }, [
    permits, 
    searchTerm, 
    startDate, 
    endDate, 
    valueRange, 
    selectedNeighborhoods, 
    permitStatuses,
    onFilteredPermitsChange
  ]);
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setValueRange([minValue, maxValue]);
    setSelectedNeighborhoods(neighborhoodCodes);
    setPermitStatuses({ enter: true, skip: true });
  };
  
  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Toggle neighborhood selection
  const toggleNeighborhood = (code: string) => {
    const newSelection = new Set(selectedNeighborhoods);
    if (newSelection.has(code)) {
      newSelection.delete(code);
    } else {
      newSelection.add(code);
    }
    setSelectedNeighborhoods(newSelection);
  };
  
  // Select/deselect all neighborhoods
  const toggleAllNeighborhoods = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedNeighborhoods(neighborhoodCodes);
    } else {
      setSelectedNeighborhoods(new Set());
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search filter */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Date range filter */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><>

            <Label htmlFor="start-date" className="text-xs">Start Date</Label>
            <Popover
</>>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-xs h-9"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {startDate ? format(startDate, 'MM/dd/yyyy') : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-1"><>

            <Label htmlFor="end-date" className="text-xs">End Date</Label>
            <Popover
</>>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-xs h-9"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {endDate ? format(endDate, 'MM/dd/yyyy') : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Value range filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center"><>

            <Label className="text-xs">Permit Value Range</Label>
            <span
</> className="text-xs text-muted-foreground">
              {formatCurrency(valueRange[0])} - {formatCurrency(valueRange[1])}
            </span>
          </div>
          <Slider
            defaultValue={[minValue, maxValue]}
            value={valueRange}
            min={minValue}
            max={maxValue}
            step={(maxValue - minValue) / 100}
            onValueChange={(value) => setValueRange(value as [number, number])}
            className="my-6"
          />
        </div>
        
        {/* Status filter */}
        <div className="space-y-2"><>

          <Label className="text-xs">Permit Status</Label>
          <div
</> className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="status-enter" 
                checked={permitStatuses.enter} 
                onCheckedChange={checked => setPermitStatuses({...permitStatuses, enter: checked as boolean})}
              />
              <label
                htmlFor="status-enter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enter Permits
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="status-skip" 
                checked={permitStatuses.skip} 
                onCheckedChange={checked => setPermitStatuses({...permitStatuses, skip: checked as boolean})}
              />
              <label
                htmlFor="status-skip"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Skip Permits
              </label>
            </div>
          </div>
        </div>
        
        {/* Neighborhood filter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center"><>

            <Label className="text-xs">Neighborhoods</Label>
            <div
</> className="space-x-2"><>

              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => toggleAllNeighborhoods(true)}
              >
                Select All
              </Button>
              <Button
</> 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => toggleAllNeighborhoods(false)}
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
            {Array.from(neighborhoodCodes).map(code => (
              <div key={code} className="flex items-center space-x-2">
                <Checkbox 
                  id={`neighborhood-${code}`} 
                  checked={selectedNeighborhoods.has(code)} 
                  onCheckedChange={() => toggleNeighborhood(code)}
                />
                <label
                  htmlFor={`neighborhood-${code}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {code}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Reset all filters */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center justify-center"
          onClick={resetFilters}
        >
          <RefreshCcw className="h-3 w-3 mr-2" />
          Reset All Filters
        </Button>
      </CardContent>
    </Card>
  );
}

export default PermitFilterPanel;