/**
 * Education Portal - Students Page
 * Manage student records, enrollment, and profiles
 */

import { useState } from 'react';
import { TerraCard, TerraTable, TerraButton, TerraInput, TerraModal } from '../../../src/components';
import { useStudents } from '../../../src/hooks/useEducation';
import LoadingState from '../../../src/components/LoadingState';
import ErrorState from '../../../src/components/ErrorState';
import './StudentsPage.css';

const StudentsPage = () => {
  const { students: studentsData, loading, error, refetch } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return <LoadingState message="Loading students..." fullPage />;
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load students" onRetry={refetch} fullPage />;
  }

  // Use API data or fallback to mock data
  const students = studentsData || [
    { id: 1, name: 'Sarah Johnson', grade: '10th', gpa: 3.8, attendance: '96%', email: 'sarah.j@school.edu', status: 'Active' },
    { id: 2, name: 'Mike Davis', grade: '11th', gpa: 3.5, attendance: '92%', email: 'mike.d@school.edu', status: 'Active' },
    { id: 3, name: 'Emma Wilson', grade: '9th', gpa: 3.9, attendance: '98%', email: 'emma.w@school.edu', status: 'Active' },
    { id: 4, name: 'James Brown', grade: '12th', gpa: 3.6, attendance: '94%', email: 'james.b@school.edu', status: 'Active' },
    { id: 5, name: 'Olivia Martinez', grade: '10th', gpa: 3.7, attendance: '95%', email: 'olivia.m@school.edu', status: 'Active' },
    { id: 6, name: 'William Taylor', grade: '11th', gpa: 3.4, attendance: '91%', email: 'william.t@school.edu', status: 'Active' },
    { id: 7, name: 'Sophia Anderson', grade: '9th', gpa: 4.0, attendance: '99%', email: 'sophia.a@school.edu', status: 'Active' },
    { id: 8, name: 'Lucas Thomas', grade: '12th', gpa: 3.3, attendance: '89%', email: 'lucas.t@school.edu', status: 'Active' },
  ];

  const columns = [
    { key: 'name', label: 'Student Name', width: '25%' },
    { key: 'grade', label: 'Grade', width: '10%' },
    { key: 'gpa', label: 'GPA', width: '10%' },
    { key: 'attendance', label: 'Attendance', width: '15%' },
    { key: 'email', label: 'Email', width: '25%' },
    { key: 'status', label: 'Status', width: '15%' },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="students-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student records and enrollment</p>
        </div>
        <TerraButton variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Student
        </TerraButton>
      </div>

      <TerraCard>
        <div className="students-controls">
          <TerraInput
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-buttons">
            <TerraButton variant="outline" size="sm">All Grades</TerraButton>
            <TerraButton variant="outline" size="sm">Export</TerraButton>
          </div>
        </div>

        <TerraTable
          columns={columns}
          data={filteredStudents}
          pageSize={10}
        />

        <div className="students-summary">
          <p>Showing {filteredStudents.length} of {students.length} students</p>
        </div>
      </TerraCard>

      {showAddModal && (
        <TerraModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Student"
          footer={
            <>
              <TerraButton variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </TerraButton>
              <TerraButton variant="primary" onClick={() => setShowAddModal(false)}>
                Add Student
              </TerraButton>
            </>
          }
        >
          <div className="add-student-form">
            <TerraInput label="First Name" placeholder="Enter first name" />
            <TerraInput label="Last Name" placeholder="Enter last name" />
            <TerraInput label="Email" type="email" placeholder="student@school.edu" />
            <TerraInput label="Grade" placeholder="e.g., 10th" />
            <TerraInput label="Date of Birth" type="date" />
            <TerraInput label="Parent/Guardian" placeholder="Parent name" />
            <TerraInput label="Contact Phone" type="tel" placeholder="(555) 123-4567" />
          </div>
        </TerraModal>
      )}
    </div>
  );
};

export default StudentsPage;
