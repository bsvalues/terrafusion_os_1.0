/**
 * Education Portal - Grades Page
 * Grade entry and gradebook management
 */

import { TerraCard, TerraTable, TerraButton } from '../../../src/components';
import { useGrades } from '../../../src/hooks/useEducation';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './GradesPage.css';

const GradesPage = () => {
  const { grades, distribution, loading, error, refetch } = useGrades();

  if (loading) {
    return <LoadingState message="Loading grades..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load grades" onRetry={refetch} fullPage />;
  }

  const classGrades = grades || [
    { class: 'Mathematics 101', teacher: 'Dr. Sarah Johnson', students: 28, avgGrade: 87.3, graded: 26, pending: 2, status: 'Updated' },
    { class: 'English Literature', teacher: 'Prof. Michael Davis', students: 25, avgGrade: 91.2, graded: 25, pending: 0, status: 'Complete' },
    { class: 'World History', teacher: 'Dr. Emily Brown', students: 30, avgGrade: 84.5, graded: 28, pending: 2, status: 'Updated' },
    { class: 'Biology I', teacher: 'Prof. David Wilson', students: 22, avgGrade: 89.7, graded: 22, pending: 0, status: 'Complete' },
    { class: 'Chemistry II', teacher: 'Dr. Lisa Anderson', students: 18, avgGrade: 92.4, graded: 17, pending: 1, status: 'Updated' },
    { class: 'Physical Education', teacher: 'Coach James Taylor', students: 35, avgGrade: 95.8, graded: 35, pending: 0, status: 'Complete' },
    { class: 'Spanish I', teacher: 'Prof. Maria Garcia', students: 24, avgGrade: 88.6, graded: 23, pending: 1, status: 'Updated' },
    { class: 'Art & Design', teacher: 'Ms. Jennifer Lee', students: 20, avgGrade: 93.1, graded: 20, pending: 0, status: 'Complete' },
  ];

  const recentGrades = [
    { studentId: 'STU-1234', student: 'John Smith', class: 'Mathematics 101', assignment: 'Midterm Exam', grade: 'A-', score: 91, date: '10/03/2025' },
    { studentId: 'STU-1235', student: 'Sarah Johnson', class: 'English Literature', assignment: 'Essay Assignment', grade: 'A', score: 95, date: '10/03/2025' },
    { studentId: 'STU-1236', student: 'Mike Davis', class: 'World History', assignment: 'Chapter 5 Quiz', grade: 'B+', score: 88, date: '10/02/2025' },
    { studentId: 'STU-1237', student: 'Emily Brown', class: 'Biology I', assignment: 'Lab Report #3', grade: 'A-', score: 92, date: '10/02/2025' },
    { studentId: 'STU-1238', student: 'David Wilson', class: 'Chemistry II', assignment: 'Final Project', grade: 'A', score: 97, date: '10/01/2025' },
  ];

  const gradeDistribution = [
    { grade: 'A (90-100)', count: 387, percentage: 31.0, color: 'success' },
    { grade: 'B (80-89)', count: 524, percentage: 42.0, color: 'primary' },
    { grade: 'C (70-79)', count: 245, percentage: 19.6, color: 'warning' },
    { grade: 'D (60-69)', count: 67, percentage: 5.4, color: 'danger' },
    { grade: 'F (0-59)', count: 24, percentage: 1.9, color: 'danger' },
  ];

  const classColumns = [
    { key: 'class', label: 'Class', width: '20%' },
    { key: 'teacher', label: 'Teacher', width: '18%' },
    { key: 'students', label: 'Students', width: '10%' },
    { key: 'avgGrade', label: 'Avg Grade', width: '12%', render: (row) => (
      <div className="grade-cell">
        <span className={`grade-badge ${row.avgGrade >= 90 ? 'high' : row.avgGrade >= 80 ? 'medium' : 'low'}`}>
          {row.avgGrade.toFixed(1)}
        </span>
      </div>
    )},
    { key: 'graded', label: 'Graded', width: '10%', render: (row) => `${row.graded}/${row.students}` },
    { key: 'pending', label: 'Pending', width: '10%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'actions', label: '', width: '8%', render: () => <TerraButton size="sm">Gradebook</TerraButton> },
  ];

  const recentColumns = [
    { key: 'studentId', label: 'Student ID', width: '12%' },
    { key: 'student', label: 'Student', width: '18%' },
    { key: 'class', label: 'Class', width: '18%' },
    { key: 'assignment', label: 'Assignment', width: '18%' },
    { key: 'grade', label: 'Grade', width: '10%', render: (row) => (
      <span className={`grade-badge ${row.score >= 90 ? 'high' : row.score >= 80 ? 'medium' : 'low'}`}>
        {row.grade}
      </span>
    )},
    { key: 'score', label: 'Score', width: '10%' },
    { key: 'date', label: 'Date', width: '12%' },
  ];

  return (
    <div className="grades-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grades & Gradebook</h1>
          <p className="page-subtitle">Grade entry, student performance, and GPA tracking</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Grade Reports</TerraButton>
          <TerraButton variant="primary">📝 Enter Grades</TerraButton>
        </div>
      </div>

      <div className="grades-stats">
        <div className="stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-content">
            <span className="stat-value">47</span>
            <span className="stat-label">Classes</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-content">
            <span className="stat-value">89.7</span>
            <span className="stat-label">Avg Grade</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">1,196</span>
            <span className="stat-label">Graded Assignments</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <span className="stat-value">6</span>
            <span className="stat-label">Pending Grades</span>
          </div>
        </div>
      </div>

      <TerraCard className="class-grades-card">
        <h2>Class Grades Overview</h2>
        <TerraTable columns={classColumns} data={classGrades} pageSize={10} />
      </TerraCard>

      <div className="grades-grid">
        <TerraCard className="distribution-card">
          <h2>Grade Distribution</h2>
          <div className="distribution-list">
            {gradeDistribution.map((item, index) => (
              <div key={index} className="distribution-item">
                <div className="distribution-header">
                  <span className="distribution-grade">{item.grade}</span>
                  <span className="distribution-count">{item.count} students</span>
                </div>
                <div className="distribution-bar">
                  <div 
                    className={`distribution-fill ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="distribution-percentage">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </TerraCard>

        <TerraCard className="recent-grades-card">
          <h2>Recent Grade Entries</h2>
          <TerraTable columns={recentColumns} data={recentGrades} pageSize={5} />
        </TerraCard>
      </div>
    </div>
  );
};

export default GradesPage;
