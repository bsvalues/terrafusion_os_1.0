import React from 'react';
import PropertyCard from './PropertyCard';

/**
 * PropertyList Component
 * Displays a list of properties in a grid layout
 * 
 * @param {Array} properties - Array of property objects to display
 * @param {Function} onPropertyClick - Function to call when a property is clicked
 * @param {Boolean} loading - Whether properties are being loaded
 * @param {Boolean} error - Whether there was an error loading properties
 */
const PropertyList = ({ properties, onPropertyClick, loading, error }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">
          There was a problem loading properties. Please try again later.
        </p>
      </div>
    );
  }
  
  if (!properties || properties.length === 0) {
    return (
      <div className="empty-state">
        <h3>No properties found</h3>
        <p>Try adjusting your search criteria or add new properties to your inventory.</p>
      </div>
    );
  }
  
  return (
    <div className="property-list">
      {properties.map((property) => (
        <PropertyCard 
          key={property.id} 
          property={property} 
          onClick={onPropertyClick} 
        />
      ))}
    </div>
  );
};

export default PropertyList;