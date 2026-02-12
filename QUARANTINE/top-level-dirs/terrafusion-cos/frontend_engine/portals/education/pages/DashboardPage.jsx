/**
 * Education Portal - Dashboard Page
 * Overview of education metrics, recent activities, and quick actions
 */

import { TerraCard, TerraMetric, TerraTable, TerraButton } from '../../../src/components';
import './DashboardPage.css';

const DashboardPage = () => {
  // Mock data - replace with API calls
  const metrics = [
    { label: 'Total Students', value: '12,847', trend: '+3.2%', trendUp: true },
    { label: 'Active Classes', value: '487', trend: '+12', trendUp: true },
    { label: 'Attendance Rate', value: '94.3%', trend: '-1.2%', trendUp: false },
    { label: 'Staff Members', value: '892', trend: '+5', trendUp: true },
  ];

  const recentActivities = [
    { id: 1, action: 'New student enrollment', student: 'Sarah Johnson', timestamp: '2 minutes ago', type: 'enrollment' },
    { id: 2, action: 'Attendance submitted', teacher: 'Mr. Smith', class: 'Math 101', timestamp: '15 minutes ago', type: 'attendance' },
    { id: 3, action: 'Grade updated', student: 'Mike Davis', course: 'English Literature', timestamp: '1 hour ago', type: 'grade' },
    { id: 4, action: 'Class schedule changed', class: 'Chemistry 201', timestamp: '2 hours ago', type: 'schedule' },
    { id: 5, action: 'Parent meeting scheduled', student: 'Emma Wilson', timestamp: '3 hours ago', type: 'meeting' },
  ];

  const upcomingEvents = [
    { id: 1, event: 'Parent-Teacher Conference', date: 'Oct 15, 2025', time: '2:00 PM' },
    { id: 2, event: 'Science Fair', date: 'Oct 20, 2025', time: '10:00 AM' },
    { id: 3, event: 'Midterm Exams Begin', date: 'Oct 25, 2025', time: '8:00 AM' },
    { id: 4, event: 'School Board Meeting', date: 'Oct 30, 2025', time: '6:00 PM' },
  ];

  const activityColumns = [
    { key: 'action', label: 'Action', width: '35%' },
    { key: 'details', label: 'Details', width: '35%' },
    { key: 'timestamp', label: 'Time', width: '30%' },
  ];

  const activityRows = recentActivities.map(activity => ({
    action: activity.action,
    details: activity.student || activity.teacher || activity.class || activity.course || 'System',
    timestamp: activity.timestamp,
  }));

  return (
    <div className="education-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Education Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, Admin</p>
        </div>
        <div className="dashboard-actions">
          <TerraButton variant="outline">View Reports</TerraButton>
          <TerraButton variant="primary">Quick Actions</TerraButton>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <TerraMetric
            key={index}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
            trendUp={metric.trendUp}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Recent Activities */}
        <TerraCard className="activities-card">
          <h2>Recent Activities</h2>
          <TerraTable
            columns={activityColumns}
            data={activityRows}
            pageSize={5}
          />
        </TerraCard>

        {/* Upcoming Events */}
        <TerraCard className="events-card">
          <h2>Upcoming Events</h2>
          <div className="events-list">
            {upcomingEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-icon">📅</div>
                <div className="event-details">
                  <h3>{event.event}</h3>
                  <p>{event.date} at {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <TerraCard>
          <h3>Today's Summary</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Present Today</span>
              <span className="stat-value">12,115</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Absent Today</span>
              <span className="stat-value">732</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Late Arrivals</span>
              <span className="stat-value">45</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Early Dismissals</span>
              <span className="stat-value">23</span>
            </div>
          </div>
        </TerraCard>
      </div>
    </div>
  );
};

export default DashboardPage;
