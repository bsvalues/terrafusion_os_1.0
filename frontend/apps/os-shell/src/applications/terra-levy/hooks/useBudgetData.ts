import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import { BudgetCategory } from '../types/BudgetTypes';

/**
 * Budget data hook — API-first levy budget loading with explicit live-data gaps.
 * Reads the current levy dashboard/budget endpoints and reports a governed
 * unavailable state when no certified budget-category mapping exists yet.
 */
type BudgetCategoryEnvelope =
  | BudgetCategory[]
  | {
      categories?: BudgetCategory[];
      data?: BudgetCategory[];
      results?: BudgetCategory[];
      status?: string;
      message?: string;
    }
  | null;

function extractCategories(payload: BudgetCategoryEnvelope): BudgetCategory[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.categories)) {
    return payload.categories;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

export const useBudgetData = () => {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadBudgetData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const responses = await Promise.allSettled([
        api.get('/levy/dashboard/summary'),
        api.get('/levy/budget/scenarios'),
        api.get('/levy/budget/visualization'),
      ]);

      const categories = responses.flatMap((result) =>
        result.status === 'fulfilled'
          ? extractCategories(result.value.data as BudgetCategoryEnvelope)
          : []
      );

      if (categories.length > 0) {
        setBudgetData(categories);
      } else {
        setBudgetData([]);
        setError('Live levy budget endpoints returned no certified budget-category data.');
      }
    } catch (cause) {
      setBudgetData([]);
      setError(cause instanceof Error ? cause.message : 'Failed to load budget data.');
    } finally {
      setLastUpdate(new Date());
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBudgetData();
  }, [loadBudgetData]);

  const refreshData = useCallback(async () => {
    await loadBudgetData();
  }, [loadBudgetData]);

  const updateBudgetCategory = useCallback(
    async (categoryId: string, updates: Partial<BudgetCategory>) => {
      setBudgetData((current) =>
        current.map((category) =>
          category.id === categoryId
            ? { ...category, ...updates, lastUpdated: new Date() }
            : category
        )
      );
      setLastUpdate(new Date());
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
  };
};
