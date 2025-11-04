/**
 * TerraFusionPro Web Client - Dashboard Component
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [reports, setReports] = useState([]);
  const [marketUpdates, setMarketUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch properties
        const propertiesResponse = await fetch('/api/properties?limit=5', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
          }
        });
        
        // Fetch reports
        const reportsResponse = await fetch('/api/reports?limit=5', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
          }
        });
        
        // Fetch market updates
        const marketUpdatesResponse = await fetch('/api/market-updates?limit=3', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
          }
        });
        
        // Process responses
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json();
          setProperties(propertiesData.properties || []);
        }
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData.reports || []);
        }
        
        if (marketUpdatesResponse.ok) {
          const marketData = await marketUpdatesResponse.json();
          setMarketUpdates(marketData.updates || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Fallback data for development
        if (process.env.NODE_ENV !== 'production') {
          setProperties([
            { id: 1, address: '123 Main St', city: 'San Francisco', state: 'CA', property_type: 'Residential', created_at: '2025-04-10T10:30:00Z' },
            { id: 2, address: '456 Market St', city: 'San Francisco', state: 'CA', property_type: 'Commercial', created_at: '2025-04-08T14:15:00Z' },
            { id: 3, address: '789 Oak Ave', city: 'Oakland', state: 'CA', property_type: 'Residential', created_at: '2025-04-05T09:45:00Z' }
          ]);
          
          setReports([
            { id: 1, report_number: 'RA-2025-001', status: 'draft', title: 'Residential Appraisal - 123 Main St', created_at: '2025-04-15T11:20:00Z' },
            { id: 2, report_number: 'CA-2025-001', status: 'in_review', title: 'Commercial Appraisal - 456 Market St', created_at: '2025-04-12T16:30:00Z' },
            { id: 3, report_number: 'RA-2025-002', status: 'approved', title: 'Residential Appraisal - 789 Oak Ave', created_at: '2025-04-08T13:45:00Z' }
          ]);
          
          setMarketUpdates([
            { id: 1, title: 'Bay Area Market Update - Q2 2025', summary: 'Housing prices increased by 3.2% in the San Francisco Bay Area during Q2 2025.', date: '2025-04-20T08:00:00Z' },
            { id: 2, title: 'Commercial Real Estate Trends', summary: 'Office space vacancy rates continue to decline as companies return to in-person work.', date: '2025-04-15T09:30:00Z' }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge class based on report status
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'draft': 'status-draft',
      'in_review': 'status-review',
      'pending': 'status-pending',
      'approved': 'status-approved',
      'finalized': 'status-finalized',
      'archived': 'status-archived'
    };
    
    return `status-badge ${statusMap[status] || 'status-draft'}`;
  };
  
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="dashboard-welcome">
            <h2>Welcome, {currentUser?.first_name || 'User'}!</h2>
            <p>Here's an overview of your recent activity and important updates.</p>
          </div>
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-value">{properties.length}</div>
              <div className="stat-label">Recent Properties</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{reports.length}</div>
              <div className="stat-label">Active Reports</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">4</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{marketUpdates.length}</div>
              <div className="stat-label">Market Updates</div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <h2>Recent Properties</h2>
                <Link to="/properties" className="btn btn-text">View All</Link>
              </div>
              
              {properties.length > 0 ? (
                <ul className="list-items">
                  {properties.map(property => (
                    <li key={property.id} className="list-item">
                      <div className="list-item-main">
                        <h3>
                          <Link to={`/properties/${property.id}`}>
                            {property.address}
                          </Link>
                        </h3>
                        <div className="list-item-details">
                          <span>{property.city}, {property.state}</span>
                          <span className="list-item-category">{property.property_type}</span>
                        </div>
                      </div>
                      <div className="list-item-date">
                        {formatDate(property.created_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No properties available.</p>
              )}
              
              <div className="card-footer">
                <Link to="/properties/new" className="btn btn-primary">Add New Property</Link>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h2>Active Reports</h2>
                <Link to="/reports" className="btn btn-text">View All</Link>
              </div>
              
              {reports.length > 0 ? (
                <ul className="list-items">
                  {reports.map(report => (
                    <li key={report.id} className="list-item">
                      <div className="list-item-main">
                        <h3>
                          <Link to={`/reports/${report.id}`}>
                            {report.title}
                          </Link>
                        </h3>
                        <div className="list-item-details">
                          <span>{report.report_number}</span>
                          <span className={getStatusBadgeClass(report.status)}>
                            {report.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="list-item-date">
                        {formatDate(report.created_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No reports available.</p>
              )}
              
              <div className="card-footer">
                <Link to="/reports/new" className="btn btn-primary">Create New Report</Link>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h2>Market Updates</h2>
                <Link to="/market-analysis" className="btn btn-text">View All</Link>
              </div>
              
              {marketUpdates.length > 0 ? (
                <ul className="list-items">
                  {marketUpdates.map(update => (
                    <li key={update.id} className="list-item">
                      <div className="list-item-main">
                        <h3>
                          <Link to={`/market-analysis/${update.id}`}>
                            {update.title}
                          </Link>
                        </h3>
                        <p className="list-item-summary">{update.summary}</p>
                      </div>
                      <div className="list-item-date">
                        {formatDate(update.date)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No market updates available.</p>
              )}
            </div>
            
            <div className="card">
              <div className="card-header">
                <h2>Quick Actions</h2>
              </div>
              
              <div className="quick-actions">
                <Link to="/properties/new" className="quick-action-btn">
                  <span className="icon">🏢</span>
                  <span>Add Property</span>
                </Link>
                
                <Link to="/reports/new" className="quick-action-btn">
                  <span className="icon">📄</span>
                  <span>Create Report</span>
                </Link>
                
                <Link to="/data-collection" className="quick-action-btn">
                  <span className="icon">📱</span>
                  <span>Field Collection</span>
                </Link>
                
                <Link to="/market-analysis/new" className="quick-action-btn">
                  <span className="icon">📊</span>
                  <span>Analyze Market</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;