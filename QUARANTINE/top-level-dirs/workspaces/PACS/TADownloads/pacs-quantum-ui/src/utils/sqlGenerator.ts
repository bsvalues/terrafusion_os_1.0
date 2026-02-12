/**
 * SQL Generator Utility
 * Elite Power User - Generate SQL from Query Builder State
 */

import type { QueryBuilderState } from '../types/pacs';

/**
 * Generate SQL query from QueryBuilder state
 */
export function generateSQL(queryBuilder: QueryBuilderState): string {
  if (queryBuilder.selectedTables.length === 0) {
    return '-- Select tables to build query';
  }

  const parts: string[] = [];

  // SELECT clause
  if (queryBuilder.columns.length === 0) {
    parts.push('SELECT *');
  } else {
    const selectClause: string[] = [];
    
    // Add aggregations
    queryBuilder.aggregations.forEach((agg) => {
      if (agg.column) {
        const alias = agg.alias || `${agg.function}_${agg.column.replace('.', '_')}`;
        selectClause.push(`${agg.function}(${agg.column}) AS ${alias}`);
      }
    });

    // Add regular columns (if not already in aggregations)
    queryBuilder.columns.forEach((col) => {
      if (!queryBuilder.aggregations.some((agg) => agg.column === `${col.table}.${col.name}`)) {
        selectClause.push(`${col.table}.${col.name}`);
      }
    });

    if (selectClause.length === 0) {
      selectClause.push('*');
    }

    parts.push(`SELECT ${selectClause.join(', ')}`);
  }

  // FROM clause
  const fromTable = queryBuilder.selectedTables[0];
  parts.push(`FROM ${fromTable}`);

  // JOIN clauses
  for (let i = 1; i < queryBuilder.selectedTables.length; i++) {
    const table = queryBuilder.selectedTables[i];
    // Simple JOIN - in production, use relationship metadata
    parts.push(`LEFT JOIN ${table} ON ${fromTable}.id = ${table}.id`);
  }

  // WHERE clause
  if (queryBuilder.conditions.length > 0) {
    const whereClause: string[] = [];
    queryBuilder.conditions.forEach((condition, index) => {
      if (condition.column && condition.operator && condition.value !== undefined && condition.value !== '') {
        const prefix = index > 0 ? (condition.logicalOperator || 'AND') + ' ' : '';
        let value = condition.value;
        
        // Handle different operators
        if (condition.operator === 'LIKE') {
          value = `'%${value}%'`;
        } else if (condition.operator === 'IN') {
          const values = (value as string).split(',').map((v: string) => `'${v.trim()}'`).join(', ');
          value = `(${values})`;
        } else if (condition.operator === 'BETWEEN') {
          const [start, end] = (value as string).split(' AND ').map((v: string) => v.trim());
          value = `'${start}' AND '${end}'`;
        } else if (typeof condition.value === 'string') {
          value = `'${value}'`;
        }

        whereClause.push(`${prefix}${condition.column} ${condition.operator} ${value}`);
      }
    });

    if (whereClause.length > 0) {
      parts.push(`WHERE ${whereClause.join(' ')}`);
    }
  }

  // GROUP BY clause
  const groupByColumns = queryBuilder.aggregations
    .filter((agg) => agg.groupBy && agg.column)
    .map((agg) => agg.column);
  
  const nonAggregatedColumns = queryBuilder.columns
    .filter((col) => !queryBuilder.aggregations.some((agg) => agg.column === `${col.table}.${col.name}`))
    .map((col) => `${col.table}.${col.name}`);

  if (queryBuilder.aggregations.length > 0 && (groupByColumns.length > 0 || nonAggregatedColumns.length > 0)) {
    const groupByClause = [...groupByColumns, ...nonAggregatedColumns].join(', ');
    if (groupByClause) {
      parts.push(`GROUP BY ${groupByClause}`);
    }
  }

  // HAVING clause (for aggregate conditions)
  const havingConditions = queryBuilder.conditions.filter((c) =>
    queryBuilder.aggregations.some((agg) => agg.column === c.column)
  );
  if (havingConditions.length > 0) {
    const havingClause: string[] = [];
    havingConditions.forEach((condition, index) => {
      if (condition.column && condition.operator && condition.value !== undefined) {
        const prefix = index > 0 ? (condition.logicalOperator || 'AND') + ' ' : '';
        let value = condition.value;
        if (typeof value === 'string') {
          value = `'${value}'`;
        }
        havingClause.push(`${prefix}${condition.column} ${condition.operator} ${value}`);
      }
    });
    if (havingClause.length > 0) {
      parts.push(`HAVING ${havingClause.join(' ')}`);
    }
  }

  // ORDER BY clause
  if (queryBuilder.orderBy.length > 0) {
    const orderByClause = queryBuilder.orderBy
      .filter((ob) => ob.column)
      .map((ob) => `${ob.column} ${ob.direction}`)
      .join(', ');
    if (orderByClause) {
      parts.push(`ORDER BY ${orderByClause}`);
    }
  }

  // LIMIT clause
  if (queryBuilder.limit !== undefined && queryBuilder.limit > 0) {
    parts.push(`LIMIT ${queryBuilder.limit}`);
  }

  return parts.join('\n');
}

