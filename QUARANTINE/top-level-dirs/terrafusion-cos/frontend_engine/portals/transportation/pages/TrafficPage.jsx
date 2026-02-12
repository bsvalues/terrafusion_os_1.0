/**
 * Transportation Portal - Traffic Page
 * Real-time traffic flow monitoring and incident management
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton } from '../../../src/components';
import { useTraffic } from '../../../src/hooks/useTransportation';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './TrafficPage.css';

const TrafficPage = () => {
  const { trafficFlow, roadSegments, incidents: incidentsData, loading, error, refetch } = useTraffic();
  const [timeRange, setTimeRange] = useState('live');

  if (loading) {
    return <LoadingState message="Loading traffic data..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load traffic data" onRetry={refetch} fullPage />;
  }

  const corridors = roadSegments || [
    { id: 1, name: 'I-5 Corridor', flow: 'Heavy', speed: 42, incidents: 2, congestion: 78, trend: 'worsening' },
    { id: 2, name: 'Highway 20', flow: 'Moderate', speed: 58, incidents: 1, congestion: 45, trend: 'stable' },
    { id: 3, name: 'Downtown Core', flow: 'Light', speed: 28, incidents: 0, congestion: 32, trend: 'improving' },
    { id: 4, name: 'Main Street', flow: 'Moderate', speed: 35, incidents: 0, congestion: 52, trend: 'stable' },
    { id: 5, name: 'Highway 99', flow: 'Heavy', speed: 38, incidents: 3, congestion: 82, trend: 'worsening' },
  ];

  const incidents = [
    { id: 'TRF-1023', type: 'Accident', location: 'I-5 Mile 247 NB', severity: 'High', lanes: '2 closed', delay: '35 min', eta: '45 min', reported: '10 min ago' },
    { id: 'TRF-1024', type: 'Construction', location: 'Main St & 5th Ave', severity: 'Medium', lanes: '1 closed', delay: '12 min', eta: '2 hours', reported: '1 hour ago' },
    { id: 'TRF-1025', type: 'Breakdown', location: 'Hwy 20 Exit 12', severity: 'Low', lanes: 'Shoulder', delay: '5 min', eta: '15 min', reported: '25 min ago' },
    { id: 'TRF-1026', type: 'Accident', location: 'Hwy 99 Mile 34', severity: 'High', lanes: '3 closed', delay: '42 min', eta: '1 hour', reported: '5 min ago' },
  ];

  const sensors = [
    { id: 'SEN-001', location: 'I-5 @ Oak St', volume: 2847, speed: 42, occupancy: 78, status: 'Active' },
    { id: 'SEN-002', location: 'Hwy 20 @ Maple', volume: 1923, speed: 58, occupancy: 45, status: 'Active' },
    { id: 'SEN-003', location: 'Main St @ 3rd', volume: 1234, speed: 28, occupancy: 32, status: 'Active' },
    { id: 'SEN-004', location: 'Hwy 99 @ River Rd', volume: 3156, speed: 38, occupancy: 82, status: 'Warning' },
    { id: 'SEN-005', location: 'Downtown @ Center', volume: 987, speed: 22, occupancy: 28, status: 'Active' },
  ];

  const corridorColumns = [
    { key: 'name', label: 'Corridor', width: '25%' },
    { key: 'flow', label: 'Traffic Flow', width: '15%' },
    { key: 'speed', label: 'Avg Speed (mph)', width: '15%' },
    { key: 'incidents', label: 'Incidents', width: '10%' },
    { key: 'congestion', label: 'Congestion', width: '15%', render: (row) => (
      <div className="congestion-bar">
        <div className="congestion-fill" style={{ width: `${row.congestion}%`, background: row.congestion > 70 ? '#ef4444' : row.congestion > 50 ? '#f59e0b' : '#10b981' }}></div>
        <span>{row.congestion}%</span>
      </div>
    )},
    { key: 'trend', label: 'Trend', width: '15%', render: (row) => (
      <span className={`trend-badge trend-${row.trend}`}>
        {row.trend === 'worsening' ? '📈 Worsening' : row.trend === 'improving' ? '📉 Improving' : '➡️ Stable'}
      </span>
    )},
    { key: 'actions', label: '', width: '5%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const incidentColumns = [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'type', label: 'Type', width: '12%' },
    { key: 'location', label: 'Location', width: '22%' },
    { key: 'severity', label: 'Severity', width: '10%' },
    { key: 'lanes', label: 'Lanes Affected', width: '12%' },
    { key: 'delay', label: 'Delay', width: '10%' },
    { key: 'eta', label: 'ETA Clear', width: '12%' },
    { key: 'reported', label: 'Reported', width: '12%' },
  ];

  const sensorColumns = [
    { key: 'id', label: 'Sensor ID', width: '15%' },
    { key: 'location', label: 'Location', width: '30%' },
    { key: 'volume', label: 'Volume (veh/hr)', width: '15%' },
    { key: 'speed', label: 'Speed (mph)', width: '15%' },
    { key: 'occupancy', label: 'Occupancy %', width: '15%' },
    { key: 'status', label: 'Status', width: '10%' },
  ];

  return (
    <div className="traffic-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Traffic Control Center</h1>
          <p className="page-subtitle">Real-time traffic monitoring and incident management</p>
        </div>
        <div className="page-actions">
          <div className="time-range-selector">
            <TerraButton 
              variant={timeRange === 'live' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('live')}
            >
              🔴 Live
            </TerraButton>
            <TerraButton 
              variant={timeRange === '1h' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('1h')}
            >
              1 Hour
            </TerraButton>
            <TerraButton 
              variant={timeRange === '24h' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('24h')}
            >
              24 Hours
            </TerraButton>
          </div>
          <TerraButton variant="primary">🗺️ Traffic Map</TerraButton>
        </div>
      </div>

      <div className="traffic-stats">
        <div className="stat-card">
          <span className="stat-icon">🚗</span>
          <div className="stat-content">
            <span className="stat-value">10,147</span>
            <span className="stat-label">Vehicles/Hour</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div className="stat-content">
            <span className="stat-value">38 mph</span>
            <span className="stat-label">Average Speed</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-value">{incidents.length}</span>
            <span className="stat-label">Active Incidents</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-value">62%</span>
            <span className="stat-label">Network Congestion</span>
          </div>
        </div>
      </div>

      <TerraCard className="corridors-card">
        <h2>Major Corridors</h2>
        <TerraTable columns={corridorColumns} data={corridors} pageSize={10} />
      </TerraCard>

      <TerraCard className="incidents-card">
        <h2>Active Traffic Incidents</h2>
        <TerraTable columns={incidentColumns} data={incidents} pageSize={10} />
      </TerraCard>

      <TerraCard className="sensors-card">
        <h2>Traffic Sensors</h2>
        <TerraTable columns={sensorColumns} data={sensors} pageSize={10} />
      </TerraCard>
    </div>
  );
};

export default TrafficPage;
