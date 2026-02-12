/**
 * Parks & Recreation Portal - Reservations Page
 * Facility booking and reservation management
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraModal, TerraInput } from '../../../src/components';
import './ReservationsPage.css';

const ReservationsPage = () => {
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const reservations = [
    { id: 'RES-2025-1089', facility: 'Central Park Pavilion', customer: 'Smith Family', type: 'Birthday Party', date: '10/05/2025', time: '12:00 PM - 4:00 PM', guests: 50, fee: '$150', status: 'Confirmed' },
    { id: 'RES-2025-1090', facility: 'Sports Complex Field 1', customer: 'City Soccer League', type: 'Tournament', date: '10/08/2025', time: '8:00 AM - 6:00 PM', guests: 200, fee: '$500', status: 'Confirmed' },
    { id: 'RES-2025-1091', facility: 'Community Center Room A', customer: 'Johnson Corp', type: 'Meeting', date: '10/03/2025', time: '9:00 AM - 12:00 PM', guests: 25, fee: '$75', status: 'Active' },
    { id: 'RES-2025-1092', facility: 'Pool Aquatics Center', customer: 'Swim Team', type: 'Practice', date: '10/03/2025', time: '6:00 AM - 8:00 AM', guests: 30, fee: '$100', status: 'Active' },
    { id: 'RES-2025-1093', facility: 'Tennis Court 3-4', customer: 'Davis Tennis Club', type: 'Lessons', date: '10/04/2025', time: '4:00 PM - 6:00 PM', guests: 12, fee: '$40', status: 'Confirmed' },
    { id: 'RES-2025-1094', facility: 'Riverside Park Area B', customer: 'Martinez Wedding', type: 'Wedding', date: '10/15/2025', time: '2:00 PM - 10:00 PM', guests: 150, fee: '$800', status: 'Pending' },
    { id: 'RES-2025-1095', facility: 'Botanical Garden', customer: 'Photography Group', type: 'Photo Shoot', date: '10/02/2025', time: '8:00 AM - 11:00 AM', guests: 8, fee: '$60', status: 'Completed' },
    { id: 'RES-2025-1096', facility: 'Dog Park', customer: 'Pet Rescue Org', type: 'Adoption Event', date: '10/20/2025', time: '10:00 AM - 4:00 PM', guests: 75, fee: 'Free', status: 'Confirmed' },
  ];

  const calendar = [
    { date: '10/03', reservations: 3, available: 12 },
    { date: '10/04', reservations: 5, available: 10 },
    { date: '10/05', reservations: 7, available: 8 },
    { date: '10/06', reservations: 4, available: 11 },
    { date: '10/07', reservations: 2, available: 13 },
    { date: '10/08', reservations: 9, available: 6 },
    { date: '10/09', reservations: 6, available: 9 },
  ];

  const filteredReservations = reservations.filter(res => 
    filterStatus === 'all' || res.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const reservationColumns = [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'facility', label: 'Facility', width: '18%' },
    { key: 'customer', label: 'Customer', width: '15%' },
    { key: 'type', label: 'Event Type', width: '12%' },
    { key: 'date', label: 'Date', width: '10%' },
    { key: 'time', label: 'Time', width: '13%' },
    { key: 'guests', label: 'Guests', width: '7%' },
    { key: 'fee', label: 'Fee', width: '8%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'actions', label: '', width: '7%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  return (
    <div className="reservations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">Facility booking and event management</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📅 Calendar View</TerraButton>
          <TerraButton variant="primary" onClick={() => setShowNewReservation(true)}>➕ New Reservation</TerraButton>
        </div>
      </div>

      <div className="reservations-stats">
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-value">128</span>
            <span className="stat-label">Active Reservations</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-content">
            <span className="stat-value">$12,450</span>
            <span className="stat-label">Monthly Revenue</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏰</span>
          <div className="stat-content">
            <span className="stat-value">3</span>
            <span className="stat-label">Today's Events</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-value">72%</span>
            <span className="stat-label">Occupancy Rate</span>
          </div>
        </div>
      </div>

      <div className="calendar-widget">
        <TerraCard>
          <h2>7-Day Availability</h2>
          <div className="calendar-grid">
            {calendar.map((day, index) => (
              <div key={index} className="calendar-day">
                <div className="calendar-date">{day.date}</div>
                <div className="calendar-stats">
                  <div className="calendar-reserved">
                    <span className="calendar-label">Reserved:</span>
                    <span className="calendar-value">{day.reservations}</span>
                  </div>
                  <div className="calendar-available">
                    <span className="calendar-label">Available:</span>
                    <span className="calendar-value">{day.available}</span>
                  </div>
                </div>
                <div className="calendar-bar">
                  <div 
                    className="calendar-bar-fill" 
                    style={{ width: `${(day.reservations / (day.reservations + day.available)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>
      </div>

      <TerraCard className="reservations-card">
        <h2>All Reservations</h2>
        <div className="reservations-controls">
          <div className="filter-buttons">
            <TerraButton 
              variant={filterStatus === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({reservations.length})
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'active' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'confirmed' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('confirmed')}
            >
              Confirmed
            </TerraButton>
            <TerraButton 
              variant={filterStatus === 'pending' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('pending')}
            >
              Pending
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
        <TerraTable columns={reservationColumns} data={filteredReservations} pageSize={10} />
      </TerraCard>

      {showNewReservation && (
        <TerraModal
          title="New Reservation"
          onClose={() => setShowNewReservation(false)}
          size="large"
        >
          <div className="new-reservation-form">
            <div className="form-row">
              <div className="form-group">
                <label>Facility</label>
                <select className="terra-select">
                  <option>Central Park Pavilion</option>
                  <option>Sports Complex Field 1</option>
                  <option>Community Center Room A</option>
                  <option>Tennis Courts</option>
                  <option>Pool Aquatics Center</option>
                </select>
              </div>
              <div className="form-group">
                <label>Event Type</label>
                <TerraInput type="text" placeholder="e.g., Birthday Party, Meeting" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <TerraInput type="text" placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <TerraInput type="email" placeholder="email@example.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <TerraInput type="date" />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <TerraInput type="time" />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <TerraInput type="time" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expected Guests</label>
                <TerraInput type="number" placeholder="Number of guests" />
              </div>
              <div className="form-group">
                <label>Rental Fee</label>
                <TerraInput type="text" placeholder="$0.00" />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Special Requests</label>
              <textarea className="terra-textarea" rows="3" placeholder="Any special requirements..."></textarea>
            </div>
            <div className="form-actions">
              <TerraButton variant="outline" onClick={() => setShowNewReservation(false)}>Cancel</TerraButton>
              <TerraButton variant="primary">Create Reservation</TerraButton>
            </div>
          </div>
        </TerraModal>
      )}
    </div>
  );
};

export default ReservationsPage;
