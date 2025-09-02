/**
 * Terrafusion Advanced Analytics Dashboard
 * Comprehensive analytics and insights for government operations
 */

import React, { useState, useEffect } from 'react';
import { governmentAPI } from '../services/GovernmentAPIService';
import { performanceService } from '../services/PerformanceService';
import './AdvancedAnalytics.css';

interface AnalyticsData {
  countyMetrics: CountyMetrics[];
  pluginUsage: PluginUsageMetrics[];
  complianceMetrics: ComplianceMetrics;
  performanceMetrics: PerformanceMetrics;
  aiInsights: AIInsight[];
  trends: TrendData[];
}

interface CountyMetrics {
  countyId: string;
  countyName: string;
  totalPlugins: number;
  activeUsers: number;
  complianceScore: number;
  costSavings: number;
  efficiencyGain: number;
  lastActivity: string;
}

interface PluginUsageMetrics {
  pluginId: string;
  pluginName: string;
  totalDeployments: number;
  activeInstances: number;
  monthlyUsage: number;
  userSatisfaction: number;
  costPerUse: number;
  roi: number;
}

interface ComplianceMetrics {
  fismaScore: number;
  stateDoEScore: number;
  countyAuditScore: number;
  overallCompliance: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastAudit: string;
  nextAudit: string;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  systemUptime: number;
  errorRate: number;
  userSatisfaction: number;
  resourceUtilization: number;
}

interface AIInsight {
  id: string;
  type: 'optimization' | 'risk' | 'opportunity' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendation: string;
}

interface TrendData {
  metric: string;
  period: string;
  values: number[];
  labels: string[];
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'counties' | 'plugins' | 'compliance' | 'ai-insights'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate comprehensive analytics data
      const mockAnalyticsData: AnalyticsData = {
        countyMetrics: [
          {
            countyId: 'benton-wa',
            countyName: 'Benton County',
            totalPlugins: 12,
            activeUsers: 45,
            complianceScore: 94,
            costSavings: 195000,
            efficiencyGain: 67,
            lastActivity: '2025-07-31T19:45:00Z'
          },
          {
            countyId: 'franklin-wa',
            countyName: 'Franklin County',
            totalPlugins: 8,
            activeUsers: 32,
            complianceScore: 89,
            costSavings: 142000,
            efficiencyGain: 58,
            lastActivity: '2025-07-31T18:30:00Z'
          },
          {
            countyId: 'walla-walla-wa',
            countyName: 'Walla Walla County',
            totalPlugins: 6,
            activeUsers: 28,
            complianceScore: 76,
            costSavings: 98000,
            efficiencyGain: 42,
            lastActivity: '2025-07-31T17:15:00Z'
          }
        ],
        pluginUsage: [
          {
            pluginId: 'costforge-pro',
            pluginName: 'CostForge Professional',
            totalDeployments: 3,
            activeInstances: 3,
            monthlyUsage: 1247,
            userSatisfaction: 4.8,
            costPerUse: 0.24,
            roi: 340
          },
          {
            pluginId: 'gis-analytics',
            pluginName: 'GIS Analytics Pro',
            totalDeployments: 2,
            activeInstances: 2,
            monthlyUsage: 892,
            userSatisfaction: 4.6,
            costPerUse: 0.17,
            roi: 280
          },
          {
            pluginId: 'pilt-calculator',
            pluginName: 'PILT Calculator',
            totalDeployments: 3,
            activeInstances: 3,
            monthlyUsage: 156,
            userSatisfaction: 4.9,
            costPerUse: 0.00,
            roi: 999
          }
        ],
        complianceMetrics: {
          fismaScore: 96,
          stateDoEScore: 92,
          countyAuditScore: 94,
          overallCompliance: 94,
          riskLevel: 'low',
          lastAudit: '2025-07-15',
          nextAudit: '2025-10-15'
        },
        performanceMetrics: {
          averageResponseTime: 1.8,
          systemUptime: 99.97,
          errorRate: 0.03,
          userSatisfaction: 4.7,
          resourceUtilization: 68
        },
        aiInsights: [
          {
            id: 'insight-1',
            type: 'optimization',
            title: 'Plugin Deployment Optimization Opportunity',
            description: 'Analysis shows that deploying GIS Analytics Pro to Walla Walla County could improve their compliance score by 8-12 points.',
            impact: 'high',
            confidence: 0.87,
            actionable: true,
            recommendation: 'Schedule deployment of GIS Analytics Pro to Walla Walla County within the next 30 days.'
          },
          {
            id: 'insight-2',
            type: 'trend',
            title: 'Increasing User Adoption Trend',
            description: 'User adoption has increased by 23% over the last 30 days, with particularly strong growth in assessment tools.',
            impact: 'medium',
            confidence: 0.94,
            actionable: false,
            recommendation: 'Continue current user onboarding strategies and consider expanding assessment tool offerings.'
          },
          {
            id: 'insight-3',
            type: 'risk',
            title: 'Compliance Score Variance Alert',
            description: 'Walla Walla County compliance score is 18 points below the federation average, indicating potential audit risk.',
            impact: 'high',
            confidence: 0.91,
            actionable: true,
            recommendation: 'Implement targeted compliance improvement plan for Walla Walla County.'
          }
        ],
        trends: [
          {
            metric: 'User Adoption',
            period: '30d',
            values: [78, 82, 85, 89, 92, 95, 98, 105],
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            trend: 'up',
            changePercent: 23
          },
          {
            metric: 'Compliance Score',
            period: '30d',
            values: [91, 92, 93, 94, 94, 95, 94, 94],
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            trend: 'stable',
            changePercent: 3
          }
        ]
      };

      setAnalyticsData(mockAnalyticsData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'var(--tf-error)';
      case 'medium': return 'var(--tf-warning)';
      case 'low': return 'var(--tf-success)';
      default: return 'var(--tf-text-secondary)';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const renderOverviewTab = () => (
    <div className="analytics-overview">
      <div className="analytics-summary-cards">
        <div className="summary-card">
          <div className="card-header"><>

            <h3>Total Counties</h3>
            <span
</>
className="card-icon">🏛️</span>
          </div><>

          <div className="card-value">{analyticsData?.countyMetrics.length || 0}</div>
          <div
</>
className="card-change positive">+2 this month</div>
        </div>

        <div className="summary-card">
          <div className="card-header"><>

            <h3>Active Users</h3>
            <span
</>
className="card-icon">👥</span>
          </div><>

          <div className="card-value">
            {analyticsData?.countyMetrics.reduce((sum, county) => sum + county.activeUsers, 0) || 0}
          </div>
          <div
</>
className="card-change positive">+23% growth</div>
        </div>

        <div className="summary-card">
          <div className="card-header"><>

            <h3>Total Cost Savings</h3>
            <span
</>
className="card-icon">💰</span>
          </div><>

          <div className="card-value">
            {formatCurrency(analyticsData?.countyMetrics.reduce((sum, county) => sum + county.costSavings, 0) || 0)}
          </div>
          <div
</>
className="card-change positive">+15% this quarter</div>
        </div>

        <div className="summary-card">
          <div className="card-header"><>

            <h3>Avg Compliance</h3>
            <span
</>
className="card-icon">✅</span>
          </div><>

          <div className="card-value">
            {formatPercentage(analyticsData?.complianceMetrics.overallCompliance || 0)}
          </div>
          <div
</>
className="card-change positive">+3% improvement</div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container"><>

          <h3>User Adoption Trend</h3>
          <div
</>
className="trend-chart">
            {analyticsData?.trends.find(t => t.metric === 'User Adoption')?.values.map((value /* , index */) => (
              <div key={index} className="trend-bar"><>

                <div 
                  className="bar" 
                  style={{ height: `${(value / 105) * 100}%` }}
                  title={`${value} users`}
                ></div>
                <span
</>
className="bar-label">W{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container"><>

          <h3>Compliance Score Trend</h3>
          <div
</>
className="trend-chart">
            {analyticsData?.trends.find(t => t.metric === 'Compliance Score')?.values.map((value /* , index */) => (
              <div key={index} className="trend-bar"><>

                <div 
                  className="bar compliance" 
                  style={{ height: `${(value / 100) * 100}%` }}
                  title={`${value}% compliance`}
                ></div>
                <span
</>
className="bar-label">W{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCountiesTab = () => (
    <div className="analytics-counties"><>

      <h3>County Performance Metrics</h3>
      <div
</>
className="counties-grid">
        {analyticsData?.countyMetrics.map(county => (
          <div key={county.countyId} className="county-analytics-card">
            <div className="county-header"><>

              <h4>{county.countyName}</h4>
              <div
</>
className="county-score"><>

                <span className="score-value">{county.complianceScore}%</span>
                <span
</>
className="score-label">Compliance</span>
              </div>
            </div>
            
            <div className="county-metrics">
              <div className="metric-row"><>

                <span className="metric-label">Active Users</span>
                <span
</>
className="metric-value">{county.activeUsers}</span>
              </div>
              <div className="metric-row"><>

                <span className="metric-label">Total Plugins</span>
                <span
</>
className="metric-value">{county.totalPlugins}</span>
              </div>
              <div className="metric-row"><>

                <span className="metric-label">Cost Savings</span>
                <span
</>
className="metric-value">{formatCurrency(county.costSavings)}</span>
              </div>
              <div className="metric-row"><>

                <span className="metric-label">Efficiency Gain</span>
                <span
</>
className="metric-value">{county.efficiencyGain}%</span>
              </div>
            </div>

            <div className="county-footer">
              <span className="last-activity">
                Last activity: {new Date(county.lastActivity).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPluginsTab = () => (
    <div className="analytics-plugins"><>

      <h3>Plugin Usage Analytics</h3>
      <div
</>
className="plugins-table">
        <div className="table-header"><>

          <div className="header-cell">Plugin</div>
          <div
</>
className="header-cell">Deployments</div><>

          <div className="header-cell">Monthly Usage</div>
          <div
</>
className="header-cell">Satisfaction</div><>

          <div className="header-cell">ROI</div>
          <div
</>
className="header-cell">Cost/Use</div>
        </div>
        
        {analyticsData?.pluginUsage.map(plugin => (
          <div key={plugin.pluginId} className="table-row">
            <div className="cell plugin-name"><>

              <strong>{plugin.pluginName}</strong>
              <span
</>
className="plugin-status">
                {plugin.activeInstances}/{plugin.totalDeployments} active
              </span>
            </div><>

            <div className="cell">{plugin.totalDeployments}</div>
            <div
</>
className="cell">{plugin.monthlyUsage.toLocaleString()}</div>
            <div className="cell">
              <div className="satisfaction-rating"><>

                <span className="rating-value">{plugin.userSatisfaction}</span>
                <span
</>
className="rating-stars">
                  {'★'.repeat(Math.floor(plugin.userSatisfaction))}
                </span>
              </div>
            </div><>

            <div className="cell roi-value">{plugin.roi}%</div>
            <div
</>
className="cell">{formatCurrency(plugin.costPerUse)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="analytics-compliance"><>

      <h3>Compliance Dashboard</h3>
      
      <div
</>
className="compliance-overview">
        <div className="compliance-score-circle">
          <div className="score-circle" data-score={analyticsData?.complianceMetrics.overallCompliance}><>

            <span className="score-number">{analyticsData?.complianceMetrics.overallCompliance}%</span>
            <span
</>
className="score-label">Overall Compliance</span>
          </div>
        </div>

        <div className="compliance-breakdown">
          <div className="compliance-metric">
            <div className="metric-header"><>

              <span className="metric-name">FISMA Compliance</span>
              <span
</>
className="metric-score">{analyticsData?.complianceMetrics.fismaScore}%</span>
            </div>
            <div className="metric-bar">
              <div 
                className="bar-fill" 
                style={{ width: `${analyticsData?.complianceMetrics.fismaScore}%` }}
              ></div>
            </div>
          </div>

          <div className="compliance-metric">
            <div className="metric-header"><>

              <span className="metric-name">State DOE Requirements</span>
              <span
</>
className="metric-score">{analyticsData?.complianceMetrics.stateDoEScore}%</span>
            </div>
            <div className="metric-bar">
              <div 
                className="bar-fill" 
                style={{ width: `${analyticsData?.complianceMetrics.stateDoEScore}%` }}
              ></div>
            </div>
          </div>

          <div className="compliance-metric">
            <div className="metric-header"><>

              <span className="metric-name">County Audit Standards</span>
              <span
</>
className="metric-score">{analyticsData?.complianceMetrics.countyAuditScore}%</span>
            </div>
            <div className="metric-bar">
              <div 
                className="bar-fill" 
                style={{ width: `${analyticsData?.complianceMetrics.countyAuditScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="compliance-details">
        <div className="detail-card"><>

          <h4>Risk Level</h4>
          <div
</>
className={`risk-indicator ${analyticsData?.complianceMetrics.riskLevel}`}>
            {analyticsData?.complianceMetrics.riskLevel?.toUpperCase()}
          </div>
        </div>

        <div className="detail-card"><>

          <h4>Last Audit</h4>
          <div
</>
className="audit-date">
            {analyticsData?.complianceMetrics.lastAudit}
          </div>
        </div>

        <div className="detail-card"><>

          <h4>Next Audit</h4>
          <div
</>
className="audit-date">
            {analyticsData?.complianceMetrics.nextAudit}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIInsightsTab = () => (
    <div className="analytics-ai-insights"><>

      <h3>AI-Powered Insights & Recommendations</h3>
      
      <div
</>
className="insights-grid">
        {analyticsData?.aiInsights.map(insight => (
          <div key={insight.id} className={`insight-card ${insight.type}`}>
            <div className="insight-header">
              <div className="insight-type">
                {insight.type === 'optimization' && '⚡'}
                {insight.type === 'risk' && '⚠️'}
                {insight.type === 'opportunity' && '💡'}
                {insight.type === 'trend' && '📈'}
                <span className="type-label">{insight.type.toUpperCase()}</span>
              </div>
              <div className="insight-impact" style={{ color: getImpactColor(insight.impact) }}>
                {insight.impact.toUpperCase()} IMPACT
              </div>
            </div><>

            <h4 className="insight-title">{insight.title}</h4>
            <p
</>
className="insight-description">{insight.description}</p>

            <div className="insight-footer">
              <div className="confidence-score"><>

                <span className="confidence-label">AI Confidence:</span>
                <span
</>
className="confidence-value">{Math.round(insight.confidence * 100)}%</span>
              </div>
              
              {insight.actionable && (
                <div className="insight-recommendation"><>

                  <strong>Recommendation:</strong>
                  <p
</>
</>>{insight.recommendation}</p>
                  <button className="action-button">Take Action</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="analytics-loading"><>

        <div className="loading-spinner"></div>
        <p
</>
</>>Loading advanced analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error"><>

        <h3>Analytics Error</h3>
        <p
</>
</>>{error}</p>
        <button onClick={loadAnalyticsData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      <div className="analytics-header"><>

        <h2>Terrafusion Advanced Analytics</h2>
        <div
</>
className="analytics-controls">
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="timeframe-selector"
            title="Select Analytics Timeframe"
          ><>

            <option value="7d">Last 7 Days</option>
            <option
</>
value="30d">Last 30 Days</option><>

            <option value="90d">Last 90 Days</option>
            <option
</>
value="1y">Last Year</option>
          </select>
        </div>
      </div>

      <div className="analytics-tabs"><>

        <button 
          className={`tab-button ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          📊 Overview
        </button>
        <button
</>

          className={`tab-button ${selectedView === 'counties' ? 'active' : ''}`}
          onClick={() => setSelectedView('counties')}
        >
          🏛️ Counties
        </button><>

        <button 
          className={`tab-button ${selectedView === 'plugins' ? 'active' : ''}`}
          onClick={() => setSelectedView('plugins')}
        >
          🔌 Plugins
        </button>
        <button
</>

          className={`tab-button ${selectedView === 'compliance' ? 'active' : ''}`}
          onClick={() => setSelectedView('compliance')}
        >
          ✅ Compliance
        </button>
        <button 
          className={`tab-button ${selectedView === 'ai-insights' ? 'active' : ''}`}
          onClick={() => setSelectedView('ai-insights')}
        >
          🤖 AI Insights
        </button>
      </div>

      <div className="analytics-content">
        {selectedView === 'overview' && renderOverviewTab()}
        {selectedView === 'counties' && renderCountiesTab()}
        {selectedView === 'plugins' && renderPluginsTab()}
        {selectedView === 'compliance' && renderComplianceTab()}
        {selectedView === 'ai-insights' && renderAIInsightsTab()}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
