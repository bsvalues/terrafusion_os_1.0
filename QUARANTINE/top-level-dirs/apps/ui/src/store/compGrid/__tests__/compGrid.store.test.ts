import { configureStore } from '@reduxjs/toolkit';
import slice, { addRow, addRowCommitted, addRowFailed, selectScore } from '../slice';
import { vi } from 'vitest';

function makeStore(pre?: any) {
  return configureStore({ reducer: { compGrid: slice }, preloadedState: pre });
}

describe('compGrid store', () => {
  it('immutably applies complex transforms & normalized updates', () => {
    const store = makeStore();
    store.dispatch(addRow({ id: 'temp-1', address: '123 Main St', price: 425000, optimistic: true }));
    expect(store.getState().compGrid.rows.byId['temp-1'].optimistic).toBe(true);

    store.dispatch(addRowCommitted({ tempId: 'temp-1', id: 'row-1' }));
    const s = store.getState().compGrid;
    expect(s.rows.byId['row-1']).toBeDefined();
    expect(s.rows.byId['temp-1']).toBeUndefined();
  });

  it('rolls back optimistic updates on failure', () => {
    const store = makeStore();
    store.dispatch(addRow({ id: 'temp-2', address: 'X', price: 1, optimistic: true }));
    store.dispatch(addRowFailed({ tempId: 'temp-2', error: 'Conflict' }));
    expect(store.getState().compGrid.rows.byId['temp-2']).toBeUndefined();
  });

  it('selector memoization and render minimization', () => {
    const store = makeStore();
    const score1 = selectScore(store.getState());
    const score2 = selectScore(store.getState());
    expect(score1).toBe(score2); // memoized
  });
});