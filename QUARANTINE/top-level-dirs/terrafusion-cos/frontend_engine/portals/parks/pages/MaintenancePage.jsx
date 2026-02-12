/**
 * Parks & Recreation Portal - Maintenance Page
 * Work order tracking and facility maintenance management
 */

import { TerraCard, TerraTable, TerraButton } from '../../../src/components';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const workOrders = [
    { id: 'WO-2025-0234', facility: 'Central Park', issue: 'Playground Equipment Repair', priority: 'High', assignedTo: 'Mike Johnson', status: 'In Progress', created: '10/01/2025', due: '10/05/2025' },
    { id: 'WO-2025-0235', facility: 'Community Center', issue: 'HVAC System Maintenance', priority: 'Medium', assignedTo: 'Sarah Lee', status: 'Scheduled', created: '10/02/2025', due: '10/08/2025' },
    { id: 'WO-2025-0236', facility: 'Sports Complex', issue: 'Field Line Painting', priority: 'Low', assignedTo: 'Tom Wilson', status: 'Scheduled', created: '10/02/2025', due: '10/10/2025' },
    { id: 'WO-2025-0237', facility: 'Pool Aquatics', issue: 'Pool Pump Replacement', priority: 'Critical', assignedTo: 'Mike Johnson', status: 'In Progress', created: '09/30/2025', due: '10/04/2025' },
    { id: 'WO-2025-0238', facility: 'Tennis Center', issue: 'Court Resurfacing', priority: 'Medium', assignedTo: 'Alex Chen', status: 'Pending', created: '10/03/2025', due: '10/15/2025' },
    { id: 'WO-2025-0239', facility: 'Riverside Park', issue: 'Trail Erosion Repair', priority: 'High', assignedTo: 'Tom Wilson', status: 'In Progress', created: '10/01/2025', due: '10/06/2025' },
    { id: 'WO-2025-0240', facility: 'Dog Park', issue: 'Fence Repair', priority: 'Medium', assignedTo: 'Sarah Lee', status: 'Completed', created: '09/28/2025', due: '10/02/2025' },
    { id: 'WO-2025-0241', facility: 'Botanical Garden', issue: 'Irrigation System Check', priority: 'Low', assignedTo: 'Alex Chen', status: 'Completed', created: '09/25/2025', due: '09/30/2025' },
  ];

  const schedule = [
    { day: 'Monday', tasks: 5, completed: 3, team: 'Team A' },
    { day: 'Tuesday', tasks: 7, completed: 4, team: 'Team B' },
    { day: 'Wednesday', tasks: 6, completed: 6, team: 'Team A' },
    { day: 'Thursday', tasks: 8, completed: 2, team: 'Team C' },
    { day: 'Friday', tasks: 4, completed: 1, team: 'Team B' },
  ];

  const inventory = [
    { item: 'Paint (gallons)', current: 45, minimum: 20, status: 'Good' },
    { item: 'Lumber (boards)', current: 87, minimum: 50, status: 'Good' },
    { item: 'Grass Seed (lbs)', current: 12, minimum: 25, status: 'Low' },
    { item: 'Safety Equipment', current: 34, minimum: 30, status: 'Good' },
    { item: 'Tools', current: 156, minimum: 100, status: 'Good' },
    { item: 'Irrigation Parts', current: 8, minimum: 15, status: 'Low' },
  ];

  const workOrderColumns = [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'facility', label: 'Facility', width: '15%' },
    { key: 'issue', label: 'Issue', width: '20%' },
    { key: 'priority', label: 'Priority', width: '10%' },
    { key: 'assignedTo', label: 'Assigned To', width: '12%' },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'created', label: 'Created', width: '10%' },
    { key: 'due', label: 'Due Date', width: '10%' },
    { key: 'actions', label: '', width: '3%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const inventoryColumns = [
    { key: 'item', label: 'Item', width: '40%' },
    { key: 'current', label: 'Current Stock', width: '20%' },
    { key: 'minimum', label: 'Minimum', width: '20%' },
    { key: 'status', label: 'Status', width: '20%' },
  ];

  return (
    <div className="maintenance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Management</h1>
          <p className="page-subtitle">Work orders, schedules, and inventory tracking</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Maintenance Report</TerraButton>
          <TerraButton variant="primary">➕ New Work Order</TerraButton>
        </div>
      </div>

      <div className="maintenance-stats">
        <div className="stat-card">
          <span className="stat-icon">🔧</span>
          <div className="stat-content">
            <span className="stat-value">23</span>
            <span className="stat-label">Active Work Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <span className="stat-value">5</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">147</span>
            <span className="stat-label">Completed This Month</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-value">2</span>
            <span className="stat-label">Critical Priority</span>
          </div>
        </div>
      </div>

      <TerraCard className="work-orders-card">
        <h2>Work Orders</h2>
        <TerraTable columns={workOrderColumns} data={workOrders} pageSize={10} />
      </TerraCard>

      <div className="maintenance-grid">
        <TerraCard className="schedule-card">
          <h2>Weekly Schedule</h2>
          <div className="schedule-list">
            {schedule.map((day, index) => (
              <div key={index} className="schedule-item">
                <div className="schedule-header">
                  <span className="schedule-day">{day.day}</span>
                  <span className="schedule-team">{day.team}</span>
                </div>
                <div className="schedule-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(day.completed / day.tasks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{day.completed}/{day.tasks} tasks</span>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>

        <TerraCard className="inventory-card">
          <h2>Maintenance Inventory</h2>
          <TerraTable columns={inventoryColumns} data={inventory} pageSize={10} />
        </TerraCard>
      </div>
    </div>
  );
};

export default MaintenancePage;
