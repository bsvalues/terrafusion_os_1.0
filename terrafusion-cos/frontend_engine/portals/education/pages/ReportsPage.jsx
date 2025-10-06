/**
 * Education Portal - Reports Page
 * Analytics dashboard with trends and performance metrics
 */

import { TerraCard, TerraButton } from '../../../src/components';
import './ReportsPage.css';

const ReportsPage = () => {
  const reportTypes = [
    { title: 'Enrollment Report', description: 'Student enrollment trends and demographics', icon: '👥', color: 'primary' },
    { title: 'Attendance Report', description: 'Daily, weekly, and monthly attendance statistics', icon: '✅', color: 'success' },
    { title: 'Grade Report', description: 'Class performance and grade distributions', icon: '📊', color: 'warning' },
    { title: 'Teacher Report', description: 'Teacher assignments and class loads', icon: '👨‍🏫', color: 'info' },
    { title: 'Discipline Report', description: 'Incident tracking and behavioral patterns', icon: '⚠️', color: 'danger' },
    { title: 'Financial Report', description: 'Budget allocation and expense tracking', icon: '💰', color: 'success' },
  ];

  const quickStats = [
    { label: 'Total Students', value: '1,247', change: '+23', trend: 'up' },
    { label: 'Avg Attendance', value: '94.3%', change: '+1.2%', trend: 'up' },
    { label: 'Avg Grade', value: '89.7', change: '+2.1', trend: 'up' },
    { label: 'Active Classes', value: '47', change: '+3', trend: 'up' },
  ];

  const trendData = [
    { month: 'Sep', enrollment: 1198, attendance: 93.8, avgGrade: 87.2 },
    { month: 'Oct', enrollment: 1224, attendance: 94.1, avgGrade: 88.5 },
    { month: 'Nov', enrollment: 1235, attendance: 94.5, avgGrade: 89.1 },
    { month: 'Dec', enrollment: 1247, attendance: 94.3, avgGrade: 89.7 },
  ];

  const insights = [
    { title: 'Enrollment Growth', description: 'Student enrollment increased by 4.1% this semester, with the strongest growth in 9th grade classes.', icon: '📈', color: 'success' },
    { title: 'Attendance Improvement', description: 'Overall attendance rate improved to 94.3%, exceeding the district target of 93%.', icon: '✅', color: 'success' },
    { title: 'Grade Performance', description: 'Average grades increased across all subjects, with Math and Science showing the highest improvements.', icon: '🎯', color: 'primary' },
    { title: 'Teacher Utilization', description: 'Average class size is 26.5 students, within optimal range for effective instruction.', icon: '👨‍🏫', color: 'info' },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Performance metrics, trends, and data insights</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📅 Schedule Report</TerraButton>
          <TerraButton variant="primary">📥 Export Data</TerraButton>
        </div>
      </div>

      <div className="quick-stats-grid">
        {quickStats.map((stat, index) => (
          <div key={index} className="quick-stat-card">
            <span className="stat-label">{stat.label}</span>
            <div className="stat-value-row">
              <span className="stat-value">{stat.value}</span>
              <span className={`stat-change ${stat.trend}`}>
                {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <TerraCard className="report-types-card">
        <h2>Available Reports</h2>
        <div className="report-types-grid">
          {reportTypes.map((report, index) => (
            <div key={index} className={`report-type-card ${report.color}`}>
              <span className="report-icon">{report.icon}</span>
              <h3 className="report-title">{report.title}</h3>
              <p className="report-description">{report.description}</p>
              <TerraButton size="sm" variant="outline">Generate</TerraButton>
            </div>
          ))}
        </div>
      </TerraCard>

      <div className="reports-grid">
        <TerraCard className="trends-card">
          <h2>Semester Trends</h2>
          <div className="trends-table">
            <div className="trends-header">
              <div className="trend-col">Month</div>
              <div className="trend-col">Enrollment</div>
              <div className="trend-col">Attendance</div>
              <div className="trend-col">Avg Grade</div>
            </div>
            {trendData.map((data, index) => (
              <div key={index} className="trends-row">
                <div className="trend-col">{data.month}</div>
                <div className="trend-col">{data.enrollment}</div>
                <div className="trend-col">{data.attendance}%</div>
                <div className="trend-col">{data.avgGrade}</div>
              </div>
            ))}
          </div>
          <div className="chart-placeholder">
            <p>📊 Interactive chart visualization coming soon</p>
            <p className="chart-note">Will display enrollment, attendance, and grade trends over time</p>
          </div>
        </TerraCard>

        <TerraCard className="insights-card">
          <h2>Key Insights</h2>
          <div className="insights-list">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-item ${insight.color}`}>
                <span className="insight-icon">{insight.icon}</span>
                <div className="insight-content">
                  <h3 className="insight-title">{insight.title}</h3>
                  <p className="insight-description">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>
      </div>
    </div>
  );
};

export default ReportsPage;
