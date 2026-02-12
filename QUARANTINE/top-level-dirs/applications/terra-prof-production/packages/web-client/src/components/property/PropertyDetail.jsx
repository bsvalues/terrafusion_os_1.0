import React from 'react';

/**
 * PropertyDetail Component
 * Displays detailed information about a property
 * 
 * @param {Object} property - The property data to display
 * @param {Function} onBack - Function to call when back button is clicked
 * @param {Function} onEdit - Function to call when edit button is clicked
 */
const PropertyDetail = ({ property, onBack, onEdit }) => {
  if (!property) {
    return (
      <div className="property-detail-placeholder">
        <button className="btn btn-back" onClick={onBack}>
          &larr; Back to Properties
        </button>
        <div className="message">Select a property to view details</div>
      </div>
    );
  }
  
  // Format price display
  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Format full address
  const formatFullAddress = (property) => {
    const { address, city, state, zipCode, country } = property;
    const parts = [address];
    if (city || state) {
      parts.push([city, state].filter(Boolean).join(', '));
    }
    if (zipCode) {
      parts.push(zipCode);
    }
    if (country) {
      parts.push(country);
    }
    return parts.filter(Boolean).join(', ');
  };
  
  return (
    <div className="property-detail">
      <div className="property-detail-header">
        <button className="btn btn-back" onClick={onBack}>
          &larr; Back to Properties
        </button>
        
        <div className="property-detail-actions">
          <button className="btn btn-primary" onClick={() => onEdit && onEdit(property)}>
            Edit Property
          </button>
        </div>
      </div>
      
      <div className="property-detail-main">
        <div className="property-detail-gallery">
          {property.imageUrl ? (
            <img 
              src={property.imageUrl} 
              alt={property.address} 
              className="property-detail-image"
            />
          ) : (
            <div className="property-detail-image-placeholder">
              No Image Available
            </div>
          )}
          
          {/* Thumbnail gallery would go here */}
        </div>
        
        <div className="property-detail-info">
          <h1 className="property-detail-title">{property.address}</h1>
          <p className="property-detail-location">{formatFullAddress(property)}</p>
          
          <div className="property-detail-price">
            {formatPrice(property.price)}
            {property.pricePerSqFt && (
              <span className="price-per-sqft">
                (${property.pricePerSqFt.toLocaleString()} / sq ft)
              </span>
            )}
          </div>
          
          <div className="property-detail-status">
            Status: <span className={`status-${property.status?.toLowerCase()}`}>{property.status}</span>
          </div>
          
          <div className="property-detail-features">
            <div className="feature-row">
              {property.bedrooms && (
                <div className="feature-item">
                  <span className="feature-icon">🛏️</span>
                  <span className="feature-label">Bedrooms</span>
                  <span className="feature-value">{property.bedrooms}</span>
                </div>
              )}
              
              {property.bathrooms && (
                <div className="feature-item">
                  <span className="feature-icon">🚿</span>
                  <span className="feature-label">Bathrooms</span>
                  <span className="feature-value">{property.bathrooms}</span>
                </div>
              )}
            </div>
            
            <div className="feature-row">
              {property.squareFootage && (
                <div className="feature-item">
                  <span className="feature-icon">📏</span>
                  <span className="feature-label">Square Feet</span>
                  <span className="feature-value">{property.squareFootage.toLocaleString()}</span>
                </div>
              )}
              
              {property.lotSize && (
                <div className="feature-item">
                  <span className="feature-icon">🏞️</span>
                  <span className="feature-label">Lot Size</span>
                  <span className="feature-value">{property.lotSize.toLocaleString()} acres</span>
                </div>
              )}
            </div>
            
            <div className="feature-row">
              {property.yearBuilt && (
                <div className="feature-item">
                  <span className="feature-icon">🏗️</span>
                  <span className="feature-label">Year Built</span>
                  <span className="feature-value">{property.yearBuilt}</span>
                </div>
              )}
              
              {property.propertyType && (
                <div className="feature-item">
                  <span className="feature-icon">🏠</span>
                  <span className="feature-label">Property Type</span>
                  <span className="feature-value">{property.propertyType}</span>
                </div>
              )}
            </div>
          </div>
          
          {property.description && (
            <div className="property-detail-description">
              <h3>Description</h3>
              <p>{property.description}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="property-detail-sections">
        {/* Property Details Section */}
        <section className="property-section">
          <h3>Property Details</h3>
          <div className="property-attributes">
            <div className="attribute">
              <span className="attribute-label">MLS Number</span>
              <span className="attribute-value">{property.mlsNumber || 'N/A'}</span>
            </div>
            
            <div className="attribute">
              <span className="attribute-label">Property Tax</span>
              <span className="attribute-value">
                {property.propertyTax ? formatPrice(property.propertyTax) + '/year' : 'N/A'}
              </span>
            </div>
            
            <div className="attribute">
              <span className="attribute-label">Zoning</span>
              <span className="attribute-value">{property.zoning || 'N/A'}</span>
            </div>
            
            {property.constructionMaterials && (
              <div className="attribute">
                <span className="attribute-label">Construction</span>
                <span className="attribute-value">{property.constructionMaterials}</span>
              </div>
            )}
            
            {property.parking && (
              <div className="attribute">
                <span className="attribute-label">Parking</span>
                <span className="attribute-value">{property.parking}</span>
              </div>
            )}
            
            {property.heating && (
              <div className="attribute">
                <span className="attribute-label">Heating</span>
                <span className="attribute-value">{property.heating}</span>
              </div>
            )}
            
            {property.cooling && (
              <div className="attribute">
                <span className="attribute-label">Cooling</span>
                <span className="attribute-value">{property.cooling}</span>
              </div>
            )}
          </div>
        </section>
        
        {/* Location Information */}
        {property.location && (
          <section className="property-section">
            <h3>Location Information</h3>
            <div className="property-attributes">
              {property.location.schoolDistrict && (
                <div className="attribute">
                  <span className="attribute-label">School District</span>
                  <span className="attribute-value">{property.location.schoolDistrict}</span>
                </div>
              )}
              
              {property.location.floodZone && (
                <div className="attribute">
                  <span className="attribute-label">Flood Zone</span>
                  <span className="attribute-value">{property.location.floodZone}</span>
                </div>
              )}
              
              {property.location.nearbyAmenities && (
                <div className="attribute wide">
                  <span className="attribute-label">Nearby Amenities</span>
                  <span className="attribute-value">{property.location.nearbyAmenities}</span>
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* Listed By */}
        {property.listedBy && (
          <section className="property-section">
            <h3>Listed By</h3>
            <div className="property-attributes">
              <div className="attribute">
                <span className="attribute-label">Agent</span>
                <span className="attribute-value">
                  {property.listedBy.agentName || 'N/A'}
                </span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Company</span>
                <span className="attribute-value">
                  {property.listedBy.company || 'N/A'}
                </span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Contact</span>
                <span className="attribute-value">
                  {property.listedBy.phone || 'N/A'}
                </span>
              </div>
              
              <div className="attribute">
                <span className="attribute-label">Date Listed</span>
                <span className="attribute-value">
                  {property.listedDate ? formatDate(property.listedDate) : 'N/A'}
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;