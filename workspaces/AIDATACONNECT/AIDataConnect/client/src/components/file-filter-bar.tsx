import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FileFilterBarProps {
  onFilterChange: (filters: FileFilters) => void;
  categories: string[];
  fileTypes: string[];
}

export interface FileFilters {
  type?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeRange?: string;
  searchTerm?: string;
}

export function FileFilterBar({ onFilterChange, categories, fileTypes }: FileFilterBarProps) {
  const [filters, setFilters] = useState<FileFilters>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Size range options
  const sizeRanges = [
    { value: "small", label: "Small (<1MB)" },
    { value: "medium", label: "Medium (1-10MB)" },
    { value: "large", label: "Large (10-100MB)" },
    { value: "xlarge", label: "Very Large (>100MB)" },
  ];

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
    
    // Update active filters list for display
    const active: string[] = [];
    if (filters.type) active.push(`Type: ${filters.type}`);
    if (filters.category) active.push(`Category: ${filters.category}`);
    if (filters.sizeRange) active.push(`Size: ${sizeRanges.find(r => r.value === filters.sizeRange)?.label}`);
    if (filters.dateFrom) active.push(`From: ${format(filters.dateFrom, "PPP")}`);
    if (filters.dateTo) active.push(`To: ${format(filters.dateTo, "PPP")}`);
    
    setActiveFilters(active);
  }, [filters, onFilterChange]);

  const clearAllFilters = () => {
    setFilters({});
  };

  const removeFilter = (filterIndex: number) => {
    const filterKeys = Object.keys(filters) as Array<keyof FileFilters>;
    const active = activeFilters.map((f, i) => i === filterIndex ? 
      f.split(":")[0].trim().toLowerCase() : null).filter(Boolean) as string[];
    
    const updatedFilters = { ...filters };
    
    // Match active filter with filter key and remove it
    filterKeys.forEach(key => {
      const keyStr = key.toString();
      if (active.some(a => keyStr.includes(a) || 
          (a === "from" && keyStr === "dateFrom") || 
          (a === "to" && keyStr === "dateTo") ||
          (a === "size" && keyStr === "sizeRange"))) {
        delete updatedFilters[key];
      }
    });
    
    setFilters(updatedFilters);
  };

  return (
    <div className="w-full bg-card rounded-md p-3 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Filters</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          {isOpen ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {activeFilters.map((filter, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {filter}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter(index)}
              />
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={clearAllFilters}
            >
              Clear all
            </Badge>
          )}
        </div>
      )}

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* File Type filter */}
          <div>
            <Select 
              value={filters.type || ""} 
              onValueChange={(value) => setFilters({...filters, type: value || undefined})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any type</SelectItem>
                {fileTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category filter */}
          <div>
            <Select 
              value={filters.category || ""} 
              onValueChange={(value) => setFilters({...filters, category: value || undefined})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Range filter */}
          <div>
            <Select 
              value={filters.sizeRange || ""} 
              onValueChange={(value) => setFilters({...filters, sizeRange: value || undefined})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any size</SelectItem>
                {sizeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From filter */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => setFilters({...filters, dateFrom: date || undefined})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To filter */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => setFilters({...filters, dateTo: date || undefined})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={clearAllFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}