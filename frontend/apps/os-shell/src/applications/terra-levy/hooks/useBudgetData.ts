import { useCallback, useState } from 'react';
import { BudgetCategory } from '../types/BudgetTypes';

/**
 * Budget data hook — pending R2 backend integration.
 * Returns empty data with isSampleData=true so consumers can display
 * appropriate provenance banners. Does NOT attempt WebSocket connections
 * to non-existent endpoints.
 */
export const useBudgetData = () => {
  const [budgetData] = useState<BudgetCategory[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [lastUpdate] = useState<Date | null>(null);

  const refreshData = useCallback(() => {
    // No-op until backend integration is available
  }, []);

  const updateBudgetCategory = useCallback(
    async (_categoryId: string, _updates: Partial<BudgetCategory>) => {
      // No-op until backend integration is available
    },
    []
  );

  return {
    budgetData,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    updateBudgetCategory,
    /** True — budget data backend not yet integrated */
    isSampleData: true,
  };
};
