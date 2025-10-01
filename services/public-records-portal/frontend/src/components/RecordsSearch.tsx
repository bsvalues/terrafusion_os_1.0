import React, { useState, useEffect } from 'react';
import './RecordsSearch.css';

interface SearchFilter {
  category: string;
  department: string;
  dateRange: {
    start: string;
    end: string;
  };
  recordType: string;
  accessLevel: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  dateCreated: string;
  lastModified: string;
  fileSize: string;
  format: string;
  accessLevel: 'public' | 'restricted' | 'confidential';
  downloadCount: number;
  tags: string[];
  preview?: string;
}

const RecordsSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({
    category: '',
    department: '',
    dateRange: { start: '', end: '' },
    recordType: '',
    accessLevel: ''
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    'Financial Records', 'Meeting Minutes', 'Legal Documents', 'Planning Documents',
    'Personnel Records', 'Public Safety', 'Environmental Reports', 'Infrastructure',
    'Electoral Records', 'Permits & Licenses', 'Budget Documents', 'Audit Reports'
  ];

  const departments = [
    'City Council', 'Mayor\'s Office', 'Public Works', 'Police Department',
    'Fire Department', 'Parks & Recreation', 'Planning & Development', 
    'Finance Department', 'Human Resources', 'Legal Department', 
    'Environmental Services', 'Public Health'
  ];

  const recordTypes = [
    'Official Documents', 'Meeting Records', 'Reports', 'Correspondence',
    'Contracts', 'Permits', 'Applications', 'Inspection Reports',
    'Financial Statements', 'Policy Documents', 'Maps & Plans', 'Media Files'
  ];

  useEffect(() => {
    if (searchQuery || Object.values(filters).some(f => 
      typeof f === 'string' ? f !== '' : f.start !== '' || f.end !== ''
    )) {
      performSearch();
    } else {
      setResults([]);
      setTotalResults(0);
    }
  }, [searchQuery, filters, currentPage, sortBy]);

  const performSearch = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: 'DOC-2024-0834',
          title: 'Annual Budget Report 2024 - Complete Financial Overview',
          description: 'Comprehensive annual budget report including departmental allocations, revenue projections, and expenditure analysis for fiscal year 2024.',
          category: 'Financial Records',
          department: 'Finance Department',
          dateCreated: '2024-01-15',
          lastModified: '2024-09-10',
          fileSize: '15.2 MB',
          format: 'PDF',
          accessLevel: 'public',
          downloadCount: 15247,
          tags: ['budget', 'finance', 'annual report', 'fiscal year 2024'],
          preview: 'This comprehensive budget document outlines the city\'s financial plan for 2024, including detailed departmental allocations...'
        },
        {
          id: 'MEET-2024-0912',
          title: 'City Council Meeting Minutes - September 12, 2024',
          description: 'Official minutes from the regular city council meeting covering agenda items, voting records, and public comments.',
          category: 'Meeting Minutes',
          department: 'City Council',
          dateCreated: '2024-09-12',
          lastModified: '2024-09-13',
          fileSize: '2.8 MB',
          format: 'PDF',
          accessLevel: 'public',
          downloadCount: 8956,
          tags: ['city council', 'meeting minutes', 'public meeting', 'governance'],
          preview: 'Meeting called to order at 7:00 PM. Present: Mayor Johnson, Councilmembers Smith, Davis, Wilson, and Chen...'
        },
        {
          id: 'PLAN-2024-0156',
          title: 'Downtown Revitalization Master Plan - Phase 2',
          description: 'Detailed planning document for the second phase of downtown revitalization including zoning changes and development guidelines.',
          category: 'Planning Documents',
          department: 'Planning & Development',
          dateCreated: '2024-08-20',
          lastModified: '2024-09-05',
          fileSize: '28.7 MB',
          format: 'PDF',
          accessLevel: 'public',
          downloadCount: 6728,
          tags: ['downtown', 'revitalization', 'master plan', 'development', 'zoning'],
          preview: 'The Downtown Revitalization Master Plan Phase 2 builds upon the successful implementation of Phase 1...'
        },
        {
          id: 'AUDIT-2024-0023',
          title: 'Independent Financial Audit Report 2023',
          description: 'Third-party financial audit report reviewing the city\'s financial practices, internal controls, and compliance.',
          category: 'Audit Reports',
          department: 'Finance Department',
          dateCreated: '2024-07-15',
          lastModified: '2024-07-20',
          fileSize: '8.9 MB',
          format: 'PDF',
          accessLevel: 'public',
          downloadCount: 9413,
          tags: ['audit', 'financial review', 'compliance', 'internal controls'],
          preview: 'This independent audit was conducted by Smith & Associates CPA firm and covers the period from January 1, 2023...'
        },
        {
          id: 'ENV-2024-0445',
          title: 'Water Quality Testing Results - Q3 2024',
          description: 'Quarterly water quality testing results for all municipal wells and treatment facilities.',
          category: 'Environmental Reports',
          department: 'Environmental Services',
          dateCreated: '2024-09-01',
          lastModified: '2024-09-08',
          fileSize: '5.4 MB',
          format: 'PDF',
          accessLevel: 'public',
          downloadCount: 3892,
          tags: ['water quality', 'testing', 'municipal wells', 'environmental'],
          preview: 'Water quality testing conducted in accordance with EPA standards shows all municipal water sources...'
        },
        {
          id: 'CONT-2024-0067',
          title: 'Public Works Infrastructure Contract - Highway 101 Maintenance',
          description: 'Contract agreement for highway maintenance services including terms, specifications, and payment schedule.',
          category: 'Legal Documents',
          department: 'Public Works',
          dateCreated: '2024-06-10',
          lastModified: '2024-08-15',
          fileSize: '12.1 MB',
          format: 'PDF',
          accessLevel: 'public',
          downloadCount: 2156,
          tags: ['contract', 'highway maintenance', 'public works', 'infrastructure'],
          preview: 'This agreement between the City and ABC Construction Services covers comprehensive maintenance...'
        }
      ];

      // Apply filters
      let filteredResults = mockResults;
      
      if (searchQuery) {
        filteredResults = filteredResults.filter(result =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (filters.category) {
        filteredResults = filteredResults.filter(result => result.category === filters.category);
      }

      if (filters.department) {
        filteredResults = filteredResults.filter(result => result.department === filters.department);
      }

      if (filters.recordType) {
        // This would be more sophisticated in real implementation
        filteredResults = filteredResults.filter(result => 
          result.tags.some(tag => tag.toLowerCase().includes(filters.recordType.toLowerCase()))
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'date-newest':
          filteredResults.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
          break;
        case 'date-oldest':
          filteredResults.sort((a, b) => new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
          break;
        case 'popularity':
          filteredResults.sort((a, b) => b.downloadCount - a.downloadCount);
          break;
        case 'title':
          filteredResults.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default: // relevance
          // Keep original order for relevance
          break;
      }

      setResults(filteredResults);
      setTotalResults(filteredResults.length);
      setIsLoading(false);
    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      department: '',
      dateRange: { start: '', end: '' },
      recordType: '',
      accessLevel: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return '#00ff88';
      case 'restricted': return '#ffaa00';
      case 'confidential': return '#ff3333';
      default: return '#888888';
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public': return '🌐';
      case 'restricted': return '🔒';
      case 'confidential': return '🔐';
      default: return '❓';
    }
  };

  return (
    <div className="records-search">
      
      {/* Search Header */}
      <div className="search-header">
        <div className="search-title">
          <h1>Public Records Search</h1>
          <p>Search and access government records with advanced filtering options</p>
        </div>
        
        <div className="search-stats">
          <div className="stat">
            <span className="stat-number">1,247,893</span>
            <span className="stat-label">Total Records</span>
          </div>
          <div className="stat">
            <span className="stat-number">94.7%</span>
            <span className="stat-label">Digitized</span>
          </div>
          <div className="stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Access</span>
          </div>
        </div>
      </div>

      {/* Search Controls */}
      <div className="search-controls">
        <div className="primary-search">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search records by title, description, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <span className="search-icon">🔍</span>
            </button>
          </div>
          
          <button 
            className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced Filters</span>
            <span className="toggle-icon">{showAdvanced ? '▲' : '▼'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Department</label>
                <select 
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Record Type</label>
                <select 
                  value={filters.recordType}
                  onChange={(e) => handleFilterChange('recordType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {recordTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', {...filters.dateRange, start: e.target.value})}
                />
              </div>
              
              <div className="filter-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', {...filters.dateRange, end: e.target.value})}
                />
              </div>
              
              <div className="filter-actions">
                <button className="clear-filters" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Controls */}
      <div className="results-controls">
        <div className="results-info">
          {isLoading ? (
            <span>Searching...</span>
          ) : (
            <span>
              {totalResults.toLocaleString()} records found
              {searchQuery && (
                <span className="search-terms"> for "{searchQuery}"</span>
              )}
            </span>
          )}
        </div>
        
        <div className="view-controls">
          <div className="sort-control">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="date-newest">Date (Newest)</option>
              <option value="date-oldest">Date (Oldest)</option>
              <option value="popularity">Most Popular</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
          
          <div className="view-mode">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className={`search-results ${viewMode}`}>
        {isLoading ? (
          <div className="loading-results">
            <div className="loading-spinner"></div>
            <div>Searching records...</div>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="results-container">
              {results.map(result => (
                <div key={result.id} className="result-item">
                  <div className="result-header">
                    <div className="result-title">
                      <h3>{result.title}</h3>
                      <div className="result-id">{result.id}</div>
                    </div>
                    <div className="result-access">
                      <span 
                        className="access-level"
                        style={{color: getAccessLevelColor(result.accessLevel)}}
                      >
                        {getAccessLevelIcon(result.accessLevel)} {result.accessLevel}
                      </span>
                    </div>
                  </div>
                  
                  <div className="result-content">
                    <div className="result-description">
                      {result.description}
                    </div>
                    
                    {result.preview && (
                      <div className="result-preview">
                        <strong>Preview:</strong> {result.preview}
                      </div>
                    )}
                    
                    <div className="result-meta">
                      <div className="meta-item">
                        <span className="meta-label">Category:</span>
                        <span className="meta-value">{result.category}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Department:</span>
                        <span className="meta-value">{result.department}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Modified:</span>
                        <span className="meta-value">{result.lastModified}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Size:</span>
                        <span className="meta-value">{result.fileSize}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Format:</span>
                        <span className="meta-value">{result.format}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Downloads:</span>
                        <span className="meta-value">{result.downloadCount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="result-tags">
                      {result.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="result-actions">
                    <button className="action-btn primary">
                      <span className="btn-icon">👁️</span>
                      <span>View</span>
                    </button>
                    <button className="action-btn secondary">
                      <span className="btn-icon">⬇️</span>
                      <span>Download</span>
                    </button>
                    <button className="action-btn tertiary">
                      <span className="btn-icon">🔗</span>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalResults > 20 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  ← Previous
                </button>
                
                <div className="page-info">
                  Page {currentPage} of {Math.ceil(totalResults / 20)}
                </div>
                
                <button 
                  className="page-btn"
                  disabled={currentPage >= Math.ceil(totalResults / 20)}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div className="no-results-title">No records found</div>
            <div className="no-results-message">
              Try adjusting your search terms or filters to find what you're looking for.
            </div>
            <button className="no-results-action" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordsSearch;