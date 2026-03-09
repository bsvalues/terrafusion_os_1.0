import { useCallback, useEffect, useRef, useState } from 'react';
import { getViteEnv } from '@/shared/viteEnv';
import { BudgetCategory } from '../types/BudgetTypes';

// Custom hook for managing budget data with real-time updates
export const useBudgetData = () => {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch budget data from TerraLevy Core API
  // TODO: pending R2 backend integration
  const fetchBudgetData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // pending R2 backend integration — will fetch from TerraLevy Core API
      const budgetCategories: BudgetCategory[] = [];

      setBudgetData(budgetCategories);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup real-time WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // In a real implementation, this would connect to TerraLevy's real-time service
        wsRef.current = new WebSocket(`${getViteEnv().VITE_WS_URL || 'ws://localhost:8080'}/budget-updates`);

        wsRef.current.onopen = () => {
          console.debug('Connected to budget data stream');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);

            if (update.type === 'budget_update') {
              setBudgetData((prevData) =>
                prevData.map((category) =>
                  category.id === update.categoryId
                    ? { ...category, ...update.changes, lastUpdated: new Date() }
                    : category
                )
              );
              setLastUpdate(new Date());
            }
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Real-time connection error');
        };

        wsRef.current.onclose = () => {
          console.debug('WebSocket connection closed');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        console.error('Failed to establish WebSocket connection:', err);
      }
    };

    // Initial data fetch
    fetchBudgetData();

    // Setup WebSocket for real-time updates
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchBudgetData]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  // Update budget category
  const updateBudgetCategory = useCallback(
    async (categoryId: string, updates: Partial<BudgetCategory>) => {
      try {
        setBudgetData((prevData) =>
          prevData.map((category) =>
            category.id === categoryId
              ? { ...category, ...updates, lastUpdated: new Date() }
              : category
          )
        );

        // In a real implementation, this would call the TerraLevy API
        // await api.updateBudgetCategory(categoryId, updates);

        setLastUpdate(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update budget category');
      }
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
