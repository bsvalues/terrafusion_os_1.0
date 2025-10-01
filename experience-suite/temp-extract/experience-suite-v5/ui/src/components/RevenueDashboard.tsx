import React, { useState, useEffect } from 'react';
import { revenueService, RevenueMetrics, CountyBilling } from '../services/RevenueService';

// Revenue Dashboard Component
export const RevenueDashboard: React.FC = () => {
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [countyBilling, setCountyBilling] = useState<CountyBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const [metrics, billing] = await Promise.all([
        revenueService.getRevenueMetrics(),
        revenueService.getAllCountyBilling()
      ]);
      
      setRevenueMetrics(metrics);
      setCountyBilling(billing);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
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

  if (loading) {
    return (
      <div className="tf-revenue-dashboard">
        <h2>💰 Revenue Management Center</h2>
        <div className="tf-loading">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="tf-revenue-dashboard">
      <div className="tf-revenue-header">
        <h2>💰 Revenue Management Center</h2>
        <p className="tf-revenue-subtitle">Government Module Marketplace - $619/County ARPU Model</p>
        
        <div className="tf-timeframe-selector">
          <button 
            className={selectedTimeframe === 'monthly' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('monthly')}
          >
            Monthly View
          </button>
          <button 
            className={selectedTimeframe === 'annual' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('annual')}
          >
            Annual View
          </button>
        </div>
      </div>

      {/* Key Revenue Metrics */}
      {revenueMetrics && (
        <div className="tf-revenue-metrics">
          <div className="tf-revenue-card primary">
            <h3>Monthly ARPU</h3>
            <div className="tf-revenue-value">
              {formatCurrency(revenueMetrics.monthlyARPU)}
            </div>
            <span className="tf-revenue-label">Per County Average</span>
          </div>

          <div className="tf-revenue-card secondary">
            <h3>Annual Potential</h3>
            <div className="tf-revenue-value">
              {formatCurrency(revenueMetrics.annualRevenuePotential * revenueMetrics.totalCounties)}
            </div>
            <span className="tf-revenue-label">Total Revenue Projection</span>
          </div>

          <div className="tf-revenue-card success">
            <h3>Active Counties</h3>
            <div className="tf-revenue-value">
              {revenueMetrics.totalCounties}
            </div>
            <span className="tf-revenue-label">Government Installations</span>
          </div>

          <div className="tf-revenue-card warning">
            <h3>Revenue Split</h3>
            <div className="tf-revenue-split">
              <span>{revenueMetrics.revenueSplit.terrafusion}% TerraFusion</span>
              <span>{revenueMetrics.revenueSplit.developer}% Developers</span>
            </div>
          </div>
        </div>
      )}

      {/* County Billing Overview */}
      <div className="tf-county-billing">
        <h3>County Billing Status</h3>
        <div className="tf-billing-grid">
          {countyBilling.map((county) => (
            <div key={county.countyId} className={`tf-billing-card ${county.paymentStatus}`}>
              <div className="tf-billing-header">
                <h4>{county.countyName}</h4>
                <span className={`tf-payment-status ${county.paymentStatus}`}>
                  {county.paymentStatus === 'current' ? '✅ Current' :
                   county.paymentStatus === 'overdue' ? '⚠️ Overdue' : '🔄 Trial'}
                </span>
              </div>

              <div className="tf-billing-details">
                <div className="tf-billing-row">
                  <span>Base Subscription:</span>
                  <span>{formatCurrency(county.baseSubscription)}/month</span>
                </div>
                <div className="tf-billing-row">
                  <span>Marketplace Modules:</span>
                  <span>{formatCurrency(county.marketplaceSpend)}/month</span>
                </div>
                <div className="tf-billing-row total">
                  <span>Total Monthly:</span>
                  <span>{formatCurrency(county.totalMonthly)}</span>
                </div>
                <div className="tf-billing-row annual">
                  <span>Annual Value:</span>
                  <span>{formatCurrency(county.totalAnnual)}</span>
                </div>
              </div>

              <div className="tf-module-summary">
                <span>{county.modules.length} installed modules</span>
                <span>Next billing: {new Date(county.nextBillingDate).toLocaleDateString()}</span>
              </div>

              <div className="tf-billing-actions">
                <button className="tf-invoice-btn">Generate Invoice</button>
                <button className="tf-payment-btn">Process Payment</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module Revenue Breakdown */}
      <div className="tf-module-revenue">
        <h3>Module Revenue Performance</h3>
        <div className="tf-module-performance">
          {countyBilling.flatMap(county => county.modules).map((module, index) => (
            <div key={`${module.moduleId}-${index}`} className="tf-module-revenue-item">
              <div className="tf-module-info">
                <h4>{module.moduleName}</h4>
                <span className="tf-module-county">{module.county}</span>
              </div>
              
              <div className="tf-module-pricing">
                <span className="tf-module-monthly">{formatCurrency(module.monthlyPrice)}/month</span>
                <span className="tf-module-annual">{formatCurrency(module.annualPrice)}/year</span>
              </div>

              <div className="tf-revenue-split-details">
                <div className="tf-split-item terrafusion">
                  <span>TerraFusion (70%)</span>
                  <span>{formatCurrency(module.revenueShare.terrafusionAmount)}</span>
                </div>
                <div className="tf-split-item developer">
                  <span>Developer (30%)</span>
                  <span>{formatCurrency(module.revenueShare.developerAmount)}</span>
                </div>
              </div>

              <span className={`tf-module-status ${module.status}`}>
                {module.status.charAt(0).toUpperCase() + module.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Analytics Summary */}
      <div className="tf-revenue-summary">
        <h3>Revenue Analytics</h3>
        <div className="tf-analytics-grid">
          <div className="tf-analytics-card">
            <h4>Total Module Installations</h4>
            <div className="tf-analytics-value">
              {countyBilling.reduce((sum, county) => sum + county.modules.length, 0)}
            </div>
          </div>
          
          <div className="tf-analytics-card">
            <h4>Average Module Price</h4>
            <div className="tf-analytics-value">
              {formatCurrency(
                countyBilling.reduce((sum, county) => 
                  sum + county.modules.reduce((moduleSum, module) => moduleSum + module.monthlyPrice, 0), 0
                ) / Math.max(1, countyBilling.reduce((sum, county) => sum + county.modules.length, 0))
              )}
            </div>
          </div>

          <div className="tf-analytics-card">
            <h4>TerraFusion Revenue Share</h4>
            <div className="tf-analytics-value">
              {formatCurrency(
                countyBilling.reduce((sum, county) => 
                  sum + county.modules.reduce((moduleSum, module) => 
                    moduleSum + module.revenueShare.terrafusionAmount, 0
                  ), 0
                )
              )}
            </div>
          </div>

          <div className="tf-analytics-card">
            <h4>Developer Revenue Share</h4>
            <div className="tf-analytics-value">
              {formatCurrency(
                countyBilling.reduce((sum, county) => 
                  sum + county.modules.reduce((moduleSum, module) => 
                    moduleSum + module.revenueShare.developerAmount, 0
                  ), 0
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};