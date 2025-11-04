import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Refresh, Search, Plus  } from '@mui/icons-material';
import { Input } from "@/components/ui/input";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => any);
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  emptyState?: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onAdd?: () => void;
  addButtonText?: string;
  keyExtractor?: (item: T) => string | number;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  onRetry,
  className,
  emptyState,
  searchPlaceholder = "Search...",
  onSearch,
  onAdd,
  addButtonText = "Add New",
  keyExtractor = (item: any) => item.id,
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const renderAccessor = (row: T, accessor: keyof T | ((row: T) => any)) => {
    if (typeof accessor === "function") {
      return accessor(row);
    }
    return row[accessor];
  };

  const renderEmptyState = () => {
    if (emptyState) {
      return emptyState;
    }

    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No data available</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load data"
        message={error}
        onRetry={onRetry}
        severity="error"
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(onSearch || onAdd) && (
        <div className="flex items-center justify-between gap-4">
          {onSearch && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          )}
          {onAdd && (
            <Button onClick={onAdd} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          )}
        </div>
      )}

      <LoadingState
        isLoading={isLoading}
        loadingText="Loading data..."
        variant={isLoading && data.length === 0 ? "skeleton" : "overlay"}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column /* , index */) => (
                  <TableHead key={index} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24">
                    {renderEmptyState()}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={keyExtractor(row)}
                    className={cn(onRowClick ? "cursor-pointer hover:bg-muted/50" : "")}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column, columnIndex) => (
                      <TableCell key={columnIndex} className={column.className}>
                        {column.cell ? column.cell(row) : renderAccessor(row, column.accessorKey)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LoadingState>
    </div>
  );
}
