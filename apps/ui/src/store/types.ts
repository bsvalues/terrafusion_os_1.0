import { configureStore } from '@reduxjs/toolkit';
import compGrid from './compGrid/slice';

export const store = configureStore({ reducer: { compGrid } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;