/**
 * TerraFusionPro Web Client - Property Detail Component
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PropertyDetail = () => {
  const [property, setProperty] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // Check if user can edit property
  const canEdit = hasRole(['admin', 'appraiser', 'manager']);
  
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        
        // Fetch property details
        const propertyResponse = await fetch(`/api/properties/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
          }
        });
        
        // Fetch reports related to this property
        const reportsResponse = await fetch(`/api/reports?property_id=${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
          }
        });
        
        // Process responses
        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          setProperty(propertyData);
        } else {
          throw new Error('Failed to fetch property details');
        }
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData.reports || []);
        }
      } catch (err) {
        console.error('Error fetching property data:', err);
        setError('Failed to load property data. Please try again later.');
        
        // Fallback data for development
        if (process.env.NODE_ENV !== 'production') {
          setProperty({
            id: parseInt(id, 10),
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
            bathrooms: 3,
            parking_spaces: 2,
            latitude: 37.7749,
            longitude: -122.4194,
            description: 'Beautiful single-family home in a desirable neighborhood. Updated kitchen, hardwood floors throughout, spacious backyard.',
            amenities: ['Central AC', 'Fireplace', 'Updated Kitchen', 'Hardwood Floors', 'Fenced Yard'],
            images: [
              { id: 1, url: 'https://placehold.co/600x400?text=Property+Image+1', description: 'Front view' },
              { id: 2, url: 'https://placehold.co/600x400?text=Property+Image+2', description: 'Kitchen' },
              { id: 3, url: 'https://placehold.co/600x400?text=Property+Image+3', description: 'Living room' }
            ],
            created_at: '2025-03-15T10:30:00Z',
            last_updated: '2025-04-10T14:15:00Z'
          });
          
          setReports([
            { 
              id: 1, 
              report_number: 'RA-2025-001', 
              title: 'Residential Appraisal - 123 Main St', 
              status: 'draft', 
              created_at: '2025-04-15T11:20:00Z' 
            },
            { 
              id: 2, 
              report_number: 'RA-2025-002', 
              title: 'Residential Appraisal Update - 123 Main St', 
              status: 'in_review', 
              created_at: '2025-04-18T16:30:00Z' 
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [id]);
  
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
  
  const handleEditProperty = () => {
    navigate(`/properties/${id}/edit`);
  };
  
  const handleCreateReport = () => {
    navigate('/reports/new', { state: { propertyId: id } });
  };
  
  if (loading) {
    return <div className="spinner"></div>;
  }
  
  if (error || !property) {
    return (
      <div className="error-container">
        <h1>Property Not Found</h1>
        <p className="error-message">{error || 'The requested property could not be found.'}</p>
        <Link to="/properties" className="btn btn-primary">
          Back to Properties
        </Link>
      </div>
    );
  }
  
  return (
    <div className="property-detail-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1>{property.address}</h1>
          <p className="property-location">
            {property.city}, {property.state} {property.zip_code}
          </p>
        </div>
        
        <div className="page-header-actions">
          {canEdit && (
            <button 
              className="btn btn-primary"
              onClick={handleEditProperty}
            >
              Edit Property
            </button>
          )}
          
          <button 
            className="btn btn-primary"
            onClick={handleCreateReport}
          >
            Create Report
          </button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Property Details
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({reports.length})
        </button>
        <button 
          className={`tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Images ({property.images?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          Location
        </button>
      </div>
      
      {activeTab === 'details' && (
        <div className="property-grid-2col">
          <div className="property-detail-main">
            <div className="card">
              <h2>Property Information</h2>
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
                <div className="info-item">
                  <label>Parking Spaces</label>
                  <div>{property.parking_spaces}</div>
                </div>
              </div>
              
              <h3>Description</h3>
              <p>{property.description}</p>
              
              {property.amenities && property.amenities.length > 0 && (
                <>
                  <h3>Amenities</h3>
                  <div className="amenities-list">
                    {property.amenities.map((amenity /* , index */) => (
                      <span className="amenity-tag" key={index}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="property-detail-sidebar">
            <div className="card">
              <h2>Property Timeline</h2>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-date">
                    {formatDate(property.created_at)}
                  </div>
                  <div className="timeline-content">
                    <h4>Property Added</h4>
                    <p>Property record was created in the system</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-date">
                    {formatDate(property.last_updated)}
                  </div>
                  <div className="timeline-content">
                    <h4>Last Updated</h4>
                    <p>Property information was last modified</p>
                  </div>
                </div>
                
                {reports.length > 0 && (
                  <div className="timeline-item">
                    <div className="timeline-date">
                      {formatDate(reports[0].created_at)}
                    </div>
                    <div className="timeline-content">
                      <h4>First Report Created</h4>
                      <p>{reports[0].report_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card">
              <h2>Recent Activity</h2>
              <p className="empty-state">No recent activity available.</p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'reports' && (
        <div className="property-reports">
          <div className="card">
            <div className="card-header">
              <h2>Reports for this Property</h2>
              <button 
                className="btn btn-primary"
                onClick={handleCreateReport}
              >
                Create New Report
              </button>
            </div>
            
            {reports.length > 0 ? (
              <div className="reports-list">
                {reports.map(report => (
                  <div className="report-item" key={report.id}>
                    <div className="report-item-main">
                      <h3>
                        <Link to={`/reports/${report.id}`}>
                          {report.title}
                        </Link>
                      </h3>
                      <div className="report-item-details">
                        <span className="report-number">{report.report_number}</span>
                        <span className={getStatusBadgeClass(report.status)}>
                          {report.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="report-item-date">
                      {formatDate(report.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No reports exist for this property yet.</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'images' && (
        <div className="property-images-container">
          <div className="card">
            <div className="card-header">
              <h2>Property Images</h2>
              {canEdit && (
                <button className="btn btn-primary">
                  Add Images
                </button>
              )}
            </div>
            
            {property.images && property.images.length > 0 ? (
              <div className="property-images">
                {property.images.map(image => (
                  <div className="property-image" key={image.id}>
                    <img src={image.url} alt={image.description || 'Property image'} />
                    <div className="image-description">{image.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No images available for this property.</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'location' && (
        <div className="property-location-container">
          <div className="card">
            <h2>Property Location</h2>
            
            <div className="property-map-placeholder">
              {/* In a real app, we'd use a map component like Google Maps or Mapbox */}
              <div className="map-container">
                <p className="map-placeholder">
                  Interactive map would display here with property location at
                  {property.latitude}, {property.longitude}
                </p>
              </div>
            </div>
            
            <div className="location-details">
              <div className="info-item">
                <label>Address</label>
                <div>{property.address}</div>
              </div>
              <div className="info-item">
                <label>City</label>
                <div>{property.city}</div>
              </div>
              <div className="info-item">
                <label>State</label>
                <div>{property.state}</div>
              </div>
              <div className="info-item">
                <label>Zip Code</label>
                <div>{property.zip_code}</div>
              </div>
              <div className="info-item">
                <label>Coordinates</label>
                <div>{property.latitude}, {property.longitude}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;