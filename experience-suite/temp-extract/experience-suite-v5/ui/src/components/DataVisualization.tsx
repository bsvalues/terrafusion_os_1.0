import React, { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

// Real-time Data Visualization Components
export const BentonCountyMap: React.FC = () => {
  const [mapData] = useState({
    totalParcels: 89247,
    zonesAssessed: 12,
    assessmentProgress: 78.5,
    recentActivity: [
      { zone: 'Richland Urban', parcels: 15420, status: 'Complete' },
      { zone: 'Kennewick Central', parcels: 12340, status: 'In Progress' },
      { zone: 'Pasco Industrial', parcels: 8756, status: 'Pending' },
      { zone: 'West Richland', parcels: 6891, status: 'Complete' }
    ]
  });

  return (
    <div className="tf-county-map">
      <h2>🗺️ Benton County Assessment Map</h2>
      <div className="tf-map-overview">
        <div className="tf-map-stats">
          <div className="tf-map-stat">
            <h3>{mapData.totalParcels.toLocaleString()}</h3>
            <span>Total Parcels</span>
          </div>
          <div className="tf-map-stat">
            <h3>{mapData.zonesAssessed}</h3>
            <span>Assessment Zones</span>
          </div>
          <div className="tf-map-stat">
            <h3>{mapData.assessmentProgress}%</h3>
            <span>Progress Complete</span>
          </div>
        </div>
        
        <div className="tf-map-placeholder">
          <div className="tf-map-visual">
            <div className="tf-map-zone zone-complete">Richland</div>
            <div className="tf-map-zone zone-progress">Kennewick</div>
            <div className="tf-map-zone zone-pending">Pasco</div>
            <div className="tf-map-zone zone-complete">W. Richland</div>
          </div>
        </div>
        
        <div className="tf-zone-activity">
          <h3>Zone Assessment Status</h3>
          {mapData.recentActivity.map((zone, index) => (
            <div key={index} className="tf-zone-item">
              <div className="tf-zone-info">
                <h4>{zone.zone}</h4>
                <p>{zone.parcels.toLocaleString()} parcels</p>
              </div>
              <span className={`tf-zone-status status-${zone.status.toLowerCase().replace(' ', '-')}`}>
                {zone.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Real-time Performance Charts
export const PerformanceCharts: React.FC = () => {
  const [chartRef, setChartRef] = useState<HTMLCanvasElement | null>(null);
  const [performanceData] = useState({
    apiResponseTimes: [6.2, 5.8, 7.1, 6.5, 5.9, 6.8, 6.7],
    systemLoad: [23, 45, 67, 34, 56, 78, 45],
    agentActivity: [48234, 49876, 47892, 50123, 48967, 49234, 48779]
  });

  useEffect(() => {
    if (chartRef) {
      const ctx = chartRef.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'API Response Time (ms)',
                data: performanceData.apiResponseTimes,
                borderColor: '#00B3A4',
                backgroundColor: 'rgba(0, 179, 164, 0.1)',
                tension: 0.4
              },
              {
                label: 'System Load (%)',
                data: performanceData.systemLoad,
                borderColor: '#0A1E2E',
                backgroundColor: 'rgba(10, 30, 46, 0.1)',
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
  }, [chartRef, performanceData]);

  return (
    <div className="tf-performance-charts">
      <h2>📊 Real-time Performance Metrics</h2>
      <div className="tf-charts-grid">
        <div className="tf-chart-container">
          <h3>System Performance</h3>
          <canvas ref={setChartRef} width="400" height="200"></canvas>
        </div>
        
        <div className="tf-metrics-summary">
          <h3>Live Metrics</h3>
          <div className="tf-live-metrics">
            <div className="tf-live-metric">
              <span className="tf-metric-label">Active AI Agents</span>
              <span className="tf-metric-value">{performanceData.agentActivity[6].toLocaleString()}</span>
            </div>
            <div className="tf-live-metric">
              <span className="tf-metric-label">Avg Response Time</span>
              <span className="tf-metric-value">{performanceData.apiResponseTimes[6]}ms</span>
            </div>
            <div className="tf-live-metric">
              <span className="tf-metric-label">System Load</span>
              <span className="tf-metric-value">{performanceData.systemLoad[6]}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Revenue Analytics Dashboard
export const RevenueAnalytics: React.FC = () => {
  const [revenueData] = useState({
    monthlyRevenue: 477000,
    marketplaceRevenue: 142000,
    totalARPU: 619,
    annualProjection: 5400000,
    topPerformingModules: [
      { name: 'Government Edition', revenue: 45200, growth: '+12%' },
      { name: 'AI Command Brain', revenue: 38700, growth: '+8%' },
      { name: 'GIS Pro', revenue: 29800, growth: '+15%' },
      { name: 'Terra Collections', revenue: 28300, growth: '+5%' }
    ]
  });

  return (
    <div className="tf-revenue-analytics">
      <h2>💰 Revenue Analytics Dashboard</h2>
      <div className="tf-revenue-overview">
        <div className="tf-revenue-cards">
          <div className="tf-revenue-card">
            <h3>Monthly Revenue</h3>
            <p className="tf-revenue-amount">${(revenueData.monthlyRevenue / 1000).toFixed(0)}K</p>
            <span className="tf-revenue-trend">+8.5% vs last month</span>
          </div>
          <div className="tf-revenue-card">
            <h3>Marketplace ARPU</h3>
            <p className="tf-revenue-amount">${revenueData.marketplaceRevenue / 1000}K</p>
            <span className="tf-revenue-trend">+12.3% growth</span>
          </div>
          <div className="tf-revenue-card">
            <h3>Combined ARPU</h3>
            <p className="tf-revenue-amount">${revenueData.totalARPU}</p>
            <span className="tf-revenue-trend">Per county/month</span>
          </div>
          <div className="tf-revenue-card">
            <h3>Annual Projection</h3>
            <p className="tf-revenue-amount">${(revenueData.annualProjection / 1000000).toFixed(1)}M</p>
            <span className="tf-revenue-trend">Government market</span>
          </div>
        </div>
        
        <div className="tf-top-modules">
          <h3>Top Performing Modules</h3>
          {revenueData.topPerformingModules.map((module, index) => (
            <div key={index} className="tf-module-performance">
              <div className="tf-module-info">
                <h4>{module.name}</h4>
                <p>${(module.revenue / 1000).toFixed(1)}K monthly</p>
              </div>
              <span className={`tf-growth-indicator ${module.growth.startsWith('+') ? 'positive' : 'negative'}`}>
                {module.growth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AI Agent Activity Monitor
export const AIActivityMonitor: React.FC = () => {
  const [activityData, setActivityData] = useState({
    currentTime: new Date().toLocaleTimeString(),
    agentDistribution: {
      'Property Assessment': 15420,
      'Data Processing': 12340,
      'Security Monitoring': 8750,
      'Revenue Optimization': 6890,
      'Compliance Checking': 5379
    },
    recentTasks: [
      { task: 'Parcel 47-1234 Assessment Complete', agent: 'PA-4521', time: '14:32:15' },
      { task: 'Harris PACS Sync Complete', agent: 'DS-7892', time: '14:31:58' },
      { task: 'Security Scan Successful', agent: 'SM-2341', time: '14:31:22' },
      { task: 'Revenue Analysis Updated', agent: 'RO-9876', time: '14:30:45' }
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setActivityData(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tf-activity-monitor">
      <h2>🤖 AI Agent Activity Monitor</h2>
      <div className="tf-activity-header">
        <p>Real-time Agent Coordination - {activityData.currentTime}</p>
      </div>
      
      <div className="tf-activity-content">
        <div className="tf-agent-distribution">
          <h3>Agent Distribution by Task</h3>
          {Object.entries(activityData.agentDistribution).map(([task, count]) => (
            <div key={task} className="tf-task-allocation">
              <div className="tf-task-info">
                <span className="tf-task-name">{task}</span>
                <span className="tf-task-count">{count.toLocaleString()} agents</span>
              </div>
              <div className="tf-task-bar">
                <div 
                  className="tf-task-progress" 
                  style={{ width: `${(count / 50000) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="tf-recent-activity">
          <h3>Recent Agent Activity</h3>
          <div className="tf-activity-feed">
            {activityData.recentTasks.map((task, index) => (
              <div key={index} className="tf-activity-item">
                <div className="tf-activity-details">
                  <p className="tf-activity-task">{task.task}</p>
                  <span className="tf-activity-agent">Agent: {task.agent}</span>
                </div>
                <span className="tf-activity-time">{task.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};