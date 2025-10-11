/**
 * TerraFusion UI Components Library
 * Day 13: Production-Ready UI Components for Property Assessment Platform
 * 
 * Comprehensive set of accessible, type-safe UI components including:
 * - Table: Sortable, filterable, paginated data grids for property listings, tax records
 * - Tabs: Multi-section navigation for property details, tax history, comparables
 * - Tooltip: Contextual help for complex property assessment terminology
 * - Badge: Status indicators for assessments, appeals, tax payments
 * 
 * @see ui-components.README.md for examples and API reference
 */

import React, { useState, useMemo, useCallback, ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, ButtonHTMLAttributes } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Column definition for Table component
 */
export interface TableColumn<T = any> {
  /** Unique key for the column, maps to data property */
  key: string;
  /** Display label for column header */
  label: string;
  /** Enable sorting for this column (default: true) */
  sortable?: boolean;
  /** Enable filtering for this column (default: true) */
  filterable?: boolean;
  /** Custom render function for cell content */
  render?: (value: any, row: T, index: number) => ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom className for header cell */
  headerClassName?: string;
  /** Custom className for body cells */
  cellClassName?: string;
}

/**
 * Pagination configuration
 */
export interface TablePagination {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Number of rows per page */
  pageSize: number;
  /** Total number of rows */
  totalRows: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
}

/**
 * Sort configuration
 */
export interface TableSortConfig {
  /** Column key to sort by */
  key: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Table component props
 */
export interface TableProps<T = any> extends Omit<HTMLAttributes<HTMLTableElement>, 'data'> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Enable sortable columns (default: true) */
  sortable?: boolean;
  /** Enable row hover effects (default: true) */
  hoverable?: boolean;
  /** Enable striped rows (default: false) */
  striped?: boolean;
  /** Compact mode with reduced padding (default: false) */
  compact?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Callback when row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Enable row selection (default: false) */
  selectable?: boolean;
  /** Selected row keys */
  selectedRows?: string[];
  /** Callback when row selection changes */
  onRowSelectionChange?: (selectedKeys: string[]) => void;
  /** Key property for row identification (default: 'id') */
  rowKey?: string;
  /** Pagination configuration */
  pagination?: TablePagination;
  /** Filter text for client-side filtering */
  filterText?: string;
  /** Custom empty state component */
  emptyState?: ReactNode;
  /** Custom loading state component */
  loadingState?: ReactNode;
}

/**
 * Tab item definition
 */
export interface TabItem {
  /** Unique identifier for tab */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon (ReactNode) */
  icon?: ReactNode;
  /** Badge content (number or string) */
  badge?: string | number;
  /** Disable tab */
  disabled?: boolean;
  /** Tab content */
  content: ReactNode;
}

/**
 * Tabs component props
 */
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of tab items */
  tabs: TabItem[];
  /** Active tab ID (controlled) */
  activeTab?: string;
  /** Default active tab ID (uncontrolled) */
  defaultActiveTab?: string;
  /** Callback when active tab changes */
  onTabChange?: (tabId: string) => void;
  /** Tab orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Tab variant style */
  variant?: 'default' | 'pills' | 'underline';
  /** Full width tabs */
  fullWidth?: boolean;
}

/**
 * Tooltip component props
 */
export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** Tooltip content */
  content: ReactNode;
  /** Trigger element (child) */
  children: ReactNode;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Show tooltip on click instead of hover */
  trigger?: 'hover' | 'click';
  /** Show arrow */
  arrow?: boolean;
  /** Max width of tooltip */
  maxWidth?: string;
}

/**
 * Badge variant types
 */
export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  // Property assessment status variants
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'appealed'
  | 'delinquent'
  | 'active'
  | 'inactive';

/**
 * Badge component props
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant/color */
  variant?: BadgeVariant;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional icon */
  icon?: ReactNode;
  /** Rounded pill style */
  pill?: boolean;
  /** Show as outline style */
  outline?: boolean;
}

// ============================================================================
// TABLE COMPONENT
// ============================================================================

/**
 * Data Table Component
 * 
 * Production-ready table with sorting, filtering, pagination, and row selection.
 * Optimized for property listings, tax records, assessment history, and appeal tracking.
 * 
 * @example
 * ```tsx
 * <Table
 *   columns={[
 *     { key: 'parcelId', label: 'Parcel ID', sortable: true },
 *     { key: 'owner', label: 'Owner', sortable: true },
 *     { key: 'assessedValue', label: 'Assessed Value', render: (val) => formatCurrency(val) }
 *   ]}
 *   data={properties}
 *   sortable
 *   pagination={{
 *     currentPage: 1,
 *     pageSize: 25,
 *     totalRows: 500,
 *     onPageChange: (page) => setPage(page)
 *   }}
 * />
 * ```
 */
export function Table<T = any>({
  columns,
  data,
  sortable = true,
  hoverable = true,
  striped = false,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectable = false,
  selectedRows = [],
  onRowSelectionChange,
  rowKey = 'id',
  pagination,
  filterText = '',
  emptyState,
  loadingState,
  className = '',
  ...props
}: TableProps<T>) {
  // Sort state
  const [sortConfig, setSortConfig] = useState<TableSortConfig | null>(null);

  // Handle column sort
  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return;
    
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnKey, direction: 'asc' };
    });
  }, [sortable]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterText) return data;
    
    const searchLower = filterText.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        if (col.filterable === false) return false;
        const value = (row as any)[col.key];
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, filterText, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];
      
      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      // Compare values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  // Handle row selection
  const handleRowSelect = useCallback((row: T) => {
    if (!selectable || !onRowSelectionChange) return;
    
    const key = String((row as any)[rowKey]);
    const isSelected = selectedRows.includes(key);
    
    const newSelection = isSelected
      ? selectedRows.filter(k => k !== key)
      : [...selectedRows, key];
    
    onRowSelectionChange(newSelection);
  }, [selectable, selectedRows, onRowSelectionChange, rowKey]);

  // Select all rows
  const handleSelectAll = useCallback(() => {
    if (!selectable || !onRowSelectionChange) return;
    
    const allSelected = paginatedData.length > 0 && 
      paginatedData.every(row => selectedRows.includes(String((row as any)[rowKey])));
    
    if (allSelected) {
      onRowSelectionChange([]);
    } else {
      const allKeys = paginatedData.map(row => String((row as any)[rowKey]));
      onRowSelectionChange(allKeys);
    }
  }, [selectable, paginatedData, selectedRows, onRowSelectionChange, rowKey]);

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Loading state
  if (loading) {
    if (loadingState) return <>{loadingState}</>;
    return (
      <div className="table-loading" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Loading data...
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className="table-empty" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        {emptyMessage}
      </div>
    );
  }

  const displayData = paginatedData;
  const totalPages = pagination ? Math.ceil(sortedData.length / pagination.pageSize) : 1;

  return (
    <div className={`table-container ${className}`}>
      <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
        <table 
          className={`table ${compact ? 'table-compact' : ''} ${striped ? 'table-striped' : ''} ${hoverable ? 'table-hover' : ''}`}
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: compact ? '0.875rem' : '1rem'
          }}
          {...props}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              {selectable && (
                <th style={{ padding: compact ? '0.5rem' : '0.75rem', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={displayData.length > 0 && displayData.every(row => 
                      selectedRows.includes(String((row as any)[rowKey]))
                    )}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.headerClassName}
                  onClick={() => col.sortable !== false && sortable && handleSort(col.key)}
                  style={{
                    padding: compact ? '0.5rem' : '0.75rem',
                    textAlign: col.align || 'left',
                    fontWeight: 600,
                    cursor: col.sortable !== false && sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    width: col.width,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.label}{getSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => {
              const key = String((row as any)[rowKey] || index);
              const isSelected = selectedRows.includes(key);
              
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row, index)}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    cursor: onRowClick ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#e0f2fe' : striped && index % 2 === 1 ? '#f9fafb' : 'transparent',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => hoverable && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={(e) => hoverable && (e.currentTarget.style.backgroundColor = 
                    isSelected ? '#e0f2fe' : striped && index % 2 === 1 ? '#f9fafb' : 'transparent'
                  )}
                >
                  {selectable && (
                    <td style={{ padding: compact ? '0.5rem' : '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleRowSelect(row)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  {columns.map(col => {
                    const value = (row as any)[col.key];
                    const content = col.render ? col.render(value, row, index) : value;
                    
                    return (
                      <td
                        key={col.key}
                        className={col.cellClassName}
                        style={{
                          padding: compact ? '0.5rem' : '0.75rem',
                          textAlign: col.align || 'left',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="table-pagination" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem 0',
          gap: '1rem'
        }}>
          <div className="pagination-info" style={{ color: '#666', fontSize: '0.875rem' }}>
            Showing {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, sortedData.length)} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          
          <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: 'white',
                cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            
            <span style={{ color: '#666', fontSize: '0.875rem' }}>
              Page {pagination.currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                backgroundColor: 'white',
                cursor: pagination.currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage === totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
            
            {pagination.pageSizeOptions && pagination.onPageSizeChange && (
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange!(Number(e.target.value))}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              >
                {pagination.pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TABS COMPONENT
// ============================================================================

/**
 * Tabs Component
 * 
 * Multi-section navigation for property details, tax history, comparables, and more.
 * Supports keyboard navigation and accessibility features.
 * 
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'details', label: 'Property Details', content: <PropertyDetails /> },
 *     { id: 'tax', label: 'Tax History', badge: '5', content: <TaxHistory /> },
 *     { id: 'comparables', label: 'Comparables', content: <Comparables /> }
 *   ]}
 *   defaultActiveTab="details"
 *   variant="underline"
 * />
 * ```
 */
export function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  fullWidth = false,
  className = '',
  ...props
}: TabsProps) {
  // Controlled/uncontrolled state
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab || tabs[0]?.id);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = useCallback((tabId: string) => {
    setInternalActiveTab(tabId);
    onTabChange?.(tabId);
  }, [onTabChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    let nextIndex = currentIndex;

    if (orientation === 'horizontal') {
      if (e.key === 'ArrowLeft') nextIndex = currentIndex - 1;
      if (e.key === 'ArrowRight') nextIndex = currentIndex + 1;
    } else {
      if (e.key === 'ArrowUp') nextIndex = currentIndex - 1;
      if (e.key === 'ArrowDown') nextIndex = currentIndex + 1;
    }

    // Wrap around
    if (nextIndex < 0) nextIndex = tabs.length - 1;
    if (nextIndex >= tabs.length) nextIndex = 0;

    // Skip disabled tabs
    while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % tabs.length;
    }

    if (nextIndex !== currentIndex && !tabs[nextIndex]?.disabled) {
      handleTabChange(tabs[nextIndex].id);
    }
  }, [tabs, orientation, handleTabChange]);

  const getTabListStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      gap: variant === 'pills' ? '0.5rem' : '0',
      borderBottom: variant === 'underline' ? '2px solid #e5e7eb' : undefined,
      padding: variant === 'default' ? '0.25rem' : '0',
      backgroundColor: variant === 'default' ? '#f3f4f6' : 'transparent',
      borderRadius: variant === 'default' ? '0.5rem' : '0'
    };

    if (orientation === 'vertical') {
      base.flexDirection = 'column';
      base.borderBottom = 'none';
      base.borderRight = variant === 'underline' ? '2px solid #e5e7eb' : undefined;
    }

    if (fullWidth) {
      base.width = '100%';
    }

    return base;
  };

  const getTabButtonStyles = (tab: TabItem): React.CSSProperties => {
    const isActive = tab.id === activeTab;
    
    const base: React.CSSProperties = {
      padding: '0.75rem 1.25rem',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: tab.disabled ? 'not-allowed' : 'pointer',
      opacity: tab.disabled ? 0.5 : 1,
      fontWeight: isActive ? 600 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
      flex: fullWidth ? 1 : undefined,
      justifyContent: fullWidth ? 'center' : undefined
    };

    if (variant === 'default') {
      base.backgroundColor = isActive ? 'white' : 'transparent';
      base.borderRadius = '0.375rem';
      base.boxShadow = isActive ? '0 1px 2px rgba(0,0,0,0.05)' : undefined;
    } else if (variant === 'pills') {
      base.backgroundColor = isActive ? '#3b82f6' : '#f3f4f6';
      base.color = isActive ? 'white' : '#374151';
      base.borderRadius = '9999px';
    } else if (variant === 'underline') {
      base.borderBottom = isActive ? '2px solid #3b82f6' : '2px solid transparent';
      base.marginBottom = '-2px';
      base.color = isActive ? '#3b82f6' : '#6b7280';
    }

    return base;
  };

  const containerStyles: React.CSSProperties = orientation === 'horizontal' 
    ? { display: 'flex', flexDirection: 'column', gap: '1rem' }
    : { display: 'flex', gap: '1rem' };

  const activeTabContent = tabs.find(t => t.id === activeTab);

  return (
    <div className={`tabs tabs-${orientation} tabs-${variant} ${className}`} style={containerStyles} {...props}>
      <div className="tabs-list" role="tablist" aria-orientation={orientation} style={getTabListStyles()}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={tab.id === activeTab}
            aria-disabled={tab.disabled}
            tabIndex={tab.id === activeTab ? 0 : -1}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            disabled={tab.disabled}
            style={getTabButtonStyles(tab)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge !== undefined && (
              <Badge variant="secondary" size="sm">
                {tab.badge}
              </Badge>
            )}
          </button>
        ))}
      </div>

      <div 
        className="tabs-content"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        style={{ flex: orientation === 'vertical' ? 1 : undefined }}
      >
        {activeTabContent?.content}
      </div>
    </div>
  );
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

/**
 * Tooltip Component
 * 
 * Contextual help for complex property assessment terminology.
 * Provides hover/click tooltips with accessible keyboard support.
 * 
 * @example
 * ```tsx
 * <Tooltip content="The millage rate is the amount per $1,000 of assessed value used to calculate property taxes">
 *   <span style={{ textDecoration: 'underline dotted' }}>Millage Rate</span>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  trigger = 'hover',
  arrow = true,
  maxWidth = '300px',
  className = '',
  ...props
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback(() => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    const gap = arrow ? 12 : 8;
    
    switch (position) {
      case 'top':
        top = rect.top - (tooltipRect?.height || 0) - gap;
        left = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2;
        left = rect.left - (tooltipRect?.width || 0) - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2;
        left = rect.right + gap;
        break;
    }
    
    setCoords({ top, left });
    setVisible(true);
  }, [position, arrow]);

  const hideTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (trigger !== 'hover') return;
    timeoutRef.current = setTimeout(showTooltip, delay);
  }, [trigger, showTooltip, delay]);

  const handleMouseLeave = useCallback(() => {
    if (trigger !== 'hover') return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hideTooltip();
  }, [trigger, hideTooltip]);

  const handleClick = useCallback(() => {
    if (trigger !== 'click') return;
    setVisible(prev => !prev);
  }, [trigger]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowStyles = (): React.CSSProperties => {
    const arrowSize = 6;
    const styles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid'
    };

    switch (position) {
      case 'top':
        styles.bottom = -arrowSize;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        styles.borderWidth = `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`;
        styles.borderColor = '#1f2937 transparent transparent transparent';
        break;
      case 'bottom':
        styles.top = -arrowSize;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        styles.borderWidth = `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`;
        styles.borderColor = 'transparent transparent #1f2937 transparent';
        break;
      case 'left':
        styles.right = -arrowSize;
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        styles.borderWidth = `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`;
        styles.borderColor = 'transparent transparent transparent #1f2937';
        break;
      case 'right':
        styles.left = -arrowSize;
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        styles.borderWidth = `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`;
        styles.borderColor = 'transparent #1f2937 transparent transparent';
        break;
    }

    return styles;
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ display: 'inline-block', cursor: 'help' }}
        {...props}
      >
        {children}
      </div>

      {visible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position} ${className}`}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            maxWidth,
            padding: '0.5rem 0.75rem',
            backgroundColor: '#1f2937',
            color: 'white',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 9999,
            pointerEvents: 'none',
            lineHeight: 1.5
          }}
        >
          {content}
          {arrow && <div className="tooltip-arrow" style={getArrowStyles()} />}
        </div>
      )}
    </>
  );
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

/**
 * Badge Component
 * 
 * Status indicators for assessments, appeals, tax payments, and more.
 * Supports property assessment domain-specific variants.
 * 
 * @example
 * ```tsx
 * <Badge variant="pending">Pending Assessment</Badge>
 * <Badge variant="approved" icon={<CheckIcon />}>Approved</Badge>
 * <Badge variant="delinquent" pill>Delinquent</Badge>
 * ```
 */
export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  pill = false,
  outline = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const getVariantStyles = (): React.CSSProperties => {
    const variants: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
      default: { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
      primary: { bg: '#3b82f6', color: 'white', border: '#2563eb' },
      secondary: { bg: '#6b7280', color: 'white', border: '#4b5563' },
      success: { bg: '#10b981', color: 'white', border: '#059669' },
      warning: { bg: '#f59e0b', color: 'white', border: '#d97706' },
      danger: { bg: '#ef4444', color: 'white', border: '#dc2626' },
      info: { bg: '#06b6d4', color: 'white', border: '#0891b2' },
      // Property assessment status variants
      pending: { bg: '#fbbf24', color: '#78350f', border: '#f59e0b' },
      approved: { bg: '#10b981', color: 'white', border: '#059669' },
      rejected: { bg: '#ef4444', color: 'white', border: '#dc2626' },
      appealed: { bg: '#8b5cf6', color: 'white', border: '#7c3aed' },
      delinquent: { bg: '#dc2626', color: 'white', border: '#b91c1c' },
      active: { bg: '#10b981', color: 'white', border: '#059669' },
      inactive: { bg: '#6b7280', color: 'white', border: '#4b5563' }
    };

    return variants[variant];
  };

  const getSizeStyles = (): React.CSSProperties => {
    const sizes = {
      sm: { fontSize: '0.75rem', padding: '0.125rem 0.5rem', gap: '0.25rem' },
      md: { fontSize: '0.875rem', padding: '0.25rem 0.75rem', gap: '0.375rem' },
      lg: { fontSize: '1rem', padding: '0.375rem 1rem', gap: '0.5rem' }
    };

    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyles.gap,
    fontSize: sizeStyles.fontSize,
    padding: sizeStyles.padding,
    fontWeight: 600,
    borderRadius: pill ? '9999px' : '0.25rem',
    backgroundColor: outline ? 'transparent' : variantStyles.bg,
    color: outline ? variantStyles.bg : variantStyles.color,
    border: outline ? `1px solid ${variantStyles.border}` : 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1
  };

  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`} style={styles} {...props}>
      {icon && <span className="badge-icon" style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </span>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/**
 * Format date value
 */
export function formatDate(value: Date | string | number, format: 'short' | 'long' | 'full' = 'short', locale = 'en-US'): string {
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = 
    format === 'short' ? { year: 'numeric', month: 'numeric', day: 'numeric' } :
    format === 'long' ? { year: 'numeric', month: 'long', day: 'numeric' } :
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals = 0, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  }).format(value);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Table,
  Tabs,
  Tooltip,
  Badge,
  formatCurrency,
  formatDate,
  formatNumber
};
