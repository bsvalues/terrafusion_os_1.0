import { configureStore } from '@reduxjs/toolkit';

// Simple store for now - we'll enhance this as we build out
export const store = configureStore({
  reducer: {
    // Will add reducers as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
