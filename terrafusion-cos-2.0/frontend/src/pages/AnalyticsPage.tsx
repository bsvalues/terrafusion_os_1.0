import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaChartPie, FaChartBar, FaDatabase, FaEye, FaDownload, FaCog, FaBrain } from 'react-icons/fa';
import '../styles/app.css'; // Ensure TerraFusion brand styles are imported

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState({
    name: "TerraFusion Analytics",
    version: "2.0.0",
    capabilities: [
      "Real-time data visualization",
      "Predictive analytics",
      "Machine learning insights",
      "Government data analysis",
      "Performance optimization",
      "Trend analysis"
    ],
    data_sources: [
      "Harris PACS Database",
      "Tyler Courts System",
      "Esri GIS Platform",
      "CostForge Financial Data",
      "AI Swarm Metrics"
    ],
    active_dashboards: 8,
    queries_today: 1250
  });

  const [dashboards, setDashboards] = useState([
    {
      id: "vendor_performance",
      name: "Vendor Performance Dashboard",
      description: "Real-time vendor performance metrics",
      widgets: 12,
      last_updated: "2024-01-15T14:30:00Z",
      status: "active"
    },
    {
      id: "ai_swarm_metrics",
      name: "AI Swarm Metrics Dashboard", 
      description: "AI agent coordination and performance",
      widgets: 8,
      last_updated: "2024-01-15T14:28:00Z",
      status: "active"
    },
    {
      id: "financial_intelligence",
      name: "Financial Intelligence Dashboard",
      description: "CostForge AI financial analysis",
      widgets: 15,
      last_updated: "2024-01-15T14:25:00Z",
      status: "active"
    },
    {
      id: "compliance_monitoring",
      name: "Compliance Monitoring Dashboard",
      description: "Real-time compliance status and alerts",
      widgets: 10,
      last_updated: "2024-01-15T14:20:00Z",
      status: "active"
    },
    {
      id: "system_performance",
      name: "System Performance Dashboard",
      description: "Platform performance and optimization metrics",
      widgets: 14,
      last_updated: "2024-01-15T14:15:00Z",
      status: "active"
    },
    {
      id: "user_activity",
      name: "User Activity Dashboard",
      description: "User engagement and platform usage analytics",
      widgets: 9,
      last_updated: "2024-01-15T14:10:00Z",
      status: "active"
    }
  ]);

  const [recentInsights, setRecentInsights] = useState([
    {
      id: "insight-001",
      title: "Harris PACS Performance Optimization",
      description: "AI identified 23% efficiency improvement opportunity in property assessment workflow",
      confidence: 94,
      impact: "high",
      generated_at: "2024-01-15T14:30:00Z"
    },
    {
      id: "insight-002",
      title: "Tyler Courts Automation Potential",
      description: "Machine learning suggests 45% reduction in manual case processing time",
      confidence: 89,
      impact: "medium",
      generated_at: "2024-01-15T14:25:00Z"
    },
    {
      id: "insight-003",
      title: "CostForge Revenue Prediction",
      description: "Predictive model forecasts 18% revenue increase for Q4 based on current trends",
      confidence: 92,
      impact: "high",
      generated_at: "2024-01-15T14:20:00Z"
    }
  ]);

  useEffect(() => {
    // In a real application, you would fetch this data from your API Gateway
    // For now, we'll simulate real-time updates
    const interval = setInterval(() => {
      setAnalytics(prevAnalytics => ({
        ...prevAnalytics,
        queries_today: prevAnalytics.queries_today + Math.floor(Math.random() * 10) + 1
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tf-page-container tf-analytics-page">
      <header className="tf-page-header">
        <h1 className="tf-page-title">
          <FaChartLine className="tf-icon-large tf-gradient-text" /> TerraFusion Analytics
        </h1>
        <p className="tf-page-subtitle">AI-powered data visualization and predictive analytics for government operations.</p>
      </header>

      <section className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-4 tf-gap-6 tf-mb-8">
        <div className="tf-card tf-card-gradient-blue">
          <div className="tf-card-header">
            <FaChartBar className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Active Dashboards</h3>
          </div>
          <p className="tf-card-value tf-text-white">{analytics.active_dashboards}</p>
          <p className="tf-card-description tf-text-white">Real-time data visualization dashboards.</p>
        </div>

        <div className="tf-card tf-card-gradient-green">
          <div className="tf-card-header">
            <FaDatabase className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Queries Today</h3>
          </div>
          <p className="tf-card-value tf-text-white">{analytics.queries_today.toLocaleString()}</p>
          <p className="tf-card-description tf-text-white">Analytics queries executed in the last 24 hours.</p>
        </div>

        <div className="tf-card tf-card-gradient-purple">
          <div className="tf-card-header">
            <FaBrain className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">AI Insights</h3>
          </div>
          <p className="tf-card-value tf-text-white">{recentInsights.length}</p>
          <p className="tf-card-description tf-text-white">Machine learning insights generated today.</p>
        </div>

        <div className="tf-card tf-card-gradient-orange">
          <div className="tf-card-header">
            <FaChartPie className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Data Sources</h3>
          </div>
          <p className="tf-card-value tf-text-white">{analytics.data_sources.length}</p>
          <p className="tf-card-description tf-text-white">Integrated data sources for analysis.</p>
        </div>
      </section>

      <section className="tf-section-card">
        <h2 className="tf-section-title">Analytics Dashboards</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-3 tf-gap-6">
          {dashboards.map((dashboard) => (
            <div key={dashboard.id} className="tf-card tf-card-hover">
              <div className="tf-card-header">
                <FaChartLine className="tf-icon tf-text-blue-600" />
                <h3 className="tf-card-title">{dashboard.name}</h3>
              </div>
              <p className="tf-card-description tf-mb-4">{dashboard.description}</p>
              <div className="tf-mb-4">
                <div className="tf-flex tf-justify-between tf-items-center tf-mb-2">
                  <span className="tf-text-sm tf-text-gray-600">Widgets:</span>
                  <span className="tf-font-semibold">{dashboard.widgets}</span>
                </div>
                <div className="tf-flex tf-justify-between tf-items-center tf-mb-2">
                  <span className="tf-text-sm tf-text-gray-600">Status:</span>
                  <span className="tf-badge tf-badge-green">{dashboard.status}</span>
                </div>
                <div className="tf-flex tf-justify-between tf-items-center">
                  <span className="tf-text-sm tf-text-gray-600">Last Updated:</span>
                  <span className="tf-text-sm">{new Date(dashboard.last_updated).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="tf-flex tf-space-x-2">
                <button className="tf-button tf-button-sm tf-button-primary tf-flex-1">
                  <FaEye className="tf-mr-1" /> View
                </button>
                <button className="tf-button tf-button-sm tf-button-secondary tf-flex-1">
                  <FaCog className="tf-mr-1" /> Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Recent AI Insights</h2>
        <div className="tf-space-y-4">
          {recentInsights.map((insight) => (
            <div key={insight.id} className="tf-card tf-card-hover">
              <div className="tf-card-body">
                <div className="tf-flex tf-justify-between tf-items-start tf-mb-3">
                  <h3 className="tf-text-lg tf-font-semibold tf-text-gray-800">{insight.title}</h3>
                  <div className="tf-flex tf-space-x-2">
                    <span className={`tf-badge ${
                      insight.impact === 'high' ? 'tf-badge-red' : 
                      insight.impact === 'medium' ? 'tf-badge-yellow' : 'tf-badge-green'
                    }`}>
                      {insight.impact} impact
                    </span>
                    <span className="tf-badge tf-badge-blue">{insight.confidence}% confidence</span>
                  </div>
                </div>
                <p className="tf-text-gray-700 tf-mb-3">{insight.description}</p>
                <div className="tf-flex tf-justify-between tf-items-center">
                  <span className="tf-text-sm tf-text-gray-500">
                    Generated: {new Date(insight.generated_at).toLocaleString()}
                  </span>
                  <div className="tf-flex tf-space-x-2">
                    <button className="tf-button tf-button-xs tf-button-primary">
                      <FaEye className="tf-mr-1" /> View Details
                    </button>
                    <button className="tf-button tf-button-xs tf-button-secondary">
                      <FaDownload className="tf-mr-1" /> Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Data Sources</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 tf-gap-4">
          {analytics.data_sources.map((source, index) => (
            <div key={index} className="tf-flex tf-items-center tf-p-3 tf-bg-gray-50 tf-rounded-lg">
              <FaDatabase className="tf-mr-3 tf-text-blue-600" />
              <span className="tf-text-gray-700">{source}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Analytics Capabilities</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 tf-gap-4">
          {analytics.capabilities.map((capability, index) => (
            <div key={index} className="tf-flex tf-items-center tf-p-3 tf-bg-gray-50 tf-rounded-lg">
              <FaCog className="tf-mr-3 tf-text-blue-600" />
              <span className="tf-text-gray-700">{capability}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Quick Actions</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-4 tf-gap-4">
          <Link to="/analytics/dashboard/new" className="tf-button tf-button-primary">
            <FaChartBar className="tf-mr-2" /> Create Dashboard
          </Link>
          <Link to="/analytics/insights" className="tf-button tf-button-secondary">
            <FaBrain className="tf-mr-2" /> AI Insights
          </Link>
          <Link to="/analytics/data-sources" className="tf-button tf-button-tertiary">
            <FaDatabase className="tf-mr-2" /> Data Sources
          </Link>
          <Link to="/analytics/reports" className="tf-button tf-button-quaternary">
            <FaChartLine className="tf-mr-2" /> Analytics Reports
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
