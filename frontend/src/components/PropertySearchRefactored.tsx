/**
 * Refactored Property Search Component - Enterprise Architecture
 * 
 * Demonstrates the new Service Mesh + Trust Fabric + Circuit Breaker architecture
 * Replaces hardcoded API calls with secure, discoverable, resilient communication
 * 
 * @author TerraFusion Engineering Team
 * @version 2.0.0 - Enterprise Refactored
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSecureAPI, useServiceHealth } from '../contexts/InfrastructureContext';
import type { SecureResponse } from '../../infrastructure/SecureAPIClient';

interface Property {
  parcelId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
  sqft: number;
  yearBuilt: number;
  lastAssessed: string;
  owner: string;
  taxStatus: string;
  aiConfidence: number;
  coordinates: [number, number];
}

interface SearchCriteria {
  query?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  yearBuilt?: number;
  limit?: number;
}

interface PropertySearchStats {
  totalFound: number;
  searchTime: number;
  cacheHit: boolean;
  attestationVerified: boolean;
  serviceHealth: 'healthy' | 'degraded' | 'critical';
}

export const PropertySearchRefactored: React.FC = () => {
  const secureAPI = useSecureAPI();
  const serviceHealth = useServiceHealth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [stats, setStats] = useState<PropertySearchStats | null>(null);
  
  // No more hardcoded URLs! Service discovery handles everything
  const searchProperties = useCallback(async (criteria: SearchCriteria) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Executing secure property search...', criteria);
      
      // This call automatically:
      // 1. Discovers the property service via Service Mesh
      // 2. Creates cryptographic attestation via Trust Fabric  
      // 3. Handles retries and circuit breaking
      // 4. Verifies response attestations
      // 5. Caches results
      const response: SecureResponse<Property[]> = await secureAPI.post(
        'terrafusion-backend', // Service name (not URL!)
        '/api/properties/search',
        criteria,
        {
          timeout: 15000,
          retries: 2,
          attestRequired: true,
          priority: 'high'
        }
      );
      
      setProperties(response.data);
      
      // Update stats with enterprise metrics
      setStats({
        totalFound: response.data.length,
        searchTime: response.metadata.responseTime,
        cacheHit: response.metadata.fromCache,
        attestationVerified: response.metadata.attestationVerified,
        serviceHealth: serviceHealth?.overall || 'critical'
      });
      
      console.log('✅ Property search completed', {
        found: response.data.length,
        responseTime: response.metadata.responseTime,
        fromCache: response.metadata.fromCache,
        attestationVerified: response.metadata.attestationVerified
      });
      
    } catch (err: any) {
      console.error('❌ Property search failed:', err);
      
      // Handle different types of errors appropriately
      if (err.name === 'CircuitBreakerError') {
        setError(`Service temporarily unavailable (Circuit Breaker ${err.state}). Please try again later.`);
      } else if (err.name === 'AttestationError') {
        setError('Security attestation failed. Please refresh and try again.');
      } else {
        setError(err.message || 'Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [secureAPI, serviceHealth]);
  
  // Load recent properties on mount
  useEffect(() => {
    searchProperties({ limit: 10 });
  }, [searchProperties]);
  
  // Auto-refresh when service health changes
  useEffect(() => {
    if (serviceHealth?.overall === 'healthy' && error) {
      console.log('🔄 Service health restored, retrying last search...');
      searchProperties(searchCriteria);
    }
  }, [serviceHealth, error, searchCriteria, searchProperties]);
  
  const handleSearch = useCallback((criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    searchProperties(criteria);
  }, [searchProperties]);
  
  const getPropertyDetails = useCallback(async (parcelId: string) => {
    try {
      // Another secure API call - no hardcoded URLs!
      const response: SecureResponse<Property> = await secureAPI.get(
        'terrafusion-backend',
        `/api/properties/${parcelId}`,
        {
          timeout: 10000,
          priority: 'normal'
        }
      );
      
      console.log('📄 Property details loaded:', response.metadata);
      return response.data;
      
    } catch (err) {
      console.error('Failed to load property details:', err);
      throw err;
    }
  }, [secureAPI]);
  
  const updateAssessment = useCallback(async (parcelId: string, newValue: number) => {
    try {
      // Secure PUT request with attestation
      const response: SecureResponse<{ success: boolean }> = await secureAPI.put(
        'terrafusion-backend',
        `/api/properties/${parcelId}/assessment`,
        { assessedValue: newValue },
        {
          timeout: 20000,
          priority: 'high',
          attestRequired: true
        }
      );
      
      if (response.data.success) {
        // Refresh the property list
        await searchProperties(searchCriteria);
      }
      
      return response.data;
      
    } catch (err) {
      console.error('Failed to update assessment:', err);
      throw err;
    }
  }, [secureAPI, searchCriteria, searchProperties]);
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Service Health Indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Property Assessment System
          </h1>
          
          {/* Enterprise Health Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              serviceHealth?.overall === 'healthy' ? 'bg-green-500' :
              serviceHealth?.overall === 'degraded' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {serviceHealth?.overall || 'Unknown'} Service Health
            </span>
          </div>
        </div>
        
        {/* Enterprise Architecture Badge */}
        <div className="text-sm text-gray-500 mb-4">
          🔒 Secure • 🌐 Service Mesh • 🔐 Trust Fabric • 🔧 Circuit Breaker
        </div>
      </div>
      
      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">Property Search</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Address or Parcel ID"
            className="px-3 py-2 border rounded-lg"
            onChange={(e) => handleSearch({ ...searchCriteria, query: e.target.value })}
          />
          
          <select
            className="px-3 py-2 border rounded-lg"
            onChange={(e) => handleSearch({ ...searchCriteria, propertyType: e.target.value })}
          >
            <option value="">All Property Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
          
          <input
            type="number"
            placeholder="Min Value"
            className="px-3 py-2 border rounded-lg"
            onChange={(e) => handleSearch({ ...searchCriteria, minValue: parseInt(e.target.value) })}
          />
          
          <input
            type="number"
            placeholder="Max Value"
            className="px-3 py-2 border rounded-lg"
            onChange={(e) => handleSearch({ ...searchCriteria, maxValue: parseInt(e.target.value) })}
          />
        </div>
        
        {/* Enterprise Stats */}
        {stats && (
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-600">Found</div>
              <div className="text-lg font-bold">{stats.totalFound}</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Response Time</div>
              <div className="text-lg font-bold">{stats.searchTime}ms</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Cache</div>
              <div className={`text-lg font-bold ${stats.cacheHit ? 'text-green-600' : 'text-blue-600'}`}>
                {stats.cacheHit ? 'HIT' : 'MISS'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Attestation</div>
              <div className={`text-lg font-bold ${stats.attestationVerified ? 'text-green-600' : 'text-red-600'}`}>
                {stats.attestationVerified ? '✓' : '✗'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Service</div>
              <div className={`text-lg font-bold ${
                stats.serviceHealth === 'healthy' ? 'text-green-600' :
                stats.serviceHealth === 'degraded' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {stats.serviceHealth.toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-3">
                <button
                  onClick={() => searchProperties(searchCriteria)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            Property Results {loading && <span className="text-blue-500">(Loading...)</span>}
          </h3>
        </div>
        
        <div className="divide-y">
          {properties.map((property) => (
            <div key={property.parcelId} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {property.address}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Parcel ID:</span>
                      <div className="font-medium">{property.parcelId}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Assessed Value:</span>
                      <div className="font-medium">${property.assessedValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Property Type:</span>
                      <div className="font-medium">{property.propertyType}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">AI Confidence:</span>
                      <div className="font-medium">{property.aiConfidence}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => getPropertyDetails(property.parcelId)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => {
                      const newValue = prompt('Enter new assessed value:');
                      if (newValue) {
                        updateAssessment(property.parcelId, parseInt(newValue));
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {properties.length === 0 && !loading && (
            <div className="p-6 text-center text-gray-500">
              No properties found. Try adjusting your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertySearchRefactored;
