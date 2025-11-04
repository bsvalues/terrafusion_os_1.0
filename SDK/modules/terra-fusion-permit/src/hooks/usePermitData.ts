/**
 * TerraFusion Permit System - React Query Hooks
 * Government. Transcended. - Elite Permit Data Management
 *
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TerraPermit,
  PermitAnalytics,
  PermitMetrics,
  PermitStatus,
  PermitType
} from '../types';
import {
  mockPermits,
  mockAnalytics,
  mockMetrics
} from '../data/mockData';

// Query Keys
export const permitKeys = {
  all: ['permits'] as const,
  lists: () => [...permitKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...permitKeys.lists(), filters] as const,
  details: () => [...permitKeys.all, 'detail'] as const,
  detail: (id: string) => [...permitKeys.details(), id] as const,
  analytics: () => [...permitKeys.all, 'analytics'] as const,
  metrics: () => [...permitKeys.all, 'metrics'] as const,
};

// Permits Query Hooks
export const usePermits = (filters?: {
  status?: PermitStatus;
  type?: PermitType;
  priority?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: permitKeys.list(filters || {}),
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let filteredPermits = [...mockPermits];

      if (filters?.status) {
        filteredPermits = filteredPermits.filter(permit => permit.status === filters.status);
      }

      if (filters?.type) {
        filteredPermits = filteredPermits.filter(permit => permit.type === filters.type);
      }

      if (filters?.priority) {
        filteredPermits = filteredPermits.filter(permit => permit.priority === filters.priority);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredPermits = filteredPermits.filter(permit =>
          permit.title.toLowerCase().includes(searchTerm) ||
          permit.permitNumber.toLowerCase().includes(searchTerm) ||
          permit.applicant.name.toLowerCase().includes(searchTerm)
        );
      }

      return filteredPermits;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePermit = (id: string) => {
  return useQuery({
    queryKey: permitKeys.detail(id),
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const permit = mockPermits.find(p => p.id === id);
      if (!permit) {
        throw new Error(`Permit with id ${id} not found`);
      }

      return permit;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

// Analytics Query Hooks
export const usePermitAnalytics = () => {
  return useQuery({
    queryKey: permitKeys.analytics(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add some dynamic data
      const dynamicAnalytics: PermitAnalytics = {
        ...mockAnalytics,
        totalPermits: mockAnalytics.totalPermits + Math.floor(Math.random() * 10),
        activePermits: mockAnalytics.activePermits + Math.floor(Math.random() * 5) - 2,
        revenueGenerated: mockAnalytics.revenueGenerated + Math.floor(Math.random() * 5000),
        averageProcessingTime: mockAnalytics.averageProcessingTime + (Math.random() * 2 - 1),
        complianceScore: Math.min(100, mockAnalytics.complianceScore + (Math.random() * 5 - 2.5)),
        quantumOptimizationScore: Math.min(100, mockAnalytics.quantumOptimizationScore + (Math.random() * 3 - 1.5))
      };

      return dynamicAnalytics;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const usePermitMetrics = () => {
  return useQuery({
    queryKey: permitKeys.metrics(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      // Add some dynamic variance to metrics
      const dynamicMetrics: PermitMetrics = {
        efficiency: Math.min(100, mockMetrics.efficiency + (Math.random() * 4 - 2)),
        customerSatisfaction: Math.min(100, mockMetrics.customerSatisfaction + (Math.random() * 3 - 1.5)),
        complianceRate: Math.min(100, mockMetrics.complianceRate + (Math.random() * 2 - 1)),
        revenueGrowth: mockMetrics.revenueGrowth + (Math.random() * 6 - 3),
        processingSpeed: Math.min(100, mockMetrics.processingSpeed + (Math.random() * 5 - 2.5)),
        digitalAdoption: Math.min(100, mockMetrics.digitalAdoption + (Math.random() * 2 - 1))
      };

      return dynamicMetrics;
    },
    staleTime: 45 * 1000, // 45 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 25 * 1000, // Refetch every 25 seconds
  });
};

// Real-time Dashboard Data Hook
export const useRealTimePermitData = () => {
  return useQuery({
    queryKey: ['realTimePermitData'],
    queryFn: async () => {
      // Mock real-time permit system data
      return {
        quantum_factor: 949,
        active_permits: Math.floor(Math.random() * 150) + 50,
        processing_efficiency: Math.random() * 10 + 90,
        compliance_score: Math.random() * 5 + 95,
        revenue_today: Math.floor(Math.random() * 5000) + 2000,
        average_processing_time: Math.random() * 5 + 12,
        digital_adoption_rate: Math.random() * 3 + 92,
        customer_satisfaction: Math.random() * 4 + 86,
        last_updated: new Date().toISOString()
      };
    },
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 4000,
    gcTime: 30 * 1000,
  });
};

// Permit Mutation Hooks
export const useUpdatePermitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ permitId, status }: { permitId: string; status: PermitStatus }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find and update permit in mock data
      const permit = mockPermits.find(p => p.id === permitId);
      if (!permit) {
        throw new Error(`Permit ${permitId} not found`);
      }

      permit.status = status;
      permit.lastUpdated = new Date().toISOString();

      return permit;
    },
    onSuccess: (updatedPermit) => {
      // Update permit detail cache
      queryClient.setQueryData(
        permitKeys.detail(updatedPermit.id),
        updatedPermit
      );

      // Invalidate permits list to refetch
      queryClient.invalidateQueries({
        queryKey: permitKeys.lists()
      });

      // Invalidate analytics to reflect changes
      queryClient.invalidateQueries({
        queryKey: permitKeys.analytics()
      });
    },
    onError: (error) => {
      console.error('Failed to update permit status:', error);
    }
  });
};

export const useCreatePermit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permitData: Partial<TerraPermit>) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const newPermit: TerraPermit = {
        id: `permit-${Date.now()}`,
        permitNumber: `TF-2024-${String(mockPermits.length + 1).padStart(3, '0')}`,
        status: 'draft',
        priority: 'medium',
        submittedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        assignedTo: undefined,
        reviewers: [],
        fees: [],
        documents: [],
        workflow: {
          currentStep: {
            id: 'step-initial',
            name: 'Application Preparation',
            description: 'Preparing application for submission',
            order: 0,
            estimatedDays: 1,
            status: 'in_progress',
            required: true
          },
          steps: [],
          completedSteps: [],
          estimatedDays: 0
        },
        compliance: [],
        notes: [],
        quantumOptimization: false,
        terraFusionScore: 50,
        ...permitData
      } as TerraPermit;

      mockPermits.push(newPermit);
      return newPermit;
    },
    onSuccess: (newPermit) => {
      // Invalidate permits list to show new permit
      queryClient.invalidateQueries({
        queryKey: permitKeys.lists()
      });

      // Invalidate analytics to reflect new permit
      queryClient.invalidateQueries({
        queryKey: permitKeys.analytics()
      });
    },
    onError: (error) => {
      console.error('Failed to create permit:', error);
    }
  });
};

// Bulk Operations Hook
export const useBulkUpdatePermits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ permitIds, updates }: {
      permitIds: string[];
      updates: Partial<TerraPermit>
    }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedPermits = mockPermits
        .filter(permit => permitIds.includes(permit.id))
        .map(permit => ({
          ...permit,
          ...updates,
          lastUpdated: new Date().toISOString()
        }));

      return updatedPermits;
    },
    onSuccess: () => {
      // Invalidate all permit-related queries
      queryClient.invalidateQueries({
        queryKey: permitKeys.all
      });
    },
    onError: (error) => {
      console.error('Failed to bulk update permits:', error);
    }
  });
};
