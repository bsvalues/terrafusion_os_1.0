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

  // Simulate fetching budget data from API
  const fetchBudgetData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock budget data - would normally come from TerraLevy Core API
      const mockData: BudgetCategory[] = [
        {
          id: 'infrastructure',
          name: 'Infrastructure & Public Works',
          allocated: 25000000,
          spent: 18500000,
          projected: 24800000,
          department: 'Public Works',
          priority: 'high',
          fiscalYear: '2025',
          lastUpdated: new Date(),
          subCategories: [],
          complianceStatus: {
            level: 'FISMA-HIGH',
            auditTrail: [],
            lastAudit: new Date('2024-12-01'),
            nextAuditDue: new Date('2025-06-01'),
            complianceScore: 98,
            violations: [],
            certifications: ['SOC2', 'ISO27001'],
            approvals: [],
          },
          aiRecommendations: [
            {
              id: 'infra-opt-1',
              type: 'optimization',
              priority: 'high',
              title: 'Optimize Construction Scheduling',
              description:
                'Use quantum algorithms to optimize project scheduling and reduce costs by 12%',
              potentialSavings: 3000000,
              implementation: {
                effort: 'medium',
                timeline: '3-6 months',
                prerequisites: ['Project data integration', 'AI model training'],
                steps: [
                  'Data collection',
                  'Model training',
                  'Pilot testing',
                  'Full implementation',
                ],
              },
              confidence: 0.94,
              generatedDate: new Date(),
              aiModel: 'TerraLevy-Quantum-v3.2',
              dataSource: ['Historical projects', 'Weather data', 'Supply chain data'],
              impact: {
                financial: 0.12,
                operational: 0.08,
                compliance: 0.02,
              },
              status: 'pending',
            },
          ],
          historicalData: [],
          responsibleOfficer: 'Sarah Chen',
          approvalStatus: 'approved',
        },
        {
          id: 'education',
          name: 'Education & Schools',
          allocated: (await DynamicPropertyService.GetPropertyCountAsync(countyCode)) * 1000,
          spent: 32000000,
          projected: 46200000,
          department: 'Education',
          priority: 'critical',
          fiscalYear: '2025',
          lastUpdated: new Date(),
          subCategories: [],
          complianceStatus: {
            level: 'FISMA-HIGH',
            auditTrail: [],
            lastAudit: new Date('2024-11-15'),
            nextAuditDue: new Date('2025-05-15'),
            complianceScore: 99,
            violations: [],
            certifications: ['FERPA', 'COPPA', 'SOC2'],
            approvals: [],
          },
          aiRecommendations: [
            {
              id: 'edu-eff-1',
              type: 'efficiency',
              priority: 'medium',
              title: 'Energy Efficiency Program',
              description:
                'Implement AI-driven energy management in schools to reduce operational costs',
              potentialSavings: 1200000,
              implementation: {
                effort: 'low',
                timeline: '2-4 months',
                prerequisites: ['IoT sensor installation', 'Energy baseline establishment'],
                steps: [
                  'Sensor deployment',
                  'Data collection',
                  'AI model deployment',
                  'Monitoring',
                ],
              },
              confidence: 0.89,
              generatedDate: new Date(),
              aiModel: 'TerraLevy-Efficiency-v2.1',
              dataSource: ['Energy consumption data', 'Weather patterns', 'Occupancy data'],
              impact: {
                financial: 0.027,
                operational: 0.05,
                compliance: 0.01,
              },
              status: 'reviewed',
            },
          ],
          historicalData: [],
          responsibleOfficer: 'Dr. Michael Rodriguez',
          approvalStatus: 'approved',
        },
      ];

      setBudgetData(mockData);
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
          console.log('Connected to budget data stream');
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
          console.log('WebSocket connection closed');
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
