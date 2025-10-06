/**
 * Parks & Recreation Portal - Facilities Page
 * Park and facility management with details and amenities
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraInput } from '../../../src/components';
import { useFacilities } from '../../../src/hooks/useParks';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './FacilitiesPage.css';

const FacilitiesPage = () => {
  const { facilities: facilitiesData, loading, error, refetch } = useFacilities();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  if (loading) {
    return <LoadingState message="Loading facilities..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load facilities" onRetry={refetch} fullPage />;
  }

  const facilities = facilitiesData || [
    { id: 'FAC-001', name: 'Central Park', type: 'Park', size: '150 acres', amenities: 'Playground, Trails, Lake', status: 'Open', visitors: 847, hours: '6 AM - 10 PM' },
    { id: 'FAC-002', name: 'Community Center', type: 'Recreation', size: '45,000 sq ft', amenities: 'Gym, Pool, Classes', status: 'Open', visitors: 234, hours: '7 AM - 9 PM' },
    { id: 'FAC-003', name: 'Sports Complex', type: 'Sports', size: '80 acres', amenities: 'Fields, Courts, Track', status: 'Open', visitors: 456, hours: '6 AM - 11 PM' },
    { id: 'FAC-004', name: 'Pool & Aquatics Center', type: 'Aquatics', size: '25,000 sq ft', amenities: 'Pool, Spa, Classes', status: 'Open', visitors: 189, hours: '6 AM - 8 PM' },
    { id: 'FAC-005', name: 'Nature Reserve', type: 'Trail', size: '200 acres', amenities: 'Trails, Wildlife', status: 'Open', visitors: 312, hours: 'Dawn - Dusk' },
    { id: 'FAC-006', name: 'Riverside Park', type: 'Park', size: '75 acres', amenities: 'Picnic, Fishing, Trails', status: 'Open', visitors: 423, hours: '6 AM - 10 PM' },
    { id: 'FAC-007', name: 'Tennis Center', type: 'Sports', size: '12 courts', amenities: 'Courts, Lessons', status: 'Open', visitors: 145, hours: '7 AM - 9 PM' },
    { id: 'FAC-008', name: 'Skate Park', type: 'Recreation', size: '15,000 sq ft', amenities: 'Ramps, Bowls, Rails', status: 'Open', visitors: 92, hours: '8 AM - Dusk' },
    { id: 'FAC-009', name: 'Dog Park', type: 'Park', size: '5 acres', amenities: 'Off-leash Areas', status: 'Open', visitors: 178, hours: '6 AM - 10 PM' },
    { id: 'FAC-010', name: 'Botanical Garden', type: 'Garden', size: '25 acres', amenities: 'Gardens, Events', status: 'Maintenance', visitors: 0, hours: 'Closed' },
  ];

  const amenityIcons = {
    'Playground': '🛝',
    'Trails': '🥾',
    'Lake': '🏞️',
    'Gym': '🏋️',
    'Pool': '🏊',
    'Classes': '📚',
    'Fields': '⚽',
    'Courts': '🎾',
    'Track': '🏃',
    'Spa': '🧖',
    'Wildlife': '🦌',
    'Picnic': '🧺',
    'Fishing': '🎣',
    'Lessons': '📝',
    'Ramps': '🛹',
    'Off-leash': '🐕',
    'Gardens': '🌺',
    'Events': '🎉'
  };

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.amenities.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || facility.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const facilityColumns = [
    { key: 'id', label: 'ID', width: '8%' },
    { key: 'name', label: 'Facility Name', width: '20%' },
    { key: 'type', label: 'Type', width: '12%' },
    { key: 'size', label: 'Size', width: '12%' },
    { key: 'amenities', label: 'Amenities', width: '20%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'visitors', label: "Today's Visitors", width: '10%' },
    { key: 'hours', label: 'Hours', width: '13%' },
    { key: 'actions', label: '', width: '5%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  return (
    <div className="facilities-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facility Management</h1>
          <p className="page-subtitle">Parks, recreation centers, and amenity details</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Facility Report</TerraButton>
          <TerraButton variant="primary">➕ Add Facility</TerraButton>
        </div>
      </div>

      <div className="facilities-stats">
        <div className="stat-card">
          <span className="stat-icon">🏞️</span>
          <div className="stat-content">
            <span className="stat-value">{facilities.length}</span>
            <span className="stat-label">Total Facilities</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">{facilities.reduce((sum, f) => sum + f.visitors, 0).toLocaleString()}</span>
            <span className="stat-label">Today's Visitors</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{facilities.filter(f => f.status === 'Open').length}</span>
            <span className="stat-label">Currently Open</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔧</span>
          <div className="stat-content">
            <span className="stat-value">{facilities.filter(f => f.status === 'Maintenance').length}</span>
            <span className="stat-label">Under Maintenance</span>
          </div>
        </div>
      </div>

      <TerraCard className="facilities-card">
        <h2>All Facilities</h2>
        <div className="facilities-controls">
          <TerraInput
            type="text"
            placeholder="Search facilities or amenities..."
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
              All ({facilities.length})
            </TerraButton>
            <TerraButton 
              variant={filterType === 'Park' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('Park')}
            >
              Parks
            </TerraButton>
            <TerraButton 
              variant={filterType === 'Recreation' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('Recreation')}
            >
              Recreation
            </TerraButton>
            <TerraButton 
              variant={filterType === 'Sports' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('Sports')}
            >
              Sports
            </TerraButton>
            <TerraButton 
              variant={filterType === 'Aquatics' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterType('Aquatics')}
            >
              Aquatics
            </TerraButton>
          </div>
        </div>
        <TerraTable columns={facilityColumns} data={filteredFacilities} pageSize={10} />
      </TerraCard>

      <div className="amenities-section">
        <TerraCard>
          <h2>Popular Amenities</h2>
          <div className="amenities-grid">
            {Object.entries(amenityIcons).map(([name, icon]) => (
              <div key={name} className="amenity-card">
                <span className="amenity-icon">{icon}</span>
                <span className="amenity-name">{name}</span>
              </div>
            ))}
          </div>
        </TerraCard>
      </div>
    </div>
  );
};

export default FacilitiesPage;
