import React, { useState, useEffect } from 'react';
import PropertyList from '../../components/property/PropertyList';
import PropertyFilter from '../../components/property/PropertyFilter';
import PropertyDetail from '../../components/property/PropertyDetail';

/**
 * PropertiesPage Component
 * Main page for listing and interacting with properties
 */
const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyTypes, setPropertyTypes] = useState([
    'Single Family', 
    'Condo', 
    'Townhouse', 
    'Multi-Family',
    'Land',
    'Commercial'
  ]);
  
  // Fetch properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would be an API call
        // For now, we'll simulate a network request with a delay
        setTimeout(() => {
          // This is where we would normally call the API
          // For now, set an empty array - the real data will come from the API
          setProperties([]);
          setFilteredProperties([]);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    if (!properties.length) {
      setFilteredProperties([]);
      return;
    }
    
    // Apply filters to properties
    const filtered = properties.filter(property => {
      // Price filters
      if (newFilters.minPrice && property.price < parseFloat(newFilters.minPrice)) {
        return false;
      }
      if (newFilters.maxPrice && property.price > parseFloat(newFilters.maxPrice)) {
        return false;
      }
      
      // Bedroom filter
      if (newFilters.minBedrooms && property.bedrooms < parseFloat(newFilters.minBedrooms)) {
        return false;
      }
      
      // Bathroom filter
      if (newFilters.minBathrooms && property.bathrooms < parseFloat(newFilters.minBathrooms)) {
        return false;
      }
      
      // Property type filter
      if (newFilters.propertyType && property.propertyType !== newFilters.propertyType) {
        return false;
      }
      
      // Square feet filters
      if (newFilters.minSquareFeet && property.squareFootage < parseFloat(newFilters.minSquareFeet)) {
        return false;
      }
      if (newFilters.maxSquareFeet && property.squareFootage > parseFloat(newFilters.maxSquareFeet)) {
        return false;
      }
      
      // Year built filter
      if (newFilters.minYearBuilt && property.yearBuilt < parseFloat(newFilters.minYearBuilt)) {
        return false;
      }
      
      // Status filter
      if (newFilters.status && property.status !== newFilters.status) {
        return false;
      }
      
      return true;
    });
    
    setFilteredProperties(filtered);
  };
  
  // Handle property selection
  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
  };
  
  // Handle back button from detail view
  const handleBack = () => {
    setSelectedProperty(null);
  };
  
  // Handle property edit
  const handleEdit = (property) => {
    // Navigate to edit page or open edit modal
    console.log('Edit property:', property);
    // This would typically navigate to an edit page or open a modal
  };
  
  // If a property is selected, show its details
  if (selectedProperty) {
    return (
      <div className="properties-page">
        <PropertyDetail 
          property={selectedProperty} 
          onBack={handleBack}
          onEdit={handleEdit}
        />
      </div>
    );
  }
  
  return (
    <div className="properties-page">
      <div className="page-header">
        <h1>Properties</h1>
        <button className="btn btn-primary">
          Add New Property
        </button>
      </div>
      
      <div className="properties-container">
        <div className="properties-sidebar">
          <PropertyFilter 
            filters={filters}
            onFilterChange={handleFilterChange}
            propertyTypes={propertyTypes}
          />
        </div>
        
        <div className="properties-main">
          <div className="properties-count">
            {!loading && (
              <p>
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
              </p>
            )}
          </div>
          
          <PropertyList 
            properties={filteredProperties}
            onPropertyClick={handlePropertySelect}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;