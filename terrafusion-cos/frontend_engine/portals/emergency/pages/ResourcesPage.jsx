/**
 * Emergency Portal - Resources Page
 * Resource allocation and equipment management
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraInput } from '../../../src/components';
import { useResources } from '../../../src/hooks/useEmergency';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './ResourcesPage.css';

const ResourcesPage = () => {
  const { resources: resourcesData, equipment: equipmentData, personnel: personnelData, loading, error, refetch } = useResources();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading resources..." fullPage />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} message="Failed to load resources" onRetry={refetch} fullPage />;
  }

  // Use API data or fallback to mock data
  const resources = resourcesData || [
    { id: 'RES-001', type: 'Fire Engine', unit: 'Engine 12', status: 'Available', location: 'Station 3', capacity: '4 crew', fuel: '87%', lastMaint: '09/28/2025' },
    { id: 'RES-002', type: 'Fire Engine', unit: 'Engine 15', status: 'Deployed', location: 'Oak Street Fire', capacity: '4 crew', fuel: '62%', lastMaint: '09/25/2025' },
    { id: 'RES-003', type: 'Ambulance', unit: 'Medic 7', status: 'Available', location: 'Station 1', capacity: '2 crew', fuel: '94%', lastMaint: '09/30/2025' },
    { id: 'RES-004', type: 'Ambulance', unit: 'Medic 9', status: 'En Route', location: 'Maple Ave Medical', capacity: '2 crew', fuel: '78%', lastMaint: '09/27/2025' },
    { id: 'RES-005', type: 'Police Unit', unit: 'Unit 23', status: 'Available', location: 'Precinct 2', capacity: '2 officers', fuel: '81%', lastMaint: '09/26/2025' },
    { id: 'RES-006', type: 'Police Unit', unit: 'Unit 31', status: 'Deployed', location: 'Traffic Incident I-5', capacity: '2 officers', fuel: '55%', lastMaint: '09/29/2025' },
    { id: 'RES-007', type: 'Helicopter', unit: 'Air-1', status: 'Available', location: 'Helipad Central', capacity: '4 crew', fuel: '100%', lastMaint: '10/01/2025' },
    { id: 'RES-008', type: 'Hazmat Unit', unit: 'Hazmat 4', status: 'Maintenance', location: 'Station 5', capacity: '6 crew', fuel: '45%', lastMaint: '09/20/2025' },
    { id: 'RES-009', type: 'Rescue Unit', unit: 'Rescue 8', status: 'Available', location: 'Station 4', capacity: '5 crew', fuel: '92%', lastMaint: '09/28/2025' },
    { id: 'RES-010', type: 'Fire Engine', unit: 'Engine 18', status: 'Available', location: 'Station 6', capacity: '4 crew', fuel: '88%', lastMaint: '09/29/2025' },
  ];

  const equipment = equipmentData || [
    { category: 'Medical', item: 'Defibrillators', available: 23, total: 25, status: 'Good' },
    { category: 'Medical', item: 'First Aid Kits', available: 147, total: 150, status: 'Good' },
    { category: 'Fire', item: 'Fire Extinguishers', available: 289, total: 300, status: 'Good' },
    { category: 'Fire', item: 'Breathing Apparatus', available: 42, total: 50, status: 'Fair' },
    { category: 'Communication', item: 'Radios', available: 187, total: 200, status: 'Good' },
    { category: 'Communication', item: 'Satellite Phones', available: 14, total: 15, status: 'Good' },
    { category: 'Safety', item: 'Hazmat Suits', available: 28, total: 35, status: 'Fair' },
    { category: 'Safety', item: 'Safety Vests', available: 156, total: 175, status: 'Good' },
  ];

  const personnel = personnelData || [
    { role: 'Firefighters', onDuty: 89, offDuty: 34, deployed: 12, total: 135 },
    { role: 'Paramedics', onDuty: 47, offDuty: 18, deployed: 8, total: 73 },
    { role: 'Police Officers', onDuty: 124, offDuty: 56, deployed: 15, total: 195 },
    { role: 'Dispatchers', onDuty: 12, offDuty: 4, deployed: 0, total: 16 },
    { role: 'Support Staff', onDuty: 28, offDuty: 15, deployed: 0, total: 43 },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         resource.status.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const resourceColumns = [
    { key: 'id', label: 'ID', width: '8%' },
    { key: 'type', label: 'Type', width: '12%' },
    { key: 'unit', label: 'Unit', width: '12%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'location', label: 'Location', width: '18%' },
    { key: 'capacity', label: 'Capacity', width: '10%' },
    { key: 'fuel', label: 'Fuel', width: '8%' },
    { key: 'lastMaint', label: 'Last Maint.', width: '12%' },
    { key: 'actions', label: 'Actions', width: '10%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const equipmentColumns = [
    { key: 'category', label: 'Category', width: '20%' },
    { key: 'item', label: 'Item', width: '30%' },
    { key: 'available', label: 'Available', width: '15%' },
    { key: 'total', label: 'Total', width: '15%' },
    { key: 'status', label: 'Status', width: '20%' },
  ];

  const personnelColumns = [
    { key: 'role', label: 'Role', width: '25%' },
    { key: 'onDuty', label: 'On Duty', width: '15%' },
    { key: 'offDuty', label: 'Off Duty', width: '15%' },
    { key: 'deployed', label: 'Deployed', width: '15%' },
    { key: 'total', label: 'Total', width: '15%' },
    { key: 'actions', label: 'Actions', width: '15%', render: () => <TerraButton size="sm" variant="outline">Manage</TerraButton> },
  ];

  return (
    <div className="resources-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resource Management</h1>
          <p className="page-subtitle">Equipment, vehicles, and personnel allocation</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Generate Report</TerraButton>
          <TerraButton variant="primary">➕ Add Resource</TerraButton>
        </div>
      </div>

      <TerraCard className="resources-card">
        <h2>Units & Vehicles</h2>
        <div className="resources-controls">
          <TerraInput
            type="text"
            placeholder="Search units, type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-buttons">
            <TerraButton 
              variant={filterType === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All ({resources.length})
            </TerraButton>
            <TerraButton 
              variant={filterType === 'available' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('available')}
            >
              Available
            </TerraButton>
            <TerraButton 
              variant={filterType === 'deployed' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('deployed')}
            >
              Deployed
            </TerraButton>
            <TerraButton 
              variant={filterType === 'maintenance' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('maintenance')}
            >
              Maintenance
            </TerraButton>
          </div>
        </div>
        <TerraTable columns={resourceColumns} data={filteredResources} pageSize={10} />
      </TerraCard>

      <div className="resources-grid">
        <TerraCard className="equipment-card">
          <h2>Equipment Inventory</h2>
          <TerraTable columns={equipmentColumns} data={equipment} pageSize={8} />
        </TerraCard>

        <TerraCard className="personnel-card">
          <h2>Personnel Status</h2>
          <TerraTable columns={personnelColumns} data={personnel} pageSize={5} />
          <div className="personnel-summary">
            <div className="summary-item">
              <span className="summary-label">Total Personnel:</span>
              <span className="summary-value">{personnel.reduce((sum, p) => sum + p.total, 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Currently Deployed:</span>
              <span className="summary-value">{personnel.reduce((sum, p) => sum + p.deployed, 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">On Duty:</span>
              <span className="summary-value">{personnel.reduce((sum, p) => sum + p.onDuty, 0)}</span>
            </div>
          </div>
        </TerraCard>
      </div>
    </div>
  );
};

export default ResourcesPage;
