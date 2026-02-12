/**
 * Education Portal - Attendance Page
 * Attendance tracking with daily reports and notifications
 */

import { TerraCard, TerraTable, TerraButton } from '../../../src/components';
import './AttendancePage.css';

const AttendancePage = () => {
  const todayAttendance = [
    { class: 'Mathematics 101', teacher: 'Dr. Sarah Johnson', present: 26, absent: 2, late: 0, total: 28, rate: 92.9 },
    { class: 'English Literature', teacher: 'Prof. Michael Davis', present: 24, absent: 1, late: 0, total: 25, rate: 96.0 },
    { class: 'World History', teacher: 'Dr. Emily Brown', present: 28, absent: 1, late: 1, total: 30, rate: 93.3 },
    { class: 'Biology I', teacher: 'Prof. David Wilson', present: 21, absent: 1, late: 0, total: 22, rate: 95.5 },
    { class: 'Chemistry II', teacher: 'Dr. Lisa Anderson', present: 17, absent: 1, late: 0, total: 18, rate: 94.4 },
    { class: 'Physical Education', teacher: 'Coach James Taylor', present: 33, absent: 2, late: 0, total: 35, rate: 94.3 },
    { class: 'Spanish I', teacher: 'Prof. Maria Garcia', present: 23, absent: 0, late: 1, total: 24, rate: 95.8 },
    { class: 'Art & Design', teacher: 'Ms. Jennifer Lee', present: 20, absent: 0, late: 0, total: 20, rate: 100.0 },
  ];

  const absentStudents = [
    { studentId: 'STU-2025-1234', name: 'John Smith', grade: '9th', class: 'Mathematics 101', lastAbsent: '10/01/2025', totalAbsences: 3, status: 'Notified' },
    { studentId: 'STU-2025-1235', name: 'Sarah Johnson', grade: '10th', class: 'English Literature', lastAbsent: '10/03/2025', totalAbsences: 1, status: 'Pending' },
    { studentId: 'STU-2025-1236', name: 'Mike Davis', grade: '11th', class: 'World History', lastAbsent: '10/03/2025', totalAbsences: 5, status: 'Notified' },
    { studentId: 'STU-2025-1237', name: 'Emily Brown', grade: '9th', class: 'Biology I', lastAbsent: '10/03/2025', totalAbsences: 2, status: 'Pending' },
    { studentId: 'STU-2025-1238', name: 'David Wilson', grade: '12th', class: 'Chemistry II', lastAbsent: '10/03/2025', totalAbsences: 1, status: 'Pending' },
    { studentId: 'STU-2025-1239', name: 'Lisa Anderson', grade: '9th', class: 'Physical Education', lastAbsent: '10/02/2025', totalAbsences: 4, status: 'Notified' },
  ];

  const weeklyTrends = [
    { day: 'Monday', present: 1198, absent: 42, late: 7, rate: 96.1 },
    { day: 'Tuesday', present: 1205, absent: 35, late: 7, rate: 96.6 },
    { day: 'Wednesday', present: 1189, absent: 51, late: 7, rate: 95.4 },
    { day: 'Thursday', present: 1212, absent: 28, late: 7, rate: 97.2 },
    { day: 'Friday', present: 1176, absent: 63, late: 8, rate: 94.3 },
  ];

  const attendanceColumns = [
    { key: 'class', label: 'Class', width: '20%' },
    { key: 'teacher', label: 'Teacher', width: '18%' },
    { key: 'present', label: 'Present', width: '10%' },
    { key: 'absent', label: 'Absent', width: '10%' },
    { key: 'late', label: 'Late', width: '10%' },
    { key: 'total', label: 'Total', width: '10%' },
    { key: 'rate', label: 'Rate', width: '12%', render: (row) => (
      <div className="rate-cell">
        <span>{row.rate.toFixed(1)}%</span>
        <div className="rate-bar">
          <div 
            className={`rate-fill ${row.rate >= 95 ? 'high' : row.rate >= 90 ? 'medium' : 'low'}`}
            style={{ width: `${row.rate}%` }}
          ></div>
        </div>
      </div>
    )},
    { key: 'actions', label: '', width: '10%', render: () => <TerraButton size="sm">Details</TerraButton> },
  ];

  const absentColumns = [
    { key: 'studentId', label: 'Student ID', width: '12%' },
    { key: 'name', label: 'Name', width: '18%' },
    { key: 'grade', label: 'Grade', width: '10%' },
    { key: 'class', label: 'Class', width: '18%' },
    { key: 'lastAbsent', label: 'Last Absent', width: '12%' },
    { key: 'totalAbsences', label: 'Total', width: '10%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'actions', label: '', width: '8%', render: () => <TerraButton size="sm" variant="outline">Notify</TerraButton> },
  ];

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Tracking</h1>
          <p className="page-subtitle">Daily attendance reports and student notifications</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Attendance Report</TerraButton>
          <TerraButton variant="primary">📝 Take Attendance</TerraButton>
        </div>
      </div>

      <div className="attendance-stats">
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">1,176</span>
            <span className="stat-label">Present Today</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">❌</span>
          <div className="stat-content">
            <span className="stat-value">63</span>
            <span className="stat-label">Absent Today</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏰</span>
          <div className="stat-content">
            <span className="stat-value">8</span>
            <span className="stat-label">Late Today</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-content">
            <span className="stat-value">94.3%</span>
            <span className="stat-label">Attendance Rate</span>
          </div>
        </div>
      </div>

      <TerraCard className="today-attendance-card">
        <h2>Today's Attendance by Class</h2>
        <TerraTable columns={attendanceColumns} data={todayAttendance} pageSize={10} />
      </TerraCard>

      <div className="attendance-grid">
        <TerraCard className="trends-card">
          <h2>Weekly Attendance Trends</h2>
          <div className="trends-list">
            {weeklyTrends.map((day, index) => (
              <div key={index} className="trend-item">
                <div className="trend-header">
                  <span className="trend-day">{day.day}</span>
                  <span className="trend-rate">{day.rate.toFixed(1)}%</span>
                </div>
                <div className="trend-stats">
                  <span className="trend-stat present">✅ {day.present}</span>
                  <span className="trend-stat absent">❌ {day.absent}</span>
                  <span className="trend-stat late">⏰ {day.late}</span>
                </div>
                <div className="trend-bar">
                  <div 
                    className={`trend-fill ${day.rate >= 95 ? 'high' : day.rate >= 90 ? 'medium' : 'low'}`}
                    style={{ width: `${day.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </TerraCard>

        <TerraCard className="absent-card">
          <h2>Absent Students Today</h2>
          <TerraTable columns={absentColumns} data={absentStudents} pageSize={10} />
        </TerraCard>
      </div>
    </div>
  );
};

export default AttendancePage;
