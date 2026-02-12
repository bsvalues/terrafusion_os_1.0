/**
 * Education Portal - Classes Page
 * Class management with rosters, schedules, and teacher assignments
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraModal, TerraInput } from '../../../src/components';
import './ClassesPage.css';

const ClassesPage = () => {
  const [showNewClass, setShowNewClass] = useState(false);
  const [filterGrade, setFilterGrade] = useState('all');

  const classes = [
    { id: 'CLS-101', name: 'Mathematics 101', grade: '9th', teacher: 'Dr. Sarah Johnson', students: 28, capacity: 30, schedule: 'Mon/Wed/Fri 9:00 AM', room: '204A', status: 'Active' },
    { id: 'CLS-102', name: 'English Literature', grade: '10th', teacher: 'Prof. Michael Davis', students: 25, capacity: 28, schedule: 'Tue/Thu 10:30 AM', room: '301B', status: 'Active' },
    { id: 'CLS-103', name: 'World History', grade: '11th', teacher: 'Dr. Emily Brown', students: 30, capacity: 30, schedule: 'Mon/Wed/Fri 1:00 PM', room: '205C', status: 'Full' },
    { id: 'CLS-104', name: 'Biology I', grade: '9th', teacher: 'Prof. David Wilson', students: 22, capacity: 25, schedule: 'Tue/Thu 9:00 AM', room: 'Lab 1', status: 'Active' },
    { id: 'CLS-105', name: 'Chemistry II', grade: '12th', teacher: 'Dr. Lisa Anderson', students: 18, capacity: 24, schedule: 'Mon/Wed 2:00 PM', room: 'Lab 2', status: 'Active' },
    { id: 'CLS-106', name: 'Physical Education', grade: '9th', teacher: 'Coach James Taylor', students: 35, capacity: 40, schedule: 'Daily 11:00 AM', room: 'Gym', status: 'Active' },
    { id: 'CLS-107', name: 'Spanish I', grade: '10th', teacher: 'Prof. Maria Garcia', students: 24, capacity: 28, schedule: 'Tue/Thu 1:00 PM', room: '302A', status: 'Active' },
    { id: 'CLS-108', name: 'Art & Design', grade: '11th', teacher: 'Ms. Jennifer Lee', students: 20, capacity: 22, schedule: 'Mon/Wed/Fri 10:00 AM', room: 'Art Studio', status: 'Active' },
    { id: 'CLS-109', name: 'Computer Science', grade: '12th', teacher: 'Dr. Robert Chen', students: 26, capacity: 30, schedule: 'Tue/Thu 2:30 PM', room: 'Computer Lab', status: 'Active' },
    { id: 'CLS-110', name: 'Music Theory', grade: '10th', teacher: 'Prof. Anna Martinez', students: 15, capacity: 20, schedule: 'Mon/Wed 3:00 PM', room: 'Music Room', status: 'Active' },
    { id: 'CLS-111', name: 'Physics I', grade: '11th', teacher: 'Dr. Thomas White', students: 27, capacity: 28, schedule: 'Mon/Wed/Fri 11:00 AM', room: 'Lab 3', status: 'Active' },
    { id: 'CLS-112', name: 'U.S. Government', grade: '12th', teacher: 'Prof. Patricia Moore', students: 29, capacity: 30, schedule: 'Tue/Thu 9:30 AM', room: '203B', status: 'Active' },
  ];

  const teachers = [
    { name: 'Dr. Sarah Johnson', classes: 3, students: 82, department: 'Mathematics' },
    { name: 'Prof. Michael Davis', classes: 2, students: 54, department: 'English' },
    { name: 'Dr. Emily Brown', classes: 3, students: 87, department: 'History' },
    { name: 'Prof. David Wilson', classes: 2, students: 48, department: 'Science' },
    { name: 'Dr. Lisa Anderson', classes: 2, students: 42, department: 'Science' },
  ];

  const filteredClasses = classes.filter(cls => 
    filterGrade === 'all' || cls.grade === filterGrade
  );

  const classColumns = [
    { key: 'id', label: 'ID', width: '8%' },
    { key: 'name', label: 'Class Name', width: '18%' },
    { key: 'grade', label: 'Grade', width: '8%' },
    { key: 'teacher', label: 'Teacher', width: '15%' },
    { key: 'students', label: 'Enrollment', width: '12%', render: (row) => (
      <div className="enrollment-cell">
        <span>{row.students}/{row.capacity}</span>
        <div className="enrollment-bar">
          <div 
            className="enrollment-fill" 
            style={{ width: `${(row.students / row.capacity) * 100}%` }}
          ></div>
        </div>
      </div>
    )},
    { key: 'schedule', label: 'Schedule', width: '15%' },
    { key: 'room', label: 'Room', width: '10%' },
    { key: 'status', label: 'Status', width: '8%' },
    { key: 'actions', label: '', width: '6%', render: () => <TerraButton size="sm">View</TerraButton> },
  ];

  const teacherColumns = [
    { key: 'name', label: 'Teacher Name', width: '35%' },
    { key: 'department', label: 'Department', width: '25%' },
    { key: 'classes', label: 'Classes', width: '20%' },
    { key: 'students', label: 'Total Students', width: '20%' },
  ];

  return (
    <div className="classes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes Management</h1>
          <p className="page-subtitle">Course schedules, rosters, and teacher assignments</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">📊 Class Reports</TerraButton>
          <TerraButton variant="primary" onClick={() => setShowNewClass(true)}>➕ New Class</TerraButton>
        </div>
      </div>

      <div className="classes-stats">
        <div className="stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-content">
            <span className="stat-value">47</span>
            <span className="stat-label">Total Classes</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👨‍🏫</span>
          <div className="stat-content">
            <span className="stat-value">32</span>
            <span className="stat-label">Active Teachers</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">1,247</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-content">
            <span className="stat-value">26.5</span>
            <span className="stat-label">Avg Class Size</span>
          </div>
        </div>
      </div>

      <TerraCard className="classes-card">
        <h2>All Classes</h2>
        <div className="classes-controls">
          <div className="filter-buttons">
            <TerraButton 
              variant={filterGrade === 'all' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterGrade('all')}
            >
              All Grades
            </TerraButton>
            <TerraButton 
              variant={filterGrade === '9th' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterGrade('9th')}
            >
              9th Grade
            </TerraButton>
            <TerraButton 
              variant={filterGrade === '10th' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterGrade('10th')}
            >
              10th Grade
            </TerraButton>
            <TerraButton 
              variant={filterGrade === '11th' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterGrade('11th')}
            >
              11th Grade
            </TerraButton>
            <TerraButton 
              variant={filterGrade === '12th' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setFilterGrade('12th')}
            >
              12th Grade
            </TerraButton>
          </div>
        </div>
        <TerraTable columns={classColumns} data={filteredClasses} pageSize={10} />
      </TerraCard>

      <TerraCard className="teachers-card">
        <h2>Teacher Assignments</h2>
        <TerraTable columns={teacherColumns} data={teachers} pageSize={10} />
      </TerraCard>

      {showNewClass && (
        <TerraModal
          title="Create New Class"
          onClose={() => setShowNewClass(false)}
          size="large"
        >
          <div className="new-class-form">
            <div className="form-row">
              <div className="form-group">
                <label>Class Name</label>
                <TerraInput type="text" placeholder="e.g., Mathematics 101" />
              </div>
              <div className="form-group">
                <label>Grade Level</label>
                <select className="terra-select">
                  <option>9th Grade</option>
                  <option>10th Grade</option>
                  <option>11th Grade</option>
                  <option>12th Grade</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teacher</label>
                <select className="terra-select">
                  {teachers.map((teacher, i) => (
                    <option key={i} value={teacher.name}>{teacher.name} - {teacher.department}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <TerraInput type="number" placeholder="Maximum students" defaultValue="30" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Schedule</label>
                <TerraInput type="text" placeholder="e.g., Mon/Wed/Fri 9:00 AM" />
              </div>
              <div className="form-group">
                <label>Room</label>
                <TerraInput type="text" placeholder="e.g., 204A" />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea className="terra-textarea" rows="3" placeholder="Course description..."></textarea>
            </div>
            <div className="form-actions">
              <TerraButton variant="outline" onClick={() => setShowNewClass(false)}>Cancel</TerraButton>
              <TerraButton variant="primary">Create Class</TerraButton>
            </div>
          </div>
        </TerraModal>
      )}
    </div>
  );
};

export default ClassesPage;
