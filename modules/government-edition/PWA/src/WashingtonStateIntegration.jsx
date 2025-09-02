import React, { useState, useEffect } from 'react';
import './WashingtonStateIntegration.css';

// Washington State County Data with Real Integration Details
const washingtonCounties = {
  king: {
    name: "King County",
    population: "2,269,675",
    parcels: "750,000",
    propertyValue: "$478B",
    budget: "$7.2B",
    gisSystem: "ArcGIS REST API",
    apiUrl: "https://gis.kingcounty.gov/arcgis/rest/services",
    migrationReady: true,
    integrationScore: 95,
    priority: "CRITICAL",
    message: "Seattle-Grade Innovation for Seattle's County",
    icon: "👑",
    gradient: "linear-gradient(135deg, #4a148c, #7b1fa2)",
    features: {
      parcelSearch: true,
      propertyReports: true,
      taxCalculator: true,
      permitTracking: true,
      apiAccess: true
    }
  },
  pierce: {
    name: "Pierce County",
    population: "921,130",
    parcels: "340,000",
    propertyValue: "$142B",
    budget: "$2.1B",
    gisSystem: "ArcGIS REST API",
    apiUrl: "https://gis.piercecountywa.gov/arcgis/rest/services",
    migrationReady: true,
    integrationScore: 92,
    priority: "HIGH",
    message: "Tacoma-Tested Technology",
    icon: "🏔️",
    gradient: "linear-gradient(135deg, #1565c0, #1976d2)"
  },
  snohomish: {
    name: "Snohomish County",
    population: "827,957",
    parcels: "310,000",
    propertyValue: "$156B",
    budget: "$1.4B",
    gisSystem: "Hybrid Custom/ArcGIS",
    apiUrl: "https://gis.snoco.org/maps/rest/services",
    migrationReady: true,
    integrationScore: 88,
    priority: "CRITICAL",
    message: "Boeing-Quality Precision",
    icon: "✈️",
    gradient: "linear-gradient(135deg, #00695c, #00897b)"
  },
  clark: {
    name: "Clark County",
    population: "503,311",
    parcels: "178,000",
    propertyValue: "$89B",
    budget: "$892M",
    gisSystem: "Custom GIS Portal",
    apiUrl: "https://gis.clark.wa.gov/gishome/Property",
    migrationReady: true,
    integrationScore: 85,
    priority: "HIGH",
    message: "Vancouver's Vision Realized",
    icon: "🌲",
    gradient: "linear-gradient(135deg, #2e7d32, #43a047)"
  },
  yakima: {
    name: "Yakima County",
    population: "256,728",
    parcels: "98,000",
    propertyValue: "$32B",
    budget: "$400M",
    gisSystem: "ArcGIS Open Data",
    apiUrl: "https://gis.yakimacounty.us/arcgis/rest/services",
    migrationReady: true,
    integrationScore: 82,
    priority: "HIGH",
    message: "Agricultural Innovation Hub",
    icon: "🌾",
    gradient: "linear-gradient(135deg, #e65100, #ff6f00)"
  },
  whatcom: {
    name: "Whatcom County",
    population: "229,247",
    parcels: "95,000",
    propertyValue: "$48B",
    budget: "$380M",
    gisSystem: "Traditional GIS",
    apiUrl: "https://www.whatcomcounty.us/1593/Property-Information",
    migrationReady: false,
    integrationScore: 72,
    priority: "HIGH",
    message: "Bellingham's Bold Move",
    icon: "🏔️",
    gradient: "linear-gradient(135deg, #5e35b1, #673ab7)"
  },
  cowlitz: {
    name: "Cowlitz County",
    population: "110,730",
    parcels: "52,000",
    propertyValue: "$18B",
    budget: "$180M",
    gisSystem: "Custom REST API",
    apiUrl: "https://www.cowlitzinfo.net/apps/PropertyInformation",
    migrationReady: true,
    integrationScore: 78,
    priority: "QUICK_WIN",
    message: "Longview's Long-Term Vision",
    icon: "🌊",
    gradient: "linear-gradient(135deg, #0277bd, #0288d1)"
  },
  island: {
    name: "Island County",
    population: "86,857",
    parcels: "48,000",
    propertyValue: "$22B",
    budget: "$120M",
    gisSystem: "ArcGIS Online",
    apiUrl: "https://www.islandcountyassessor.com/Map/GIS",
    migrationReady: true,
    integrationScore: 90,
    priority: "QUICK_WIN",
    message: "Island Innovation",
    icon: "🏝️",
    gradient: "linear-gradient(135deg, #00838f, #00acc1)"
  },
  grant: {
    name: "Grant County",
    population: "99,123",
    parcels: "45,000",
    propertyValue: "$16B",
    budget: "$150M",
    gisSystem: "ArcGIS Open Data",
    apiUrl: "https://grantcountywa.gov/GIS",
    migrationReady: true,
    integrationScore: 75,
    priority: "QUICK_WIN",
    message: "Grant's Growth Gateway",
    icon: "🌅",
    gradient: "linear-gradient(135deg, #f57c00, #ff9800)"
  },
  franklin: {
    name: "Franklin County",
    population: "96,749",
    parcels: "32,000",
    propertyValue: "$14B",
    budget: "$140M",
    gisSystem: "ArcGIS Online",
    apiUrl: "https://franklincountywa.gov/gis",
    migrationReady: true,
    integrationScore: 88,
    priority: "QUICK_WIN",
    message: "Pasco's Progress Platform",
    icon: "🚀",
    gradient: "linear-gradient(135deg, #d32f2f, #f44336)"
  },
  stevens: {
    name: "Stevens County",
    population: "46,445",
    parcels: "28,000",
    propertyValue: "$8B",
    budget: "$60M",
    gisSystem: "Traditional GIS",
    apiUrl: "https://www.stevenscountywa.gov/landservices",
    migrationReady: false,
    integrationScore: 68,
    priority: "DEVELOPMENT",
    message: "Small County, Big Impact",
    icon: "🦌",
    gradient: "linear-gradient(135deg, #4e342e, #6d4c41)"
  },
  sanjuan: {
    name: "San Juan County",
    population: "18,001",
    parcels: "15,000",
    propertyValue: "$12B",
    budget: "$45M",
    gisSystem: "Basic Property Search",
    apiUrl: "https://www.sanjuanco.com/1539/Parcel-Search",
    migrationReady: false,
    integrationScore: 68,
    priority: "DEVELOPMENT",
    message: "Island Paradise Modernized",
    icon: "⛵",
    gradient: "linear-gradient(135deg, #1a237e, #3949ab)"
  }
};

// Migration Strategy Component
const MigrationStrategy = ({ county, onMigrate }) => {
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  const getMigrationTime = (county) => {
    if (county.migrationReady && county.integrationScore > 85) return "24 hours";
    if (county.migrationReady) return "48-72 hours";
    return "1-2 weeks";
  };

  const startMigration = async () => {
    setMigrationStatus('migrating');
    setProgress(0);
    
    // Simulate migration progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setMigrationStatus('complete');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="migration-strategy">
      <div className="migration-header">
        <h3>{county.icon} {county.name} Migration</h3>
        <span className={`priority-badge priority-${county.priority.toLowerCase()}`}>
          {county.priority}
        </span>
      </div>
      
      <div className="migration-details">
        <div className="detail-row">
          <span>Current System:</span>
          <strong>{county.gisSystem}</strong>
        </div>
        <div className="detail-row">
          <span>Integration Score:</span>
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ width: `${county.integrationScore}%` }}
            />
            <span className="score-value">{county.integrationScore}%</span>
          </div>
        </div>
        <div className="detail-row">
          <span>Migration Time:</span>
          <strong>{getMigrationTime(county)}</strong>
        </div>
        <div className="detail-row">
          <span>Property Value:</span>
          <strong>{county.propertyValue}</strong>
        </div>
      </div>

      {migrationStatus === 'idle' && (
        <button 
          className={`migrate-btn ${county.migrationReady ? 'ready' : 'prepare'}`}
          onClick={county.migrationReady ? startMigration : null}
        >
          {county.migrationReady ? '🚀 Start Migration' : '📋 Prepare Migration'}
        </button>
      )}

      {migrationStatus === 'migrating' && (
        <div className="migration-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">Migrating... {progress}%</span>
        </div>
      )}

      {migrationStatus === 'complete' && (
        <div className="migration-complete">
          ✅ Migration Complete! County is now transcended.
        </div>
      )}
    </div>
  );
};

// Main Washington State Integration Component
const WashingtonStateIntegration = () => {
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showMigrationReady, setShowMigrationReady] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalParcels: 0,
    totalValue: 0,
    totalPopulation: 0,
    averageScore: 0
  });

  useEffect(() => {
    // Calculate total statistics
    const stats = Object.values(washingtonCounties).reduce((acc, county) => {
      return {
        totalParcels: acc.totalParcels + parseInt(county.parcels.replace(/,/g, '')),
        totalValue: acc.totalValue + parseFloat(county.propertyValue.replace(/[$B]/g, '')),
        totalPopulation: acc.totalPopulation + parseInt(county.population.replace(/,/g, '')),
        totalScore: acc.totalScore + county.integrationScore
      };
    }, { totalParcels: 0, totalValue: 0, totalPopulation: 0, totalScore: 0 });

    setTotalStats({
      totalParcels: (stats.totalParcels / 1000000).toFixed(1) + 'M',
      totalValue: '$' + stats.totalValue.toFixed(0) + 'B',
      totalPopulation: (stats.totalPopulation / 1000000).toFixed(1) + 'M',
      averageScore: Math.round(stats.totalScore / Object.keys(washingtonCounties).length)
    });
  }, []);

  const getFilteredCounties = () => {
    return Object.entries(washingtonCounties).filter(([key, county]) => {
      if (filterPriority !== 'ALL' && county.priority !== filterPriority) return false;
      if (showMigrationReady && !county.migrationReady) return false;
      return true;
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      CRITICAL: '#ff1744',
      HIGH: '#ff9800',
      QUICK_WIN: '#4caf50',
      DEVELOPMENT: '#2196f3'
    };
    return colors[priority] || '#666';
  };

  return (
    <div className="washington-integration">
      {/* Header Section */}
      <header className="integration-header">
        <div className="header-content">
          <h1 className="main-title">
            🌲 Washington State County Integration Hub
          </h1>
          <p className="subtitle">
            Real-Time Migration Control Center for 12 Counties
          </p>
        </div>
        
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{totalStats.totalParcels}</span>
            <span className="stat-label">Total Parcels</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalStats.totalValue}</span>
            <span className="stat-label">Property Value</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalStats.totalPopulation}</span>
            <span className="stat-label">Population</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalStats.averageScore}%</span>
            <span className="stat-label">Avg Ready Score</span>
          </div>
        </div>
      </header>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Priority Filter:</label>
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="ALL">All Counties</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="QUICK_WIN">Quick Wins</option>
            <option value="DEVELOPMENT">Development</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>
            <input 
              type="checkbox"
              checked={showMigrationReady}
              onChange={(e) => setShowMigrationReady(e.target.checked)}
            />
            Show Migration Ready Only
          </label>
        </div>
      </div>

      {/* County Grid */}
      <div className="county-grid">
        {getFilteredCounties().map(([key, county]) => (
          <div 
            key={key}
            className={`county-card ${selectedCounty === key ? 'selected' : ''}`}
            style={{ background: county.gradient }}
            onClick={() => setSelectedCounty(key)}
          >
            <div className="county-header">
              <span className="county-icon">{county.icon}</span>
              <h3>{county.name}</h3>
            </div>
            
            <div className="county-stats">
              <div className="stat-row">
                <span>Population:</span>
                <strong>{county.population}</strong>
              </div>
              <div className="stat-row">
                <span>Parcels:</span>
                <strong>{county.parcels}</strong>
              </div>
              <div className="stat-row">
                <span>GIS System:</span>
                <strong>{county.gisSystem}</strong>
              </div>
            </div>
            
            <div className="integration-indicator">
              <div className="indicator-bar">
                <div 
                  className="indicator-fill"
                  style={{ 
                    width: `${county.integrationScore}%`,
                    backgroundColor: county.integrationScore > 80 ? '#4caf50' : 
                                    county.integrationScore > 70 ? '#ff9800' : '#f44336'
                  }}
                />
              </div>
              <span className="indicator-text">
                {county.integrationScore}% Ready
              </span>
            </div>
            
            <div className="county-message">
              "{county.message}"
            </div>
            
            <button 
              className="view-details-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCounty(key);
              }}
            >
              View Integration Plan →
            </button>
          </div>
        ))}
      </div>

      {/* Selected County Details */}
      {selectedCounty && (
        <div className="county-details-panel">
          <button 
            className="close-btn"
            onClick={() => setSelectedCounty(null)}
          >
            ×
          </button>
          
          <MigrationStrategy 
            county={washingtonCounties[selectedCounty]}
            onMigrate={() => console.log('Migration started for', selectedCounty)}
          />
          
          {/* Feature Matrix */}
          <div className="feature-matrix">
            <h4>System Capabilities</h4>
            <div className="features">
              {Object.entries(washingtonCounties[selectedCounty].features || {}).map(([feature, enabled]) => (
                <div key={feature} className="feature-item">
                  <span className={`feature-indicator ${enabled ? 'enabled' : 'disabled'}`}>
                    {enabled ? '✅' : '⭕'}
                  </span>
                  <span className="feature-name">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* API Endpoint */}
          <div className="api-info">
            <h4>Current API Endpoint</h4>
            <code>{washingtonCounties[selectedCounty].apiUrl}</code>
            <button className="test-api-btn">Test Connection</button>
          </div>
        </div>
      )}

      {/* Migration Timeline */}
      <div className="migration-timeline">
        <h2>30-Day Washington State Rollout Timeline</h2>
        <div className="timeline">
          <div className="timeline-week">
            <h3>Week 1: Critical Counties</h3>
            <ul>
              <li>Day 1-2: King County executive briefing & technical assessment</li>
              <li>Day 3-4: Snohomish County API integration</li>
              <li>Day 5: Quick wins - Island & Franklin Counties</li>
            </ul>
          </div>
          <div className="timeline-week">
            <h3>Week 2: High Priority</h3>
            <ul>
              <li>Day 6-7: Pierce County weekend migration</li>
              <li>Day 8-9: Clark County pilot launch</li>
              <li>Day 10: Yakima County bilingual setup</li>
            </ul>
          </div>
          <div className="timeline-week">
            <h3>Week 3: Quick Wins</h3>
            <ul>
              <li>Day 11-12: Cowlitz custom migration</li>
              <li>Day 13: Grant County deployment</li>
              <li>Day 14: Whatcom County preparation</li>
            </ul>
          </div>
          <div className="timeline-week">
            <h3>Week 4: Development & Polish</h3>
            <ul>
              <li>Day 15-16: Stevens County Pioneer Program</li>
              <li>Day 17: San Juan County transformation</li>
              <li>Day 18-20: Statewide integration testing</li>
              <li>Day 21: Washington State declared "Transcended"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Financial Projections */}
      <div className="financial-projections">
        <h2>📊 Washington State Financial Impact</h2>
        <div className="projection-cards">
          <div className="projection-card">
            <h3>Implementation Revenue</h3>
            <div className="amount">$4.2M</div>
            <div className="detail">One-time setup fees</div>
          </div>
          <div className="projection-card">
            <h3>Annual Recurring</h3>
            <div className="amount">$8.4M</div>
            <div className="detail">Subscription revenue</div>
          </div>
          <div className="projection-card">
            <h3>5-Year Value</h3>
            <div className="amount">$46M</div>
            <div className="detail">Total contract value</div>
          </div>
          <div className="projection-card">
            <h3>County ROI</h3>
            <div className="amount">6-12 mo</div>
            <div className="detail">Payback period</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WashingtonStateIntegration;