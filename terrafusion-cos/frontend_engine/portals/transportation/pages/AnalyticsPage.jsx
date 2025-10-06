/**
 * Transportation Portal - Analytics Page
 * Historical trends and transportation analytics
 */

import { TerraCard, TerraButton } from '../../../src/components';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const trends = [
    { metric: 'Traffic Volume', current: '10,147 veh/hr', lastWeek: '9,834 veh/hr', change: '+3.2%', trend: 'up' },
    { metric: 'Average Speed', current: '38 mph', lastWeek: '42 mph', change: '-9.5%', trend: 'down' },
    { metric: 'Transit Ridership', current: '8,467/day', lastWeek: '8,123/day', change: '+4.2%', trend: 'up' },
    { metric: 'Parking Occupancy', current: '68%', lastWeek: '64%', change: '+6.3%', trend: 'up' },
    { metric: 'Incident Response Time', current: '4.2 min', lastWeek: '5.1 min', change: '-17.6%', trend: 'down' },
    { metric: 'On-Time Performance', current: '87%', lastWeek: '83%', change: '+4.8%', trend: 'up' },
  ];

  const peakHours = [
    { hour: '6:00 AM', volume: 2847, congestion: 45 },
    { hour: '7:00 AM', volume: 4923, congestion: 72 },
    { hour: '8:00 AM', volume: 6234, congestion: 89 },
    { hour: '9:00 AM', volume: 5156, congestion: 78 },
    { hour: '12:00 PM', volume: 4567, congestion: 65 },
    { hour: '5:00 PM', volume: 7234, congestion: 92 },
    { hour: '6:00 PM', volume: 5892, congestion: 81 },
  ];

  const topIncidents = [
    { location: 'I-5 Mile 247', incidents: 47, avgDelay: '35 min', severity: 'High' },
    { location: 'Highway 99 @ River Rd', incidents: 34, avgDelay: '28 min', severity: 'High' },
    { location: 'Main St & 5th Ave', incidents: 28, avgDelay: '15 min', severity: 'Medium' },
    { location: 'Downtown @ Oak St', incidents: 23, avgDelay: '12 min', severity: 'Medium' },
    { location: 'Highway 20 Exit 12', incidents: 19, avgDelay: '8 min', severity: 'Low' },
  ];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transportation Analytics</h1>
          <p className="page-subtitle">Historical trends and performance insights</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📥 Export Data</TerraButton>
          <TerraButton variant="outline">📊 Custom Report</TerraButton>
          <TerraButton variant="primary">⚙️ Configure Metrics</TerraButton>
        </div>
      </div>

      <TerraCard className="trends-card">
        <h2>Key Performance Trends (Last 7 Days)</h2>
        <div className="trends-grid">
          {trends.map((trend, index) => (
            <div key={index} className="trend-item">
              <div className="trend-header">
                <span className="trend-metric">{trend.metric}</span>
                <span className={`trend-change ${trend.trend === 'up' ? (trend.metric.includes('Response') || trend.metric.includes('Speed') ? 'trend-negative' : 'trend-positive') : (trend.metric.includes('Response') || trend.metric.includes('Speed') ? 'trend-positive' : 'trend-negative')}`}>
                  {trend.trend === 'up' ? '📈' : '📉'} {trend.change}
                </span>
              </div>
              <div className="trend-values">
                <div className="trend-current">
                  <span className="trend-label">Current:</span>
                  <span className="trend-value">{trend.current}</span>
                </div>
                <div className="trend-previous">
                  <span className="trend-label">Last Week:</span>
                  <span className="trend-value">{trend.lastWeek}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TerraCard>

      <div className="analytics-grid">
        <TerraCard className="peak-hours-card">
          <h2>Peak Traffic Hours</h2>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {peakHours.map((hour, index) => (
                <div key={index} className="chart-bar-item">
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar-fill" 
                      style={{ 
                        height: `${(hour.volume / 8000) * 100}%`,
                        background: hour.congestion > 80 ? '#ef4444' : hour.congestion > 60 ? '#f59e0b' : '#10b981'
                      }}
                    ></div>
                  </div>
                  <div className="chart-bar-label">{hour.hour}</div>
                  <div className="chart-bar-value">{hour.volume.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#10b981' }}></span>
                <span>Low Congestion (&lt;60%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#f59e0b' }}></span>
                <span>Medium Congestion (60-80%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#ef4444' }}></span>
                <span>High Congestion (&gt;80%)</span>
              </div>
            </div>
          </div>
        </TerraCard>

        <TerraCard className="incidents-card">
          <h2>Top Incident Locations (Last 30 Days)</h2>
          <div className="incidents-list">
            {topIncidents.map((incident, index) => (
              <div key={index} className="incident-item">
                <div className="incident-rank">{index + 1}</div>
                <div className="incident-details">
                  <div className="incident-location">{incident.location}</div>
                  <div className="incident-stats">
                    <span className="incident-count">{incident.incidents} incidents</span>
                    <span className="incident-delay">Avg delay: {incident.avgDelay}</span>
                    <span className={`incident-severity severity-${incident.severity.toLowerCase()}`}>
                      {incident.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>
      </div>

      <TerraCard className="forecast-card">
        <h2>7-Day Forecast & Predictions</h2>
        <div className="forecast-content">
          <div className="forecast-item">
            <span className="forecast-icon">📈</span>
            <div className="forecast-info">
              <h3>Traffic Volume Increase Expected</h3>
              <p>Predicted 12% increase in traffic volume this weekend due to local events</p>
            </div>
          </div>
          <div className="forecast-item">
            <span className="forecast-icon">🚌</span>
            <div className="forecast-info">
              <h3>Transit Demand Spike</h3>
              <p>Transit ridership expected to increase 18% on Friday (University game day)</p>
            </div>
          </div>
          <div className="forecast-item">
            <span className="forecast-icon">🅿️</span>
            <div className="forecast-info">
              <h3>Parking Capacity Alert</h3>
              <p>Downtown parking likely to reach 95%+ capacity on Saturday afternoon</p>
            </div>
          </div>
        </div>
      </TerraCard>
    </div>
  );
};

export default AnalyticsPage;
