/**
 * Transportation Portal - Transit Page
 * Public transit route management and real-time tracking
 */

import { TerraCard, TerraTable, TerraButton } from '../../../src/components';
import { useTransit } from '../../../src/hooks/useTransportation';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './TransitPage.css';

const TransitPage = () => {
  const { routes: routesData, buses: busesData, alerts: alertsData, loading, error, refetch } = useTransit();

  if (loading) {
    return <LoadingState message="Loading transit data..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load transit data" onRetry={refetch} fullPage />;
  }

  const routes = routesData || [
    { id: 1, route: 'Route 1', name: 'Downtown Loop', status: 'On Time', buses: 5, passengers: 142, nextArrival: '3 min', onTimePerf: 94 },
    { id: 2, route: 'Route 5', name: 'University Line', status: 'Delayed', buses: 4, passengers: 98, nextArrival: '8 min', onTimePerf: 76 },
    { id: 3, route: 'Route 12', name: 'Industrial Park', status: 'On Time', buses: 6, passengers: 187, nextArrival: '5 min', onTimePerf: 91 },
    { id: 4, route: 'Route 18', name: 'Residential Express', status: 'On Time', buses: 3, passengers: 76, nextArrival: '12 min', onTimePerf: 88 },
    { id: 5, route: 'Route 22', name: 'Hospital Shuttle', status: 'On Time', buses: 4, passengers: 134, nextArrival: '2 min', onTimePerf: 97 },
    { id: 6, route: 'Route 35', name: 'Airport Connector', status: 'Delayed', buses: 2, passengers: 54, nextArrival: '18 min', onTimePerf: 72 },
  ];

  const buses = [
    { id: 'BUS-101', route: 'Route 1', driver: 'John Smith', location: 'Main St & 5th', nextStop: '6th Ave Station', passengers: 28, capacity: 40, status: 'In Service' },
    { id: 'BUS-105', route: 'Route 5', driver: 'Sarah Johnson', location: 'University Ave', nextStop: 'Campus Center', passengers: 35, capacity: 40, status: 'In Service' },
    { id: 'BUS-112', route: 'Route 12', driver: 'Mike Chen', location: 'Industrial Way', nextStop: 'Factory Gate', passengers: 31, capacity: 40, status: 'In Service' },
    { id: 'BUS-118', route: 'Route 18', driver: 'Emily Davis', location: 'Oak Street', nextStop: 'Residential Hub', passengers: 22, capacity: 40, status: 'In Service' },
    { id: 'BUS-122', route: 'Route 22', driver: 'Robert Wilson', location: 'Hospital Entrance', nextStop: 'Medical Center', passengers: 38, capacity: 40, status: 'In Service' },
    { id: 'BUS-201', route: 'Route 1', driver: 'Lisa Anderson', location: 'Depot', nextStop: 'Maintenance', passengers: 0, capacity: 40, status: 'Maintenance' },
  ];

  const stops = [
    { id: 'STOP-001', name: 'Downtown Transit Center', routes: 8, avgWait: '5 min', ridership: 2847, status: 'Active' },
    { id: 'STOP-002', name: 'University Campus', routes: 4, avgWait: '8 min', ridership: 1923, status: 'Active' },
    { id: 'STOP-003', name: '6th Ave Station', routes: 6, avgWait: '6 min', ridership: 1456, status: 'Active' },
    { id: 'STOP-004', name: 'Hospital Main Entrance', routes: 3, avgWait: '4 min', ridership: 1234, status: 'Active' },
    { id: 'STOP-005', name: 'Airport Terminal', routes: 2, avgWait: '12 min', ridership: 987, status: 'Active' },
  ];

  const routeColumns = [
    { key: 'route', label: 'Route', width: '10%' },
    { key: 'name', label: 'Name', width: '22%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'buses', label: 'Active Buses', width: '12%' },
    { key: 'passengers', label: 'Passengers', width: '12%' },
    { key: 'nextArrival', label: 'Next Arrival', width: '12%' },
    { key: 'onTimePerf', label: 'On-Time %', width: '15%', render: (row) => (
      <div className="performance-bar">
        <div className="performance-fill" style={{ width: `${row.onTimePerf}%`, background: row.onTimePerf > 85 ? '#10b981' : row.onTimePerf > 70 ? '#f59e0b' : '#ef4444' }}></div>
        <span>{row.onTimePerf}%</span>
      </div>
    )},
    { key: 'actions', label: '', width: '5%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const busColumns = [
    { key: 'id', label: 'Bus ID', width: '10%' },
    { key: 'route', label: 'Route', width: '10%' },
    { key: 'driver', label: 'Driver', width: '15%' },
    { key: 'location', label: 'Current Location', width: '18%' },
    { key: 'nextStop', label: 'Next Stop', width: '15%' },
    { key: 'passengers', label: 'Passengers', width: '10%', render: (row) => `${row.passengers}/${row.capacity}` },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'actions', label: '', width: '10%', render: () => <TerraButton size="sm">Track</TerraButton> },
  ];

  const stopColumns = [
    { key: 'id', label: 'Stop ID', width: '12%' },
    { key: 'name', label: 'Stop Name', width: '30%' },
    { key: 'routes', label: 'Routes', width: '10%' },
    { key: 'avgWait', label: 'Avg Wait', width: '12%' },
    { key: 'ridership', label: 'Daily Ridership', width: '18%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'actions', label: '', width: '8%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  return (
    <div className="transit-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transit Operations</h1>
          <p className="page-subtitle">Public transit route management and real-time tracking</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Performance Report</TerraButton>
          <TerraButton variant="primary">🗺️ Live Transit Map</TerraButton>
        </div>
      </div>

      <div className="transit-stats">
        <div className="stat-card">
          <span className="stat-icon">🚌</span>
          <div className="stat-content">
            <span className="stat-value">42</span>
            <span className="stat-label">Active Buses</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">691</span>
            <span className="stat-label">Current Passengers</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div className="stat-content">
            <span className="stat-value">87%</span>
            <span className="stat-label">On-Time Performance</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📍</span>
          <div className="stat-content">
            <span className="stat-value">124</span>
            <span className="stat-label">Active Stops</span>
          </div>
        </div>
      </div>

      <TerraCard className="routes-card">
        <h2>Transit Routes</h2>
        <TerraTable columns={routeColumns} data={routes} pageSize={10} />
      </TerraCard>

      <TerraCard className="buses-card">
        <h2>Active Buses</h2>
        <TerraTable columns={busColumns} data={buses} pageSize={10} />
      </TerraCard>

      <TerraCard className="stops-card">
        <h2>Top Transit Stops</h2>
        <TerraTable columns={stopColumns} data={stops} pageSize={10} />
      </TerraCard>
    </div>
  );
};

export default TransitPage;
