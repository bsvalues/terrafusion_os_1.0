import React, { forwardRef, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon  } from '@mui/icons-material';

/**
 * Table variants using class-variance-authority
 */
const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: '',
      striped: 'table-striped',
      bordered: 'table-bordered',
      borderless: 'table-borderless',
      compact: 'table-compact',
    },
    hover: {
      true: 'table-hover',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    hover: true,
  },
});

export interface ColumnSortState {
  /**
   * ID of the column being sorted
   */
  columnId: string;
  /**
   * Sort direction
   */
  direction: 'asc' | 'desc';
}

export interface TableProps
  extends HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  /**
   * Whether table should be full width
   */
  fullWidth?: boolean;
  /**
   * Whether to enable sticky headers
   */
  stickyHeader?: boolean;
  /**
   * Current sort state for the table
   */
  sortState?: ColumnSortState;
  /**
   * Handler for sort changes
   */
  onSort?: (columnId: string) => void;
}

/**
 * Table component
 *
 * A table component for displaying tabular data with sorting support.
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Email</TableHead>
 *       <TableHead>Status</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>John Doe</TableCell>
 *       <TableCell>john@example.com</TableCell>
 *       <TableCell>Active</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    { className, variant, hover, fullWidth, stickyHeader, sortState, onSort, children, ...props },
    ref
  ) => {
    return (
      <div
        className={cn('relative w-full overflow-auto', fullWidth ? '' : 'max-w-full', className)}
      >
        <table ref={ref} className={cn(tableVariants({ variant, hover }))} {...props}>
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Custom class to apply to the header
   */
  className?: string;
}

/**
 * TableHeader component
 */
export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-muted/50', className)} {...props} />
  )
);

TableHeader.displayName = 'TableHeader';

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Custom class to apply to the body
   */
  className?: string;
}

/**
 * TableBody component
 */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />
);

TableBody.displayName = 'TableBody';

interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Custom class to apply to the footer
   */
  className?: string;
}

/**
 * TableFooter component
 */
export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-muted/50 font-medium', className)} {...props} />
  )
);

TableFooter.displayName = 'TableFooter';

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /**
   * Custom class to apply to the row
   */
  className?: string;
}

/**
 * TableRow component
 */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Custom class to apply to the header cell
   */
  className?: string;
  /**
   * Whether the column is sortable
   */
  sortable?: boolean;
  /**
   * Column ID for sorting
   */
  columnId?: string;
  /**
   * Current sort direction if this column is being sorted
   */
  sortDirection?: 'asc' | 'desc' | null;
  /**
   * Handler for sort changes
   */
  onSort?: () => void;
}

/**
 * TableHead component
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, columnId, sortDirection, onSort, children, ...props }, ref) => {
    const handleSort = () => {
      if (sortable && onSort) {
        onSort();
      }
    };

    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
          sortable && 'cursor-pointer select-none',
          className
        )}
        onClick={sortable ? handleSort : undefined}
        {...props}
      >
        {sortable ? (
          <div className="flex items-center gap-1">
            <span>{children}</span>
            {sortDirection === 'asc' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : sortDirection === 'desc' ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : (
              <ArrowUpDownIcon className="h-4 w-4 opacity-50" />
            )}
          </div>
        ) : (
          children
        )}
      </th>
    );
  }
);

TableHead.displayName = 'TableHead';

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Custom class to apply to the cell
   */
  className?: string;
  /**
   * Whether the cell should be truncated
   */
  truncate?: boolean;
  /**
   * Whether the cell contains numeric data
   */
  numeric?: boolean;
}

/**
 * TableCell component
 */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, truncate, numeric, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle',
        truncate && 'max-w-[150px] truncate',
        numeric && 'text-right tabular-nums',
        className
      )}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {
  /**
   * Custom class to apply to the caption
   */
  className?: string;
}

/**
 * TableCaption component
 */
export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
  )
);

TableCaption.displayName = 'TableCaption';

// Additional CSS for the table variants
const tableStyles = `
  .table-striped tbody tr:nth-of-type(odd) {
    background-color: hsl(var(--muted) / 0.3);
  }
  
  .table-bordered {
    border: 1px solid hsl(var(--border));
  }
  
  .table-bordered th,
  .table-bordered td {
    border: 1px solid hsl(var(--border));
  }
  
  .table-borderless th,
  .table-borderless td,
  .table-borderless thead th,
  .table-borderless tbody + tbody {
    border: 0;
  }
  
  .table-compact th,
  .table-compact td {
    padding: 0.5rem;
  }
  
  .table-hover tbody tr:hover {
    background-color: hsl(var(--muted) / 0.5);
  }
`;

// Insert the styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = tableStyles;
  document.head.appendChild(styleElement);
}

// Export components (already exported above)
