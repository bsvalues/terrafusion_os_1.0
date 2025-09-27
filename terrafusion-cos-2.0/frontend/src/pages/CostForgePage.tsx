/**
 * TerraFusion cOS 2.0 - CostForge AI Page
 * Financial intelligence and optimization dashboard
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface FinancialMetrics {
  revenue: {
    current_month: number;
    ytd: number;
    growth_rate: number;
    forecast_next_quarter: number;
  };
  costs: {
    operational: number;
    compliance: number;
    infrastructure: number;
    total: number;
    optimization_potential: number;
  };
  roi: {
    current: number;
    projected: number;
    by_vendor: {
      vendor: string;
      roi: number;
      revenue: number;
    }[];
  };
  insights: {
    id: string;
    type: 'opportunity' | 'risk' | 'optimization';
    title: string;
    description: string;
    impact: string;
    confidence: number;
  }[];
}

const CostForgePage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [activeTab, setActiveTab] = useState<'overview' | 'optimization' | 'forecasting' | 'insights'>('overview');

  // Fetch financial data
  const { data: financialData, isLoading } = useQuery<FinancialMetrics>({
    queryKey: ['costforge-data', selectedPeriod],
    queryFn: async () => {
      // In production, fetch from API
      return {
        revenue: {
          current_month: 8750000,
          ytd: 52500000,
          growth_rate: 18.5,
          forecast_next_quarter: 28900000
        },
        costs: {
          operational: 3200000,
          compliance: 450000,
          infrastructure: 1100000,
          total: 4750000,
          optimization_potential: 1425000
        },
        roi: {
          current: 287,
          projected: 342,
          by_vendor: [
            { vendor: 'Harris', roi: 287, revenue: 5200000 },
            { vendor: 'Tyler', roi: 420, revenue: 3800000 },
            { vendor: 'Esri', roi: 580, revenue: 2100000 },
            { vendor: 'Others', roi: 215, revenue: 1400000 }
          ]
        },
        insights: [
          {
            id: '1',
            type: 'opportunity',
            title: 'Harris PACS Optimization',
            description: 'AI analysis shows 35% efficiency gain possible through workflow automation',
            impact: '+$2.1M annual revenue',
            confidence: 0.92
          },
          {
            id: '2',
            type: 'optimization',
            title: 'Infrastructure Cost Reduction',
            description: 'Quantum optimization can reduce compute costs by 28%',
            impact: '-$308K annual costs',
            confidence: 0.88
          },
          {
            id: '3',
            type: 'risk',
            title: 'Compliance Overhead Increasing',
            description: 'New regulations may increase compliance costs by 15%',
            impact: '+$67K quarterly',
            confidence: 0.75
          },
          {
            id: '4',
            type: 'opportunity',
            title: 'Tyler Upsell Potential',
            description: 'Court systems showing high engagement, ready for expansion',
            impact: '+$1.5M revenue',
            confidence: 0.85
          }
        ]
      };
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="tf-loading">
        <div className="tf-skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="tf-costforge-page">
      <div className="tf-page-header">
        <h1 className="tf-h1">CostForge AI</h1>
        <p className="tf-text-muted">Financial intelligence and optimization engine</p>
      </div>

      {/* Period Selector */}
      <div className="tf-period-selector">
        <button
          className={`tf-btn ${selectedPeriod === 'month' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedPeriod('month')}
        >
          Monthly
        </button>
        <button
          className={`tf-btn ${selectedPeriod === 'quarter' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedPeriod('quarter')}
        >
          Quarterly
        </button>
        <button
          className={`tf-btn ${selectedPeriod === 'year' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedPeriod('year')}
        >
          Yearly
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tf-tabs">
        <button
          className={`tf-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tf-tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          Cost Optimization
        </button>
        <button
          className={`tf-tab ${activeTab === 'forecasting' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasting')}
        >
          Forecasting
        </button>
        <button
          className={`tf-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          AI Insights
        </button>
      </div>

      {/* Tab Content */}
      <div className="tf-tab-content">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Key Metrics */}
            <div className="tf-metrics-grid">
              <div className="tf-metric-card tf-metric-card-large">
                <h3 className="tf-h3">Revenue</h3>
                <div className="tf-metric-value tf-text-success">
                  {formatCurrency(financialData?.revenue.current_month || 0)}
                </div>
                <div className="tf-metric-label">Current Month</div>
                <div className="tf-metric-trend positive">
                  {formatPercentage(financialData?.revenue.growth_rate || 0)} YoY
                </div>
                <div className="tf-metric-details">
                  <div>YTD: {formatCurrency(financialData?.revenue.ytd || 0)}</div>
                  <div>Next Quarter Forecast: {formatCurrency(financialData?.revenue.forecast_next_quarter || 0)}</div>
                </div>
              </div>

              <div className="tf-metric-card">
                <h3 className="tf-h3">Total Costs</h3>
                <div className="tf-metric-value">
                  {formatCurrency(financialData?.costs.total || 0)}
                </div>
                <div className="tf-metric-label">Monthly</div>
                <div className="tf-cost-breakdown">
                  <div>Operational: {formatCurrency(financialData?.costs.operational || 0)}</div>
                  <div>Compliance: {formatCurrency(financialData?.costs.compliance || 0)}</div>
                  <div>Infrastructure: {formatCurrency(financialData?.costs.infrastructure || 0)}</div>
                </div>
              </div>

              <div className="tf-metric-card">
                <h3 className="tf-h3">ROI</h3>
                <div className="tf-metric-value tf-text-transcend">
                  {financialData?.roi.current || 0}%
                </div>
                <div className="tf-metric-label">Current</div>
                <div className="tf-metric-trend positive">
                  Projected: {financialData?.roi.projected || 0}%
                </div>
              </div>
            </div>

            {/* Vendor ROI Chart */}
            <div className="tf-card tf-mt-6">
              <h3 className="tf-h3 tf-mb-4">ROI by Vendor</h3>
              <div className="tf-vendor-roi-chart">
                {financialData?.roi.by_vendor.map((vendor) => (
                  <div key={vendor.vendor} className="tf-vendor-roi-item">
                    <div className="tf-vendor-info">
                      <div className="tf-vendor-name">{vendor.vendor}</div>
                      <div className="tf-vendor-revenue">{formatCurrency(vendor.revenue)}</div>
                    </div>
                    <div className="tf-roi-bar-container">
                      <div 
                        className="tf-roi-bar"
                        style={{ 
                          width: `${(vendor.roi / 600) * 100}%`,
                          background: vendor.roi > 400 ? 
                            'var(--tf-success-green)' : 
                            vendor.roi > 250 ? 'var(--tf-transcend-cyan)' : 'var(--tf-trust-blue)'
                        }}
                      />
                      <span className="tf-roi-value">{vendor.roi}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'optimization' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tf-optimization-panel">
              <div className="tf-card">
                <h3 className="tf-h3">Optimization Potential</h3>
                <div className="tf-optimization-value">
                  {formatCurrency(financialData?.costs.optimization_potential || 0)}
                </div>
                <div className="tf-optimization-label">Annual Savings Available</div>
                
                <div className="tf-optimization-categories tf-mt-6">
                  <div className="tf-optimization-item">
                    <div className="tf-optimization-header">
                      <span>Process Automation</span>
                      <span className="tf-text-success">-$850K</span>
                    </div>
                    <div className="tf-progress">
                      <div className="tf-progress-bar" style={{ width: '65%' }} />
                    </div>
                    <div className="tf-optimization-detail">
                      65% of manual processes can be automated
                    </div>
                  </div>

                  <div className="tf-optimization-item">
                    <div className="tf-optimization-header">
                      <span>Infrastructure Optimization</span>
                      <span className="tf-text-success">-$308K</span>
                    </div>
                    <div className="tf-progress">
                      <div className="tf-progress-bar" style={{ width: '28%' }} />
                    </div>
                    <div className="tf-optimization-detail">
                      Quantum optimization reduces compute by 28%
                    </div>
                  </div>

                  <div className="tf-optimization-item">
                    <div className="tf-optimization-header">
                      <span>Vendor Consolidation</span>
                      <span className="tf-text-success">-$267K</span>
                    </div>
                    <div className="tf-progress">
                      <div className="tf-progress-bar" style={{ width: '45%' }} />
                    </div>
                    <div className="tf-optimization-detail">
                      Consolidate 3 redundant services
                    </div>
                  </div>
                </div>

                <button className="tf-btn tf-btn-primary tf-mt-6">
                  Generate Optimization Report
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'forecasting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tf-forecasting-panel">
              <div className="tf-card">
                <h3 className="tf-h3">Revenue Forecast</h3>
                <div className="tf-forecast-chart">
                  {/* Simplified chart representation */}
                  <svg viewBox="0 0 600 300" className="tf-chart-svg">
                    <defs>
                      <linearGradient id="revenue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00ffaa" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00ffaa" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,250 Q 150,200 300,150 T 600,50"
                      fill="none"
                      stroke="#00ffaa"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0,250 Q 150,200 300,150 T 600,50 L 600,300 L 0,300 Z"
                      fill="url(#revenue-gradient)"
                    />
                  </svg>
                  <div className="tf-forecast-labels">
                    <span>Current</span>
                    <span>+3 Months</span>
                    <span>+6 Months</span>
                    <span>+12 Months</span>
                  </div>
                </div>

                <div className="tf-forecast-metrics">
                  <div className="tf-forecast-item">
                    <div className="tf-forecast-label">3-Month Projection</div>
                    <div className="tf-forecast-value">{formatCurrency(28900000)}</div>
                    <div className="tf-forecast-confidence">92% confidence</div>
                  </div>
                  <div className="tf-forecast-item">
                    <div className="tf-forecast-label">6-Month Projection</div>
                    <div className="tf-forecast-value">{formatCurrency(62400000)}</div>
                    <div className="tf-forecast-confidence">85% confidence</div>
                  </div>
                  <div className="tf-forecast-item">
                    <div className="tf-forecast-label">12-Month Projection</div>
                    <div className="tf-forecast-value">{formatCurrency(138500000)}</div>
                    <div className="tf-forecast-confidence">78% confidence</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tf-insights-grid">
              {financialData?.insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  className={`tf-insight-card tf-insight-${insight.type}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="tf-insight-header">
                    <div className="tf-insight-icon">
                      {insight.type === 'opportunity' && '💡'}
                      {insight.type === 'optimization' && '⚡'}
                      {insight.type === 'risk' && '⚠️'}
                    </div>
                    <div className="tf-insight-confidence">
                      {Math.round(insight.confidence * 100)}% confidence
                    </div>
                  </div>
                  <h4 className="tf-h3">{insight.title}</h4>
                  <p className="tf-insight-description">{insight.description}</p>
                  <div className="tf-insight-impact">
                    Impact: <span>{insight.impact}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Page Styles */}
      <style jsx>{`
        .tf-costforge-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .tf-period-selector {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-4);
        }

        .tf-tabs {
          display: flex;
          gap: var(--tf-space-1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: var(--tf-space-6);
        }

        .tf-tab {
          background: transparent;
          border: none;
          color: var(--tf-gray-400);
          padding: var(--tf-space-3) var(--tf-space-4);
          font-size: var(--tf-body);
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: all var(--tf-duration-fast) var(--tf-easing-smooth);
        }

        .tf-tab:hover {
          color: var(--tf-white);
        }

        .tf-tab.active {
          color: var(--tf-trust-blue);
        }

        .tf-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--tf-trust-blue);
        }

        .tf-metrics-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: var(--tf-space-4);
        }

        .tf-metric-card-large {
          grid-column: span 1;
        }

        .tf-metric-details {
          margin-top: var(--tf-space-3);
          padding-top: var(--tf-space-3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-cost-breakdown {
          margin-top: var(--tf-space-3);
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-1);
        }

        .tf-vendor-roi-chart {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-3);
        }

        .tf-vendor-roi-item {
          display: flex;
          align-items: center;
          gap: var(--tf-space-4);
        }

        .tf-vendor-info {
          min-width: 150px;
        }

        .tf-vendor-name {
          font-weight: 600;
        }

        .tf-vendor-revenue {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-roi-bar-container {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          height: 32px;
          border-radius: var(--tf-radius-full);
          position: relative;
          overflow: hidden;
        }

        .tf-roi-bar {
          height: 100%;
          border-radius: var(--tf-radius-full);
          transition: width var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-roi-value {
          position: absolute;
          right: var(--tf-space-3);
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          font-size: var(--tf-small);
        }

        .tf-optimization-value {
          font-size: var(--tf-heading-1);
          color: var(--tf-success-green);
          font-weight: 700;
          margin: var(--tf-space-2) 0;
        }

        .tf-optimization-label {
          color: var(--tf-gray-400);
          font-size: var(--tf-body);
        }

        .tf-optimization-categories {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-4);
        }

        .tf-optimization-item {
          padding: var(--tf-space-3);
          background: rgba(0, 255, 170, 0.05);
          border-radius: var(--tf-radius-lg);
        }

        .tf-optimization-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--tf-space-2);
          font-weight: 600;
        }

        .tf-optimization-detail {
          margin-top: var(--tf-space-2);
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-chart-svg {
          width: 100%;
          height: 300px;
        }

        .tf-forecast-labels {
          display: flex;
          justify-content: space-between;
          margin-top: var(--tf-space-2);
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-forecast-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--tf-space-4);
          margin-top: var(--tf-space-6);
        }

        .tf-forecast-item {
          text-align: center;
        }

        .tf-forecast-value {
          font-size: var(--tf-heading-2);
          font-weight: 700;
          color: var(--tf-success-green);
          margin: var(--tf-space-2) 0;
        }

        .tf-forecast-confidence {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-insight-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
          transition: all var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-insight-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--tf-shadow-lg);
        }

        .tf-insight-opportunity {
          border-color: var(--tf-success-green);
        }

        .tf-insight-optimization {
          border-color: var(--tf-transcend-cyan);
        }

        .tf-insight-risk {
          border-color: var(--tf-caution-amber);
        }

        .tf-insight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-3);
        }

        .tf-insight-icon {
          font-size: 24px;
        }

        .tf-insight-confidence {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-insight-description {
          color: var(--tf-gray-300);
          margin: var(--tf-space-2) 0;
        }

        .tf-insight-impact {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          margin-top: var(--tf-space-3);
        }

        .tf-insight-impact span {
          color: var(--tf-white);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .tf-metrics-grid {
            grid-template-columns: 1fr;
          }

          .tf-forecast-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CostForgePage;
