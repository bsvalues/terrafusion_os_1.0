/**
 * Emergency Portal - Incidents Page
 * Manage and track active emergency incidents
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraInput, TerraModal } from '../../../src/components';
import { useIncidents } from '../../../src/hooks/useEmergency';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './IncidentsPage.css';

const IncidentsPage = () => {
  const { incidents: incidentsData, loading, error, refetch, createIncident } = useIncidents();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading incidents..." fullPage />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} message="Failed to load incidents" onRetry={refetch} fullPage />;
  }

  // Use API data or fallback to mock data for development
  const incidents = incidentsData || [
    { id: 'INC-2025-1047', type: 'Fire', location: '1234 Oak Street', severity: 'High', status: 'Responding', units: 3, reported: '2:34 PM', responder: 'Station 5' },
    { id: 'INC-2025-1048', type: 'Medical', location: '456 Maple Ave', severity: 'Critical', status: 'En Route', units: 2, reported: '2:30 PM', responder: 'Medic 3' },
    { id: 'INC-2025-1049', type: 'Traffic', location: 'I-5 Mile 247', severity: 'Medium', status: 'Clearing', units: 2, reported: '2:17 PM', responder: 'Unit 12' },
    { id: 'INC-2025-1050', type: 'Hazmat', location: 'Industrial Park', severity: 'High', status: 'Contained', units: 4, reported: '1:57 PM', responder: 'Hazmat 1' },
    { id: 'INC-2025-1051', type: 'Rescue', location: 'River Trail', severity: 'Medium', status: 'Responding', units: 2, reported: '1:42 PM', responder: 'Rescue 7' },
    { id: 'INC-2025-1052', type: 'Fire', location: '789 Pine Rd', severity: 'Low', status: 'Resolved', units: 1, reported: '1:15 PM', responder: 'Station 3' },
    { id: 'INC-2025-1053', type: 'Medical', location: '321 Elm Street', severity: 'High', status: 'On Scene', units: 3, reported: '1:05 PM', responder: 'Medic 5' },
    { id: 'INC-2025-1054', type: 'Alarm', location: '555 Commerce Blvd', severity: 'Low', status: 'Investigating', units: 1, reported: '12:50 PM', responder: 'Unit 8' },
  ];

  const columns = [
    { key: 'id', label: 'Incident ID', width: '12%' },
    { key: 'type', label: 'Type', width: '10%' },
    { key: 'location', label: 'Location', width: '18%' },
    { key: 'severity', label: 'Severity', width: '10%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'units', label: 'Units', width: '8%' },
    { key: 'reported', label: 'Reported', width: '10%' },
    { key: 'responder', label: 'Responder', width: '12%' },
    { key: 'actions', label: 'Actions', width: '8%' },
  ];

  const filteredIncidents = incidents
    .filter(incident => {
      const matchesSearch = incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || incident.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .map(incident => ({
      ...incident,
      actions: <TerraButton variant="ghost" size="sm">View</TerraButton>
    }));

  return (
    <div className="incidents-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Management</h1>
          <p className="page-subtitle">Track and manage all emergency incidents</p>
        </div>
        <TerraButton variant="danger" onClick={() => setShowNewModal(true)}>
          🚨 Report New Incident
        </TerraButton>
      </div>

      <TerraCard>
        <div className="incidents-controls">
          <TerraInput
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-buttons">
            <TerraButton 
              variant={filterStatus === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'Responding' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('Responding')}
            >
              Responding
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'On Scene' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('On Scene')}
            >
              On Scene
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'Resolved' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('Resolved')}
            >
              Resolved
            </TerraButton>
          </div>
        </div>

        <TerraTable
          columns={columns}
          data={filteredIncidents}
          pageSize={10}
        />

        <div className="incidents-summary">
          <p>Showing {filteredIncidents.length} of {incidents.length} incidents</p>
        </div>
      </TerraCard>

      {showNewModal && (
        <TerraModal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          title="Report New Incident"
          footer={
            <>
              <TerraButton variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </TerraButton>
              <TerraButton variant="danger" onClick={() => setShowNewModal(false)}>
                Report Incident
              </TerraButton>
            </>
          }
        >
          <div className="new-incident-form">
            <TerraInput label="Incident Type" placeholder="Fire, Medical, Traffic, etc." />
            <TerraInput label="Location" placeholder="Address or intersection" />
            <TerraInput label="Severity" placeholder="Low, Medium, High, Critical" />
            <TerraInput label="Description" placeholder="Incident details" />
            <TerraInput label="Caller Name" placeholder="Reporter's name" />
            <TerraInput label="Caller Phone" type="tel" placeholder="(555) 123-4567" />
            <div className="form-group-full">
              <TerraInput label="Additional Notes" placeholder="Any additional information" />
            </div>
          </div>
        </TerraModal>
      )}
    </div>
  );
};

export default IncidentsPage;
