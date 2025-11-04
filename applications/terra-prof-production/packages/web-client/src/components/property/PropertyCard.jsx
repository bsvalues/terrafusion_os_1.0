import React from 'react';

/**
 * PropertyCard Component
 * Displays a property in a card format with key details
 * 
 * @param {Object} property - The property data to display
 * @param {Function} onClick - Function to call when card is clicked
 */
const PropertyCard = ({ property, onClick }) => {
  if (!property) return null;
  
  // Format price display
  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Format address display
  const formatAddress = (property) => {
    const { address, city, state, zipCode } = property;
    const parts = [address];
    if (city || state) {
      parts.push([city, state].filter(Boolean).join(', '));
    }
    if (zipCode) {
      parts.push(zipCode);
    }
    return parts.filter(Boolean).join(' ');
  };
  
  return (
    <div className="property-card" onClick={() => onClick && onClick(property)}>
      <div 
        className="property-image" 
        style={{ 
          backgroundImage: property.imageUrl ? 
            `url(${property.imageUrl})` : 
            'url(/assets/images/property-placeholder.png)' 
        }}
      >
        {property.status && (
          <span className={`property-status property-status-${property.status.toLowerCase()}`}>
            {property.status}
          </span>
        )}
      </div>
      
      <div className="property-content">
        <div className="property-price">{formatPrice(property.price)}</div>
        <h3 className="property-address">{formatAddress(property)}</h3>
        
        <div className="property-features">
          {property.bedrooms && (
            <div className="property-feature">
              <span className="feature-icon">🛏️</span>
              <span className="feature-value">{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>
          )}
          
          {property.bathrooms && (
            <div className="property-feature">
              <span className="feature-icon">🚿</span>
              <span className="feature-value">{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>
          )}
          
          {property.squareFootage && (
            <div className="property-feature">
              <span className="feature-icon">📏</span>
              <span className="feature-value">{property.squareFootage.toLocaleString()} sq ft</span>
            </div>
          )}
        </div>
        
        <div className="property-meta">
          {property.propertyType && (
            <span className="property-type">{property.propertyType}</span>
          )}
          
          {property.yearBuilt && (
            <span className="property-year">Built {property.yearBuilt}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;