/**
 * Parks & Recreation Portal - Dashboard Page
 * Facility management and recreation program overview
 */

import { TerraCard, TerraMetric, TerraTable, TerraButton } from '../../../src/components';
import './DashboardPage.css';

const DashboardPage = () => {
  const metrics = [
    { label: 'Total Facilities', value: '47', trend: '+2', trendUp: true, icon: '🏞️' },
    { label: 'Active Reservations', value: '128', trend: '+15', trendUp: true, icon: '📅' },
    { label: 'Maintenance Tasks', value: '23', trend: '-5', trendUp: false, icon: '🔧' },
    { label: 'Upcoming Events', value: '34', trend: '+8', trendUp: true, icon: '🎉' },
  ];

  const facilities = [
    { name: 'Central Park', type: 'Park', status: 'Open', visitors: 847, capacity: '95%', hours: '6 AM - 10 PM' },
    { name: 'Community Center', type: 'Recreation', status: 'Open', visitors: 234, capacity: '67%', hours: '7 AM - 9 PM' },
    { name: 'Sports Complex', type: 'Sports', status: 'Open', visitors: 456, capacity: '82%', hours: '6 AM - 11 PM' },
    { name: 'Pool & Aquatics', type: 'Aquatics', status: 'Open', visitors: 189, capacity: '54%', hours: '6 AM - 8 PM' },
    { name: 'Nature Reserve', type: 'Trail', status: 'Open', visitors: 312, capacity: 'N/A', hours: 'Dawn - Dusk' },
  ];

  const upcomingEvents = [
    { id: 1, event: 'Summer Concert Series', date: 'Oct 15, 2025', location: 'Central Park', attendees: 500 },
    { id: 2, event: 'Youth Soccer Tournament', date: 'Oct 18, 2025', location: 'Sports Complex', attendees: 200 },
    { id: 3, event: 'Community Picnic', date: 'Oct 22, 2025', location: 'Riverside Park', attendees: 350 },
    { id: 4, event: 'Marathon Event', date: 'Oct 28, 2025', location: 'Downtown', attendees: 1200 },
  ];

  const facilityColumns = [
    { key: 'name', label: 'Facility', width: '25%' },
    { key: 'type', label: 'Type', width: '15%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'visitors', label: 'Today\'s Visitors', width: '15%' },
    { key: 'capacity', label: 'Capacity', width: '13%' },
    { key: 'hours', label: 'Hours', width: '20%' },
  ];

  const eventColumns = [
    { key: 'event', label: 'Event', width: '35%' },
    { key: 'date', label: 'Date', width: '20%' },
    { key: 'location', label: 'Location', width: '25%' },
    { key: 'attendees', label: 'Expected', width: '20%' },
  ];

  return (
    <div className="parks-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Parks & Recreation Dashboard</h1>
          <p className="dashboard-subtitle">Facility management and program coordination</p>
        </div>
        <div className="dashboard-actions">
          <TerraButton variant="outline">📅 New Reservation</TerraButton>
          <TerraButton variant="primary">🎉 New Event</TerraButton>
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

      <TerraCard className="facilities-card">
        <h2>Facility Status</h2>
        <TerraTable columns={facilityColumns} data={facilities} pageSize={10} />
      </TerraCard>

      <TerraCard className="events-card">
        <h2>Upcoming Events</h2>
        <TerraTable columns={eventColumns} data={upcomingEvents} pageSize={5} />
      </TerraCard>

      <div className="quick-actions">
        <TerraCard>
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <TerraButton variant="outline" size="lg">🏞️ View All Facilities</TerraButton>
            <TerraButton variant="outline" size="lg">📅 Manage Reservations</TerraButton>
            <TerraButton variant="outline" size="lg">🔧 Maintenance Schedule</TerraButton>
            <TerraButton variant="outline" size="lg">📊 Generate Report</TerraButton>
          </div>
        </TerraCard>
      </div>
    </div>
  );
};

export default DashboardPage;
