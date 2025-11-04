// Custom React Hook for Quantum AI Metrics
// MIT PhD-Level Analytics Platform

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { QuantumAIService, QuantumAIHub } from '../services/quantum-ai-api'
import type { AdvancedAIMetrics } from '../types/quantum-ai'

export function useQuantumMetrics() {
  const queryClient = useQueryClient()
  const hubRef = useRef<QuantumAIHub | null>(null)

  // Fetch initial metrics
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery<AdvancedAIMetrics>({
    queryKey: ['quantum-metrics'],
    queryFn: () => QuantumAIService.getAdvancedMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  })

  // Setup real-time updates via SignalR
  useEffect(() => {
    const hub = new QuantumAIHub()

    hub.connect().then(() => {
      hub.onMetricsUpdate((updatedMetrics) => {
        queryClient.setQueryData(['quantum-metrics'], updatedMetrics)
      })

      hubRef.current = hub
    })

    return () => {
      hub.disconnect()
    }
  }, [queryClient])

  return {
    metrics,
    isLoading,
    error,
    refetch,
  }
}

export function useSwarmStatus() {
  return useQuery({
    queryKey: ['swarm-status'],
    queryFn: () => QuantumAIService.getSwarmStatus(),
    refetchInterval: 15000, // 15 seconds
  })
}

export function useActiveAgents() {
  return useQuery({
    queryKey: ['active-agents'],
    queryFn: () => QuantumAIService.getActiveAgents(),
    refetchInterval: 20000, // 20 seconds
  })
}

export function useEmergentPatterns() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['emergent-patterns'],
    queryFn: () => QuantumAIService.getEmergentPatterns(),
    refetchInterval: 60000, // 1 minute
  })

  // Setup real-time pattern detection notifications
  useEffect(() => {
    const hub = new QuantumAIHub()

    hub.connect().then(() => {
      hub.onEmergentPatternDetected((pattern) => {
        queryClient.invalidateQueries({ queryKey: ['emergent-patterns'] })
        console.log('🧬 New emergent pattern detected:', pattern)
      })
    })

    return () => {
      hub.disconnect()
    }
  }, [queryClient])

  return query
}

export function usePredictiveInsights(domain: string) {
  return useQuery({
    queryKey: ['predictive-insights', domain],
    queryFn: () => QuantumAIService.getPredictiveInsights(domain),
    enabled: !!domain,
  })
}

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => QuantumAIService.getAnalyticsDashboard(),
    refetchInterval: 30000, // 30 seconds
  })
}

export function useRevenueForecast(
  jurisdiction: string,
  months: number = 12,
  scenario: string = 'Base'
) {
  return useQuery({
    queryKey: ['revenue-forecast', jurisdiction, months, scenario],
    queryFn: () => QuantumAIService.getRevenueForecast(jurisdiction, months, scenario),
    enabled: !!jurisdiction,
    staleTime: 300000, // 5 minutes
  })
}
