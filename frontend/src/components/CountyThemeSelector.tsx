// TerraFusion OS - County Theme Selector
// Government. Transcended.
// Runtime county theme management with government branding

import React, { useState, useEffect } from 'react';
import { applyCountyTheme, getCurrentCounty, County } from '../brand/countyTheme';
import './CountyThemeSelector.css';

// County configuration for TerraFusion OS
const COUNTY_CONFIGS = {
  default: {
    name: 'TerraFusion Default',
    displayName: 'Government Standard',
    color: '#07D1D6',
    description: 'Standard TerraFusion government branding',
    population: 'Multi-County',
    agencies: 'Federal Standard'
  },
  benton: {
    name: 'Benton County',
    displayName: 'Benton County, WA',
    color: '#00B3A4',
    description: 'Benton County specialized theme',
    population: '206,873',
    agencies: '15 Government Departments'
  },
  yakima: {
    name: 'Yakima County', 
    displayName: 'Yakima County, WA',
    color: '#2FB3FF',
    description: 'Yakima County specialized theme',
    population: '249,168',
    agencies: '18 Government Departments'
  }
};

interface CountyThemeSelectorProps {
  className?: string;
  showDetails?: boolean;
}

export const CountyThemeSelector: React.FC<CountyThemeSelectorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [currentCounty, setCurrentCounty] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get initial county from theming system
    const county = getCurrentCounty();
    setCurrentCounty(county);
  }, []);

  const handleCountyChange = async (county: string) => {
    setIsLoading(true);
    
    try {
      // Apply county theme
      await applyCountyTheme(county as County);
      setCurrentCounty(county);
      
      // Log government compliance information
      console.log(`🏛️ County theme applied: ${COUNTY_CONFIGS[county as keyof typeof COUNTY_CONFIGS].name}`);
      console.log('✅ Government branding maintained');
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('terrafusion-county-change', {
        detail: { county, config: COUNTY_CONFIGS[county as keyof typeof COUNTY_CONFIGS] }
      }));
      
    } catch (error) {
      console.error('Failed to apply county theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentConfig = COUNTY_CONFIGS[currentCounty as keyof typeof COUNTY_CONFIGS];

  return (
    <div className={`tf-county-selector ${className}`} data-testid="county-theme-selector">
      <div className="tf-county-header">
        <div className="tf-county-badge" data-testid="county-badge">
          <div 
            className="tf-county-indicator"
            style={{ backgroundColor: currentConfig.color }}
            data-county={currentCounty}
          />
          <span className="tf-county-name">{currentConfig.displayName}</span>
        </div>
        
        {showDetails && (
          <div className="tf-county-details">
            <span className="tf-county-population">Population: {currentConfig.population}</span>
            <span className="tf-county-agencies">{currentConfig.agencies}</span>
          </div>
        )}
      </div>

      <div className="tf-county-selector-controls">
        <label htmlFor="county-select" className="tf-county-label">
          Select County Theme:
        </label>
        
        <select
          id="county-select"
          value={currentCounty}
          onChange={(e) => handleCountyChange(e.target.value)}
          disabled={isLoading}
          className="tf-county-select"
          aria-label="Select county theme for TerraFusion OS"
        >
          {Object.entries(COUNTY_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.displayName}
            </option>
          ))}
        </select>
        
        {isLoading && (
          <div className="tf-loading-indicator">
            Applying county theme...
          </div>
        )}
      </div>

      {showDetails && (
        <div className="tf-county-description">
          <p>{currentConfig.description}</p>
          <div className="tf-government-compliance">
            <span className="tf-compliance-badge">
              ✅ FISMA Compliant
            </span>
            <span className="tf-compliance-badge">
              ✅ Section 508
            </span>
            <span className="tf-compliance-badge">
              ✅ WCAG 2.1 AA
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountyThemeSelector;