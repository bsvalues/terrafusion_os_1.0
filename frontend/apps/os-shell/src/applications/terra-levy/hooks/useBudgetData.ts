import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import { BudgetCategory } from '../types/BudgetTypes';

/**
 * Budget data hook — API-first levy budget loading with explicit fallback provenance.
 * Reads the current levy dashboard/budget endpoints and marks the result as sample
 * when those endpoints return stub payloads or no category data yet.
 */
export const useBudgetData = () => {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSampleData, setIsSampleData] = useState(true);

  const loadBudgetData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const responses = await Promise.allSettled([
        api.get('/levy/dashboard/summary'),
        api.get('/levy/budget/scenarios'),
        api.get('/levy/budget/visualization'),
      ]);

      const categories = responses.flatMap((result) => {
        if (result.status !== 'fulfilled') {
          return [];
        }

        const payload = result.value.data as
          | BudgetCategory[]
          | { categories?: BudgetCategory[]; data?: BudgetCategory[]; results?: BudgetCategory[]; status?: string; message?: string }
          | null;

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
      });

      if (categories.length > 0) {
        setBudgetData(categories);
        setIsSampleData(false);
      } else {
        setBudgetData([]);
        setIsSampleData(true);
        setError('Levy budget endpoints returned no category data.');
      }
    } catch (cause) {
      setBudgetData([]);
      setIsSampleData(true);
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

  const updateBudgetCategory = useCallback(async (categoryId: string, updates: Partial<BudgetCategory>) => {
    setBudgetData((current) =>
      current.map((category) =>
        category.id === categoryId ? { ...category, ...updates, lastUpdated: new Date() } : category
      )
    );
    setLastUpdate(new Date());
  }, []);

  return {
    budgetData,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    updateBudgetCategory,
    /** True when the hook had to fall back because live levy budget categories are absent. */
    isSampleData,
  };
};
