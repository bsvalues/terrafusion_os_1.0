// File filter bar component for filtering files

export interface FileFilters {type?: string;
  category?: string;
  dateRange?: [Date?, Date?];
  sizeRange?: string;
  dateFrom?: Date;
  dateTo?: Date;}

export interface FileFilterBarProps {filters: FileFilters;
  onFiltersChange: (filters: FileFilters) =>void;
  categories: string[];
  fileTypes: string[];}

export function FileFilterBar({filters, onFiltersChange}: FileFilterBarProps) {
  return (<div className="flex gap-4 p-4 border rounded-lg"><div><label className="block text-sm font-medium">Type</label><select
          value={filters.type || ''}
          onChange={e => onFiltersChange({ ...filters, type: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300"
        ><option value="">All Types</option><option value="image">Images</option><option value="document">Documents</option><option value="video">Videos</option></select></div></div>
  );
}
