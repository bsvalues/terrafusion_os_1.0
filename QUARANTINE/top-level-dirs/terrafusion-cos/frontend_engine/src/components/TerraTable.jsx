/**
 * TerraTable - Official TerraFusion Table Component
 * 
 * @architecture Data tables using design tokens
 * Provides sortable, filterable tables for government data
 * 
 * @example
 * <TerraTable 
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     { key: 'value', label: 'Value', sortable: true }
 *   ]}
 *   data={[
 *     { name: 'Property Tax', value: '$1,234' },
 *     { name: 'Permits', value: '42' }
 *   ]}
 * />
 */

import React, { useState } from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraTable = ({ 
  columns = [],
  data = [],
  sortable = true,
  hoverable = true,
  striped = false,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick = null,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const handleSort = (columnKey) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [data, sortConfig]);
  
  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: theme.typography.fontFamily,
    fontSize: compact ? theme.typography.scale.sm : theme.typography.scale.base,
  };
  
  const theadStyles = {
    borderBottom: `2px solid ${theme.colors.transcendCyan}`,
  };
  
  const thStyles = {
    padding: compact ? theme.spacing.sm : theme.spacing.md,
    textAlign: 'left',
    fontWeight: 700,
    color: theme.colors.transcendCyan,
    cursor: sortable ? 'pointer' : 'default',
    userSelect: 'none',
    transition: `color ${theme.motion.duration.quick} ${theme.motion.easing.standard}`,
  };
  
  const getTrStyles = (index) => ({
    background: striped && index % 2 === 1 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
    borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
    transition: `background ${theme.motion.duration.quick} ${theme.motion.easing.standard}`,
    cursor: onRowClick ? 'pointer' : 'default',
  });
  
  const tdStyles = {
    padding: compact ? theme.spacing.sm : theme.spacing.md,
    color: theme.colors.white,
  };
  
  const emptyStyles = {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
  };
  
  const getSortIcon = (columnKey) => {
    if (!sortable || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };
  
  const handleRowHover = (e, isHovering) => {
    if (!hoverable) return;
    e.currentTarget.style.background = isHovering ? 'rgba(0, 255, 238, 0.1)' : 
                                       striped && parseInt(e.currentTarget.dataset.index) % 2 === 1 ? 
                                       'rgba(255, 255, 255, 0.03)' : 'transparent';
  };
  
  const handleThHover = (e, isHovering) => {
    if (!sortable) return;
    e.currentTarget.style.color = isHovering ? theme.colors.white : theme.colors.transcendCyan;
  };
  
  if (loading) {
    return (
      <div style={emptyStyles}>
        Loading data...
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div style={emptyStyles}>
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <table 
      style={tableStyles}
      className={`terra-table ${className}`}
      {...props}
    >
      <thead style={theadStyles}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={thStyles}
              onClick={() => column.sortable !== false && handleSort(column.key)}
              onMouseEnter={(e) => handleThHover(e, true)}
              onMouseLeave={(e) => handleThHover(e, false)}
            >
              {column.label}
              {getSortIcon(column.key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, index) => (
          <tr
            key={index}
            data-index={index}
            style={getTrStyles(index)}
            onClick={() => onRowClick && onRowClick(row)}
            onMouseEnter={(e) => handleRowHover(e, true)}
            onMouseLeave={(e) => handleRowHover(e, false)}
          >
            {columns.map((column) => (
              <td key={column.key} style={tdStyles}>
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TerraTable;
