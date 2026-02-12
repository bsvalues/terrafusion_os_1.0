import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import NotificationContext from '../contexts/NotificationContext';

// Data for demonstration purposes
const dashboardData = {
  summary: {
    activeProperties: 128,
    pendingReports: 14,
    completedReports: 87,
    recentSubmissions: 32
  },
  recentProperties: [
    {
      id: 'prop-1001',
      address: '123 Main Street, Metropolis, NY 10001',
      type: 'Residential',
      status: 'Active',
      lastUpdated: '2023-04-20T14:30:00Z'
    },
    {
      id: 'prop-1002',
      address: '456 Oak Avenue, Urbanville, CA 90210',
      type: 'Commercial',
      status: 'Active',
      lastUpdated: '2023-04-19T09:15:00Z'
    },
    {
      id: 'prop-1003',
      address: '789 Pine Lane, Ruraltown, TX 75001',
      type: 'Residential',
      status: 'Inactive',
      lastUpdated: '2023-04-18T16:45:00Z'
    },
  ],
  recentReports: [
    {
      id: 'rpt-2023-0001',
      title: 'Residential Appraisal Report',
      propertyId: 'prop-1001',
      status: 'Completed',
      completedDate: '2023-04-18T15:30:00Z'
    },
    {
      id: 'rpt-2023-0002',
      title: 'Commercial Valuation',
      propertyId: 'prop-1002',
      status: 'In Progress',
      completedDate: null
    },
    {
      id: 'rpt-2023-0003',
      title: 'Mixed Use Property Report',
      propertyId: 'prop-1004',
      status: 'Draft',
      completedDate: null
    }
  ],
  serviceStatus: [
    { id: 'user-service', name: 'User Service', status: 'healthy' },
    { id: 'property-service', name: 'Property Service', status: 'healthy' },
    { id: 'report-service', name: 'Report Service', status: 'healthy' },
    { id: 'form-service', name: 'Form Service', status: 'healthy' },
    { id: 'analysis-service', name: 'Analysis Service', status: 'healthy' },
    { id: 'gateway', name: 'API Gateway', status: 'healthy' }
  ]
};

/**
 * Dashboard Component
 * The primary landing page for authenticated users
 */
const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const { info } = useContext(NotificationContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [serviceStatus, setServiceStatus] = useState([]);
  
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
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real implementation, fetch data from API
        // For now, use the mock data with a timeout to simulate loading
        setTimeout(() => {
          setData(dashboardData);
          setLoading(false);
        }, 800);
        
        // Fetch service status
        fetchServiceStatus();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Welcome message
    setTimeout(() => {
      info(`Welcome back, ${currentUser?.firstName || 'User'}!`);
    }, 1000);
  }, [currentUser, info]);
  
  // Fetch service status
  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/status');
      
      if (response.ok) {
        const data = await response.json();
        setServiceStatus(data.services);
      } else {
        // Fallback to mock data if API is not available
        setServiceStatus(dashboardData.serviceStatus);
      }
    } catch (error) {
      console.error('Error fetching service status:', error);
      // Fallback to mock data
      setServiceStatus(dashboardData.serviceStatus);
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-primary">Generate Report</button>
          <button className="btn btn-outline">View Analytics</button>
        </div>
      </div>
      
      {/* Dashboard Summary */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-icon properties-icon">🏠</div>
          <div className="summary-content">
            <h3>Active Properties</h3>
            <div className="summary-value">{data.summary.activeProperties}</div>
          </div>
          <Link to="/properties" className="summary-action">View All</Link>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon reports-icon">📝</div>
          <div className="summary-content">
            <h3>Pending Reports</h3>
            <div className="summary-value">{data.summary.pendingReports}</div>
          </div>
          <Link to="/reports" className="summary-action">View All</Link>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon completed-icon">✓</div>
          <div className="summary-content">
            <h3>Completed Reports</h3>
            <div className="summary-value">{data.summary.completedReports}</div>
          </div>
          <Link to="/reports?status=completed" className="summary-action">View All</Link>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon submissions-icon">📊</div>
          <div className="summary-content">
            <h3>Recent Submissions</h3>
            <div className="summary-value">{data.summary.recentSubmissions}</div>
          </div>
          <Link to="/forms/submissions" className="summary-action">View All</Link>
        </div>
      </div>
      
      {/* Service Health Status */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Service Health</h2>
          <Link to="/settings/services" className="section-action">Manage Services</Link>
        </div>
        
        <div className="service-health-grid">
          {serviceStatus.map(service => (
            <div key={service.id} className={`service-card ${service.status}`}>
              <h3>{service.name}</h3>
              <div className={`status-indicator ${service.status}`}>
                <span className="status-circle"></span>
                <span className="status-text">
                  {service.status === 'healthy' ? 'Healthy' : 
                   service.status === 'warning' ? 'Warning' : 'Error'}
                </span>
              </div>
              <div className="service-details">
                <span>Endpoint: {service.endpoint || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Properties</h2>
          <Link to="/properties" className="section-action">View All Properties</Link>
        </div>
        
        <div className="recent-properties">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property ID</th>
                <th>Address</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recentProperties.map(property => (
                <tr key={property.id}>
                  <td>{property.id}</td>
                  <td>{property.address}</td>
                  <td>{property.type}</td>
                  <td>
                    <span className={`status-badge ${property.status.toLowerCase()}`}>
                      {property.status}
                    </span>
                  </td>
                  <td>{formatDate(property.lastUpdated)}</td>
                  <td className="actions-cell">
                    <Link to={`/properties/${property.id}`} className="btn btn-sm">
                      View
                    </Link>
                    <Link to={`/properties/${property.id}/edit`} className="btn btn-sm">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Reports Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Reports</h2>
          <Link to="/reports" className="section-action">View All Reports</Link>
        </div>
        
        <div className="recent-reports">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Title</th>
                <th>Property</th>
                <th>Status</th>
                <th>Completion Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recentReports.map(report => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.title}</td>
                  <td>{report.propertyId || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${report.status.toLowerCase().replace(' ', '-')}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{formatDate(report.completedDate)}</td>
                  <td className="actions-cell">
                    <Link to={`/reports/${report.id}`} className="btn btn-sm">
                      View
                    </Link>
                    {report.status !== 'Completed' && (
                      <Link to={`/reports/${report.id}/edit`} className="btn btn-sm">
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;