import React, { createContext, useContext, useState, useReducer, ReactNode } from "react";

// Define the state structure
export interface AppState {
  isLoading: boolean;
  loadingMessage: string | null;
  error: {
    isError: boolean;
    message: string | null;
    details: string | null;
  };
  syncState: {
    status: "idle" | "syncing" | "error" | "success";
    pendingItems: number;
    lastSyncTime: string | null;
    errorDetails: string | null;
  };
}

// Define the initial state
const initialState: AppState = {
  isLoading: false,
  loadingMessage: null,
  error: {
    isError: false,
    message: null,
    details: null,
  },
  syncState: {
    status: "idle",
    pendingItems: 0,
    lastSyncTime: null,
    errorDetails: null,
  },
};

// Define action types
type AppAction =
  | { type: "START_LOADING"; payload?: string }
  | { type: "STOP_LOADING" }
  | { type: "SET_ERROR"; payload: { message: string; details?: string } }
  | { type: "CLEAR_ERROR" }
  | { type: "START_SYNC"; payload?: number }
  | { type: "SYNC_SUCCESS" }
  | { type: "SYNC_ERROR"; payload: string }
  | { type: "RESET_SYNC" }
  | { type: "SET_PENDING_ITEMS"; payload: number };

// Create the reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "START_LOADING":
      return {
        ...state,
        isLoading: true,
        loadingMessage: action.payload || "Loading...",
      };
    case "STOP_LOADING":
      return {
        ...state,
        isLoading: false,
        loadingMessage: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: {
          isError: true,
          message: action.payload.message,
          details: action.payload.details || null,
        },
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: {
          isError: false,
          message: null,
          details: null,
        },
      };
    case "START_SYNC":
      return {
        ...state,
        syncState: {
          ...state.syncState,
          status: "syncing",
          pendingItems: action.payload || state.syncState.pendingItems,
        },
      };
    case "SYNC_SUCCESS":
      return {
        ...state,
        syncState: {
          ...state.syncState,
          status: "success",
          pendingItems: 0,
          lastSyncTime: new Date().toISOString(),
          errorDetails: null,
        },
      };
    case "SYNC_ERROR":
      return {
        ...state,
        syncState: {
          ...state.syncState,
          status: "error",
          errorDetails: action.payload,
        },
      };
    case "RESET_SYNC":
      return {
        ...state,
        syncState: {
          ...initialState.syncState,
        },
      };
    case "SET_PENDING_ITEMS":
      return {
        ...state,
        syncState: {
          ...state.syncState,
          pendingItems: action.payload,
        },
      };
    default:
      return state;
  }
}

// Create the context
type AppContextType = {
  state: AppState;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setError: (message: string, details?: string) => void;
  clearError: () => void;
  startSync: (pendingItems?: number) => void;
  syncSuccess: () => void;
  syncError: (details: string) => void;
  resetSync: () => void;
  setPendingItems: (count: number) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Create actions
  const startLoading = (message?: string) => dispatch({ type: "START_LOADING", payload: message });
  const stopLoading = () => dispatch({ type: "STOP_LOADING" });
  const setError = (message: string, details?: string) =>
    dispatch({ type: "SET_ERROR", payload: { message, details } });
  const clearError = () => dispatch({ type: "CLEAR_ERROR" });
  const startSync = (pendingItems?: number) =>
    dispatch({ type: "START_SYNC", payload: pendingItems });
  const syncSuccess = () => dispatch({ type: "SYNC_SUCCESS" });
  const syncError = (details: string) => dispatch({ type: "SYNC_ERROR", payload: details });
  const resetSync = () => dispatch({ type: "RESET_SYNC" });
  const setPendingItems = (count: number) =>
    dispatch({ type: "SET_PENDING_ITEMS", payload: count });

  const value = {
    state,
    startLoading,
    stopLoading,
    setError,
    clearError,
    startSync,
    syncSuccess,
    syncError,
    resetSync,
    setPendingItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
