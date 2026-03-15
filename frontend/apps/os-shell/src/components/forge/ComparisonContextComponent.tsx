// TFT-172 — Comparison context provider component
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { SalesComp, PropertyListing } from '@/types/realEstate';

interface ComparisonState {
  subjectParcelId: string | null;
  selectedComps: SalesComp[];
  comparedProperties: string[];
}

interface ComparisonContextValue extends ComparisonState {
  setSubject: (parcelId: string) => void;
  addComp: (comp: SalesComp) => void;
  removeComp: (compId: string) => void;
  clearComps: () => void;
  addPropertyToCompare: (parcelId: string) => void;
  removePropertyFromCompare: (parcelId: string) => void;
  clearComparedProperties: () => void;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function useComparisonContext() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error('useComparisonContext must be used within ComparisonContextComponent');
  }
  return ctx;
}

interface ComparisonContextComponentProps {
  children: React.ReactNode;
}

export function ComparisonContextComponent({ children }: ComparisonContextComponentProps) {
  const [state, setState] = useState<ComparisonState>({
    subjectParcelId: null,
    selectedComps: [],
    comparedProperties: [],
  });

  const setSubject = useCallback((parcelId: string) => {
    setState((prev) => ({ ...prev, subjectParcelId: parcelId }));
  }, []);

  const addComp = useCallback((comp: SalesComp) => {
    setState((prev) => {
      if (prev.selectedComps.some((c) => c.compId === comp.compId)) return prev;
      return { ...prev, selectedComps: [...prev.selectedComps, comp] };
    });
  }, []);

  const removeComp = useCallback((compId: string) => {
    setState((prev) => ({
      ...prev,
      selectedComps: prev.selectedComps.filter((c) => c.compId !== compId),
    }));
  }, []);

  const clearComps = useCallback(() => {
    setState((prev) => ({ ...prev, selectedComps: [] }));
  }, []);

  const addPropertyToCompare = useCallback((parcelId: string) => {
    setState((prev) => {
      if (prev.comparedProperties.includes(parcelId)) return prev;
      return { ...prev, comparedProperties: [...prev.comparedProperties, parcelId] };
    });
  }, []);

  const removePropertyFromCompare = useCallback((parcelId: string) => {
    setState((prev) => ({
      ...prev,
      comparedProperties: prev.comparedProperties.filter((id) => id !== parcelId),
    }));
  }, []);

  const clearComparedProperties = useCallback(() => {
    setState((prev) => ({ ...prev, comparedProperties: [] }));
  }, []);

  return (
    <ComparisonContext.Provider
      value={{
        ...state,
        setSubject,
        addComp,
        removeComp,
        clearComps,
        addPropertyToCompare,
        removePropertyFromCompare,
        clearComparedProperties,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}
