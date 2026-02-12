// TrueAutomation/PACS Quantum AI API Service
// MIT PhD-Level Analytics Platform - Backend Integration

import axios from 'axios'
import type { AdvancedAIMetrics, AnalyticsDashboardData, RevenueForecast } from '../types/quantum-ai'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const QuantumAIService = {
  // Advanced AI System Initialization
  async initializeAdvancedAI() {
    const response = await apiClient.post('/v2/AdvancedAI/initialize')
    return response.data
  },

  // Get comprehensive AI metrics
  async getAdvancedMetrics(): Promise<AdvancedAIMetrics> {
    const response = await apiClient.get('/v2/AdvancedAI/metrics')
    return response.data.metrics
  },

  // Get system health
  async getSystemHealth() {
    const response = await apiClient.get('/v2/AdvancedAI/health')
    return response.data
  },

  // Get AI capabilities
  async getCapabilities() {
    const response = await apiClient.get('/v2/AdvancedAI/capabilities')
    return response.data
  },

  // Process advanced AI request
  async processAdvancedRequest(request: {
    requestId?: string
    requestType: string
    textInput?: string
    requiresQuantumOptimization?: boolean
    optimizationType?: string
    optimizationParameters?: Record<string, number>
    priority?: string
  }) {
    const response = await apiClient.post('/v2/AdvancedAI/process', request)
    return response.data
  },

  // Get analytics dashboard data
  async getAnalyticsDashboard(): Promise<AnalyticsDashboardData> {
    const response = await apiClient.get('/api/analytics/dashboard')
    return response.data
  },

  // Get revenue forecast
  async getRevenueForecast(
    jurisdiction: string,
    months: number = 12,
    scenario: string = 'Base'
  ): Promise<RevenueForecast> {
    const response = await apiClient.post('/api/analytics/revenue-forecast', {
      jurisdiction,
      forecastMonths: months,
      scenario,
    })
    return response.data
  },

  // Get swarm status
  async getSwarmStatus() {
    const response = await apiClient.get('/api/swarm/status')
    return response.data
  },

  // Get active agents
  async getActiveAgents() {
    const response = await apiClient.get('/api/swarm/agents')
    return response.data
  },

  // Get emergent patterns
  async getEmergentPatterns() {
    const response = await apiClient.get('/api/swarm/patterns')
    return response.data
  },

  // Get predictive insights
  async getPredictiveInsights(domain: string) {
    const response = await apiClient.post('/api/analytics/insights', { domain })
    return response.data
  },

  // Get property valuation
  async getPropertyValuation(propertyId: string) {
    const response = await apiClient.post('/api/ai/property-valuation', { propertyId })
    return response.data
  },

  // Perform quantum optimization
  async performQuantumOptimization(request: {
    optimizationType: string
    parameters: Record<string, unknown>
  }) {
    const response = await apiClient.post('/api/quantum/optimize', request)
    return response.data
  },
}

// SignalR Hub Connection for Real-Time Updates
export class QuantumAIHub {
  private connection: any

  async connect() {
    const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr')

    this.connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/quantum-ai`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build()

    await this.connection.start()
    console.log('✅ Connected to Quantum AI Hub')
  }

  onMetricsUpdate(callback: (metrics: AdvancedAIMetrics) => void) {
    this.connection?.on('MetricsUpdate', callback)
  }

  onSwarmStatusUpdate(callback: (status: unknown) => void) {
    this.connection?.on('SwarmStatusUpdate', callback)
  }

  onEmergentPatternDetected(callback: (pattern: unknown) => void) {
    this.connection?.on('EmergentPatternDetected', callback)
  }

  onInsightGenerated(callback: (insight: unknown) => void) {
    this.connection?.on('InsightGenerated', callback)
  }

  async disconnect() {
    await this.connection?.stop()
    console.log('🔌 Disconnected from Quantum AI Hub')
  }
}

export default QuantumAIService
