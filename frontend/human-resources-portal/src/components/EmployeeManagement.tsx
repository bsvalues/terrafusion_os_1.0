import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaIdBadge, 
  FaBuilding, 
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUserTie,
  FaAward,
  FaShieldAlt
} from 'react-icons/fa';

interface Employee {
  employee_id: string;
  name: string;
  department: string;
  position: string;
  classification: string;
  pay_grade: string;
  salary: number;
  hire_date: string;
  supervisor: string;
  employment_status: string;
  benefits_eligible: boolean;
  union_member: boolean;
  security_clearance?: string;
  certifications: string[];
  performance_rating: number;
  last_evaluation: string;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:\${{TF_PORT_5360:-5360}}/api/hr/employees');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEmployees(data.employees || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('Unable to connect to HR service. Please check if the service is running on port \${{TF_PORT_5360:-5360}}.');
      
      // Set demo data for display
      setEmployees([
        {
          employee_id: 'BC-EMP-2024-001',
          name: 'Jennifer Martinez',
          department: 'Administration',
          position: 'County Administrator',
          classification: 'Executive',
          pay_grade: 'EX',
          salary: 145000,
          hire_date: '2019-03-15T00:00:00',
          supervisor: 'County Commissioners',
          employment_status: 'Active',
          benefits_eligible: true,
          union_member: false,
          security_clearance: 'Secret',
          certifications: ['MPA', 'ICMA-CM', 'CGFM'],
          performance_rating: 4.8,
          last_evaluation: '2024-08-01T00:00:00'
        },
        {
          employee_id: 'BC-EMP-2024-002',
          name: 'Michael Thompson',
          department: "Sheriff's Office",
          position: 'Lieutenant',
          classification: 'Professional II',
          pay_grade: 'E4',
          salary: 78500,
          hire_date: '2015-06-01T00:00:00',
          supervisor: 'Sheriff',
          employment_status: 'Active',
          benefits_eligible: true,
          union_member: true,
          security_clearance: 'Confidential',
          certifications: ['Basic Law Enforcement', 'Supervision', 'Emergency Management'],
          performance_rating: 4.5,
          last_evaluation: '2024-07-15T00:00:00'
        },
        {
          employee_id: 'BC-EMP-2024-003',
          name: 'Sarah Chen',
          department: 'Public Works',
          position: 'Civil Engineer III',
          classification: 'Senior Professional',
          pay_grade: 'E5',
          salary: 85200,
          hire_date: '2017-09-12T00:00:00',
          supervisor: 'Public Works Director',
          employment_status: 'Active',
          benefits_eligible: true,
          union_member: true,
          security_clearance: undefined,
          certifications: ['PE License', 'PMP', 'LEED AP'],
          performance_rating: 4.7,
          last_evaluation: '2024-06-30T00:00:00'
        },
        {
          employee_id: 'BC-EMP-2024-004',
          name: 'David Rodriguez',
          department: 'Health Department',
          position: 'Environmental Health Specialist',
          classification: 'Professional I',
          pay_grade: 'E3',
          salary: 58750,
          hire_date: '2020-02-03T00:00:00',
          supervisor: 'Health Director',
          employment_status: 'Active',
          benefits_eligible: true,
          union_member: true,
          security_clearance: undefined,
          certifications: ['REHS', 'Food Safety Manager', 'Hazmat Specialist'],
          performance_rating: 4.2,
          last_evaluation: '2024-05-20T00:00:00'
        },
        {
          employee_id: 'BC-EMP-2024-005',
          name: 'Lisa Anderson',
          department: 'Human Resources',
          position: 'HR Manager',
          classification: 'Manager',
          pay_grade: 'M2',
          salary: 92000,
          hire_date: '2018-11-08T00:00:00',
          supervisor: 'County Administrator',
          employment_status: 'Active',
          benefits_eligible: true,
          union_member: false,
          security_clearance: 'Confidential',
          certifications: ['SHRM-CP', 'PHR', 'Government HR Certification'],
          performance_rating: 4.6,
          last_evaluation: '2024-07-01T00:00:00'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(salary);
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'Active' ? 'status-active' : 
                       status === 'Inactive' ? 'status-error' : 'status-warning';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(employees.map(emp => emp.department))];

  const openEmployeeDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading"></div>
        <p>Loading Employee Data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaUser />
          <div>
            <strong>Service Connection Warning:</strong> {error}
            <br />
            <small>Displaying cached employee data for demonstration purposes.</small>
          </div>
        </div>
      )}

      {/* Header with Search and Controls */}
      <div className="data-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
            Employee Management
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="government-button secondary">
              <FaPlus size={14} style={{ marginRight: '0.5rem' }} />
              Add Employee
            </button>
            <button className="government-button">
              <FaDownload size={14} style={{ marginRight: '0.5rem' }} />
              Export
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div className="form-group">
            <label className="form-label">
              <FaSearch style={{ marginRight: '0.5rem' }} />
              Search Employees
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, ID, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaFilter style={{ marginRight: '0.5rem' }} />
              Department Filter
            </label>
            <select
              className="form-input"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <span>Total Employees: <strong>{employees.length}</strong></span>
          <span>•</span>
          <span>Filtered Results: <strong>{filteredEmployees.length}</strong></span>
          <span>•</span>
          <span>Active: <strong>{employees.filter(e => e.employment_status === 'Active').length}</strong></span>
        </div>
      </div>

      {/* Employee Table */}
      <div className="government-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Grade</th>
              <th>Salary</th>
              <th>Performance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.employee_id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%',
                      background: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#374151' }}>
                        {employee.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {employee.employee_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaBuilding size={14} style={{ color: '#6b7280' }} />
                    {employee.department}
                  </div>
                </td>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>{employee.position}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {employee.classification}
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ 
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {employee.pay_grade}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: '500' }}>
                    {formatSalary(employee.salary)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Annual
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%',
                      background: getPerformanceColor(employee.performance_rating)
                    }}></div>
                    <span style={{ fontWeight: '500' }}>
                      {employee.performance_rating.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td>
                  {getStatusBadge(employee.employment_status)}
                </td>
                <td>
                  <button
                    onClick={() => openEmployeeDetails(employee)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e40af',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '4px'
                    }}
                    title="View Details"
                  >
                    <FaEdit size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Detail Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="government-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                  Employee Details - {selectedEmployee.name}
                </h3>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="data-grid" style={{ 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Personal Information */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaUser />
                    Personal Information
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Employee ID
                      </label>
                      <div style={{ fontWeight: '500' }}>{selectedEmployee.employee_id}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Full Name
                      </label>
                      <div style={{ fontWeight: '500' }}>{selectedEmployee.name}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Hire Date
                      </label>
                      <div style={{ fontWeight: '500' }}>{formatDate(selectedEmployee.hire_date)}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Employment Status
                      </label>
                      <div>{getStatusBadge(selectedEmployee.employment_status)}</div>
                    </div>
                  </div>
                </div>

                {/* Position Information */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaUserTie />
                    Position Information
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Department
                      </label>
                      <div style={{ fontWeight: '500' }}>{selectedEmployee.department}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Position Title
                      </label>
                      <div style={{ fontWeight: '500' }}>{selectedEmployee.position}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Classification
                      </label>
                      <div style={{ fontWeight: '500' }}>{selectedEmployee.classification}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Pay Grade
                      </label>
                      <div>
                        <span style={{ 
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {selectedEmployee.pay_grade}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Supervisor
                      </label>
                      <div style={{ fontWeight: '500' }}>{selectedEmployee.supervisor}</div>
                    </div>
                  </div>
                </div>

                {/* Compensation & Benefits */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaCalendarAlt />
                    Compensation & Benefits
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Annual Salary
                      </label>
                      <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#059669' }}>
                        {formatSalary(selectedEmployee.salary)}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Benefits Eligible
                      </label>
                      <div style={{ fontWeight: '500' }}>
                        {selectedEmployee.benefits_eligible ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Union Member
                      </label>
                      <div style={{ fontWeight: '500' }}>
                        {selectedEmployee.union_member ? 'Yes' : 'No'}
                      </div>
                    </div>
                    {selectedEmployee.security_clearance && (
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                          Security Clearance
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaShieldAlt style={{ color: '#d97706' }} />
                          <span style={{ fontWeight: '500' }}>{selectedEmployee.security_clearance}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance & Certifications */}
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaAward />
                    Performance & Certifications
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Performance Rating
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%',
                          background: getPerformanceColor(selectedEmployee.performance_rating)
                        }}></div>
                        <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                          {selectedEmployee.performance_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Last Evaluation
                      </label>
                      <div style={{ fontWeight: '500' }}>
                        {formatDate(selectedEmployee.last_evaluation)}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        Certifications
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {selectedEmployee.certifications.map((cert, index) => (
                          <span
                            key={index}
                            style={{
                              background: '#f3f4f6',
                              color: '#374151',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '0.5rem',
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="government-button"
                  style={{ background: '#6b7280' }}
                >
                  Close
                </button>
                <button className="government-button">
                  <FaEdit size={14} style={{ marginRight: '0.5rem' }} />
                  Edit Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;