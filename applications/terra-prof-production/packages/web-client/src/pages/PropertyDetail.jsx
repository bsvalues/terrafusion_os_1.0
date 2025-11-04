import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import WorkflowProgress from '../components/layout/WorkflowProgress';
import useWorkflow from '../hooks/useWorkflow';

// Placeholder property data
const MOCK_PROPERTY = {
  id: 'prop-1001',
  address: '123 Main Street',
  city: 'Metropolis',
  state: 'NY',
  zipCode: '10001',
  propertyType: 'Residential',
  status: 'Active',
  lastUpdated: '2023-04-15T14:30:00Z',
  details: {
    size: 2500,
    yearBuilt: 1985,
    bedrooms: 4,
    bathrooms: 2.5,
    lotSize: 0.25,
    amenities: ['Garage', 'Fireplace', 'Deck', 'Central Air'],
    description: 'Spacious single-family home in a quiet neighborhood. Recently renovated kitchen and bathrooms. Large backyard with mature trees.',
    zoning: 'R1',
    floodZone: 'X'
  },
  valuation: {
    estimatedValue: 450000,
    lastAppraisalDate: '2023-03-10T00:00:00Z',
    comparables: [
      { id: 'prop-958', address: '456 Main Street', salePrice: 425000, saleDate: '2023-01-15T00:00:00Z' },
      { id: 'prop-1042', address: '789 Oak Avenue', salePrice: 475000, saleDate: '2023-02-22T00:00:00Z' },
      { id: 'prop-876', address: '321 Pine Lane', salePrice: 460000, saleDate: '2023-03-05T00:00:00Z' }
    ]
  },
  documents: [
    { id: 'doc-001', name: 'Property Deed', type: 'PDF', uploadDate: '2023-01-05T00:00:00Z' },
    { id: 'doc-002', name: 'Floor Plan', type: 'PDF', uploadDate: '2023-01-05T00:00:00Z' },
    { id: 'doc-003', name: 'Property Photos', type: 'ZIP', uploadDate: '2023-02-12T00:00:00Z' },
    { id: 'doc-004', name: 'Inspection Report', type: 'PDF', uploadDate: '2023-03-20T00:00:00Z' }
  ],
  location: {
    latitude: 40.7128,
    longitude: -74.0060
  }
};

// Workflow steps for property appraisal
const APPRAISAL_WORKFLOW_STEPS = [
  { id: 'step-1', label: 'Property Details', description: 'Verify property information' },
  { id: 'step-2', label: 'Inspection', description: 'Schedule and complete inspection' },
  { id: 'step-3', label: 'Comparables', description: 'Select comparable properties' },
  { id: 'step-4', label: 'Valuation', description: 'Calculate property value' },
  { id: 'step-5', label: 'Report', description: 'Generate final report' }
];

/**
 * PropertyDetail Component
 * Displays detailed information about a specific property
 */
const PropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const navigate = useNavigate();
  
  // Initialize appraisal workflow
  const appraisalWorkflow = useWorkflow('property-appraisal', APPRAISAL_WORKFLOW_STEPS);
  
  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, fetch from API
        // For now, use mock data
        if (id) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          setProperty(MOCK_PROPERTY);
        } else {
          throw new Error('Property ID is required');
        }
      } catch (err) {
        console.error('Error fetching property details:', err);
        setError('Failed to load property details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperty();
  }, [id]);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="property-detail loading-state">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !property) {
    return (
      <div className="property-detail error-state">
        <div className="alert alert-danger">
          <h3>Error Loading Property</h3>
          <p>{error || 'Property not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/properties')}>
            Back to Properties
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="property-detail-page">
      <div className="page-header">
        <div className="header-content">
          <h1>{property.address}</h1>
          <div className="property-location">
            {property.city}, {property.state} {property.zipCode}
          </div>
          
          <div className="property-badges">
            <span className={`status-badge ${property.status.toLowerCase()}`}>
              {property.status}
            </span>
            <span className="type-badge">
              {property.propertyType}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to={`/properties/${property.id}/edit`} className="btn btn-primary">
            Edit Property
          </Link>
          <div className="dropdown">
            <button className="btn btn-outline dropdown-toggle">
              Actions
            </button>
            <div className="dropdown-menu">
              <Link to={`/reports/new?propertyId=${property.id}`} className="dropdown-item">
                New Appraisal
              </Link>
              <Link to={`/properties/${property.id}/photos`} className="dropdown-item">
                Manage Photos
              </Link>
              <Link to={`/properties/${property.id}/documents`} className="dropdown-item">
                Manage Documents
              </Link>
              <button className="dropdown-item text-danger">
                Archive Property
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Appraisal Workflow Progress */}
      <div className="appraisal-workflow-section">
        <h2>Current Appraisal Progress</h2>
        <WorkflowProgress 
          steps={APPRAISAL_WORKFLOW_STEPS}
          currentStep={appraisalWorkflow.currentStep}
          completedSteps={appraisalWorkflow.completedSteps}
          onStepClick={appraisalWorkflow.goToStep}
        />
        
        <div className="workflow-actions">
          <button 
            className="btn btn-primary"
            onClick={appraisalWorkflow.nextStep}
            disabled={appraisalWorkflow.currentStep === APPRAISAL_WORKFLOW_STEPS.length - 1}
          >
            Next Step
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={appraisalWorkflow.resetWorkflow}
          >
            Reset Workflow
          </button>
        </div>
      </div>
      
      {/* Property Tabs */}
      <div className="property-tabs">
        <nav className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'valuation' ? 'active' : ''}`}
            onClick={() => setActiveTab('valuation')}
          >
            Valuation
          </button>
          <button 
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </nav>
        
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <div className="property-summary">
                <div className="summary-section">
                  <h3>Property Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="label">Property Type</span>
                      <span className="value">{property.propertyType}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Year Built</span>
                      <span className="value">{property.details.yearBuilt}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Size</span>
                      <span className="value">{property.details.size} sq ft</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Lot Size</span>
                      <span className="value">{property.details.lotSize} acres</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Bedrooms</span>
                      <span className="value">{property.details.bedrooms}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Bathrooms</span>
                      <span className="value">{property.details.bathrooms}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Zoning</span>
                      <span className="value">{property.details.zoning}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Flood Zone</span>
                      <span className="value">{property.details.floodZone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="valuation-summary">
                  <h3>Valuation Summary</h3>
                  <div className="estimated-value">
                    <span className="label">Estimated Value</span>
                    <span className="value">{formatCurrency(property.valuation.estimatedValue)}</span>
                  </div>
                  <div className="last-appraisal">
                    <span className="label">Last Appraisal</span>
                    <span className="value">{formatDate(property.valuation.lastAppraisalDate)}</span>
                  </div>
                </div>
              </div>
              
              <div className="property-description">
                <h3>Description</h3>
                <p>{property.details.description}</p>
              </div>
              
              <div className="amenities-section">
                <h3>Amenities</h3>
                <ul className="amenities-list">
                  {property.details.amenities.map((amenity /* , index */) => (
                    <li key={index} className="amenity-item">
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Other tab content would go here */}
          {activeTab !== 'overview' && (
            <div className="tab-pane">
              <p className="placeholder-text">
                Additional {activeTab} information will be displayed here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;