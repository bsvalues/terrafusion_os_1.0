import React, { useState } from 'react';

/**
 * PropertyFilter Component
 * Provides UI for filtering the property list
 * 
 * @param {Object} filters - Current filter values
 * @param {Function} onFilterChange - Function to call when filters change
 * @param {Array} propertyTypes - Available property types for dropdown
 */
const PropertyFilter = ({ filters, onFilterChange, propertyTypes = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Use the checked value for checkboxes
    const newValue = type === 'checkbox' ? checked : value;
    
    setLocalFilters({
      ...localFilters,
      [name]: newValue
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange(localFilters);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    const emptyFilters = {
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      minBathrooms: '',
      propertyType: '',
      minSquareFeet: '',
      maxSquareFeet: '',
      minYearBuilt: '',
      status: ''
    };
    
    setLocalFilters(emptyFilters);
    
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
  };
  
  return (
    <div className={`property-filter ${expanded ? 'expanded' : ''}`}>
      <div className="filter-header" onClick={() => setExpanded(!expanded)}>
        <h3>Filter Properties</h3>
        <span className="toggle-icon">{expanded ? '▼' : '►'}</span>
      </div>
      
      {expanded && (
        <div className="filter-body">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minPrice">Min Price</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={localFilters.minPrice || ''}
                onChange={handleChange}
                placeholder="Min $"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="maxPrice">Max Price</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={localFilters.maxPrice || ''}
                onChange={handleChange}
                placeholder="Max $"
              />
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minBedrooms">Bedrooms</label>
              <select
                id="minBedrooms"
                name="minBedrooms"
                value={localFilters.minBedrooms || ''}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="minBathrooms">Bathrooms</label>
              <select
                id="minBathrooms"
                name="minBathrooms"
                value={localFilters.minBathrooms || ''}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="1.5">1.5+</option>
                <option value="2">2+</option>
                <option value="2.5">2.5+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="propertyType">Property Type</label>
              <select
                id="propertyType"
                name="propertyType"
                value={localFilters.propertyType || ''}
                onChange={handleChange}
              >
                <option value="">Any</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={localFilters.status || ''}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Sold">Sold</option>
                <option value="Off Market">Off Market</option>
              </select>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minSquareFeet">Min Square Feet</label>
              <input
                type="number"
                id="minSquareFeet"
                name="minSquareFeet"
                value={localFilters.minSquareFeet || ''}
                onChange={handleChange}
                placeholder="Min sq ft"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="maxSquareFeet">Max Square Feet</label>
              <input
                type="number"
                id="maxSquareFeet"
                name="maxSquareFeet"
                value={localFilters.maxSquareFeet || ''}
                onChange={handleChange}
                placeholder="Max sq ft"
              />
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minYearBuilt">Year Built (since)</label>
              <input
                type="number"
                id="minYearBuilt"
                name="minYearBuilt"
                value={localFilters.minYearBuilt || ''}
                onChange={handleChange}
                placeholder="Min year"
              />
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="btn btn-secondary" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyFilter;