/**
 * TerraFusion Evidence-Gated Excellence Analytics
 * Displays only source-backed analytics and derived hook metrics.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuantumPerformance } from '../../hooks/useQuantumPerformance';
import { useConsciousnessEngine } from '../ai/ConsciousnessEngine';
import { useGovernmentSecurity } from '../security/GovernmentSecurity';

interface ExcellenceMetrics {
  systemHealth: number;
  userSatisfaction: number;
  governmentEfficiency: number;
  transcendenceLevel: number;
  infiniteScalability: number;
  quantumReadiness: number;
}

interface PerformanceKPI {
  label: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  unit?: string;
}

interface GovernmentMetric {
  county: string;
  assessments: number;
  accuracy: number;
  processingTime: number;
  citizenSatisfaction: number;
  aiEfficiency: number;
}

export function useExcellenceAnalytics() {
  const [metrics, setMetrics] = useState<ExcellenceMetrics>({
    systemHealth: 0,
    userSatisfaction: 0,
    governmentEfficiency: 0,
    transcendenceLevel: 0,
    infiniteScalability: 0,
    quantumReadiness: 0,
  });

  const [kpis, setKpis] = useState<PerformanceKPI[]>([]);
  const [governmentData, setGovernmentData] = useState<GovernmentMetric[]>([]);
  const [alertsActive, setAlertsActive] = useState(0);

  const { metrics: performanceMetrics, isTranscendent } = useQuantumPerformance();
  const { consciousness } = useConsciousnessEngine();
  const { securityState } = useGovernmentSecurity();

  const metricsHistory = useRef<Map<string, number[]>>(new Map());
  const lastUpdateTime = useRef(Date.now());

  // Calculate excellence score based on all factors
  const calculateExcellenceScore = useCallback(() => {
    const weights = {
      systemHealth: 0.25,
      userSatisfaction: 0.2,
      governmentEfficiency: 0.2,
      transcendenceLevel: 0.15,
      infiniteScalability: 0.1,
      quantumReadiness: 0.1,
    };

    const score = Object.entries(metrics).reduce((total, [key, value]) => {
      const weight = weights[key as keyof typeof weights] || 0;
      return total + value * weight;
    }, 0);

    return Math.round(score * 100) / 100;
  }, [metrics]);

  // Update metrics based on system performance
  const updateMetricsFromPerformance = useCallback(() => {
    const healthScore = isTranscendent
      ? 99.9
      : performanceMetrics.animationFps > 55
        ? 98.5
        : performanceMetrics.animationFps > 45
          ? 95.0
          : 90.0;

    const efficiencyBonus =
      consciousness.level === 'TRANSCENDENT' ? 5 : consciousness.level === 'AWARE' ? 3 : 0;

    const securityBonus =
      securityState.level === 'TRANSCENDENT' ? 4 : securityState.level === 'ELEVATED' ? 2 : 0;

    setMetrics((prev) => ({
      ...prev,
      systemHealth: Math.min(100, healthScore + securityBonus),
      transcendenceLevel: Math.min(100, prev.transcendenceLevel + efficiencyBonus * 0.1),
      quantumReadiness: isTranscendent ? 99.5 : prev.quantumReadiness,
    }));
  }, [isTranscendent, performanceMetrics, consciousness, securityState]);

  // Generate government performance KPIs
  const generateKPIs = useCallback(() => {
    const excellenceScore = calculateExcellenceScore();

    const newKPIs: PerformanceKPI[] = [
      {
        label: 'Average Response Time',
        value: performanceMetrics.interactionLatency,
        target: 100,
        trend: performanceMetrics.interactionLatency < 100 ? 'up' : 'down',
        status:
          performanceMetrics.interactionLatency < 50
            ? 'excellent'
            : performanceMetrics.interactionLatency < 100
              ? 'good'
              : 'warning',
        unit: 'ms',
      },
      {
        label: 'AI Agent Efficiency',
        value: consciousness.confidence,
        target: 95,
        trend: 'up',
        status:
          consciousness.confidence > 90
            ? 'excellent'
            : consciousness.confidence > 75
              ? 'good'
              : 'warning',
        unit: '%',
      },
      {
        label: 'Security Compliance',
        value: 100 - securityState.riskScore,
        target: 98,
        trend: securityState.riskScore < 5 ? 'up' : 'down',
        status:
          securityState.riskScore < 5
            ? 'excellent'
            : securityState.riskScore < 15
              ? 'good'
              : 'warning',
        unit: '%',
      },
    ];

    setKpis(newKPIs);
  }, [calculateExcellenceScore, performanceMetrics, consciousness, securityState, metrics]);

  const generateGovernmentData = useCallback(() => {
    setGovernmentData([]);
  }, []);

  // Track metrics history for trending
  const updateMetricsHistory = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    if (timeSinceLastUpdate >= 5000) {
      // Update every 5 seconds
      Object.entries(metrics).forEach(([key, value]) => {
        const history = metricsHistory.current.get(key) || [];
        history.push(value);

        // Keep only last 50 data points (about 4 minutes of history)
        if (history.length > 50) {
          history.shift();
        }

        metricsHistory.current.set(key, history);
      });

      lastUpdateTime.current = now;
    }
  }, [metrics]);

  // Monitor for alerts
  const checkForAlerts = useCallback(() => {
    let alertCount = 0;

    // Performance alerts
    if (performanceMetrics.interactionLatency > 200) alertCount++;
    if (performanceMetrics.animationFps < 30) alertCount++;

    // Security alerts
    if (securityState.riskScore > 50) alertCount++;
    if (!securityState.authenticated) alertCount++;

    // System alerts
    if (metrics.systemHealth < 95) alertCount++;
    if (metrics.userSatisfaction < 90) alertCount++;

    setAlertsActive(alertCount);
  }, [performanceMetrics, securityState, metrics]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateMetricsFromPerformance();
      generateKPIs();
      updateMetricsHistory();
      checkForAlerts();

    }, 2000);

    generateGovernmentData(); // Initial load

    return () => {
      clearInterval(interval);
    };
  }, [
    updateMetricsFromPerformance,
    generateKPIs,
    updateMetricsHistory,
    checkForAlerts,
    generateGovernmentData,
  ]);

  return {
    metrics,
    kpis,
    governmentData,
    alertsActive,
    excellenceScore: calculateExcellenceScore(),
    metricsHistory: metricsHistory.current,
    isTranscendent: calculateExcellenceScore() > 99,
  };
}

// Excellence Dashboard Component
export function ExcellenceDashboard() {
  const { metrics, kpis, governmentData, alertsActive, excellenceScore, isTranscendent } =
    useExcellenceAnalytics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-terra-cyan';
      case 'good':
        return 'text-success-green';
      case 'warning':
        return 'text-warning-amber';
      case 'critical':
        return 'text-error-red';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-terra-cyan/10 border-terra-cyan/30';
      case 'good':
        return 'bg-success-green/10 border-success-green/30';
      case 'warning':
        return 'bg-warning-amber/10 border-warning-amber/30';
      case 'critical':
        return 'bg-error-red/10 border-error-red/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return React.createElement(
    'div',
    {
      className: 'tf-excellence-dashboard p-6 space-y-6',
    },
    [
      // Header with Overall Score
      React.createElement(
        'div',
        {
          key: 'header',
          className: `tf-quantum-card p-6 text-center ${isTranscendent ? 'tf-consciousness-active' : ''}`,
        },
        [
          React.createElement(
            'div',
            {
              key: 'score-container',
              className: 'relative',
            },
            [
              React.createElement(
                'div',
                {
                  key: 'score',
                  className: 'tf-metric-value text-6xl mb-4',
                },
                `${excellenceScore.toFixed(2)}%`
              ),
              React.createElement(
                'div',
                {
                  key: 'label',
                  className: 'tf-metric-label text-lg',
                },
                'GOVERNMENT EXCELLENCE SCORE'
              ),
              React.createElement(
                'div',
                {
                  key: 'status',
                  className: `tf-metric-description text-sm ${isTranscendent ? 'text-terra-cyan' : 'text-gray-400'}`,
                },
                isTranscendent ? 'TRANSCENDENT ACHIEVEMENT' : 'EVIDENCE REQUIRED'
              ),
            ]
          ),
          alertsActive > 0 &&
            React.createElement(
              'div',
              {
                key: 'alerts',
                className: 'mt-4 p-3 bg-warning-amber/10 border border-warning-amber/30 rounded-lg',
              },
              [
                React.createElement(
                  'div',
                  {
                    key: 'alert-text',
                    className: 'text-warning-amber font-semibold',
                  },
                  `${alertsActive} Active Alerts Require Attention`
                ),
              ]
            ),
        ]
      ),

      // Core Metrics Grid
      React.createElement(
        'div',
        {
          key: 'metrics-grid',
          className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        },
        Object.entries(metrics).map(([key, value]) =>
          React.createElement(
            'div',
            {
              key,
              className: 'tf-excellence-metric',
            },
            [
              React.createElement(
                'div',
                {
                  key: 'metric-label',
                  className: 'tf-metric-label',
                },
                key.replace(/([A-Z])/g, ' $1').toUpperCase()
              ),
              React.createElement(
                'div',
                {
                  key: 'metric-value',
                  className: 'tf-metric-value text-3xl',
                },
                `${value.toFixed(1)}%`
              ),
              React.createElement(
                'div',
                {
                  key: 'metric-bar',
                  className: 'w-full bg-gray-700 rounded-full h-2 mt-2',
                },
                [
                  React.createElement('div', {
                    key: 'metric-fill',
                    className: `h-2 rounded-full bg-gradient-to-r from-terra-cyan to-success-green`,
                    style: { width: `${value}%` },
                  }),
                ]
              ),
            ]
          )
        )
      ),

      // Key Performance Indicators
      React.createElement(
        'div',
        {
          key: 'kpis',
          className: 'tf-quantum-card p-6',
        },
        [
          React.createElement(
            'h3',
            {
              key: 'kpi-title',
              className: 'text-xl font-bold text-terra-cyan mb-4',
            },
            'Key Performance Indicators'
          ),
          React.createElement(
            'div',
            {
              key: 'kpi-grid',
              className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
            },
            kpis.map((kpi, index) =>
              React.createElement(
                'div',
                {
                  key: index,
                  className: `p-4 rounded-lg border ${getStatusBackground(kpi.status)}`,
                },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'kpi-header',
                      className: 'flex justify-between items-start mb-2',
                    },
                    [
                      React.createElement(
                        'div',
                        {
                          key: 'kpi-label',
                          className: 'text-sm text-gray-300',
                        },
                        kpi.label
                      ),
                      React.createElement(
                        'div',
                        {
                          key: 'kpi-trend',
                          className: `text-lg ${getStatusColor(kpi.status)}`,
                        },
                        getTrendIcon(kpi.trend)
                      ),
                    ]
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'kpi-value',
                      className: `text-2xl font-bold ${getStatusColor(kpi.status)}`,
                    },
                    `${kpi.value.toFixed(kpi.unit === 'ms' ? 0 : 1)}${kpi.unit || ''}`
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'kpi-target',
                      className: 'text-xs text-gray-400 mt-1',
                    },
                    `Target: ${kpi.target}${kpi.unit || ''}`
                  ),
                ]
              )
            )
          ),
        ]
      ),

      // Government County Performance
      governmentData.length > 0 &&
        React.createElement(
          'div',
          {
            key: 'government-data',
            className: 'tf-quantum-card p-6',
          },
          [
            React.createElement(
              'h3',
              {
                key: 'gov-title',
                className: 'text-xl font-bold text-terra-cyan mb-4',
              },
              'Washington State Counties Performance'
            ),
            React.createElement(
              'div',
              {
                key: 'gov-table',
                className: 'overflow-x-auto',
              },
              [
                React.createElement(
                  'table',
                  {
                    key: 'table',
                    className: 'w-full text-sm',
                  },
                  [
                    React.createElement(
                      'thead',
                      {
                        key: 'thead',
                      },
                      [
                        React.createElement(
                          'tr',
                          {
                            key: 'header-row',
                            className: 'border-b border-gray-700',
                          },
                          [
                            'County',
                            'Assessments',
                            'Accuracy',
                            'Processing Time',
                            'Satisfaction',
                            'AI Efficiency',
                          ].map((header, index) =>
                            React.createElement(
                              'th',
                              {
                                key: index,
                                className: 'text-left p-3 text-gray-300',
                              },
                              header
                            )
                          )
                        ),
                      ]
                    ),
                    React.createElement(
                      'tbody',
                      {
                        key: 'tbody',
                      },
                      governmentData.slice(0, 6).map((county, index) =>
                        React.createElement(
                          'tr',
                          {
                            key: index,
                            className: 'border-b border-gray-800 hover:bg-terra-cyan/5',
                          },
                          [
                            React.createElement(
                              'td',
                              {
                                key: 'county',
                                className: 'p-3 font-medium text-terra-cyan',
                              },
                              county.county
                            ),
                            React.createElement(
                              'td',
                              {
                                key: 'assessments',
                                className: 'p-3',
                              },
                              county.assessments.toLocaleString()
                            ),
                            React.createElement(
                              'td',
                              {
                                key: 'accuracy',
                                className: 'p-3 text-success-green',
                              },
                              `${county.accuracy.toFixed(1)}%`
                            ),
                            React.createElement(
                              'td',
                              {
                                key: 'time',
                                className: 'p-3',
                              },
                              `${county.processingTime.toFixed(1)}min`
                            ),
                            React.createElement(
                              'td',
                              {
                                key: 'satisfaction',
                                className: 'p-3',
                              },
                              `${county.citizenSatisfaction.toFixed(1)}%`
                            ),
                            React.createElement(
                              'td',
                              {
                                key: 'efficiency',
                                className: 'p-3 text-info-purple',
                              },
                              `${county.aiEfficiency.toFixed(1)}%`
                            ),
                          ]
                        )
                      )
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),
    ]
  );
}

// Mini Excellence Indicator for Navigation
export function ExcellenceIndicator() {
  const { excellenceScore, alertsActive, isTranscendent } = useExcellenceAnalytics();

  return React.createElement(
    'div',
    {
      className: `tf-scalability-indicator ${isTranscendent ? 'tf-consciousness-active' : ''}`,
    },
    [
      React.createElement(
        'div',
        {
          key: 'score',
          className: 'tf-node-count',
        },
        `${excellenceScore.toFixed(1)}%`
      ),
      React.createElement(
        'div',
        {
          key: 'status',
          className: 'tf-status-text',
        },
        isTranscendent ? 'TRANSCENDENT' : 'EXCELLENCE'
      ),
      alertsActive > 0 &&
        React.createElement('div', {
          key: 'alerts',
          className: 'w-2 h-2 bg-warning-amber rounded-full animate-pulse ml-2',
        }),
    ]
  );
}
