/**
 * Parks & Recreation Portal - Events Page
 * Community event management and registration
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraModal, TerraInput } from '../../../src/components';
import { useEvents } from '../../../src/hooks/useParks';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './EventsPage.css';

const EventsPage = () => {
  const { events: eventsData, loading, error, refetch } = useEvents();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  if (loading) {
    return <LoadingState message="Loading events..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load events" onRetry={refetch} fullPage />;
  }

  const events = eventsData || [
    { id: 'EVT-2025-089', name: 'Summer Concert Series', date: '10/15/2025', location: 'Central Park', attendees: 500, registered: 347, category: 'Music', status: 'Upcoming' },
    { id: 'EVT-2025-090', name: 'Youth Soccer Tournament', date: '10/18/2025', location: 'Sports Complex', attendees: 200, registered: 176, category: 'Sports', status: 'Upcoming' },
    { id: 'EVT-2025-091', name: 'Community Picnic', date: '10/22/2025', location: 'Riverside Park', attendees: 350, registered: 234, category: 'Community', status: 'Upcoming' },
    { id: 'EVT-2025-092', name: 'Halloween Festival', date: '10/31/2025', location: 'Community Center', attendees: 600, registered: 489, category: 'Holiday', status: 'Upcoming' },
    { id: 'EVT-2025-093', name: 'Marathon Event', date: '10/28/2025', location: 'Downtown', attendees: 1200, registered: 892, category: 'Sports', status: 'Upcoming' },
    { id: 'EVT-2025-094', name: 'Art in the Park', date: '10/02/2025', location: 'Botanical Garden', attendees: 250, registered: 251, category: 'Arts', status: 'Active' },
    { id: 'EVT-2025-095', name: 'Farmers Market', date: '10/03/2025', location: 'Central Park', attendees: 400, registered: 0, category: 'Community', status: 'Active' },
    { id: 'EVT-2025-096', name: 'Outdoor Movie Night', date: '09/28/2025', location: 'Riverside Park', attendees: 300, registered: 287, category: 'Entertainment', status: 'Completed' },
  ];

  const categories = [
    { name: 'Music', count: 12, icon: '🎵' },
    { name: 'Sports', count: 18, icon: '⚽' },
    { name: 'Community', count: 24, icon: '👥' },
    { name: 'Arts', count: 15, icon: '🎨' },
    { name: 'Holiday', count: 8, icon: '🎃' },
    { name: 'Entertainment', count: 10, icon: '🎬' },
  ];

  const filteredEvents = events.filter(event => 
    filterStatus === 'all' || event.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const eventColumns = [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'name', label: 'Event Name', width: '22%' },
    { key: 'date', label: 'Date', width: '10%' },
    { key: 'location', label: 'Location', width: '15%' },
    { key: 'registered', label: 'Registered', width: '10%', render: (row) => `${row.registered}/${row.attendees}` },
    { key: 'category', label: 'Category', width: '12%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'actions', label: '', width: '11%', render: () => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <TerraButton size="sm">View</TerraButton>
        <TerraButton size="sm" variant="outline">Register</TerraButton>
      </div>
    )},
  ];

  return (
    <div className="events-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events Management</h1>
          <p className="page-subtitle">Community events, programs, and registrations</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📅 Calendar View</TerraButton>
          <TerraButton variant="primary" onClick={() => setShowNewEvent(true)}>🎉 New Event</TerraButton>
        </div>
      </div>

      <div className="events-stats">
        <div className="stat-card">
          <span className="stat-icon">🎉</span>
          <div className="stat-content">
            <span className="stat-value">34</span>
            <span className="stat-label">Upcoming Events</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">3,276</span>
            <span className="stat-label">Total Registrations</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏰</span>
          <div className="stat-content">
            <span className="stat-value">2</span>
            <span className="stat-label">Active Today</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-value">87%</span>
            <span className="stat-label">Avg Attendance Rate</span>
          </div>
        </div>
      </div>

      <TerraCard className="categories-card">
        <h2>Event Categories</h2>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div key={index} className="category-card">
              <span className="category-icon">{category.icon}</span>
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count} events</span>
              </div>
            </div>
          ))}
        </div>
      </TerraCard>

      <TerraCard className="events-card">
        <h2>All Events</h2>
        <div className="events-controls">
          <div className="filter-buttons">
            <TerraButton 
              variant={filterStatus === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({events.length})
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'active' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'upcoming' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('upcoming')}
            >
              Upcoming
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'completed' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </TerraButton>
          </div>
        </div>
        <TerraTable columns={eventColumns} data={filteredEvents} pageSize={10} />
      </TerraCard>

      {showNewEvent && (
        <TerraModal
          title="Create New Event"
          onClose={() => setShowNewEvent(false)}
          size="large"
        >
          <div className="new-event-form">
            <div className="form-row">
              <div className="form-group">
                <label>Event Name</label>
                <TerraInput type="text" placeholder="Enter event name..." />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="terra-select">
                  {categories.map((cat, i) => (
                    <option key={i} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <select className="terra-select">
                  <option>Central Park</option>
                  <option>Sports Complex</option>
                  <option>Community Center</option>
                  <option>Riverside Park</option>
                  <option>Botanical Garden</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <TerraInput type="date" />
              </div>
              <div className="form-group">
                <label>Time</label>
                <TerraInput type="time" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expected Attendees</label>
                <TerraInput type="number" placeholder="Number of attendees" />
              </div>
              <div className="form-group">
                <label>Registration Fee</label>
                <TerraInput type="text" placeholder="$0.00 (Free if empty)" />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Event Description</label>
              <textarea className="terra-textarea" rows="4" placeholder="Describe the event..."></textarea>
            </div>
            <div className="form-actions">
              <TerraButton variant="outline" onClick={() => setShowNewEvent(false)}>Cancel</TerraButton>
              <TerraButton variant="primary">Create Event</TerraButton>
            </div>
          </div>
        </TerraModal>
      )}
    </div>
  );
};

export default EventsPage;
