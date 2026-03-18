import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ComparisonState {
  selectedParcels: string[];
  comparisonMode: 'side-by-side' | 'overlay';
  maxSelections: number;
  addParcel: (parcelId: string) => void;
  removeParcel: (parcelId: string) => void;
  clearSelection: () => void;
  toggleParcel: (parcelId: string) => void;
  setComparisonMode: (mode: 'side-by-side' | 'overlay') => void;
  isSelected: (parcelId: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonState | null>(null);

interface ComparisonProviderProps {
  children: ReactNode;
  maxSelections?: number;
}

export function ComparisonProvider({ children, maxSelections = 4 }: ComparisonProviderProps) {
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  const addParcel = useCallback((parcelId: string) => {
    setSelectedParcels((prev) => {
      if (prev.includes(parcelId) || prev.length >= maxSelections) return prev;
      return [...prev, parcelId];
    });
  }, [maxSelections]);

  const removeParcel = useCallback((parcelId: string) => {
    setSelectedParcels((prev) => prev.filter((id) => id !== parcelId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedParcels([]);
  }, []);

  const toggleParcel = useCallback((parcelId: string) => {
    setSelectedParcels((prev) => {
      if (prev.includes(parcelId)) return prev.filter((id) => id !== parcelId);
      if (prev.length >= maxSelections) return prev;
      return [...prev, parcelId];
    });
  }, [maxSelections]);

  const isSelected = useCallback((parcelId: string) => {
    return selectedParcels.includes(parcelId);
  }, [selectedParcels]);

  const canAddMore = selectedParcels.length < maxSelections;

  return (
    <ComparisonContext.Provider
      value={{
        selectedParcels,
        comparisonMode,
        maxSelections,
        addParcel,
        removeParcel,
        clearSelection,
        toggleParcel,
        setComparisonMode,
        isSelected,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error('useComparison must be used within ComparisonProvider');
  return ctx;
}
