import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdjustmentOverride {
  parcelId: string;
  field: string;
  originalValue: number;
  adjustedValue: number;
  reason: string;
}

interface AdvancedComparisonState {
  selectedParcels: string[];
  adjustmentOverrides: AdjustmentOverride[];
  weightings: Record<string, number>;
  showDiffsOnly: boolean;
  addParcel: (parcelId: string) => void;
  removeParcel: (parcelId: string) => void;
  clearSelection: () => void;
  setAdjustmentOverride: (override: AdjustmentOverride) => void;
  removeAdjustmentOverride: (parcelId: string, field: string) => void;
  clearOverrides: () => void;
  setWeighting: (approach: string, weight: number) => void;
  setShowDiffsOnly: (show: boolean) => void;
  getOverride: (parcelId: string, field: string) => AdjustmentOverride | undefined;
}

const AdvancedComparisonContext = createContext<AdvancedComparisonState | null>(null);

interface AdvancedComparisonProviderProps {
  children: ReactNode;
}

export function AdvancedComparisonProvider({ children }: AdvancedComparisonProviderProps) {
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [adjustmentOverrides, setAdjustmentOverrides] = useState<AdjustmentOverride[]>([]);
  const [weightings, setWeightings] = useState<Record<string, number>>({
    cost: 0.33,
    income: 0.33,
    sales: 0.34,
  });
  const [showDiffsOnly, setShowDiffsOnly] = useState(false);

  const addParcel = useCallback((parcelId: string) => {
    setSelectedParcels((prev) => {
      if (prev.includes(parcelId)) return prev;
      return [...prev, parcelId];
    });
  }, []);

  const removeParcel = useCallback((parcelId: string) => {
    setSelectedParcels((prev) => prev.filter((id) => id !== parcelId));
    setAdjustmentOverrides((prev) => prev.filter((o) => o.parcelId !== parcelId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedParcels([]);
    setAdjustmentOverrides([]);
  }, []);

  const setAdjustmentOverride = useCallback((override: AdjustmentOverride) => {
    setAdjustmentOverrides((prev) => {
      const filtered = prev.filter(
        (o) => !(o.parcelId === override.parcelId && o.field === override.field)
      );
      return [...filtered, override];
    });
  }, []);

  const removeAdjustmentOverride = useCallback((parcelId: string, field: string) => {
    setAdjustmentOverrides((prev) =>
      prev.filter((o) => !(o.parcelId === parcelId && o.field === field))
    );
  }, []);

  const clearOverrides = useCallback(() => {
    setAdjustmentOverrides([]);
  }, []);

  const setWeighting = useCallback((approach: string, weight: number) => {
    setWeightings((prev) => ({ ...prev, [approach]: weight }));
  }, []);

  const getOverride = useCallback(
    (parcelId: string, field: string) => {
      return adjustmentOverrides.find(
        (o) => o.parcelId === parcelId && o.field === field
      );
    },
    [adjustmentOverrides]
  );

  return (
    <AdvancedComparisonContext.Provider
      value={{
        selectedParcels,
        adjustmentOverrides,
        weightings,
        showDiffsOnly,
        addParcel,
        removeParcel,
        clearSelection,
        setAdjustmentOverride,
        removeAdjustmentOverride,
        clearOverrides,
        setWeighting,
        setShowDiffsOnly,
        getOverride,
      }}
    >
      {children}
    </AdvancedComparisonContext.Provider>
  );
}

export function useAdvancedComparison() {
  const ctx = useContext(AdvancedComparisonContext);
  if (!ctx) throw new Error('useAdvancedComparison must be used within AdvancedComparisonProvider');
  return ctx;
}
