import "./terrafusion-brand.css";
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  BarChart, 
  TrendingUp, 
  PieChart, 
  ShowChart, 
  Group, 
  AttachMoney, 
  GpsFixed,
  CalendarToday,
  FilterList,
  GetApp,
  Refresh,
  Settings
} from '@mui/icons-material';
import './App.css';

interface AnalyticsData {
  revenue: { current: number; previous: number; change: number; };
  users: { current: number; previous: number; change: number; };
  conversion: { current: number; previous: number; change: number; };
  engagement: { current: number; previous: number; change: number; };
}

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: { current: 125000, previous: 98000, change: 27.6 },
    users: { current: 15420, previous: 12240, change: 25.9 },
    conversion: { current: 3.2, previous: 2.8, change: 14.3 },
    engagement: { current: 68.5, previous: 61.2, change: 11.9 }
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Simulated data fetch - replace with actual Tauri invoke
        const data = await invoke('get_analytics_data', { range: dateRange }) as AnalyticsData;
        if (data) {
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const exportReport = async (format: string) => {
    try {
      await invoke('export_report', { format, data: analyticsData });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const refreshData = async () => {
    try {
      const data = await invoke('refresh_analytics') as AnalyticsData;
      if (data) {
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  interface MetricCardProps {
    title: string;
    value: number;
    change: number;
    icon: React.ElementType;
    prefix?: string;
    suffix?: string;
  }

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }) => (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon">
          <Icon />
        </div>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
        <TrendingUp />
        {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last period
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="metrics-row">
        <MetricCard
          title="Total Revenue"
          value={analyticsData.revenue.current}
          change={analyticsData.revenue.change}
          icon={AttachMoney}
          prefix="$"
        />
        <MetricCard
          title="Active Users"
          value={analyticsData.users.current}
          change={analyticsData.users.change}
          icon={Group}
        />
        <MetricCard
          title="Conversion Rate"
          value={analyticsData.conversion.current}
          change={analyticsData.conversion.change}
          icon={GpsFixed}
          suffix="%"
        />
        <MetricCard
          title="Engagement Score"
          value={analyticsData.engagement.current}
          change={analyticsData.engagement.change}
          icon={ShowChart}
          suffix="%"
        />
      </div>
      
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Revenue Trend</h3>
            <div className="chart-controls">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="date-selector"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
          <div className="chart-placeholder">
            <BarChart className="chart-icon" />
            <span className="chart-subtitle">Dynamic visualization based on selected time period</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>User Demographics</h3>
          </div>
          <div className="chart-placeholder">
            <PieChart className="chart-icon" />
            <span className="chart-subtitle">Geographic and demographic breakdown</span>
          </div>
        </div>
      </div>

      <div className="insights-panel">
        <h3>Key Insights</h3>
        <div className="insight-item">
          <div className="insight-icon">
            <TrendingUp />
          </div>
          <div className="insight-content">
            <h4>Revenue Growth</h4>
            <p>Revenue increased by 27.6% compared to the previous period, showing strong market traction.</p>
          </div>
        </div>

        <div className="insight-item">
          <div className="insight-icon">
            <Group />
          </div>
          <div className="insight-content">
            <h4>User Acquisition</h4>
            <p>25.9% increase in active users indicates effective marketing campaigns.</p>
          </div>
        </div>

        <div className="insight-item">
          <div className="insight-icon">
            <GpsFixed />
          </div>
          <div className="insight-content">
            <h4>Conversion Optimization</h4>
            <p>While conversion rates improved, there's still room for optimization in the user funnel.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-view">
      <div className="reports-toolbar">
        <div className="toolbar-actions">
          <button className="action-btn" onClick={refreshData}>
            <Refresh />
            Refresh Data
          </button>
          <button className="action-btn" onClick={() => exportReport('pdf')}>
            <GetApp />
            Export PDF
          </button>
          <button className="action-btn" onClick={() => exportReport('excel')}>
            <GetApp />
            Export Excel
          </button>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h4>Executive Summary</h4>
          <p>Comprehensive overview of all key metrics and KPIs</p>
          <button className="generate-btn">Generate Report</button>
        </div>

        <div className="report-card">
          <h4>User Analytics</h4>
          <p>Detailed analysis of user interactions and engagement patterns</p>
          <button className="generate-btn">Generate Report</button>
        </div>

        <div className="report-card">
          <h4>Revenue Analysis</h4>
          <p>Revenue breakdown by channels, campaigns, and user segments</p>
          <button className="generate-btn">Generate Report</button>
        </div>

        <div className="report-card">
          <h4>Conversion Funnel</h4>
          <p>Step-by-step analysis of user conversion journey</p>
          <button className="generate-btn">Generate Report</button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <h3>Analytics Settings</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Enable real-time updates
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Show advanced metrics
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" />
              Enable email notifications
            </label>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-item">
            <label>Data refresh interval</label>
            <div className="setting-select">
              <select defaultValue="15">
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Cache analytics data
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="terrainsight-app">
      <header className="app-header">
        <div className="header-content">
          <h1>TerraInsight</h1>
          <span className="app-subtitle">Advanced Analytics Dashboard</span>
        </div>
        <div className="header-actions">
          <button className="header-btn">
            <CalendarToday />
            Schedule
          </button>
          <button className="header-btn">
            <FilterList />
            Filters
          </button>
          <button className="header-btn">
            <Settings />
            Settings
          </button>
        </div>
      </header>

      <main className="app-main">
        <nav className="app-nav">
          <button
            className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-btn ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          >
            Reports
          </button>
          <button
            className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </button>
        </nav>

        <div className="app-content">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'reports' && renderReports()}
          {activeView === 'settings' && renderSettings()}
        </div>
      </main>
    </div>
  );
}

export default App;
