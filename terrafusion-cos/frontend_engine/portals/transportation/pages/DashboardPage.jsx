/**
 * Transportation Portal - Dashboard Page
 * Real-time traffic monitoring and transportation analytics
 */

import { TerraCard, TerraMetric, TerraTable, TerraButton } from '../../../src/components';
import './DashboardPage.css';

const DashboardPage = () => {
  const metrics = [
    { label: 'Traffic Flow', value: '87%', trend: '+5%', trendUp: true, icon: '🚗' },
    { label: 'Active Transit', value: '42 Buses', trend: '+3', trendUp: true, icon: '🚌' },
    { label: 'Parking Available', value: '1,247', trend: '-89', trendUp: false, icon: '🅿️' },
    { label: 'Avg Commute Time', value: '18 min', trend: '-2 min', trendUp: false, icon: '⏱️' },
  ];

  const trafficIncidents = [
    { id: 'TRF-1023', type: 'Accident', location: 'I-5 Mile 247', severity: 'High', lanes: '2 closed', eta: '45 min', time: '10 min ago' },
    { id: 'TRF-1024', type: 'Construction', location: 'Main St & 5th Ave', severity: 'Medium', lanes: '1 closed', eta: '2 hours', time: '1 hour ago' },
    { id: 'TRF-1025', type: 'Breakdown', location: 'Highway 20 Exit 12', severity: 'Low', lanes: 'Shoulder', eta: '15 min', time: '25 min ago' },
  ];

  const transitStatus = [
    { route: 'Route 1', status: 'On Time', buses: 5, passengers: 142, nextArrival: '3 min' },
    { route: 'Route 5', status: 'Delayed', buses: 4, passengers: 98, nextArrival: '8 min' },
    { route: 'Route 12', status: 'On Time', buses: 6, passengers: 187, nextArrival: '5 min' },
    { route: 'Route 18', status: 'On Time', buses: 3, passengers: 76, nextArrival: '12 min' },
  ];

  const trafficColumns = [
    { key: 'id', label: 'ID', width: '12%' },
    { key: 'type', label: 'Type', width: '15%' },
    { key: 'location', label: 'Location', width: '25%' },
    { key: 'severity', label: 'Severity', width: '12%' },
    { key: 'lanes', label: 'Lanes Affected', width: '15%' },
    { key: 'eta', label: 'ETA Clear', width: '12%' },
    { key: 'time', label: 'Reported', width: '9%' },
  ];

  const transitColumns = [
    { key: 'route', label: 'Route', width: '20%' },
    { key: 'status', label: 'Status', width: '15%' },
    { key: 'buses', label: 'Active Buses', width: '15%' },
    { key: 'passengers', label: 'Passengers', width: '15%' },
    { key: 'nextArrival', label: 'Next Arrival', width: '15%' },
  ];

  return (
    <div className="transportation-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Transportation Control Center</h1>
          <p className="dashboard-subtitle">Real-time traffic and transit monitoring</p>
        </div>
        <div className="dashboard-actions">
          <TerraButton variant="outline">🗺️ Live Map</TerraButton>
          <TerraButton variant="primary">📊 Analytics</TerraButton>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <TerraMetric
            key={index}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
            trendUp={metric.trendUp}
            icon={metric.icon}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        <TerraCard className="traffic-card">
          <h2>Active Traffic Incidents</h2>
          <TerraTable columns={trafficColumns} data={trafficIncidents} pageSize={5} />
        </TerraCard>

        <TerraCard className="transit-card">
          <h2>Transit Status</h2>
          <TerraTable columns={transitColumns} data={transitStatus} pageSize={5} />
        </TerraCard>
      </div>

      <TerraCard className="parking-card">
        <h2>Parking Availability</h2>
        <div className="parking-grid">
          {['Downtown Garage A', 'Downtown Garage B', 'City Hall', 'Library', 'Hospital', 'Convention Center'].map((lot, index) => (
            <div key={index} className="parking-lot">
              <div className="parking-icon">🅿️</div>
              <div className="parking-info">
                <h3>{lot}</h3>
                <div className="parking-bar">
                  <div className="parking-bar-fill" style={{ width: `${Math.random() * 40 + 30}%` }}></div>
                </div>
                <p>{Math.floor(Math.random() * 200 + 50)} / {Math.floor(Math.random() * 200 + 300)} spaces</p>
              </div>
            </div>
          ))}
        </div>
      </TerraCard>
    </div>
  );
};

export default DashboardPage;
