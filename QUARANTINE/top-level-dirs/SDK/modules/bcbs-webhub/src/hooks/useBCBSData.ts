// TerraFusion Elite Government OS BCBS WebHub Data Hooks
// Government. Transcended.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TerraBuilding, 
  TerraPermit, 
  TerraInspection, 
  TerraViolation, 
  TerraBusinessLicense, 
  TerraCorrespondence,
  TerraBCBSAnalytics,
  TerraBCBSMetrics,
  TerraBCBSResponse,
  TerraPaginatedResponse,
  TerraFilterOptions
} from '../types';
import { 
  mockBuildings,
  mockPermits,
  mockInspections,
  mockViolations,
  mockBusinessLicenses,
  mockCorrespondence,
  mockBCBSAnalytics,
  mockBCBSMetrics
} from '../data/mockData';

// Simulated API delay
const simulateApiDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Buildings Hooks
export function useBuildingsData(filters?: TerraFilterOptions) {
  return useQuery({
    queryKey: ['buildings', filters],
    queryFn: async (): Promise<TerraPaginatedResponse<TerraBuilding>> => {
      await simulateApiDelay();
      
      let filteredBuildings = [...mockBuildings];
      
      if (filters?.status) {
        filteredBuildings = filteredBuildings.filter(building => 
          filters.status!.includes(building.status)
        );
      }
      
      if (filters?.type) {
        filteredBuildings = filteredBuildings.filter(building => 
          filters.type!.includes(building.buildingType)
        );
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredBuildings = filteredBuildings.filter(building =>
          building.address.toLowerCase().includes(searchTerm) ||
          building.parcelNumber.toLowerCase().includes(searchTerm) ||
          building.owner.name.toLowerCase().includes(searchTerm)
        );
      }
      
      return {
        data: filteredBuildings,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredBuildings.length,
          totalPages: 1
        },
        success: true,
        message: 'Buildings retrieved successfully'
      };
    },
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

export function useBuildingById(buildingId: string) {
  return useQuery({
    queryKey: ['building', buildingId],
    queryFn: async (): Promise<TerraBCBSResponse<TerraBuilding>> => {
      await simulateApiDelay();
      
      const building = mockBuildings.find(b => b.id === buildingId);
      
      if (!building) {
        throw new Error('Building not found');
      }
      
      return {
        data: building,
        success: true,
        message: 'Building retrieved successfully',
        timestamp: new Date(),
        requestId: `req-${Date.now()}`
      };
    },
    enabled: !!buildingId,
    gcTime: 1000 * 60 * 10,
    staleTime: 1000 * 60 * 5
  });
}

// Permits Hooks
export function usePermitsData(filters?: TerraFilterOptions) {
  return useQuery({
    queryKey: ['permits', filters],
    queryFn: async (): Promise<TerraPaginatedResponse<TerraPermit>> => {
      await simulateApiDelay();
      
      let filteredPermits = [...mockPermits];
      
      if (filters?.status) {
        filteredPermits = filteredPermits.filter(permit => 
          filters.status!.includes(permit.status)
        );
      }
      
      if (filters?.type) {
        filteredPermits = filteredPermits.filter(permit => 
          filters.type!.includes(permit.type)
        );
      }
      
      if (filters?.priority) {
        filteredPermits = filteredPermits.filter(permit => 
          filters.priority!.includes(permit.priority)
        );
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredPermits = filteredPermits.filter(permit =>
          permit.permitNumber.toLowerCase().includes(searchTerm) ||
          permit.description.toLowerCase().includes(searchTerm) ||
          permit.applicant.name.toLowerCase().includes(searchTerm)
        );
      }
      
      return {
        data: filteredPermits,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredPermits.length,
          totalPages: 1
        },
        success: true,
        message: 'Permits retrieved successfully'
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    retry: 3
  });
}

export function usePermitById(permitId: string) {
  return useQuery({
    queryKey: ['permit', permitId],
    queryFn: async (): Promise<TerraBCBSResponse<TerraPermit>> => {
      await simulateApiDelay();
      
      const permit = mockPermits.find(p => p.id === permitId);
      
      if (!permit) {
        throw new Error('Permit not found');
      }
      
      return {
        data: permit,
        success: true,
        message: 'Permit retrieved successfully',
        timestamp: new Date(),
        requestId: `req-${Date.now()}`
      };
    },
    enabled: !!permitId,
    gcTime: 1000 * 60 * 10,
    staleTime: 1000 * 60 * 5
  });
}

// Inspections Hooks
export function useInspectionsData(filters?: TerraFilterOptions) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: async (): Promise<TerraPaginatedResponse<TerraInspection>> => {
      await simulateApiDelay();
      
      let filteredInspections = [...mockInspections];
      
      if (filters?.status) {
        filteredInspections = filteredInspections.filter(inspection => 
          filters.status!.includes(inspection.status)
        );
      }
      
      if (filters?.type) {
        filteredInspections = filteredInspections.filter(inspection => 
          filters.type!.includes(inspection.type)
        );
      }
      
      return {
        data: filteredInspections,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredInspections.length,
          totalPages: 1
        },
        success: true,
        message: 'Inspections retrieved successfully'
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    retry: 3
  });
}

// Violations Hooks
export function useViolationsData(filters?: TerraFilterOptions) {
  return useQuery({
    queryKey: ['violations', filters],
    queryFn: async (): Promise<TerraPaginatedResponse<TerraViolation>> => {
      await simulateApiDelay();
      
      let filteredViolations = [...mockViolations];
      
      if (filters?.status) {
        filteredViolations = filteredViolations.filter(violation => 
          filters.status!.includes(violation.status)
        );
      }
      
      return {
        data: filteredViolations,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredViolations.length,
          totalPages: 1
        },
        success: true,
        message: 'Violations retrieved successfully'
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    retry: 3
  });
}

// Business Licenses Hooks
export function useBusinessLicensesData(filters?: TerraFilterOptions) {
  return useQuery({
    queryKey: ['business-licenses', filters],
    queryFn: async (): Promise<TerraPaginatedResponse<TerraBusinessLicense>> => {
      await simulateApiDelay();
      
      let filteredLicenses = [...mockBusinessLicenses];
      
      if (filters?.status) {
        filteredLicenses = filteredLicenses.filter(license => 
          filters.status!.includes(license.status)
        );
      }
      
      return {
        data: filteredLicenses,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredLicenses.length,
          totalPages: 1
        },
        success: true,
        message: 'Business licenses retrieved successfully'
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    retry: 3
  });
}

// Correspondence Hooks
export function useCorrespondenceData(filters?: TerraFilterOptions) {
  return useQuery({
    queryKey: ['correspondence', filters],
    queryFn: async (): Promise<TerraPaginatedResponse<TerraCorrespondence>> => {
      await simulateApiDelay();
      
      let filteredCorrespondence = [...mockCorrespondence];
      
      if (filters?.status) {
        filteredCorrespondence = filteredCorrespondence.filter(corr => 
          filters.status!.includes(corr.status)
        );
      }
      
      if (filters?.priority) {
        filteredCorrespondence = filteredCorrespondence.filter(corr => 
          filters.priority!.includes(corr.priority)
        );
      }
      
      return {
        data: filteredCorrespondence,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredCorrespondence.length,
          totalPages: 1
        },
        success: true,
        message: 'Correspondence retrieved successfully'
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    retry: 3
  });
}

// Analytics Hooks
export function useBCBSAnalytics() {
  return useQuery({
    queryKey: ['bcbs-analytics'],
    queryFn: async (): Promise<TerraBCBSResponse<TerraBCBSAnalytics>> => {
      await simulateApiDelay(500);
      
      return {
        data: mockBCBSAnalytics,
        success: true,
        message: 'Analytics retrieved successfully',
        timestamp: new Date(),
        requestId: `analytics-${Date.now()}`
      };
    },
    gcTime: 1000 * 60 * 10, // 10 minutes for analytics
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchInterval: 1000 * 60 * 5 // Auto-refresh every 5 minutes
  });
}

export function useBCBSMetrics() {
  return useQuery({
    queryKey: ['bcbs-metrics'],
    queryFn: async (): Promise<TerraBCBSResponse<TerraBCBSMetrics[]>> => {
      await simulateApiDelay(300);
      
      return {
        data: mockBCBSMetrics,
        success: true,
        message: 'Real-time metrics retrieved successfully',
        timestamp: new Date(),
        requestId: `metrics-${Date.now()}`
      };
    },
    gcTime: 1000 * 60 * 2, // 2 minutes for real-time data
    staleTime: 1000 * 30, // 30 seconds
    retry: 2,
    refetchInterval: 1000 * 60 // Auto-refresh every minute
  });
}

// Mutation Hooks for CRUD operations
export function useCreatePermit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (permitData: Partial<TerraPermit>): Promise<TerraBCBSResponse<TerraPermit>> => {
      await simulateApiDelay(1200);
      
      const newPermit: TerraPermit = {
        id: `permit-${Date.now()}`,
        permitNumber: `AUTO-${Date.now()}`,
        ...permitData
      } as TerraPermit;
      
      mockPermits.unshift(newPermit);
      
      return {
        data: newPermit,
        success: true,
        message: 'Permit created successfully',
        timestamp: new Date(),
        requestId: `create-${Date.now()}`
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['bcbs-analytics'] });
    }
  });
}

export function useUpdatePermitStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      permitId, 
      status, 
      notes 
    }: { 
      permitId: string; 
      status: TerraPermit['status']; 
      notes?: string; 
    }): Promise<TerraBCBSResponse<TerraPermit>> => {
      await simulateApiDelay(800);
      
      const permitIndex = mockPermits.findIndex(p => p.id === permitId);
      if (permitIndex === -1) {
        throw new Error('Permit not found');
      }
      
      mockPermits[permitIndex] = {
        ...mockPermits[permitIndex],
        status,
        notes: notes || mockPermits[permitIndex].notes,
        updatedAt: new Date()
      };
      
      return {
        data: mockPermits[permitIndex],
        success: true,
        message: 'Permit status updated successfully',
        timestamp: new Date(),
        requestId: `update-${Date.now()}`
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit', data.data.id] });
      queryClient.invalidateQueries({ queryKey: ['bcbs-analytics'] });
    }
  });
}

export function useScheduleInspection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inspectionData: Partial<TerraInspection>): Promise<TerraBCBSResponse<TerraInspection>> => {
      await simulateApiDelay(1000);
      
      const newInspection: TerraInspection = {
        id: `inspection-${Date.now()}`,
        inspectionNumber: `INS-${Date.now()}`,
        ...inspectionData
      } as TerraInspection;
      
      mockInspections.unshift(newInspection);
      
      return {
        data: newInspection,
        success: true,
        message: 'Inspection scheduled successfully',
        timestamp: new Date(),
        requestId: `schedule-${Date.now()}`
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['bcbs-analytics'] });
    }
  });
}

export function useCreateCorrespondence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (correspondenceData: Partial<TerraCorrespondence>): Promise<TerraBCBSResponse<TerraCorrespondence>> => {
      await simulateApiDelay(900);
      
      const newCorrespondence: TerraCorrespondence = {
        id: `corr-${Date.now()}`,
        correspondenceNumber: `CORR-${Date.now()}`,
        trackingNumber: `TRK-${Date.now()}`,
        sentDate: new Date(),
        status: 'sent',
        ...correspondenceData
      } as TerraCorrespondence;
      
      mockCorrespondence.unshift(newCorrespondence);
      
      return {
        data: newCorrespondence,
        success: true,
        message: 'Correspondence sent successfully',
        timestamp: new Date(),
        requestId: `send-${Date.now()}`
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondence'] });
      queryClient.invalidateQueries({ queryKey: ['bcbs-analytics'] });
    }
  });
}

// Real-time data refresh hook
export function useRealTimeRefresh() {
  const queryClient = useQueryClient();
  
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['bcbs-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['permits'] });
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
    queryClient.invalidateQueries({ queryKey: ['violations'] });
    queryClient.invalidateQueries({ queryKey: ['correspondence'] });
  };
  
  return { refreshAllData };
}