import "./terrafusion-brand.css";
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  Filter,
  Download,
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

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }>;
}

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: { current: 125470, previous: 98320, change: 27.6 },
    users: { current: 15680, previous: 12450, change: 25.9 },
    conversion: { current: 3.47, previous: 2.89, change: 20.1 },
    engagement: { current: 68.3, previous: 62.1, change: 10.0 }
  });
  
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const data = await invoke('load_analytics_data', { dateRange });
      console.log('Analytics data loaded:', data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const result = await invoke('export_analytics_report', { format, dateRange });
      console.log('Report exported:', result);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }) => (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon"><>

          <Icon size={24} />
        </div>
        <span
</>

className="metric-title">{title}</span>
      </div><>

      <div className="metric-value">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      <div
</>

className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
        <TrendingUp size={16} />
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
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard
          title="Active Users"
          value={analyticsData.users.current}
          change={analyticsData.users.change}
          icon={Users}
        />
        <MetricCard
          title="Conversion Rate"
          value={analyticsData.conversion.current}
          change={analyticsData.conversion.change}
          icon={Target}
          suffix="%"
        /><>

        <MetricCard
          title="Engagement Score"
          value={analyticsData.engagement.current}
          change={analyticsData.engagement.change}
          icon={Activity}
          suffix="%"
        />
      </div>
      
      <div
</>

className="charts-section">
        <div className="chart-container">
          <div className="chart-header"><>

            <h3>Revenue Trend</h3>
            <div
</>

className="chart-controls">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="date-selector"
              ><>

                <option value="7d">Last 7 days</option>
                <option
</>

value="30d">Last 30 days</option><>

                <option value="90d">Last 90 days</option>
                <option
</>

value="1y">Last year</option>
              </select>
            </div>
          </div>
          <div className="chart-placeholder">
            <BarChart3 size={64} className="chart-icon" /><>

            <p>Revenue Analytics Chart</p>
            <span
</>

className="chart-subtitle">Dynamic visualization based on selected time period</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>User Distribution</h3>
          </div>
          <div className="chart-placeholder">
            <PieChart size={64} className="chart-icon" /><>

            <p>User Segmentation</p>
            <span
</>

className="chart-subtitle">Geographic and demographic breakdown</span>
          </div>
        </div>
      </div>

      <div className="insights-panel"><>

        <h3>Key Insights</h3>
        <div
</>

className="insight-item"><>

          <div className="insight-indicator positive"></div>
          <div
</>

className="insight-content"><>

            <h4>Revenue Growth Acceleration</h4>
            <p
</>

</>>Revenue increased by 27.6% compared to the previous period, showing strong market traction.</p>
          </div>
        </div>
        <div className="insight-item"><>

          <div className="insight-indicator positive"></div>
          <div
</>

className="insight-content"><>

            <h4>User Acquisition Success</h4>
            <p
</>

</>>25.9% increase in active users indicates effective marketing campaigns.</p>
          </div>
        </div>
        <div className="insight-item"><>

          <div className="insight-indicator warning"></div>
          <div
</>

className="insight-content"><>

            <h4>Conversion Optimization Opportunity</h4>
            <p
</>

</>>While conversion rates improved, there's still room for optimization in the user funnel.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-section">
      <div className="reports-toolbar"><>

        <h3>Analytics Reports</h3>
        <div
</>

className="toolbar-actions">
          <button className="action-btn"><>

            <Filter size={16} />
            Filters
          </button>
          <button
</>

className="action-btn" onClick={() => exportReport('pdf')}><>

            <Download size={16} />
            Export PDF
          </button>
          <button
</>

className="action-btn" onClick={() => exportReport('excel')}>
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>
      
      <div className="reports-grid">
        <div className="report-card"><>

          <h4>Performance Summary</h4>
          <p
</>

</>>Comprehensive overview of all key metrics and KPIs</p>
          <button className="generate-btn">Generate Report</button>
        </div>
        <div className="report-card"><>

          <h4>User Behavior Analysis</h4>
          <p
</>

</>>Detailed analysis of user interactions and engagement patterns</p>
          <button className="generate-btn">Generate Report</button>
        </div>
        <div className="report-card"><>

          <h4>Revenue Attribution</h4>
          <p
</>

</>>Revenue breakdown by channels, campaigns, and user segments</p>
          <button className="generate-btn">Generate Report</button>
        </div>
        <div className="report-card"><>

          <h4>Conversion Funnel</h4>
          <p
</>

</>>Step-by-step analysis of user conversion journey</p>
          <button className="generate-btn">Generate Report</button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section"><>

      <h3>Analytics Configuration</h3>
      <div
</>

className="settings-grid">
        <div className="setting-group"><>

          <h4>Data Sources</h4>
          <div
</>

className="setting-item">
            <label>
              <input type="checkbox" checked />
              Google Analytics
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" checked />
              Internal Database
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" />
              Third-party APIs
            </label>
          </div>
        </div>
        
        <div className="setting-group"><>

          <h4>Refresh Settings</h4>
          <div
</>

className="setting-item"><>

            <label>Auto-refresh interval:</label>
            <select
</>

className="setting-select"><>

              <option value="5">5 minutes</option>
              <option
</>

value="15">15 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>
        </div>
        
        <div className="setting-group"><>

          <h4>Notifications</h4>
          <div
</>

className="setting-item">
            <label>
              <input type="checkbox" checked />
              Alert on significant changes
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" />
              Daily summary emails
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="terrainsight-app">
      <header className="app-header">
        <div className="header-left">
          <BarChart3 size={24} className="app-icon" /><>

          <h1>TerraInsight</h1>
          <span
</>

className="app-subtitle">Advanced Analytics Dashboard</span>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={loadAnalyticsData} disabled={isLoading}><>

            <Refresh size={20} className={isLoading ? 'spinning' : ''} />
          </button>
          <button
</>

className="header-btn"><>

            <Calendar size={20} />
          </button>
          <button
</>

className="header-btn">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          <button 
            className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          ><>

            <Activity size={20} />
            Overview
          </button>
          <button
</>

            className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveView('analytics')}
          ><>

            <BarChart3 size={20} />
            Analytics
          </button>
          <button
</>

            className={`nav-btn ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          ><>

            <Download size={20} />
            Reports
          </button>
          <button
</>

            className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <Settings size={20} />
            Settings
          </button>
        </nav>

        <main className="main-content">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'analytics' && renderOverview()}
          {activeView === 'reports' && renderReports()}
          {activeView === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}

export default App;
