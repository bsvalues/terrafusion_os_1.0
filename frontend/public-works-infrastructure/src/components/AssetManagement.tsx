import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Eye, 
  Wrench, 
  Activity,
  Gauge,
  TrendingUp,
  TrendingDown,
  Info,
  Settings,
  MoreVertical,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Camera,
  FileText,
  BarChart3
} from 'lucide-react';

interface InfrastructureAsset {
  id: string;
  asset_number: string;
  asset_type: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lon: number;
  };
  address: string;
  installation_date: string;
  expected_lifespan: number;
  current_condition: string;
  condition_score: number;
  last_inspection: string;
  next_inspection: string;
  replacement_cost: number;
  annual_maintenance_cost: number;
  criticality_score: number;
  service_area: string;
  specifications: any;
  maintenance_history: any[];
  performance_data: {
    uptime_percentage: number;
    efficiency_rating: number;
    failure_incidents: number;
    maintenance_frequency: number;
  };
}

interface AssetFilter {
  asset_type: string;
  condition: string;
  service_area: string;
  criticality_range: [number, number];
  installation_date_range: [string, string];
}

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<InfrastructureAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<AssetFilter>({
    asset_type: '',
    condition: '',
    service_area: '',
    criticality_range: [0, 100],
    installation_date_range: ['', '']
  });

  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
          setFilteredAssets(data.assets || []);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
    const interval = setInterval(fetchAssets, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, searchTerm, filters, sortBy, sortDirection]);

  const applyFilters = () => {
    let filtered = [...assets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Asset type filter
    if (filters.asset_type) {
      filtered = filtered.filter(asset => asset.asset_type === filters.asset_type);
    }

    // Condition filter
    if (filters.condition) {
      filtered = filtered.filter(asset => asset.current_condition === filters.condition);
    }

    // Service area filter
    if (filters.service_area) {
      filtered = filtered.filter(asset => asset.service_area === filters.service_area);
    }

    // Criticality range filter
    filtered = filtered.filter(asset =>
      asset.criticality_score >= filters.criticality_range[0] &&
      asset.criticality_score <= filters.criticality_range[1]
    );

    // Installation date range filter
    if (filters.installation_date_range[0] && filters.installation_date_range[1]) {
      filtered = filtered.filter(asset => {
        const installDate = new Date(asset.installation_date);
        const startDate = new Date(filters.installation_date_range[0]);
        const endDate = new Date(filters.installation_date_range[1]);
        return installDate >= startDate && installDate <= endDate;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof InfrastructureAsset];
      let bValue: any = b[sortBy as keyof InfrastructureAsset];

      if (sortBy === 'installation_date' || sortBy === 'last_inspection' || sortBy === 'next_inspection') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAssets(filtered);
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'condition-excellent';
      case 'good': return 'condition-good';
      case 'fair': return 'condition-fair';
      case 'poor': return 'condition-poor';
      case 'critical': return 'condition-critical';
      case 'failed': return 'condition-failed';
      default: return 'condition-unknown';
    }
  };

  const getCriticalityLevel = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateAssetAge = (installationDate: string, expectedLifespan: number) => {
    const install = new Date(installationDate);
    const now = new Date();
    const ageYears = (now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const remainingLife = Math.max(0, expectedLifespan - ageYears);
    const lifePercentage = Math.max(0, (remainingLife / expectedLifespan) * 100);
    
    return {
      ageYears: Math.round(ageYears * 10) / 10,
      remainingLife: Math.round(remainingLife * 10) / 10,
      lifePercentage: Math.round(lifePercentage)
    };
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case 'road': return '🛣️';
      case 'bridge': return '🌉';
      case 'water_main': return '🚰';
      case 'sewer_line': return '🚽';
      case 'storm_drain': return '⛈️';
      case 'traffic_signal': return '🚦';
      case 'street_light': return '💡';
      case 'park_facility': return '🏞️';
      case 'building': return '🏢';
      case 'electrical_grid': return '⚡';
      case 'fiber_optic': return '🌐';
      case 'waste_facility': return '♻️';
      default: return '🏗️';
    }
  };

  const uniqueAssetTypes = [...new Set(assets.map(a => a.asset_type))];
  const uniqueConditions = [...new Set(assets.map(a => a.current_condition))];
  const uniqueServiceAreas = [...new Set(assets.map(a => a.service_area))];

  return (
    <div className="asset-management">
      {/* Asset Management Header */}
      <div className="asset-header">
        <div className="header-content">
          <h2>Infrastructure Asset Management</h2>
          <p>Comprehensive asset tracking, condition monitoring, and lifecycle management</p>
          
          <div className="asset-stats">
            <div className="stat-item">
              <Building size={20} />
              <span className="stat-value">{assets.length}</span>
              <span className="stat-label">Total Assets</span>
            </div>
            <div className="stat-item critical">
              <AlertTriangle size={20} />
              <span className="stat-value">
                {assets.filter(a => a.current_condition === 'critical' || a.current_condition === 'poor').length}
              </span>
              <span className="stat-label">Critical/Poor</span>
            </div>
            <div className="stat-item inspection">
              <Eye size={20} />
              <span className="stat-value">
                {assets.filter(a => new Date(a.next_inspection) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
              </span>
              <span className="stat-label">Due Inspection</span>
            </div>
            <div className="stat-item value">
              <DollarSign size={20} />
              <span className="stat-value">
                {formatCurrency(assets.reduce((sum, a) => sum + a.replacement_cost, 0))}
              </span>
              <span className="stat-label">Total Value</span>
            </div>
          </div>
        </div>

        <div className="header-controls">
          <button className="control-btn refresh" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="control-btn export">
            <Download size={16} />
            Export
          </button>
          <button className="control-btn add-asset">
            <Building size={16} />
            Add Asset
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search assets by name, number, description, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="view-controls">
          <div className="view-mode">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              Map
            </button>
          </div>

          <div className="sort-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Name</option>
              <option value="asset_type">Type</option>
              <option value="current_condition">Condition</option>
              <option value="condition_score">Condition Score</option>
              <option value="criticality_score">Criticality</option>
              <option value="installation_date">Installation Date</option>
              <option value="next_inspection">Next Inspection</option>
              <option value="replacement_cost">Replacement Cost</option>
            </select>
            <button 
              className="sort-direction"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Asset Type</label>
              <select 
                value={filters.asset_type}
                onChange={(e) => setFilters({...filters, asset_type: e.target.value})}
              >
                <option value="">All Types</option>
                {uniqueAssetTypes.map(type => (
                  <option key={type} value={type}>
                    {getAssetTypeIcon(type)} {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Condition</label>
              <select 
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
              >
                <option value="">All Conditions</option>
                {uniqueConditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Service Area</label>
              <select 
                value={filters.service_area}
                onChange={(e) => setFilters({...filters, service_area: e.target.value})}
              >
                <option value="">All Areas</option>
                {uniqueServiceAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="filter-group range">
              <label>Criticality Range</label>
              <div className="range-inputs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.criticality_range[0]}
                  onChange={(e) => setFilters({
                    ...filters, 
                    criticality_range: [parseInt(e.target.value), filters.criticality_range[1]]
                  })}
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.criticality_range[1]}
                  onChange={(e) => setFilters({
                    ...filters, 
                    criticality_range: [filters.criticality_range[0], parseInt(e.target.value)]
                  })}
                />
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="clear-filters"
              onClick={() => setFilters({
                asset_type: '',
                condition: '',
                service_area: '',
                criticality_range: [0, 100],
                installation_date_range: ['', '']
              })}
            >
              Clear Filters
            </button>
            <span className="results-count">
              Showing {filteredAssets.length} of {assets.length} assets
            </span>
          </div>
        </div>
      )}

      {/* Asset Display */}
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading infrastructure assets...</p>
        </div>
      ) : (
        <div className={`assets-display ${viewMode}`}>
          {viewMode === 'grid' && (
            <div className="assets-grid">
              {filteredAssets.map((asset) => {
                const lifeInfo = calculateAssetAge(asset.installation_date, asset.expected_lifespan);
                
                return (
                  <div 
                    key={asset.id} 
                    className={`asset-card ${getConditionColor(asset.current_condition)}`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="asset-card-header">
                      <div className="asset-identity">
                        <span className="asset-icon">{getAssetTypeIcon(asset.asset_type)}</span>
                        <div className="asset-title">
                          <h4>{asset.name}</h4>
                          <span className="asset-number">{asset.asset_number}</span>
                        </div>
                      </div>
                      <div className="asset-actions">
                        <button className="action-btn">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="asset-card-content">
                      <div className="condition-display">
                        <div className="condition-score">
                          <Gauge size={24} />
                          <span className="score-value">{asset.condition_score.toFixed(1)}</span>
                          <span className="score-max">/10</span>
                        </div>
                        <div className="condition-status">
                          <span className={`status-badge ${getConditionColor(asset.current_condition)}`}>
                            {asset.current_condition}
                          </span>
                        </div>
                      </div>

                      <div className="criticality-display">
                        <label>Criticality: {getCriticalityLevel(asset.criticality_score)}</label>
                        <div className="criticality-bar">
                          <div 
                            className="criticality-fill"
                            style={{ width: `${asset.criticality_score}%` }}
                          ></div>
                        </div>
                        <span className="criticality-percent">{asset.criticality_score.toFixed(0)}%</span>
                      </div>

                      <div className="lifecycle-display">
                        <label>Asset Lifecycle</label>
                        <div className="lifecycle-bar">
                          <div 
                            className="lifecycle-fill"
                            style={{ width: `${lifeInfo.lifePercentage}%` }}
                          ></div>
                        </div>
                        <span className="lifecycle-text">
                          {lifeInfo.remainingLife} years remaining
                        </span>
                      </div>

                      <div className="asset-metrics">
                        <div className="metric-item">
                          <MapPin size={14} />
                          <span>{asset.service_area}</span>
                        </div>
                        <div className="metric-item">
                          <Calendar size={14} />
                          <span>Installed: {formatDate(asset.installation_date)}</span>
                        </div>
                        <div className="metric-item">
                          <Eye size={14} />
                          <span>Next Inspection: {formatDate(asset.next_inspection)}</span>
                        </div>
                        <div className="metric-item">
                          <DollarSign size={14} />
                          <span>Value: {formatCurrency(asset.replacement_cost)}</span>
                        </div>
                      </div>

                      <div className="performance-indicators">
                        <div className="indicator">
                          <Activity size={12} />
                          <span>Uptime: {asset.performance_data.uptime_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="indicator">
                          <Zap size={12} />
                          <span>Efficiency: {asset.performance_data.efficiency_rating.toFixed(1)}/10</span>
                        </div>
                        <div className="indicator">
                          <AlertTriangle size={12} />
                          <span>Failures: {asset.performance_data.failure_incidents}</span>
                        </div>
                      </div>
                    </div>

                    <div className="asset-card-footer">
                      <button className="action-btn inspect">
                        <Eye size={14} />
                        Inspect
                      </button>
                      <button className="action-btn maintain">
                        <Wrench size={14} />
                        Maintain
                      </button>
                      <button className="action-btn details">
                        <Info size={14} />
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="assets-list">
              <div className="list-header">
                <div className="column asset-info">Asset</div>
                <div className="column condition">Condition</div>
                <div className="column criticality">Criticality</div>
                <div className="column lifecycle">Lifecycle</div>
                <div className="column location">Location</div>
                <div className="column inspection">Next Inspection</div>
                <div className="column value">Value</div>
                <div className="column actions">Actions</div>
              </div>

              {filteredAssets.map((asset) => {
                const lifeInfo = calculateAssetAge(asset.installation_date, asset.expected_lifespan);
                
                return (
                  <div key={asset.id} className={`list-row ${getConditionColor(asset.current_condition)}`}>
                    <div className="column asset-info">
                      <div className="asset-identity">
                        <span className="asset-icon">{getAssetTypeIcon(asset.asset_type)}</span>
                        <div>
                          <strong>{asset.name}</strong>
                          <span className="asset-number">{asset.asset_number}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="column condition">
                      <span className={`status-badge ${getConditionColor(asset.current_condition)}`}>
                        {asset.current_condition}
                      </span>
                      <span className="score">{asset.condition_score.toFixed(1)}</span>
                    </div>
                    
                    <div className="column criticality">
                      <div className="criticality-display">
                        <div className="criticality-bar">
                          <div 
                            className="criticality-fill"
                            style={{ width: `${asset.criticality_score}%` }}
                          ></div>
                        </div>
                        <span>{asset.criticality_score.toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="column lifecycle">
                      <div className="lifecycle-display">
                        <div className="lifecycle-bar">
                          <div 
                            className="lifecycle-fill"
                            style={{ width: `${lifeInfo.lifePercentage}%` }}
                          ></div>
                        </div>
                        <span>{lifeInfo.remainingLife}y</span>
                      </div>
                    </div>
                    
                    <div className="column location">
                      <span>{asset.service_area}</span>
                    </div>
                    
                    <div className="column inspection">
                      <span>{formatDate(asset.next_inspection)}</span>
                    </div>
                    
                    <div className="column value">
                      <span>{formatCurrency(asset.replacement_cost)}</span>
                    </div>
                    
                    <div className="column actions">
                      <button className="action-btn" onClick={() => setSelectedAsset(asset)}>
                        <Eye size={14} />
                      </button>
                      <button className="action-btn">
                        <Wrench size={14} />
                      </button>
                      <button className="action-btn">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="assets-map">
              <div className="map-placeholder">
                <MapPin size={48} />
                <h3>Asset Location Map</h3>
                <p>Interactive map showing all infrastructure assets with real-time status indicators</p>
                <p>Integration with GIS systems and location-based analytics</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="asset-modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="asset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAsset.name}</h3>
              <button className="close-btn" onClick={() => setSelectedAsset(null)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="asset-detail-tabs">
                <button className="tab-btn active">Overview</button>
                <button className="tab-btn">Maintenance</button>
                <button className="tab-btn">Performance</button>
                <button className="tab-btn">Documents</button>
              </div>
              
              <div className="asset-detail-content">
                <div className="detail-section">
                  <h4>Asset Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Asset Number:</label>
                      <span>{selectedAsset.asset_number}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type:</label>
                      <span>{selectedAsset.asset_type.replace('_', ' ')}</span>
                    </div>
                    <div className="detail-item">
                      <label>Address:</label>
                      <span>{selectedAsset.address}</span>
                    </div>
                    <div className="detail-item">
                      <label>Service Area:</label>
                      <span>{selectedAsset.service_area}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Condition & Performance</h4>
                  <div className="performance-grid">
                    <div className="performance-item">
                      <label>Condition Score:</label>
                      <span className="score">{selectedAsset.condition_score.toFixed(1)}/10</span>
                    </div>
                    <div className="performance-item">
                      <label>Uptime:</label>
                      <span>{selectedAsset.performance_data.uptime_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="performance-item">
                      <label>Efficiency:</label>
                      <span>{selectedAsset.performance_data.efficiency_rating.toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="action-btn primary">
                <Eye size={16} />
                Schedule Inspection
              </button>
              <button className="action-btn">
                <Wrench size={16} />
                Create Work Order
              </button>
              <button className="action-btn">
                <FileText size={16} />
                View History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;