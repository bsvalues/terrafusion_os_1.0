import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Sample reports data for UI demonstration
const MOCK_REPORTS = [
  {
    id: 'rpt-2023-0001',
    title: 'Residential Appraisal Report',
    propertyId: 'prop-1001',
    propertyAddress: '123 Main Street, Metropolis, NY 10001',
    type: 'Residential Appraisal',
    status: 'Completed',
    assignedTo: 'John Appraiser',
    completedDate: '2023-04-18T15:30:00Z',
    value: 450000
  },
  {
    id: 'rpt-2023-0002',
    title: 'Commercial Valuation',
    propertyId: 'prop-1002',
    propertyAddress: '456 Oak Avenue, Urbanville, CA 90210',
    type: 'Commercial Appraisal',
    status: 'In Progress',
    assignedTo: 'Sarah Valuator',
    completedDate: null,
    value: null
  },
  {
    id: 'rpt-2023-0003',
    title: 'Mixed Use Property Report',
    propertyId: 'prop-1004',
    propertyAddress: '101 Cedar Lane, Villagetown, FL 33101',
    type: 'Mixed Use Appraisal',
    status: 'Draft',
    assignedTo: 'Michael Estimator',
    completedDate: null,
    value: 1250000
  },
  {
    id: 'rpt-2023-0004',
    title: 'Market Analysis Report',
    propertyId: null,
    propertyAddress: 'Metropolitan Area 042',
    type: 'Market Analysis',
    status: 'Completed',
    assignedTo: 'Amanda Researcher',
    completedDate: '2023-04-01T09:45:00Z',
    value: null
  },
  {
    id: 'rpt-2023-0005',
    title: 'Residential Appraisal Report',
    propertyId: 'prop-1005',
    propertyAddress: '202 Maple Drive, Hamletville, IL 60601',
    type: 'Residential Appraisal',
    status: 'Review',
    assignedTo: 'David Reviewer',
    completedDate: null,
    value: 325000
  }
];

/**
 * Reports Component
 * Displays list of property appraisal reports with filtering options
 */
const Reports = () => {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    type: '',
    status: '',
    assignedTo: ''
  });
  
  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters and search to reports
  const filteredReports = reports.filter(report => {
    // Apply search term
    const searchFields = [
      report.title,
      report.propertyAddress,
      report.id,
      report.assignedTo
    ].filter(Boolean).map(field => field.toLowerCase());
    
    const matchesSearch = !searchTerm || 
      searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    
    // Apply filters
    const matchesType = !filter.type || report.type === filter.type;
    const matchesStatus = !filter.status || report.status === filter.status;
    const matchesAssignedTo = !filter.assignedTo || report.assignedTo === filter.assignedTo;
    
    return matchesSearch && matchesType && matchesStatus && matchesAssignedTo;
  });
  
  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <Link to="/reports/new" className="btn btn-primary">
          Create New Report
        </Link>
      </div>
      
      {/* Search and Filters */}
      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="form-control"
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="type">Report Type</label>
            <select
              id="type"
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All Types</option>
              <option value="Residential Appraisal">Residential Appraisal</option>
              <option value="Commercial Appraisal">Commercial Appraisal</option>
              <option value="Mixed Use Appraisal">Mixed Use Appraisal</option>
              <option value="Market Analysis">Market Analysis</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="assignedTo">Assigned To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={filter.assignedTo}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All Users</option>
              <option value="John Appraiser">John Appraiser</option>
              <option value="Sarah Valuator">Sarah Valuator</option>
              <option value="Michael Estimator">Michael Estimator</option>
              <option value="Amanda Researcher">Amanda Researcher</option>
              <option value="David Reviewer">David Reviewer</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Reports Table */}
      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Title</th>
              <th>Property</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Completion Date</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.title}</td>
                  <td>{report.propertyAddress}</td>
                  <td>{report.type}</td>
                  <td>
                    <span className={`status-badge ${report.status.toLowerCase().replace(' ', '-')}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{report.assignedTo}</td>
                  <td>{formatDate(report.completedDate)}</td>
                  <td>{formatCurrency(report.value)}</td>
                  <td className="actions-cell">
                    <Link to={`/reports/${report.id}`} className="btn btn-sm">
                      View
                    </Link>
                    {report.status !== 'Completed' && (
                      <Link to={`/reports/${report.id}/edit`} className="btn btn-sm">
                        Edit
                      </Link>
                    )}
                    <button className="btn btn-sm">
                      Export
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-results">
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        <button className="btn btn-sm" disabled>
          Previous
        </button>
        
        <div className="page-numbers">
          <button className="page-number active">1</button>
          <button className="page-number">2</button>
          <button className="page-number">3</button>
        </div>
        
        <button className="btn btn-sm">
          Next
        </button>
      </div>
    </div>
  );
};

export default Reports;