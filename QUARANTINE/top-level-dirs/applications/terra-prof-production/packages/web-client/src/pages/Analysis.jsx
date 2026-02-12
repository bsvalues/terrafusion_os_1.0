import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Analysis Component
 * Property and market analysis tools and reports
 */
const Analysis = () => {
  const [activeTab, setActiveTab] = useState('market');
  
  return (
    <div className="analysis-page">
      <div className="page-header">
        <h1>Analysis Tools</h1>
        <div className="header-actions">
          <button className="btn btn-primary">Generate New Analysis</button>
          <button className="btn btn-outline">Export Data</button>
        </div>
      </div>
      
      {/* Analysis Tabs */}
      <div className="analysis-tabs">
        <nav className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            Market Analysis
          </button>
          <button 
            className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trend Reports
          </button>
          <button 
            className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictions')}
          >
            Value Predictions
          </button>
          <button 
            className={`tab-button ${activeTab === 'comparables' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparables')}
          >
            Comparable Properties
          </button>
        </nav>
      </div>
      
      {/* Selected Tab Content */}
      <div className="tab-content">
        {activeTab === 'market' && (
          <div className="market-analysis">
            <div className="section-intro">
              <h2>Market Analysis</h2>
              <p>
                Analyze current market conditions, trends, and metrics for specific geographic areas.
                Generate comprehensive reports with detailed market insights.
              </p>
            </div>
            
            <div className="analysis-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Region</label>
                  <select className="form-control">
                    <option>Northeast</option>
                    <option>Midwest</option>
                    <option>South</option>
                    <option>West</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>State</label>
                  <select className="form-control">
                    <option>All States</option>
                    <option>New York</option>
                    <option>California</option>
                    <option>Texas</option>
                    <option>Florida</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>City</label>
                  <select className="form-control">
                    <option>All Cities</option>
                    <option>New York City</option>
                    <option>Los Angeles</option>
                    <option>Chicago</option>
                    <option>Houston</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Property Type</label>
                  <select className="form-control">
                    <option>All Types</option>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                    <option>Mixed Use</option>
                  </select>
                </div>
              </div>
              
              <div className="filter-row">
                <div className="filter-group">
                  <label>Time Period</label>
                  <select className="form-control">
                    <option>Last 3 Months</option>
                    <option>Last 6 Months</option>
                    <option>Last 12 Months</option>
                    <option>Last 3 Years</option>
                    <option>Custom</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Data Points</label>
                  <select className="form-control">
                    <option>All Data</option>
                    <option>Sales Only</option>
                    <option>Listings Only</option>
                    <option>Appraisals Only</option>
                  </select>
                </div>
                
                <button className="btn btn-primary">Apply Filters</button>
                <button className="btn btn-outline">Reset</button>
              </div>
            </div>
            
            <div className="placeholder-chart">
              <div className="chart-header">
                <h3>Market Activity (Last 12 Months)</h3>
                <div className="chart-controls">
                  <button className="btn btn-sm">Zoom</button>
                  <button className="btn btn-sm">Export</button>
                </div>
              </div>
              <div className="chart-container">
                {/* Placeholder for chart */}
                <div className="chart-placeholder">
                  <p>Market activity chart will be displayed here</p>
                </div>
              </div>
            </div>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Average Sale Price</h4>
                <div className="metric-value">$425,000</div>
                <div className="metric-trend positive">
                  <span>↑ 5.2%</span>
                  <span className="trend-period">vs. last period</span>
                </div>
              </div>
              
              <div className="metric-card">
                <h4>Median Days on Market</h4>
                <div className="metric-value">32</div>
                <div className="metric-trend negative">
                  <span>↓ 12.5%</span>
                  <span className="trend-period">vs. last period</span>
                </div>
              </div>
              
              <div className="metric-card">
                <h4>Total Sales Volume</h4>
                <div className="metric-value">$1.2B</div>
                <div className="metric-trend positive">
                  <span>↑ 3.7%</span>
                  <span className="trend-period">vs. last period</span>
                </div>
              </div>
              
              <div className="metric-card">
                <h4>Inventory</h4>
                <div className="metric-value">1,245</div>
                <div className="metric-trend negative">
                  <span>↓ 8.3%</span>
                  <span className="trend-period">vs. last period</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab !== 'market' && (
          <div className="placeholder-content">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p className="placeholder-text">
              {activeTab === 'trends' && 'Trend analysis tools will be displayed here.'}
              {activeTab === 'predictions' && 'Value prediction models will be displayed here.'}
              {activeTab === 'comparables' && 'Comparable property finder will be displayed here.'}
            </p>
            <div className="placeholder-box">
              <p>Content for the {activeTab} tab is under development.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;