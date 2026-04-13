import { createContext, useContext, useState, useCallback } from "react";

export interface CalibrationContextValue {
  matrixVersionId: number | null;
  setMatrixVersionId: (id: number | null) => void;

  selectedRevalArea: string | null;
  setSelectedRevalArea: (area: string | null) => void;

  selectedBuildingType: string | null;
  setSelectedBuildingType: (type: string | null) => void;

  // key: `${revalArea}:${buildingType}`, value: adjustment %
  proposedAdjustments: Record<string, number>;
  setAdjustment: (revalArea: string, buildingType: string, pct: number) => void;
  clearAdjustments: () => void;

  excludedSaleIds: number[];
  addExclusion: (saleId: number) => void;
  removeExclusion: (saleId: number) => void;
}

export const CalibrationContext = createContext<CalibrationContextValue | null>(null);

export function useCalibrationContext(): CalibrationContextValue {
  const ctx = useContext(CalibrationContext);
  if (!ctx) throw new Error("useCalibrationContext must be used inside CalibrationContextProvider");
  return ctx;
}

/** Call this in the component that owns state (CalibrationWorkbench) */
export function useCalibrationContextState(
  initialMatrixVersionId: number | null
): CalibrationContextValue {
  const [mvId, setMvId] = useState<number | null>(initialMatrixVersionId);
  const [selectedRevalArea, setSelectedRevalArea] = useState<string | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);
  const [proposedAdjustments, setProposedAdjustments] = useState<Record<string, number>>({});
  const [excludedSaleIds, setExcludedSaleIds] = useState<number[]>([]);

  const setAdjustment = useCallback((area: string, type: string, pct: number) => {
    setProposedAdjustments((prev) => ({ ...prev, [`${area}:${type}`]: pct }));
  }, []);

  const clearAdjustments = useCallback(() => setProposedAdjustments({}), []);

  const addExclusion = useCallback((id: number) => {
    setExcludedSaleIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeExclusion = useCallback((id: number) => {
    setExcludedSaleIds((prev) => prev.filter((x) => x !== id));
  }, []);

  return {
    matrixVersionId: mvId,
    setMatrixVersionId: setMvId,
    selectedRevalArea,
    setSelectedRevalArea,
    selectedBuildingType,
    setSelectedBuildingType,
    proposedAdjustments,
    setAdjustment,
    clearAdjustments,
    excludedSaleIds,
    addExclusion,
    removeExclusion,
  };
}
