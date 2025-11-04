/**
 * TerraFusionPro Web Client - Report Detail Component
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ReportDetail = () => {
  const [report, setReport] = useState(null);
  const [property, setProperty] = useState(null);
  const [comparables, setComparables] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // Check if user can edit/approve the report
  const canEdit = hasRole(['admin', 'appraiser']);
  const canApprove = hasRole(['admin', 'reviewer']);
  
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch report details
        const reportResponse = await fetch(`/api/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
          }
        });
        
        // Process response
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          setReport(reportData);
          
          // If report has property_id, fetch the property details
          if (reportData.property_id) {
            const propertyResponse = await fetch(`/api/properties/${reportData.property_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
              }
            });
            
            if (propertyResponse.ok) {
              const propertyData = await propertyResponse.json();
              setProperty(propertyData);
            }
          }
          
          // Fetch comparables if report has them
          if (reportData.id) {
            const comparablesResponse = await fetch(`/api/reports/${reportData.id}/comparables`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
              }
            });
            
            if (comparablesResponse.ok) {
              const comparablesData = await comparablesResponse.json();
              setComparables(comparablesData.comparables || []);
            }
          }
        } else {
          throw new Error('Failed to fetch report details');
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again later.');
        
        // Fallback data for development
        if (process.env.NODE_ENV !== 'production') {
          setReport({
            id: parseInt(id, 10),
            report_number: 'RA-2025-001',
            title: 'Residential Appraisal - 123 Main St',
            client_name: 'ABC Mortgage Company',
            client_reference: 'LOAN-12345',
            status: 'in_review',
            report_type: 'Residential Appraisal',
            approach: 'Sales Comparison',
            effective_date: '2025-04-10T00:00:00Z',
            valuation: 850000,
            valuation_currency: 'USD',
            property_id: 1,
            appraiser_id: 1,
            reviewer_id: 2,
            description: 'Standard residential appraisal report for refinance purposes. Subject property is a single-family home in good condition.',
            created_at: '2025-04-05T14:30:00Z',
            updated_at: '2025-04-15T09:45:00Z',
            appraiser: {
              id: 1,
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane.smith@terrafusionpro.com',
              license_number: 'APP-12345'
            },
            reviewer: {
              id: 2,
              first_name: 'Michael',
              last_name: 'Johnson',
              email: 'michael.johnson@terrafusionpro.com',
              license_number: 'REV-67890'
            },
            statuses: [
              { status: 'draft', date: '2025-04-05T14:30:00Z', user_id: 1 },
              { status: 'in_review', date: '2025-04-12T16:15:00Z', user_id: 1 }
            ]
          });
          
          setProperty({
            id: 1,
            address: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94105',
            property_type: 'Residential',
            property_subtype: 'Single Family',
            year_built: 1985,
            square_feet: 2450,
            lot_size: 5000,
            bedrooms: 4,
            bathrooms: 3
          });
          
          setComparables([
            {
              id: 1,
              property_id: 2,
              address: '456 Oak Street',
              city: 'San Francisco',
              state: 'CA',
              sale_price: 875000,
              sale_date: '2025-03-15T00:00:00Z',
              square_feet: 2350,
              bedrooms: 4,
              bathrooms: 2.5,
              year_built: 1980,
              distance: 0.5,
              adjustments: {
                location: -15000,
                size: 5000,
                age: -5000,
                quality: 0,
                amenities: 10000,
                total: -5000
              },
              adjusted_price: 870000
            },
            {
              id: 2,
              property_id: 3,
              address: '789 Pine Avenue',
              city: 'San Francisco',
              state: 'CA',
              sale_price: 925000,
              sale_date: '2025-02-28T00:00:00Z',
              square_feet: 2600,
              bedrooms: 4,
              bathrooms: 3.5,
              year_built: 1990,
              distance: 0.8,
              adjustments: {
                location: 0,
                size: -15000,
                age: 10000,
                quality: -10000,
                amenities: -5000,
                total: -20000
              },
              adjusted_price: 905000
            },
            {
              id: 3,
              property_id: 4,
              address: '321 Maple Drive',
              city: 'San Francisco',
              state: 'CA',
              sale_price: 810000,
              sale_date: '2025-03-05T00:00:00Z',
              square_feet: 2300,
              bedrooms: 3,
              bathrooms: 3,
              year_built: 1982,
              distance: 0.4,
              adjustments: {
                location: 0,
                size: 7500,
                age: 0,
                quality: 5000,
                amenities: 15000,
                total: 27500
              },
              adjusted_price: 837500
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [id]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
  
  const handleEditReport = () => {
    navigate(`/reports/${id}/edit`);
  };
  
  const handleStatusChange = (newStatus) => {
    // In a real app, this would call an API to update the status
    console.log(`Changing report status to: ${newStatus}`);
    // For now just update the UI
    setReport(prevReport => ({
      ...prevReport,
      status: newStatus,
      statuses: [
        ...prevReport.statuses,
        { status: newStatus, date: new Date().toISOString(), user_id: 1 } // Use actual user ID in real app
      ]
    }));
  };
  
  const handleGeneratePDF = () => {
    // In a real app, this would call an API to generate a PDF
    console.log('Generating PDF report...');
    alert('PDF report generation started. The report will be available for download shortly.');
  };
  
  if (loading) {
    return <div className="spinner"></div>;
  }
  
  if (error || !report) {
    return (
      <div className="error-container">
        <h1>Report Not Found</h1>
        <p className="error-message">{error || 'The requested report could not be found.'}</p>
        <Link to="/reports" className="btn btn-primary">
          Back to Reports
        </Link>
      </div>
    );
  }
  
  return (
    <div className="report-detail-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1>{report.title}</h1>
          <div className="report-info">
            <span className="report-number">{report.report_number}</span>
            <span className={getStatusBadgeClass(report.status)}>
              {report.status?.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="page-header-actions">
          {report.status !== 'finalized' && canEdit && (
            <button 
              className="btn btn-primary"
              onClick={handleEditReport}
            >
              Edit Report
            </button>
          )}
          
          {report.status === 'in_review' && canApprove && (
            <button 
              className="btn btn-primary"
              onClick={() => handleStatusChange('approved')}
            >
              Approve Report
            </button>
          )}
          
          {report.status === 'approved' && canEdit && (
            <button 
              className="btn btn-primary"
              onClick={() => handleStatusChange('finalized')}
            >
              Finalize Report
            </button>
          )}
          
          <button 
            className="btn btn-secondary"
            onClick={handleGeneratePDF}
          >
            Generate PDF
          </button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'comparables' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparables')}
        >
          Comparables ({comparables.length})
        </button>
        <button 
          className={`tab ${activeTab === 'property' ? 'active' : ''}`}
          onClick={() => setActiveTab('property')}
        >
          Subject Property
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Report History
        </button>
      </div>
      
      {activeTab === 'overview' && (
        <div className="report-grid">
          <div className="report-main">
            <div className="card">
              <h2>Report Summary</h2>
              <div className="valuation-summary">
                <div className="valuation-amount">
                  {formatCurrency(report.valuation, report.valuation_currency)}
                </div>
                <div className="valuation-label">
                  Appraised Value
                </div>
                <div className="valuation-date">
                  Effective Date: {formatDate(report.effective_date)}
                </div>
              </div>
              
              <div className="report-description">
                <h3>Report Description</h3>
                <p>{report.description}</p>
              </div>
              
              <div className="report-info-grid">
                <div className="info-item">
                  <label>Report Type</label>
                  <div>{report.report_type}</div>
                </div>
                <div className="info-item">
                  <label>Approach</label>
                  <div>{report.approach}</div>
                </div>
                <div className="info-item">
                  <label>Client</label>
                  <div>{report.client_name}</div>
                </div>
                <div className="info-item">
                  <label>Client Reference</label>
                  <div>{report.client_reference}</div>
                </div>
                <div className="info-item">
                  <label>Effective Date</label>
                  <div>{formatDate(report.effective_date)}</div>
                </div>
                <div className="info-item">
                  <label>Created Date</label>
                  <div>{formatDate(report.created_at)}</div>
                </div>
              </div>
            </div>
            
            {property && (
              <div className="card">
                <h2>Subject Property Information</h2>
                <div className="report-info-grid">
                  <div className="info-item">
                    <label>Address</label>
                    <div>
                      <Link to={`/properties/${property.id}`}>
                        {property.address}
                      </Link>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <div>{property.city}, {property.state} {property.zip_code}</div>
                  </div>
                  <div className="info-item">
                    <label>Property Type</label>
                    <div>{property.property_type} - {property.property_subtype}</div>
                  </div>
                  <div className="info-item">
                    <label>Year Built</label>
                    <div>{property.year_built}</div>
                  </div>
                  <div className="info-item">
                    <label>Square Feet</label>
                    <div>{property.square_feet?.toLocaleString()}</div>
                  </div>
                  <div className="info-item">
                    <label>Bedrooms/Bathrooms</label>
                    <div>{property.bedrooms} / {property.bathrooms}</div>
                  </div>
                </div>
                <button 
                  className="btn btn-text"
                  onClick={() => setActiveTab('property')}
                >
                  View All Property Details
                </button>
              </div>
            )}
            
            <div className="card">
              <h2>Comparable Properties Summary</h2>
              {comparables.length > 0 ? (
                <>
                  <div className="comparables-summary">
                    <div className="comp-summary-item">
                      <label>Number of Comparables</label>
                      <div>{comparables.length}</div>
                    </div>
                    <div className="comp-summary-item">
                      <label>Average Sale Price</label>
                      <div>
                        {formatCurrency(
                          comparables.reduce((sum, comp) => sum + comp.sale_price, 0) / comparables.length
                        )}
                      </div>
                    </div>
                    <div className="comp-summary-item">
                      <label>Average Adjusted Price</label>
                      <div>
                        {formatCurrency(
                          comparables.reduce((sum, comp) => sum + comp.adjusted_price, 0) / comparables.length
                        )}
                      </div>
                    </div>
                    <div className="comp-summary-item">
                      <label>Price Range</label>
                      <div>
                        {formatCurrency(Math.min(...comparables.map(c => c.adjusted_price)))} - 
                        {formatCurrency(Math.max(...comparables.map(c => c.adjusted_price)))}
                      </div>
                    </div>
                  </div>
                  <button 
                    className="btn btn-text"
                    onClick={() => setActiveTab('comparables')}
                  >
                    View All Comparables
                  </button>
                </>
              ) : (
                <p className="empty-state">No comparable properties available for this report.</p>
              )}
            </div>
          </div>
          
          <div className="report-sidebar">
            <div className="card">
              <h2>Report Team</h2>
              {report.appraiser && (
                <div className="team-member">
                  <div className="team-member-role">Appraiser</div>
                  <div className="team-member-name">
                    {report.appraiser.first_name} {report.appraiser.last_name}
                  </div>
                  <div className="team-member-license">
                    License: {report.appraiser.license_number}
                  </div>
                </div>
              )}
              
              {report.reviewer && (
                <div className="team-member">
                  <div className="team-member-role">Reviewer</div>
                  <div className="team-member-name">
                    {report.reviewer.first_name} {report.reviewer.last_name}
                  </div>
                  <div className="team-member-license">
                    License: {report.reviewer.license_number}
                  </div>
                </div>
              )}
            </div>
            
            <div className="card">
              <h2>Status History</h2>
              <div className="status-timeline">
                {report.statuses?.map((statusChange /* , index */) => (
                  <div className="status-item" key={index}>
                    <div className={`status-badge ${getStatusBadgeClass(statusChange.status)}`}>
                      {statusChange.status?.replace('_', ' ')}
                    </div>
                    <div className="status-date">
                      {formatDate(statusChange.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card">
              <h2>Report Actions</h2>
              <div className="action-buttons">
                <button 
                  className="btn btn-block"
                  onClick={handleGeneratePDF}
                >
                  Generate PDF
                </button>
                
                <button className="btn btn-block">
                  Share Report
                </button>
                
                <button className="btn btn-block">
                  Export Data
                </button>
                
                {report.status !== 'archived' && (
                  <button 
                    className="btn btn-text btn-block"
                    onClick={() => handleStatusChange('archived')}
                  >
                    Archive Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'comparables' && (
        <div className="card">
          <h2>Comparable Properties</h2>
          
          {comparables.length > 0 ? (
            <div className="comparables-list">
              {comparables.map(comp => (
                <div className="comparable-item" key={comp.id}>
                  <div className="comparable-header">
                    <h3>{comp.address}</h3>
                    <div className="comparable-location">
                      {comp.city}, {comp.state}
                    </div>
                  </div>
                  
                  <div className="comparable-details">
                    <div className="comparable-info">
                      <div className="info-item">
                        <label>Sale Price</label>
                        <div>{formatCurrency(comp.sale_price)}</div>
                      </div>
                      <div className="info-item">
                        <label>Sale Date</label>
                        <div>{formatDate(comp.sale_date)}</div>
                      </div>
                      <div className="info-item">
                        <label>Distance</label>
                        <div>{comp.distance} miles</div>
                      </div>
                      <div className="info-item">
                        <label>Square Feet</label>
                        <div>{comp.square_feet.toLocaleString()}</div>
                      </div>
                      <div className="info-item">
                        <label>Bedrooms</label>
                        <div>{comp.bedrooms}</div>
                      </div>
                      <div className="info-item">
                        <label>Bathrooms</label>
                        <div>{comp.bathrooms}</div>
                      </div>
                      <div className="info-item">
                        <label>Year Built</label>
                        <div>{comp.year_built}</div>
                      </div>
                    </div>
                    
                    <div className="comparable-adjustments">
                      <h4>Adjustments</h4>
                      <div className="adjustments-list">
                        <div className="adjustment-item">
                          <span>Location</span>
                          <span>{formatCurrency(comp.adjustments.location)}</span>
                        </div>
                        <div className="adjustment-item">
                          <span>Size</span>
                          <span>{formatCurrency(comp.adjustments.size)}</span>
                        </div>
                        <div className="adjustment-item">
                          <span>Age</span>
                          <span>{formatCurrency(comp.adjustments.age)}</span>
                        </div>
                        <div className="adjustment-item">
                          <span>Quality</span>
                          <span>{formatCurrency(comp.adjustments.quality)}</span>
                        </div>
                        <div className="adjustment-item">
                          <span>Amenities</span>
                          <span>{formatCurrency(comp.adjustments.amenities)}</span>
                        </div>
                        <div className="adjustment-item total">
                          <span>Total Adjustments</span>
                          <span>{formatCurrency(comp.adjustments.total)}</span>
                        </div>
                      </div>
                      
                      <div className="adjusted-price">
                        <span>Adjusted Value</span>
                        <span>{formatCurrency(comp.adjusted_price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No comparable properties available for this report.</p>
          )}
        </div>
      )}
      
      {activeTab === 'property' && (
        <div className="card">
          <h2>Subject Property Details</h2>
          
          {property ? (
            <>
              <div className="subject-property-header">
                <h3>{property.address}</h3>
                <div className="subject-property-location">
                  {property.city}, {property.state} {property.zip_code}
                </div>
                <Link 
                  to={`/properties/${property.id}`} 
                  className="btn btn-text"
                >
                  View Full Property Record
                </Link>
              </div>
              
              <div className="subject-property-details">
                <div className="property-detail-info">
                  <div className="info-item">
                    <label>Property Type</label>
                    <div>{property.property_type}</div>
                  </div>
                  <div className="info-item">
                    <label>Property Subtype</label>
                    <div>{property.property_subtype}</div>
                  </div>
                  <div className="info-item">
                    <label>Year Built</label>
                    <div>{property.year_built}</div>
                  </div>
                  <div className="info-item">
                    <label>Square Feet</label>
                    <div>{property.square_feet?.toLocaleString()}</div>
                  </div>
                  <div className="info-item">
                    <label>Lot Size</label>
                    <div>{property.lot_size?.toLocaleString()} sq ft</div>
                  </div>
                  <div className="info-item">
                    <label>Bedrooms</label>
                    <div>{property.bedrooms}</div>
                  </div>
                  <div className="info-item">
                    <label>Bathrooms</label>
                    <div>{property.bathrooms}</div>
                  </div>
                  {/* Add more property details as needed */}
                </div>
              </div>
            </>
          ) : (
            <p className="empty-state">No property details available for this report.</p>
          )}
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="card">
          <h2>Report History</h2>
          
          <div className="report-timeline">
            <div className="timeline-item">
              <div className="timeline-date">
                {formatDate(report.created_at)}
              </div>
              <div className="timeline-content">
                <h4>Report Created</h4>
                <p>Initial report draft created by {report.appraiser?.first_name} {report.appraiser?.last_name}</p>
              </div>
            </div>
            
            {report.statuses && report.statuses.slice(1).map((statusChange /* , index */) => (
              <div className="timeline-item" key={index}>
                <div className="timeline-date">
                  {formatDate(statusChange.date)}
                </div>
                <div className="timeline-content">
                  <h4>Status Changed to {statusChange.status?.replace('_', ' ')}</h4>
                  <p>Report status was updated</p>
                </div>
              </div>
            ))}
            
            <div className="timeline-item">
              <div className="timeline-date">
                {formatDate(report.updated_at)}
              </div>
              <div className="timeline-content">
                <h4>Last Updated</h4>
                <p>Report was last modified</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;