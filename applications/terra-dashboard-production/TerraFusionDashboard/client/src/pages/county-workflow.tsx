import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Download, CheckCircle, Clock, Warning  } from '@mui/icons-material';

interface Property {
  id: string;
  parcelId: string;
  address: string;
  ownerName?: string | null;
  assessedValue: string;
  marketValue?: string;
  propertyType: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CountyWorkflow() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(250); // County-friendly batch size
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [workMode, setWorkMode] = useState<'browse' | 'search'>('browse');

  const fetchProperties = async (page: number, limit: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/properties/county-batch?page=${page}&limit=${limit}`);
      const data: PaginatedResponse = await response.json();
      
      setProperties(data.properties);
      setTotalProperties(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchProperties = async (query: string, page: number, limit: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/properties/county-search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      const data: PaginatedResponse = await response.json();
      
      setProperties(data.properties);
      setTotalProperties(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workMode === 'browse') {
      fetchProperties(currentPage, pageSize);
    } else if (workMode === 'search' && searchQuery) {
      searchProperties(searchQuery, currentPage, pageSize);
    }
  }, [currentPage, pageSize, workMode]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setWorkMode('search');
      setCurrentPage(1);
      searchProperties(query, 1, pageSize);
    } else {
      setWorkMode('browse');
      setCurrentPage(1);
      fetchProperties(1, pageSize);
    }
  };

  const handlePropertySelection = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const selectAllOnPage = () => {
    const allIds = properties.map(p => p.id);
    setSelectedProperties(new Set([...selectedProperties, ...allIds]));
  };

  const clearSelection = () => {
    setSelectedProperties(new Set());
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const getPropertyTypeColor = (type: string) => {
    if (type.toLowerCase().includes('residential') || type.includes('Single')) return 'bg-blue-100 text-blue-800';
    if (type.toLowerCase().includes('commercial')) return 'bg-green-100 text-green-800';
    if (type.toLowerCase().includes('agricultural')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
<>
        <h1 style={{ color: '#1e293b', fontSize: '28px', marginBottom: '8px' }}>
          Benton County Property Management Workflow
        </h1>
        <p
</> style={{ color: '#64748b', fontSize: '16px' }}>
          Manage all {totalProperties?.toLocaleString() || '91,808'} properties with efficient batch processing
        </p>
      </div>

      {/* Control Panel */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search properties by address, parcel ID, or owner..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Batch Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
<>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Batch Size:</span>
            <select
</>
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
<>
              <option value={100}>100</option>
              <option
</> value={250}>250</option>
<>
              <option value={500}>500</option>
              <option
</> value={1000}>1000</option>
            </select>
          </div>

          {/* Selection Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
<>
            <button
              onClick={selectAllOnPage}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Select Page ({properties.length})
            </button>
            <button
</>
              onClick={clearSelection}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Clear ({selectedProperties.size})
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ 
        backgroundColor: '#f1f5f9', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
<>
          <span style={{ fontSize: '14px', color: '#475569' }}>
            {workMode === 'search' ? 
              `Search Results: ${totalProperties.toLocaleString()} properties found for "${searchQuery}"` :
              `Total Properties: ${totalProperties.toLocaleString()}`
            }
          </span>
          <span
</> style={{ fontSize: '14px', color: '#64748b', marginLeft: '16px' }}>
            Page {currentPage} of {totalPages} | Showing {properties.length} properties
          </span>
        </div>
        <div style={{ fontSize: '14px', color: '#059669' }}>
          {selectedProperties.size} properties selected
        </div>
      </div>

      {/* Properties Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#64748b' }}>Loading properties...</div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '16px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '40px 120px 2fr 1fr 120px 100px 80px',
              gap: '16px',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#374151'
            }}>
<>
              <div></div>
              <div
</>>Parcel ID</div>
<>
              <div>Address</div>
              <div
</>>Owner</div>
<>
              <div>Assessed Value</div>
              <div
</>>Type</div>
              <div>Status</div>
            </div>

            {/* Table Body */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {properties.map((property) => (
                <div
                  key={property.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'grid',
                    gridTemplateColumns: '40px 120px 2fr 1fr 120px 100px 80px',
                    gap: '16px',
                    alignItems: 'center',
                    backgroundColor: selectedProperties.has(property.id) ? '#eff6ff' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePropertySelection(property.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedProperties.has(property.id)}
                    onChange={() => handlePropertySelection(property.id)}
                    style={{ width: '16px', height: '16px' }}
                  />
<>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#1e293b' }}>
                    {property.parcelId}
                  </div>
                  <div
</> style={{ fontSize: '14px', color: '#1e293b' }}>
                    {property.address}
                  </div>
<>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {property.ownerName || 'N/A'}
                  </div>
                  <div
</> style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                    {formatCurrency(property.assessedValue)}
                  </div>
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      ...getPropertyTypeColor(property.propertyType)
                    }}>
                      {property.propertyType}
                    </span>
                  </div>
                  <div>
                    {property.active ? (
                      <CheckCircle size={16} color="#059669" />
                    ) : (
                      <Warning size={16} color="#dc2626" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      <div style={{ 
        marginTop: '20px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{
            padding: '8px 12px',
            backgroundColor: currentPage <= 1 ? '#f1f5f9' : '#3b82f6',
            color: currentPage <= 1 ? '#94a3b8' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
<>
          <ChevronLeft size={16} />
          Previous
        </button>

        <span
</> style={{ 
          padding: '8px 16px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#374151'
        }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={{
            padding: '8px 12px',
            backgroundColor: currentPage >= totalPages ? '#f1f5f9' : '#3b82f6',
            color: currentPage >= totalPages ? '#94a3b8' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Batch Actions */}
      {selectedProperties.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e293b',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
<>
          <span style={{ fontSize: '14px' }}>
            {selectedProperties.size} properties selected
          </span>
          <button
</> style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Export Selection
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Bulk Update
          </button>
        </div>
      )}
    </div>
  );
}