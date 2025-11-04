import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Sample forms data for UI demonstration
const MOCK_FORMS = [
  {
    id: 'form-1001',
    name: 'Residential Appraisal Form',
    category: 'Appraisal',
    lastUpdated: '2023-03-15T10:00:00Z',
    fields: 45,
    usageCount: 124
  },
  {
    id: 'form-1002',
    name: 'Commercial Property Inspection',
    category: 'Inspection',
    lastUpdated: '2023-02-22T14:30:00Z',
    fields: 78,
    usageCount: 87
  },
  {
    id: 'form-1003',
    name: 'Property Photo Documentation',
    category: 'Documentation',
    lastUpdated: '2023-04-05T09:15:00Z',
    fields: 22,
    usageCount: 198
  },
  {
    id: 'form-1004',
    name: 'Market Analysis Questionnaire',
    category: 'Analysis',
    lastUpdated: '2023-01-18T11:45:00Z',
    fields: 36,
    usageCount: 53
  },
  {
    id: 'form-1005',
    name: 'Client Feedback Survey',
    category: 'Feedback',
    lastUpdated: '2023-03-30T16:20:00Z',
    fields: 15,
    usageCount: 210
  }
];

/**
 * Forms Component
 * Displays and manages data collection forms
 */
const Forms = () => {
  const [forms, setForms] = useState(MOCK_FORMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    category: ''
  });
  
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
  
  // Apply filters and search to forms
  const filteredForms = forms.filter(form => {
    // Apply search term
    const matchesSearch = !searchTerm || 
      form.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply filters
    const matchesCategory = !filter.category || form.category === filter.category;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="forms-page">
      <div className="page-header">
        <h1>Forms</h1>
        <div className="header-actions">
          <Link to="/forms/new" className="btn btn-primary">
            Create New Form
          </Link>
          <Link to="/forms/templates" className="btn btn-outline">
            View Templates
          </Link>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="form-control"
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={filter.category}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All Categories</option>
              <option value="Appraisal">Appraisal</option>
              <option value="Inspection">Inspection</option>
              <option value="Documentation">Documentation</option>
              <option value="Analysis">Analysis</option>
              <option value="Feedback">Feedback</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select className="form-control">
              <option value="lastUpdated">Last Updated</option>
              <option value="name">Name</option>
              <option value="usageCount">Usage Count</option>
              <option value="fields">Field Count</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Forms Grid */}
      <div className="forms-grid">
        {filteredForms.length > 0 ? (
          filteredForms.map(form => (
            <div key={form.id} className="form-card">
              <div className="form-card-header">
                <h3 className="form-name">{form.name}</h3>
                <span className="category-badge">{form.category}</span>
              </div>
              
              <div className="form-card-body">
                <div className="form-stats">
                  <div className="stat-item">
                    <span className="stat-label">Fields</span>
                    <span className="stat-value">{form.fields}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Uses</span>
                    <span className="stat-value">{form.usageCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Updated</span>
                    <span className="stat-value">{formatDate(form.lastUpdated)}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-card-actions">
                <Link to={`/forms/${form.id}/fill`} className="btn btn-primary">
                  Fill Form
                </Link>
                <Link to={`/forms/${form.id}`} className="btn btn-outline">
                  View
                </Link>
                <div className="dropdown">
                  <button className="btn btn-icon dropdown-toggle">
                    ⋮
                  </button>
                  <div className="dropdown-menu">
                    <Link to={`/forms/${form.id}/edit`} className="dropdown-item">
                      Edit
                    </Link>
                    <Link to={`/forms/${form.id}/duplicate`} className="dropdown-item">
                      Duplicate
                    </Link>
                    <button className="dropdown-item text-danger">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No forms found matching your criteria</p>
            <button className="btn btn-primary" onClick={() => {
              setSearchTerm('');
              setFilter({ category: '' });
            }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Form Usage Statistics */}
      <div className="form-statistics">
        <h2>Form Usage Statistics</h2>
        <div className="statistics-grid">
          <div className="statistic-card">
            <h3>Total Forms</h3>
            <div className="statistic-value">{forms.length}</div>
          </div>
          
          <div className="statistic-card">
            <h3>Total Form Submissions</h3>
            <div className="statistic-value">
              {forms.reduce((total, form) => total + form.usageCount, 0)}
            </div>
          </div>
          
          <div className="statistic-card">
            <h3>Most Used Form</h3>
            <div className="statistic-value">
              {forms.reduce((most, form) => 
                form.usageCount > most.usageCount ? form : most, 
                { name: 'None', usageCount: 0 }
              ).name}
            </div>
          </div>
          
          <div className="statistic-card">
            <h3>Average Fields Per Form</h3>
            <div className="statistic-value">
              {Math.round(forms.reduce((sum, form) => sum + form.fields, 0) / forms.length)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forms;