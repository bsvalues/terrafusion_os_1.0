import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Input } from './input';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';

/**
 * # Table Component
 * 
 * A semantic, accessible table component built on HTML table elements with Tailwind styling.
 * Provides a complete set of table sub-components for structured data display.
 * 
 * ## Architecture
 * 
 * ### Component Structure
 * ```
 * Table (wrapper with overflow)
 * ├── TableCaption (optional description)
 * ├── TableHeader (thead wrapper)
 * │   └── TableRow
 * │       └── TableHead (th cells)
 * ├── TableBody (tbody wrapper)
 * │   └── TableRow
 * │       └── TableCell (td cells)
 * └── TableFooter (tfoot wrapper)
 *     └── TableRow
 *         └── TableCell
 * ```
 * 
 * ### Sub-Components
 * 
 * - **Table**: Root container with responsive overflow scrolling
 * - **TableHeader**: Semantic `<thead>` with bottom border on rows
 * - **TableBody**: Semantic `<tbody>` with hover states on rows
 * - **TableFooter**: Semantic `<tfoot>` with muted background for totals/summaries
 * - **TableRow**: Semantic `<tr>` with hover effects and selection state support (`data-state="selected"`)
 * - **TableHead**: Semantic `<th>` for column headers with muted text color
 * - **TableCell**: Semantic `<td>` for data cells with consistent padding
 * - **TableCaption**: Semantic `<caption>` for table description (placed after table)
 * 
 * ## Features
 * 
 * ### Built-in Capabilities
 * - ✅ Semantic HTML table structure
 * - ✅ Responsive horizontal scrolling
 * - ✅ Row hover states
 * - ✅ Selection state support (`data-state="selected"`)
 * - ✅ Checkbox alignment helpers
 * - ✅ Footer for totals/summaries
 * - ✅ Caption for accessibility
 * 
 * ### Common Patterns (via composition)
 * - ✅ Sortable columns (add click handlers + icons)
 * - ✅ Filtering (add search inputs)
 * - ✅ Pagination (add page controls)
 * - ✅ Row selection (add checkboxes)
 * - ✅ Expandable rows (add nested tables)
 * - ✅ Fixed headers (CSS `position: sticky`)
 * 
 * ## Design Tokens
 * 
 * ### Colors
 * - Header text: `text-muted-foreground`
 * - Row borders: `border-b`
 * - Row hover: `hover:bg-muted/50`
 * - Selected row: `data-[state=selected]:bg-muted`
 * - Footer background: `bg-muted/50`
 * 
 * ### Spacing
 * - Cell padding: `p-2` (8px)
 * - Header height: `h-10` (40px)
 * - Header padding: `px-2` (8px horizontal)
 * 
 * ## Accessibility
 * 
 * ### ARIA Support
 * - Semantic table elements (`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`)
 * - `<caption>` for table description
 * - `<th scope="col">` for column headers
 * - Checkbox role detection for proper alignment
 * 
 * ### Keyboard Navigation
 * - Tab: Navigate through interactive cells (checkboxes, buttons, links)
 * - Arrow keys: Screen readers navigate cells
 * - Enter/Space: Activate interactive elements
 * 
 * ### Screen Reader Support
 * - Table structure announced properly
 * - Column headers associated with data cells
 * - Row/column counts announced
 * - Caption read before table content
 * 
 * ## Examples
 * 
 * The following stories demonstrate:
 * 
 * 1. **Basic Table**: Simple data table with headers and rows
 * 2. **Sortable Columns**: Click column headers to sort ascending/descending
 * 3. **Filtering**: Search box to filter rows by text content
 * 4. **Pagination**: Page size selector and navigation controls
 * 5. **Row Selection**: Checkboxes for selecting multiple rows
 * 6. **Expandable Rows**: Click rows to reveal nested detail data
 * 7. **Fixed Headers**: Sticky column headers during vertical scroll
 * 8. **Usage Guidelines**: Best practices, do's/don'ts, and code examples
 */
const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A semantic table component for displaying structured data with support for sorting, filtering, pagination, and row selection.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
interface Invoice {
  id: string;
  status: 'paid' | 'pending' | 'failed';
  amount: number;
  customer: string;
  date: string;
}

const invoices: Invoice[] = [
  { id: 'INV-001', status: 'paid', amount: 250.00, customer: 'Alice Johnson', date: '2024-01-15' },
  { id: 'INV-002', status: 'pending', amount: 150.00, customer: 'Bob Smith', date: '2024-01-16' },
  { id: 'INV-003', status: 'failed', amount: 350.00, customer: 'Carol Williams', date: '2024-01-17' },
  { id: 'INV-004', status: 'paid', amount: 450.00, customer: 'David Brown', date: '2024-01-18' },
  { id: 'INV-005', status: 'paid', amount: 550.00, customer: 'Eve Davis', date: '2024-01-19' },
  { id: 'INV-006', status: 'pending', amount: 200.00, customer: 'Frank Miller', date: '2024-01-20' },
  { id: 'INV-007', status: 'paid', amount: 300.00, customer: 'Grace Wilson', date: '2024-01-21' },
  { id: 'INV-008', status: 'failed', amount: 175.00, customer: 'Henry Moore', date: '2024-01-22' },
  { id: 'INV-009', status: 'paid', amount: 425.00, customer: 'Ivy Taylor', date: '2024-01-23' },
  { id: 'INV-010', status: 'pending', amount: 275.00, customer: 'Jack Anderson', date: '2024-01-24' },
  { id: 'INV-011', status: 'paid', amount: 325.00, customer: 'Kate Thomas', date: '2024-01-25' },
  { id: 'INV-012', status: 'paid', amount: 500.00, customer: 'Leo Jackson', date: '2024-01-26' },
];

const statusBadge = (status: Invoice['status']) => {
  const colors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/**
 * ## Basic Table
 * 
 * Simple data table with headers, rows, and a footer for totals. Demonstrates core table structure.
 * 
 * ### Use Cases
 * - Invoice lists
 * - Transaction histories
 * - User directories
 * - Product catalogs
 * - Any structured tabular data
 * 
 * ### Features
 * - Semantic HTML table structure
 * - Responsive horizontal scrolling
 * - Row hover states
 * - Footer row for totals
 * - Caption for accessibility
 */
export const BasicTable: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 5).map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{statusBadge(invoice.status)}</TableCell>
            <TableCell>{invoice.customer}</TableCell>
            <TableCell>{invoice.date}</TableCell>
            <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell className="text-right">
            ${invoices.slice(0, 5).reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

/**
 * ## Sortable Columns
 * 
 * Click column headers to sort data ascending or descending. Shows sort direction with icons.
 * 
 * ### Implementation
 * ```tsx
 * const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
 * 
 * const handleSort = (key: string) => {
 *   setSortConfig(prev => {
 *     if (!prev || prev.key !== key) return { key, direction: 'asc' };
 *     if (prev.direction === 'asc') return { key, direction: 'desc' };
 *     return null; // Reset to unsorted
 *   });
 * };
 * 
 * const sortedData = sortConfig
 *   ? [...data].sort((a, b) => {
 *       if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
 *       if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
 *       return 0;
 *     })
 *   : data;
 * ```
 * 
 * ### Use Cases
 * - Sorting by date (newest/oldest first)
 * - Sorting by amount (highest/lowest first)
 * - Sorting alphabetically (A-Z/Z-A)
 * - Multi-column sorting priority
 */
export const SortableColumns: Story = {
  render: () => {
    type SortKey = keyof Invoice;
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: SortKey) => {
      setSortConfig(prev => {
        if (!prev || prev.key !== key) return { key, direction: 'asc' };
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      });
    };

    const sortedInvoices = sortConfig
      ? [...invoices].sort((a, b) => {
          const aVal = a[sortConfig.key];
          const bVal = b[sortConfig.key];
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        })
      : invoices;

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
      if (!sortConfig || sortConfig.key !== columnKey) {
        return <ChevronsUpDown className="ml-2 h-4 w-4" />;
      }
      return sortConfig.direction === 'asc' ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronDown className="ml-2 h-4 w-4" />
      );
    };

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Click column headers to sort. Click again to reverse sort, or a third time to reset.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort('id')}
                >
                  Invoice
                  <SortIcon columnKey="id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <SortIcon columnKey="status" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort('customer')}
                >
                  Customer
                  <SortIcon columnKey="customer" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort('date')}
                >
                  Date
                  <SortIcon columnKey="date" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  <SortIcon columnKey="amount" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{statusBadge(invoice.status)}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

/**
 * ## Filtering
 * 
 * Search box to filter table rows by text content across all columns.
 * 
 * ### Implementation
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * 
 * const filteredData = data.filter(row =>
 *   Object.values(row).some(value =>
 *     String(value).toLowerCase().includes(searchQuery.toLowerCase())
 *   )
 * );
 * ```
 * 
 * ### Use Cases
 * - Search invoices by customer name
 * - Filter products by category
 * - Find transactions by date range
 * - Search users by email/name
 * 
 * ### Enhancement Ideas
 * - Column-specific filters (dropdown per column)
 * - Date range pickers
 * - Multi-select filters (status: [paid, pending])
 * - Advanced filter builder (AND/OR logic)
 */
export const Filtering: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInvoices = invoices.filter(invoice =>
      Object.values(invoice).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredInvoices.length} of {invoices.length} invoices
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{statusBadge(invoice.status)}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                  No invoices found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  },
};

/**
 * ## Pagination
 * 
 * Page size selector and navigation controls for large datasets. Shows current page info.
 * 
 * ### Implementation
 * ```tsx
 * const [page, setPage] = useState(1);
 * const [pageSize, setPageSize] = useState(10);
 * 
 * const totalPages = Math.ceil(data.length / pageSize);
 * const startIndex = (page - 1) * pageSize;
 * const paginatedData = data.slice(startIndex, startIndex + pageSize);
 * ```
 * 
 * ### Use Cases
 * - Large invoice lists (100+ items)
 * - Product catalogs (1000+ items)
 * - User directories
 * - Transaction histories
 * 
 * ### Features
 * - Page size selector (10, 25, 50, 100)
 * - First/Previous/Next/Last buttons
 * - Current page indicator
 * - Total items count
 * - Disabled states for boundary pages
 */
export const Pagination: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const totalPages = Math.ceil(invoices.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedInvoices = invoices.slice(startIndex, startIndex + pageSize);

    const handlePageSizeChange = (value: string) => {
      setPageSize(Number(value));
      setPage(1); // Reset to first page
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, invoices.length)} of {invoices.length} results
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{statusBadge(invoice.status)}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Page</span>
            <span className="font-medium">{page}</span>
            <span className="text-muted-foreground">of</span>
            <span className="font-medium">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * ## Row Selection
 * 
 * Checkboxes for selecting individual rows or all rows at once. Shows selected count.
 * 
 * ### Implementation
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 * 
 * const toggleRow = (id: string) => {
 *   setSelectedIds(prev => {
 *     const next = new Set(prev);
 *     if (next.has(id)) next.delete(id);
 *     else next.add(id);
 *     return next;
 *   });
 * };
 * 
 * const toggleAll = () => {
 *   setSelectedIds(prev =>
 *     prev.size === data.length ? new Set() : new Set(data.map(item => item.id))
 *   );
 * };
 * ```
 * 
 * ### Use Cases
 * - Bulk invoice deletion
 * - Multi-select exports
 * - Batch status updates
 * - Group email sending
 * 
 * ### Features
 * - Select all checkbox (indeterminate when partial)
 * - Individual row checkboxes
 * - Selected count indicator
 * - Visual feedback on selected rows (`data-state="selected"`)
 * - Bulk action buttons
 */
export const RowSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    const toggleAll = () => {
      setSelectedIds(prev =>
        prev.size === invoices.length ? new Set() : new Set(invoices.map(inv => inv.id))
      );
    };

    const isAllSelected = selectedIds.size === invoices.length && invoices.length > 0;
    const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < invoices.length;

    const selectedTotal = invoices
      .filter(inv => selectedIds.has(inv.id))
      .reduce((sum, inv) => sum + inv.amount, 0);

    return (
      <div className="space-y-4">
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="text-sm font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? 'invoice' : 'invoices'} selected
              {selectedIds.size > 0 && (
                <span className="ml-2 text-muted-foreground">
                  (Total: ${selectedTotal.toFixed(2)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Export Selected</Button>
              <Button variant="outline" size="sm">Mark as Paid</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all invoices"
                  className={isPartiallySelected ? 'data-[state=checked]:bg-primary' : ''}
                  {...(isPartiallySelected && { 'data-indeterminate': true })}
                />
              </TableHead>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                data-state={selectedIds.has(invoice.id) ? 'selected' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(invoice.id)}
                    onCheckedChange={() => toggleRow(invoice.id)}
                    aria-label={`Select invoice ${invoice.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{statusBadge(invoice.status)}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

/**
 * ## Expandable Rows
 * 
 * Click rows to expand and reveal additional nested detail data. Useful for master-detail views.
 * 
 * ### Implementation
 * ```tsx
 * const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
 * 
 * const toggleRow = (id: string) => {
 *   setExpandedIds(prev => {
 *     const next = new Set(prev);
 *     if (next.has(id)) next.delete(id);
 *     else next.add(id);
 *     return next;
 *   });
 * };
 * ```
 * 
 * ### Use Cases
 * - Invoice line items (expand to show products)
 * - Order details (expand to show items)
 * - User activity logs (expand to show events)
 * - Project tasks (expand to show subtasks)
 * 
 * ### Features
 * - Click anywhere on row to toggle expansion
 * - Chevron icon indicates expandable state
 * - Nested table or content in expanded row
 * - Smooth expand/collapse animation
 * - Visual indicator for expanded rows
 */
export const ExpandableRows: Story = {
  render: () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
      setExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    // Sample line items for expanded view
    const getLineItems = (invoiceId: string) => [
      { id: 1, description: 'Product A', quantity: 2, price: 50 },
      { id: 2, description: 'Product B', quantity: 1, price: 75 },
      { id: 3, description: 'Service Fee', quantity: 1, price: 25 },
    ];

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Click on any row to expand and see line item details.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.slice(0, 5).map((invoice) => {
              const isExpanded = expandedIds.has(invoice.id);
              return (
                <>
                  <TableRow
                    key={invoice.id}
                    onClick={() => toggleRow(invoice.id)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{statusBadge(invoice.status)}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${invoice.id}-details`}>
                      <TableCell colSpan={6} className="bg-muted/30 p-0">
                        <div className="p-4">
                          <h4 className="text-sm font-medium mb-2">Line Items</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getLineItems(invoice.id).map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  },
};

/**
 * ## Fixed Headers
 * 
 * Table headers remain visible when scrolling vertically through large datasets.
 * 
 * ### Implementation
 * ```tsx
 * <div className="relative h-[400px] overflow-auto">
 *   <Table>
 *     <TableHeader className="sticky top-0 bg-background z-10">
 *       ...Headers here...
 *     </TableHeader>
 *     ...Body with many rows...
 *   </Table>
 * </div>
 * ```
 * 
 * ### Use Cases
 * - Long data tables (50+ rows)
 * - Financial reports
 * - Inventory lists
 * - Transaction logs
 * 
 * ### CSS Requirements
 * - Parent container with fixed height and `overflow-auto`
 * - `position: sticky` on TableHeader
 * - `top: 0` to stick to top edge
 * - `background` color to cover scrolled content
 * - `z-index` to ensure headers stay above rows
 */
export const FixedHeaders: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Scroll down to see the table headers remain fixed at the top.
      </div>
      <div className="relative h-[400px] overflow-auto border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{statusBadge(invoice.status)}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  ),
};

/**
 * ## Usage Guidelines
 * 
 * ### ✅ Do's
 * 
 * 1. **Use semantic table structure**: Always use proper TableHeader/TableBody/TableFooter hierarchy
 *    ```tsx
 *    <Table>
 *      <TableHeader>
 *        <TableRow>
 *          <TableHead>Column 1</TableHead>
 *        </TableRow>
 *      </TableHeader>
 *      <TableBody>
 *        <TableRow>
 *          <TableCell>Data</TableCell>
 *        </TableRow>
 *      </TableBody>
 *    </Table>
 *    ```
 * 
 * 2. **Include TableCaption for accessibility**: Describe table purpose for screen readers
 *    ```tsx
 *    <Table>
 *      <TableCaption>A list of recent customer invoices and their payment status.</TableCaption>
 *      ...content...
 *    </Table>
 *    ```
 * 
 * 3. **Use TableFooter for totals/summaries**: Display aggregate data in footer row
 *    ```tsx
 *    <TableFooter>
 *      <TableRow>
 *        <TableCell colSpan=3>Total</TableCell>
 *        <TableCell className="text-right">$2,500.00</TableCell>
 *      </TableRow>
 *    </TableFooter>
 *    ```
 * 
 * 4. **Add loading states**: Show skeleton rows or spinner while data loads
 *    ```tsx
 *    isLoading ? (
 *      <TableBody>
 *        [...Array(5)].map((_, i) => (
 *          <TableRow key=i>
 *            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
 *          </TableRow>
 *        ))
 *      </TableBody>
 *    ) : (
 *      <TableBody>...actual data...</TableBody>
 *    )
 *    ```
 * 
 * 5. **Provide empty states**: Show helpful message when no data available
 *    ```tsx
 *    data.length === 0 ? (
 *      <TableRow>
 *        <TableCell colSpan=5 className="text-center h-24">
 *          No invoices found. <Button variant="link">Create your first invoice</Button>
 *        </TableCell>
 *      </TableRow>
 *    ) : (
 *      data.map(...render rows...)
 *    )
 *    ```
 * 
 * 6. **Right-align numeric columns**: Use `className="text-right"` for amounts, quantities, percentages
 *    ```tsx
 *    <TableCell className="text-right">${amount.toFixed(2)}</TableCell>
 *    ```
 * 
 * ### ❌ Don'ts
 * 
 * 1. **Don't use tables for layout**: Use CSS Grid or Flexbox for page layouts, not Table component
 *    ```tsx
 *    // ❌ Bad: Using table for layout
 *    <Table>
 *      <TableRow>
 *        <TableCell><Sidebar /></TableCell>
 *        <TableCell><MainContent /></TableCell>
 *      </TableRow>
 *    </Table>
 * 
 *    // ✅ Good: Use proper layout
 *    <div className="grid grid-cols-[200px_1fr]">
 *      <Sidebar />
 *      <MainContent />
 *    </div>
 *    ```
 * 
 * 2. **Don't forget responsive design**: Horizontal scroll or collapse on mobile
 *    ```tsx
 *    ...Bad: Table overflows on mobile...
 *    <Table>...no container...</Table>
 * 
 *    ...Good: Scrollable container (built-in)...
 *    <Table>...wrapper has overflow-auto...</Table>
 * 
 *    ...Better: Hide columns on mobile...
 *    <TableHead className="hidden md:table-cell">Date</TableHead>
 *    ```
 * 
 * 3. **Don't overload with too many columns**: 5-8 columns max, hide less important ones on mobile
 *    ```tsx
 *    ...Bad: 15 columns in one table...
 *    <TableRow>
 *      <TableHead>Col1</TableHead>
 *      ...13 more columns...
 *      <TableHead>Col15</TableHead>
 *    </TableRow>
 * 
 *    ...Good: Prioritize important columns, use expandable rows for details...
 *    <TableRow>
 *      <TableHead>ID</TableHead>
 *      <TableHead>Name</TableHead>
 *      <TableHead>Status</TableHead>
 *      <TableHead>Amount</TableHead>
 *      <TableHead>Actions</TableHead>
 *    </TableRow>
 *    ```
 * 
 * 4. **Don't put complex interactive elements in cells**: Keep cells simple, use popovers for forms
 *    ```tsx
 *    // ❌ Bad: Full form inside cell
 *    <TableCell>
 *      <Form><Input /><Select /><Button /></Form>
 *    </TableCell>
 * 
 *    ...Good: Button that opens dialog/popover...
 *    <TableCell>
 *      <Dialog>
 *        <DialogTrigger asChild>
 *          <Button variant="ghost" size="sm">Edit</Button>
 *        </DialogTrigger>
 *        <DialogContent>
 *          <Form>...full form here...</Form>
 *        </DialogContent>
 *      </Dialog>
 *    </TableCell>
 *    ```
 * 
 * ### Common Patterns
 * 
 * #### Sortable Table with Server-side Sorting
 * ```tsx
 * const { data, isLoading } = useQuery({
 *   queryKey: ['invoices', sortConfig],
 *   queryFn: () => fetchInvoices(sortConfig),
 * });
 * 
 * const handleSort = (key: string) => {
 *   setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
 * };
 * ```
 * 
 * #### Infinite Scroll with Virtual Scrolling
 * ```tsx
 * import { useVirtualizer } from '@tanstack/react-virtual';
 * 
 * const parentRef = useRef<HTMLDivElement>(null);
 * const virtualizer = useVirtualizer({
 *   count: data.length,
 *   getScrollElement: () => parentRef.current,
 *   estimateSize: () => 45,
 * });
 * ```
 * 
 * #### Drag-and-Drop Reordering
 * ```tsx
 * import { DndContext, closestCenter } from '@dnd-kit/core';
 * import { SortableContext, useSortable } from '@dnd-kit/sortable';
 * 
 * <DndContext onDragEnd={handleDragEnd}>
 *   <SortableContext items={data.map(d => d.id)}>
 *     {data.map(item => <SortableRow key={item.id} item={item} />)}
 *   </SortableContext>
 * </DndContext>
 * ```
 * 
 * ### Accessibility Checklist
 * 
 * - ✅ Semantic HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
 * - ✅ `<caption>` element for table description
 * - ✅ `scope="col"` on column headers (add manually if needed)
 * - ✅ Keyboard navigation for interactive elements (sortable headers, checkboxes)
 * - ✅ Focus indicators on interactive cells
 * - ✅ ARIA labels on checkboxes ("Select invoice INV-001")
 * - ✅ Loading states announced to screen readers (`aria-live="polite"`)
 * - ✅ Empty states with helpful messages
 * - ✅ Adequate color contrast (4.5:1 for text, 3:1 for UI components)
 * - ✅ Responsive design (horizontal scroll or collapse on mobile)
 * 
 * ### Performance Considerations
 * 
 * - **Virtualization**: For 1000+ rows, use @tanstack/react-virtual
 * - **Pagination**: For 100+ rows, implement pagination (server or client)
 * - **Debounced Search**: Debounce search input to reduce re-renders
 *   ```tsx
 *   const debouncedSearch = useMemo(
 *     () => debounce((query: string) => setSearchQuery(query), 300),
 *     []
 *   );
 *   ```
 * - **Memoization**: Memoize filtered/sorted data with `useMemo`
 *   ```tsx
 *   const sortedData = useMemo(
 *     () => sortData(data, sortConfig),
 *     [data, sortConfig]
 *   );
 *   ```
 * - **Lazy Loading**: Load data on-demand with infinite scroll or load-more button
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-2">Table Component Guidelines</h3>
        <p className="text-sm text-muted-foreground">
          Follow these best practices for creating accessible, performant, and maintainable data tables.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium mb-2 text-green-600 dark:text-green-400">✅ Do's</h4>
          <ul className="space-y-2 text-sm">
            <li>• Use semantic table structure (TableHeader/TableBody/TableFooter)</li>
            <li>• Include TableCaption for screen reader accessibility</li>
            <li>• Use TableFooter for totals and summary rows</li>
            <li>• Add loading states (skeleton rows or spinner)</li>
            <li>• Provide empty states with helpful messages</li>
            <li>• Right-align numeric columns (amounts, quantities, percentages)</li>
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-2 text-red-600 dark:text-red-400">❌ Don'ts</h4>
          <ul className="space-y-2 text-sm">
            <li>• Don't use tables for page layout (use CSS Grid/Flexbox)</li>
            <li>• Don't forget responsive design (horizontal scroll or column hiding)</li>
            <li>• Don't overload with too many columns (5-8 max, hide on mobile)</li>
            <li>• Don't put complex forms inside table cells (use dialogs/popovers)</li>
          </ul>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-2">Example: Complete Data Table</h4>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-xs overflow-x-auto">
{`<Table>
  <TableCaption>Recent customer invoices</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(invoice => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.customer}</TableCell>
        <TableCell className="text-right">
          \${invoice.amount.toFixed(2)}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-right">
        \${total.toFixed(2)}
      </TableCell>
    </TableRow>
  </TableFooter>
</Table>`}
          </pre>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-2">Accessibility Checklist</h4>
        <ul className="space-y-1 text-sm">
          <li>✅ Semantic HTML table elements</li>
          <li>✅ TableCaption for description</li>
          <li>✅ Keyboard navigation for interactive elements</li>
          <li>✅ Focus indicators on clickable cells</li>
          <li>✅ ARIA labels on checkboxes</li>
          <li>✅ Loading states with aria-live</li>
          <li>✅ Adequate color contrast (4.5:1)</li>
          <li>✅ Responsive design (scroll/collapse)</li>
        </ul>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-base font-medium mb-2">Performance Tips</h4>
        <ul className="space-y-1 text-sm">
          <li>🚀 Use virtualization for 1000+ rows (@tanstack/react-virtual)</li>
          <li>🚀 Implement pagination for 100+ rows</li>
          <li>🚀 Debounce search input (300ms delay)</li>
          <li>🚀 Memoize filtered/sorted data with useMemo</li>
          <li>🚀 Load data on-demand with infinite scroll</li>
        </ul>
      </div>
    </div>
  ),
};
