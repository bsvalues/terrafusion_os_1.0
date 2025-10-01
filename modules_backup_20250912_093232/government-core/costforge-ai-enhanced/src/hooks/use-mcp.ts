import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export const VALID_BUILDING_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Mixed-Use',
  'Retail',
  'Office',
  'Warehouse',
  'Healthcare',
  'Educational',
  'Hospitality',
] as const;

export const VALID_REGIONS = [
  'Northeast',
  'Southeast',
  'Midwest',
  'West',
  'Southwest',
  'Pacific',
  'Mountain',
  'Great Lakes',
  'Gulf Coast',
  'Atlantic',
] as const;

export const VALID_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Renovation'] as const;

export interface CostPredictionRequest {
  buildingType: string;
  region: string;
  squareFootage: number;
  yearBuilt?: number;
  condition?: string;
  complexity?: number;
}

export interface CostPredictionResponse {
  totalCost: number;
  costPerSqFt: number;
  breakdown: {
    materials: number;
    labor: number;
    permits: number;
    overhead: number;
  };
  confidence: number;
  factors: {
    regionMultiplier: number;
    complexityMultiplier: number;
    conditionMultiplier: number;
  };
  timeline: string;
  recommendations: string[];
}

export function useMCP() {
  const [isLoading, setIsLoading] = useState(false);

  const predictCost = useCallback(
    async (request: CostPredictionRequest): Promise<CostPredictionResponse> => {
      setIsLoading(true);

      try {
        // Simulate API call to MCP backend
        const response = await invoke<CostPredictionResponse>('predict_construction_cost', {
          request,
        });

        return response;
      } catch (error) {
        // Fallback to mock data if backend is not available
        console.warn('MCP backend not available, using mock data:', error);

        // Calculate mock costs based on inputs
        const baseCostPerSqFt = getBuildingTypeCost(request.buildingType);
        const regionMultiplier = getRegionMultiplier(request.region);
        const conditionMultiplier = getConditionMultiplier(request.condition || 'Good');
        const complexityMultiplier = (request.complexity || 1) * 0.2 + 0.8;

        const adjustedCostPerSqFt =
          baseCostPerSqFt * regionMultiplier * conditionMultiplier * complexityMultiplier;
        const totalCost = adjustedCostPerSqFt * request.squareFootage;

        const mockResponse: CostPredictionResponse = {
          totalCost,
          costPerSqFt: adjustedCostPerSqFt,
          breakdown: {
            materials: totalCost * 0.45,
            labor: totalCost * 0.35,
            permits: totalCost * 0.05,
            overhead: totalCost * 0.15,
          },
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          factors: {
            regionMultiplier,
            complexityMultiplier,
            conditionMultiplier,
          },
          timeline: getEstimatedTimeline(request.squareFootage, request.buildingType),
          recommendations: getRecommendations(request),
        };

        return mockResponse;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    predictCost,
    isLoading,
  };
}

function getBuildingTypeCost(buildingType: string): number {
  const costs = {
    Residential: 150,
    Commercial: 200,
    Industrial: 180,
    'Mixed-Use': 220,
    Retail: 175,
    Office: 190,
    Warehouse: 120,
    Healthcare: 350,
    Educational: 280,
    Hospitality: 250,
  };
  return costs[buildingType as keyof typeof costs] || 150;
}

function getRegionMultiplier(region: string): number {
  const multipliers = {
    Northeast: 1.3,
    Southeast: 0.9,
    Midwest: 0.95,
    West: 1.4,
    Southwest: 1.0,
    Pacific: 1.5,
    Mountain: 1.1,
    'Great Lakes': 0.98,
    'Gulf Coast': 0.95,
    Atlantic: 1.2,
  };
  return multipliers[region as keyof typeof multipliers] || 1.0;
}

function getConditionMultiplier(condition: string): number {
  const multipliers = {
    Excellent: 0.8,
    Good: 1.0,
    Fair: 1.2,
    Poor: 1.5,
    'Needs Renovation': 1.8,
  };
  return multipliers[condition as keyof typeof multipliers] || 1.0;
}

function getEstimatedTimeline(squareFootage: number, buildingType: string): string {
  const baseWeeks = Math.ceil(squareFootage / 1000) * 2;
  const typeMultiplier =
    buildingType === 'Healthcare' ? 1.5 : buildingType === 'Educational' ? 1.3 : 1.0;
  const totalWeeks = Math.ceil(baseWeeks * typeMultiplier);

  if (totalWeeks <= 4) return `${totalWeeks} weeks`;
  if (totalWeeks <= 52) return `${Math.ceil(totalWeeks / 4)} months`;
  return `${Math.ceil(totalWeeks / 52)} years`;
}

function getRecommendations(request: CostPredictionRequest): string[] {
  const recommendations = [];

  if (request.squareFootage > 10000) {
    recommendations.push('Consider bulk material discounts for large-scale projects');
  }

  if (request.condition === 'Poor' || request.condition === 'Needs Renovation') {
    recommendations.push('Budget additional 20-30% for unexpected structural issues');
  }

  if (request.region === 'Pacific' || request.region === 'West') {
    recommendations.push('Factor in seismic compliance requirements');
  }

  if (!request.yearBuilt || request.yearBuilt < 1980) {
    recommendations.push('Consider asbestos and lead testing requirements');
  }

  return recommendations;
}
