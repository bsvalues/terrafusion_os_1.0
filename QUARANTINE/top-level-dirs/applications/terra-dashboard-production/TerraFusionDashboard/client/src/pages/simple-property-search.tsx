import { useState } from 'react';

interface Property {
  id: string;
  parcelId: string;
  address: string;
  ownerName?: string | null;
  assessedValue: string;
  marketValue?: string;
  landValue?: string;
  improvementValue?: string;
  squareFootage?: number | null;
  yearBuilt?: number | null;
  propertyType: string;
  countyName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SimplePropertySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/properties/search/all?q=${encodeURIComponent(searchQuery)}&limit=500`);
      const data = await response.json();
      
      setSearchResults(data.results);
      setTotalResults(data.total);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
<>
      <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>Benton County Property Search</h1>
      <p
</> style={{ color: '#6b7280', marginBottom: '20px' }}>
        Search any property from the complete 91,808 Benton County dataset
      </p>

      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter address, parcel ID, owner name, or city..."
          style={{
            width: '400px',
            padding: '10px',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            marginRight: '10px'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Quick Search Examples */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>Try: </span>
        {['Richland', 'Prosser', 'Kennewick', 'BC000001', 'School District'].map((example) => (
          <button
            key={example}
            onClick={() => setSearchQuery(example)}
            style={{
              margin: '0 5px',
              padding: '5px 10px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {example}
          </button>
        ))}
      </div>

      {/* Results Summary */}
      {totalResults > 0 && (
        <div style={{ 
          backgroundColor: '#dbeafe', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          Found {totalResults.toLocaleString()} properties matching "{searchQuery}". 
          Showing {searchResults.length} results.
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Search Results */}
        <div style={{ flex: '2' }}>
          {searchResults.length > 0 && (
            <div>
<>
              <h3>Search Results</h3>
              <div
</> style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {searchResults.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedProperty?.id === property.id ? '#f0f9ff' : 'white'
                    }}
                  >
<>
                    <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                      {property.address}
                    </div>
                    <div
</> style={{ fontSize: '14px', color: '#6b7280', margin: '5px 0' }}>
                      Parcel: {property.parcelId} | Type: {property.propertyType}
                    </div>
                    <div style={{ fontSize: '14px', color: '#059669', fontWeight: 'bold' }}>
                      Assessed Value: {formatCurrency(property.assessedValue)}
                    </div>
                    {property.ownerName && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Owner: {property.ownerName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div style={{ flex: '1' }}>
          {selectedProperty && (
            <div style={{ 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: 'white'
            }}>
<>
              <h3 style={{ marginTop: '0', color: '#1f2937' }}>Property Details</h3>
              
              <div
</> style={{ marginBottom: '15px' }}>
                <strong>{selectedProperty.address}</strong>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                <div><strong>Parcel ID:</strong> {selectedProperty.parcelId}</div>
                <div><strong>Property Type:</strong> {selectedProperty.propertyType}</div>
                {selectedProperty.ownerName && (
                  <div><strong>Owner:</strong> {selectedProperty.ownerName}</div>
                )}
                <div><strong>Assessed Value:</strong> {formatCurrency(selectedProperty.assessedValue)}</div>
                {selectedProperty.landValue && (
                  <div><strong>Land Value:</strong> {formatCurrency(selectedProperty.landValue)}</div>
                )}
                {selectedProperty.improvementValue && (
                  <div><strong>Improvement Value:</strong> {formatCurrency(selectedProperty.improvementValue)}</div>
                )}
                {selectedProperty.squareFootage && (
                  <div><strong>Square Footage:</strong> {selectedProperty.squareFootage.toLocaleString()} sq ft</div>
                )}
                {selectedProperty.yearBuilt && (
                  <div><strong>Year Built:</strong> {selectedProperty.yearBuilt}</div>
                )}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                  <strong>Last Updated:</strong> {new Date(selectedProperty.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          
          {!selectedProperty && searchResults.length > 0 && (
            <div style={{ 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              padding: '20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Click on a property to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}