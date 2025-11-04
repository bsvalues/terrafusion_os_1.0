import { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Calendar, DollarSign  } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { Property } from '@shared/schema';

export function PropertySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [, setLocation] = useLocation();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties?limit=5000"],
  });

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      // Use API search endpoint
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const searchResults = await response.json();
        setResults(searchResults.slice(0, 10)); // Limit results
        setShowResults(true);
      } else {
        console.error('Search API failed:', response.status);
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const selectProperty = (property: Property) => {
    setShowResults(false);
    setLocation(`/property/${property.id}`);
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '$0';
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
<>
        <Search className="w-5 h-5 text-blue-600" />
        Property Search
      </h2>
      
      <div
</> className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by address, parcel ID, or owner..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
<>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p
</> className="mt-2">Searching properties...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {results.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => selectProperty(property)}
                    className="w-full text-left p-4 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{property.address}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
<>
                          <div>Parcel: {property.parcelId}</div>
                          <div
</> className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(property.assessedValue)}
                            </span>
                            {property.squareFootage && (
                              <span>{property.squareFootage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sq ft</span>
                            )}
                            {property.yearBuilt && (
                              <span>Built {property.yearBuilt}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(property.updatedAt?.toISOString() || null)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No properties found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip label="Residential" active />
        <FilterChip label="Commercial" />
        <FilterChip label="Recent Sales" />
        <FilterChip label="Pending Assessment" />
      </div>
    </div>
  );
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
        active
          ? 'bg-blue-100 border-blue-300 text-blue-700'
          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}