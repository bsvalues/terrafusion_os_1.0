import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

type Row = {
  id: string;                // real id (server) or temp-*
  address: string;
  price: number;
  optimistic?: boolean;
};

type RowsState = {
  byId: Record<string, Row>;
  allIds: string[];
};

type CompGridState = {
  rows: RowsState;
  lastError?: string | null;
};

const initialState: CompGridState = {
  rows: { byId: {}, allIds: [] },
  lastError: null,
};

// ---- Async create with optimistic flow --------------------------------------
export const createRow = createAsyncThunk<
  // return type
  { tempId: string; id?: string; error?: string },
  // arg type
  { tempId: string; address: string; price: number; forceConflict?: boolean }
>('compGrid/createRow', async (args) => {
  try {
    const res = await fetch('/api/comp-grid/rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: args.address, price: args.price, forceConflict: args.forceConflict }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { tempId: args.tempId, error: body?.error || `HTTP_${res.status}` };
    }
    const body = await res.json();
    return { tempId: args.tempId, id: body.id as string };
  } catch (e: any) {
    return { tempId: args.tempId, error: e?.message || 'NETWORK_ERROR' };
  }
});

// ---- Slice & reducers --------------------------------------------------------
const slice = createSlice({
  name: 'compGrid',
  initialState,
  reducers: {
    addRow: (state, action: PayloadAction<{ id: string; address: string; price: number; optimistic?: boolean }>) => {
      const r = action.payload;
      state.rows.byId[r.id] = r;
      state.rows.allIds.push(r.id);
    },
    addRowCommitted: (state, action: PayloadAction<{ tempId: string; id: string }>) => {
      const { tempId, id } = action.payload;
      const temp = state.rows.byId[tempId];
      if (!temp) return;
      delete state.rows.byId[tempId];
      state.rows.byId[id] = { ...temp, id, optimistic: false };
      state.rows.allIds = state.rows.allIds.map((x) => (x === tempId ? id : x));
    },
    addRowFailed: (state, action: PayloadAction<{ tempId: string; error: string }>) => {
      const { tempId, error } = action.payload;
      // rollback
      if (state.rows.byId[tempId]?.optimistic) {
        delete state.rows.byId[tempId];
        state.rows.allIds = state.rows.allIds.filter((x) => x !== tempId);
      }
      state.lastError = error;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createRow.fulfilled, (state, action) => {
      const { tempId, id, error } = action.payload;
      if (error || !id) {
        slice.caseReducers.addRowFailed(state, { type: 'x', payload: { tempId, error: error || 'UNKNOWN' } });
      } else {
        slice.caseReducers.addRowCommitted(state, { type: 'x', payload: { tempId, id } });
      }
    });
  },
});

export const { addRow, addRowCommitted, addRowFailed } = slice.actions;
export default slice.reducer;

// ---- Selectors (memoized) ----------------------------------------------------
const selectSelf = (s: any) => (s.compGrid as CompGridState) ?? initialState;

export const selectRows = createSelector(selectSelf, (s) => s.rows.allIds.map((id) => s.rows.byId[id]));
export const selectScore = createSelector(selectRows, (rows) => {
  if (!rows.length) return 0;

  // Weighted score: quantity, price dispersion, and recency placeholder
  const prices = rows.map(r => r.price || 0);
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const variance = prices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / Math.max(1, prices.length - 1);
  const stdev = Math.sqrt(variance);

  const quantityScore = Math.min(1, rows.length / 6);        // 6 comps = 100%
  const dispersionScore = 1 - Math.min(1, stdev / Math.max(1, avg * 0.25)); // tighter spread = better
  const base = 0.55 * quantityScore + 0.45 * dispersionScore;

  return Math.round(Math.max(0, Math.min(100, base * 100)));
});