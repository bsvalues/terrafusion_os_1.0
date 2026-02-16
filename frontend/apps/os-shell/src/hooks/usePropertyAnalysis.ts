/**
 * ═══════════════════════════════════════════════════════════════
 * USE PROPERTY ANALYSIS HOOK - React Hook for Property AI
 * TerraFusion OS Property Assessment Integration
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useState } from 'react';
import { getToken } from '../auth/authStorage';

interface PropertyData {
  parcelId: string;
  address: string;
  propertyType: string;
  squareFootage: number;
  yearBuilt: number;
  assessedValue: number;
  marketValue: number;
  lastAssessment: Date;
  ownerName: string;
}

interface AIInsights {
  valuationConfidence: number;
  marketTrend: 'up' | 'down' | 'stable';
  complianceStatus: 'compliant' | 'review' | 'issue';
  aiRecommendations: string[];
  comparables: number;
  accuracyScore: number;
  quantumOptimized: boolean;
}

interface PropertyAnalysisResult {
  property: PropertyData;
  insights: AIInsights;
  timestamp: Date;
}

interface UsePropertyAnalysisProps {
  countyId: string;
  apiBaseUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePropertyAnalysisReturn {
  properties: PropertyAnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
  analyzeProperty: (parcelId: string) => Promise<PropertyAnalysisResult | null>;
  analyzeBulk: (parcelIds: string[]) => Promise<PropertyAnalysisResult[]>;
  getRecentProperties: (limit?: number) => PropertyAnalysisResult[];
  clearCache: () => void;
}

export const usePropertyAnalysis = ({
  countyId,
  apiBaseUrl = 'http://localhost:5000/api',
  autoRefresh = false,
  refreshInterval = 60000,
}: UsePropertyAnalysisProps): UsePropertyAnalysisReturn => {
  const [properties, setProperties] = useState<PropertyAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProperty = useCallback(
    async (parcelId: string): Promise<PropertyAnalysisResult | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/AIAssistant/analyze-property?parcelId=${parcelId}&countyId=${countyId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to analyze property: ${response.statusText}`);
        }

        const data = await response.json();

        const result: PropertyAnalysisResult = {
          property: {
            parcelId: data.parcelId,
            address: data.address || 'Unknown',
            propertyType: data.propertyType || 'Unknown',
            squareFootage: data.squareFootage || 0,
            yearBuilt: data.yearBuilt || 0,
            assessedValue: data.assessedValue || 0,
            marketValue: data.marketValue || 0,
            lastAssessment: new Date(data.lastAssessment || Date.now()),
            ownerName: data.ownerName || 'Unknown',
          },
          insights: {
            valuationConfidence: data.valuationConfidence || 0,
            marketTrend: data.marketTrend || 'stable',
            complianceStatus: data.complianceStatus || 'review',
            aiRecommendations: data.aiRecommendations || [],
            comparables: data.comparablesCount || 0,
            accuracyScore: data.accuracyScore || 0,
            quantumOptimized: data.quantumOptimized || false,
          },
          timestamp: new Date(data.analysisTimestamp || Date.now()),
        };

        setProperties((prev) => {
          const filtered = prev.filter((p) => p.property.parcelId !== parcelId);
          return [result, ...filtered].slice(0, 50); // Keep last 50
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error analyzing property:', err);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [countyId, apiBaseUrl]
  );

  const analyzeBulk = useCallback(
    async (parcelIds: string[]): Promise<PropertyAnalysisResult[]> => {
      setIsAnalyzing(true);
      setError(null);

      const results: PropertyAnalysisResult[] = [];

      try {
        // Process in batches of 10
        for (let i = 0; i < parcelIds.length; i += 10) {
          const batch = parcelIds.slice(i, i + 10);
          const batchResults = await Promise.all(
            batch.map((parcelId) => analyzeProperty(parcelId))
          );

          results.push(...(batchResults.filter((r) => r !== null) as PropertyAnalysisResult[]));
        }

        return results;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error in bulk analysis:', err);
        return results;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analyzeProperty]
  );

  const getRecentProperties = useCallback(
    (limit: number = 10) => {
      return properties
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    },
    [properties]
  );

  const clearCache = useCallback(() => {
    setProperties([]);
    setError(null);
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (properties.length > 0) {
        const recentParcelIds = getRecentProperties(5).map((p) => p.property.parcelId);
        analyzeBulk(recentParcelIds);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, properties, getRecentProperties, analyzeBulk]);

  return {
    properties,
    isAnalyzing,
    error,
    analyzeProperty,
    analyzeBulk,
    getRecentProperties,
    clearCache,
  };
};

export default usePropertyAnalysis;
