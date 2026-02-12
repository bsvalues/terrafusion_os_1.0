/**
 * Query Builder Redux Slice
 * Elite Power User - Query Builder State Management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  QueryBuilderState,
  TableSchema,
  ColumnSchema,
  QueryCondition,
  QueryAggregation,
  OrderByClause,
} from '../../types/pacs';

const initialState: QueryBuilderState = {
  tables: [],
  selectedTables: [],
  columns: [],
  conditions: [],
  aggregations: [],
  orderBy: [],
  limit: undefined,
};

const queryBuilderSlice = createSlice({
  name: 'queryBuilder',
  initialState,
  reducers: {
    setTables: (state, action: PayloadAction<TableSchema[]>) => {
      state.tables = action.payload;
    },
    addTable: (state, action: PayloadAction<string>) => {
      if (!state.selectedTables.includes(action.payload)) {
        state.selectedTables.push(action.payload);
      }
    },
    removeTable: (state, action: PayloadAction<string>) => {
      state.selectedTables = state.selectedTables.filter((t) => t !== action.payload);
      // Remove columns from removed table
      state.columns = state.columns.filter((c) => c.table !== action.payload);
    },
    addColumn: (state, action: PayloadAction<ColumnSchema>) => {
      const exists = state.columns.some((c) => c.table === action.payload.table && c.name === action.payload.name);
      if (!exists) {
        state.columns.push(action.payload);
      }
    },
    removeColumn: (state, action: PayloadAction<{ table: string; name: string }>) => {
      state.columns = state.columns.filter(
        (c) => !(c.table === action.payload.table && c.name === action.payload.name)
      );
    },
    addCondition: (state, action: PayloadAction<QueryCondition>) => {
      state.conditions.push(action.payload);
    },
    removeCondition: (state, action: PayloadAction<number>) => {
      state.conditions.splice(action.payload, 1);
    },
    updateCondition: (state, action: PayloadAction<{ index: number; condition: QueryCondition }>) => {
      if (action.payload.index < state.conditions.length) {
        state.conditions[action.payload.index] = action.payload.condition;
      }
    },
    addAggregation: (state, action: PayloadAction<QueryAggregation>) => {
      state.aggregations.push(action.payload);
    },
    removeAggregation: (state, action: PayloadAction<number>) => {
      state.aggregations.splice(action.payload, 1);
    },
    updateAggregation: (state, action: PayloadAction<{ index: number; aggregation: QueryAggregation }>) => {
      if (action.payload.index < state.aggregations.length) {
        state.aggregations[action.payload.index] = action.payload.aggregation;
      }
    },
    addOrderBy: (state, action: PayloadAction<OrderByClause>) => {
      state.orderBy.push(action.payload);
    },
    removeOrderBy: (state, action: PayloadAction<number>) => {
      state.orderBy.splice(action.payload, 1);
    },
    updateOrderBy: (state, action: PayloadAction<{ index: number; orderBy: OrderByClause }>) => {
      if (action.payload.index < state.orderBy.length) {
        state.orderBy[action.payload.index] = action.payload.orderBy;
      }
    },
    setLimit: (state, action: PayloadAction<number | undefined>) => {
      state.limit = action.payload;
    },
    resetQueryBuilder: () => initialState,
  },
});

export const {
  setTables,
  addTable,
  removeTable,
  addColumn,
  removeColumn,
  addCondition,
  removeCondition,
  updateCondition,
  addAggregation,
  removeAggregation,
  updateAggregation,
  addOrderBy,
  removeOrderBy,
  updateOrderBy,
  setLimit,
  resetQueryBuilder,
} = queryBuilderSlice.actions;

export default queryBuilderSlice.reducer;
