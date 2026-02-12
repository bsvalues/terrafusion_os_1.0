/**
 * Transportation Portal - Parking Page
 * Parking facility management and occupancy tracking
 */

import { TerraCard, TerraTable, TerraButton } from '../../../src/components';
import { useParking } from '../../../src/hooks/useTransportation';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './ParkingPage.css';

const ParkingPage = () => {
  const { facilities: facilitiesData, reservations: reservationsData, loading, error, refetch } = useParking();

  if (loading) {
    return <LoadingState message="Loading parking data..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load parking data" onRetry={refetch} fullPage />;
  }

  const facilities = facilitiesData || [
    { id: 'PKG-001', name: 'Downtown Garage A', type: 'Garage', total: 450, occupied: 387, available: 63, occupancy: 86, rate: '$2.50/hr', status: 'Open' },
    { id: 'PKG-002', name: 'Downtown Garage B', type: 'Garage', total: 380, occupied: 298, available: 82, occupancy: 78, rate: '$2.50/hr', status: 'Open' },
    { id: 'PKG-003', name: 'City Hall Lot', type: 'Surface', total: 175, occupied: 142, available: 33, occupancy: 81, rate: '$1.50/hr', status: 'Open' },
    { id: 'PKG-004', name: 'Library Parking', type: 'Surface', total: 120, occupied: 67, available: 53, occupancy: 56, rate: 'Free', status: 'Open' },
    { id: 'PKG-005', name: 'Hospital Garage', type: 'Garage', total: 520, occupied: 478, available: 42, occupancy: 92, rate: '$3.00/hr', status: 'Near Full' },
    { id: 'PKG-006', name: 'Convention Center', type: 'Garage', total: 680, occupied: 234, available: 446, occupancy: 34, rate: '$2.00/hr', status: 'Open' },
    { id: 'PKG-007', name: 'Stadium Parking', type: 'Surface', total: 890, occupied: 67, available: 823, occupancy: 8, rate: 'Event Only', status: 'Open' },
    { id: 'PKG-008', name: 'Train Station Lot', type: 'Surface', total: 210, occupied: 189, available: 21, occupancy: 90, rate: '$1.00/hr', status: 'Near Full' },
  ];

  const reservations = [
    { id: 'RES-2025-1089', facility: 'Downtown Garage A', customer: 'ABC Corporation', spaces: 25, date: '10/03/2025', time: '8:00 AM - 6:00 PM', status: 'Active' },
    { id: 'RES-2025-1090', facility: 'Convention Center', customer: 'Tech Conference', spaces: 150, date: '10/15/2025', time: '7:00 AM - 8:00 PM', status: 'Confirmed' },
    { id: 'RES-2025-1091', facility: 'City Hall Lot', customer: 'City Council Meeting', spaces: 30, date: '10/05/2025', time: '9:00 AM - 5:00 PM', status: 'Confirmed' },
    { id: 'RES-2025-1092', facility: 'Stadium Parking', customer: 'Football Game', spaces: 500, date: '10/20/2025', time: '12:00 PM - 6:00 PM', status: 'Pending' },
  ];

  const violations = [
    { id: 'VIO-5647', facility: 'Downtown Garage A', violation: 'Expired Meter', vehicle: 'ABC-1234', time: '45 min ago', fine: '$25', status: 'Issued' },
    { id: 'VIO-5648', facility: 'City Hall Lot', violation: 'No Permit', vehicle: 'XYZ-5678', time: '1 hour ago', fine: '$50', status: 'Issued' },
    { id: 'VIO-5649', facility: 'Hospital Garage', violation: 'Handicap Violation', vehicle: 'DEF-9012', time: '2 hours ago', fine: '$250', status: 'Issued' },
  ];

  const facilityColumns = [
    { key: 'id', label: 'Facility ID', width: '10%' },
    { key: 'name', label: 'Name', width: '18%' },
    { key: 'type', label: 'Type', width: '10%' },
    { key: 'available', label: 'Available', width: '10%', render: (row) => (
      <span className={row.available < 50 ? 'text-warning' : ''}>{row.available}</span>
    )},
    { key: 'total', label: 'Total', width: '8%' },
    { key: 'occupancy', label: 'Occupancy', width: '15%', render: (row) => (
      <div className="occupancy-bar">
        <div className="occupancy-fill" style={{ 
          width: `${row.occupancy}%`, 
          background: row.occupancy > 90 ? '#ef4444' : row.occupancy > 75 ? '#f59e0b' : '#10b981' 
        }}></div>
        <span>{row.occupancy}%</span>
      </div>
    )},
    { key: 'rate', label: 'Rate', width: '12%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'actions', label: '', width: '7%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const reservationColumns = [
    { key: 'id', label: 'ID', width: '12%' },
    { key: 'facility', label: 'Facility', width: '20%' },
    { key: 'customer', label: 'Customer', width: '18%' },
    { key: 'spaces', label: 'Spaces', width: '10%' },
    { key: 'date', label: 'Date', width: '12%' },
    { key: 'time', label: 'Time', width: '18%' },
    { key: 'status', label: 'Status', width: '10%' },
  ];

  const violationColumns = [
    { key: 'id', label: 'ID', width: '12%' },
    { key: 'facility', label: 'Facility', width: '20%' },
    { key: 'violation', label: 'Violation', width: '18%' },
    { key: 'vehicle', label: 'Vehicle', width: '12%' },
    { key: 'time', label: 'Time', width: '12%' },
    { key: 'fine', label: 'Fine', width: '10%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'actions', label: '', width: '6%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const totalSpaces = facilities.reduce((sum, f) => sum + f.total, 0);
  const totalOccupied = facilities.reduce((sum, f) => sum + f.occupied, 0);
  const totalAvailable = facilities.reduce((sum, f) => sum + f.available, 0);
  const avgOccupancy = Math.round((totalOccupied / totalSpaces) * 100);

  return (
    <div className="parking-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Parking Management</h1>
          <p className="page-subtitle">Real-time parking facility monitoring and reservations</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Occupancy Report</TerraButton>
          <TerraButton variant="primary">🅿️ New Reservation</TerraButton>
        </div>
      </div>

      <div className="parking-stats">
        <div className="stat-card">
          <span className="stat-icon">🅿️</span>
          <div className="stat-content">
            <span className="stat-value">{totalSpaces.toLocaleString()}</span>
            <span className="stat-label">Total Spaces</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{totalAvailable.toLocaleString()}</span>
            <span className="stat-label">Available Now</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚗</span>
          <div className="stat-content">
            <span className="stat-value">{totalOccupied.toLocaleString()}</span>
            <span className="stat-label">Occupied</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-value">{avgOccupancy}%</span>
            <span className="stat-label">Avg Occupancy</span>
          </div>
        </div>
      </div>

      <TerraCard className="facilities-card">
        <h2>Parking Facilities</h2>
        <TerraTable columns={facilityColumns} data={facilities} pageSize={10} />
      </TerraCard>

      <TerraCard className="reservations-card">
        <h2>Reservations</h2>
        <TerraTable columns={reservationColumns} data={reservations} pageSize={5} />
      </TerraCard>

      <TerraCard className="violations-card">
        <h2>Recent Violations</h2>
        <TerraTable columns={violationColumns} data={violations} pageSize={5} />
      </TerraCard>
    </div>
  );
};

export default ParkingPage;
