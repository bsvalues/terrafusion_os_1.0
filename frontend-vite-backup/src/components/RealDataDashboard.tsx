import React, {useState} from 'react';

import {useRealData, usePropertySearch, usePermits} from '../hooks/useRealData';
import {realDataService} from '../services/RealDataService';

interface RealDataDashboardProps {className?: string;}

const RealDataDashboard: React.FC<RealDataDashboardProps> = ({className = ''}) => {const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'permits' | 'health'>(
    'overview'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const {
    connectionStatus,
    propertyStats,
    databaseHealth,
    isConnectionLoading,
    isStatsLoading,
    isHealthLoading,
    refreshAll,} = useRealData();

  const {properties,
    search: searchProperties,
    isLoading: isSearchLoading,
    clearResults,} = usePropertySearch();

  const {permits, loadPermits, isLoading: isPermitsLoading} = usePermits();

  const handleSearch = async (e: React.FormEvent) =>{e.preventDefault();
    if (searchQuery.trim()) {
      await searchProperties(searchQuery.trim());}
  };

  const handleLoadPermits = async () => {await loadPermits(1, 20);};

  const getConnectionStatusIcon = () => {if (isConnectionLoading) return '⏳';
    if (!connectionStatus) return '❌';
    if (connectionStatus.realPacsConnected && connectionStatus.terrafusionSyncConnected)
      return '✅';
    return '⚠️';};

  const getConnectionStatusText = () => {
    if (isConnectionLoading) return 'Checking connections...';
    if (!connectionStatus) return 'Connection status unknown';

    const connected = [
      connectionStatus.realPacsConnected && 'Harris PACS',
      connectionStatus.terrafusionSyncConnected && 'Terrafusion Sync',
      connectionStatus.propertiesDbConnected && 'Properties DB',
    ].filter(Boolean);

    if (connected.length === 3) return 'All databases connected';
    if (connected.length === 0) return 'No databases connected';
    return `${connected.join(', ')} connected`;
  };

  return (<div className={`tf-real-data-dashboard ${className}`}>{/* Header */}<div className='tf-dashboard-header'><div className='tf-header-title'><h2>🏛️ Benton County Real Data</h2><div className='tf-connection-status'><span className='tf-status-icon'>{getConnectionStatusIcon()}</span><span className='tf-status-text'>{getConnectionStatusText()}</span></div></div><button
          className='tf-btn-secondary tf-refresh-btn'
          onClick={refreshAll}
          disabled={isConnectionLoading || isStatsLoading}
        >🔄 Refresh Data</button></div>{/* Tab Navigation */}<div className='tf-tab-navigation'><button
          className={`tf-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() =>setActiveTab('overview')}
        >
          Overview</button><button
          className={`tf-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() =>setActiveTab('properties')}
        >
          Properties</button><button
          className={`tf-tab ${activeTab === 'permits' ? 'active' : ''}`}
          onClick={() =>setActiveTab('permits')}
        >
          Permits</button><button
          className={`tf-tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() =>setActiveTab('health')}
        >
          Database Health</button></div>{/* Tab Content */}<div className='tf-tab-content'>{/* Overview Tab */}
        {activeTab === 'overview' && (<div className='tf-overview-grid'><div className='tf-card'><h3>Property Statistics</h3>{isStatsLoading ? (<div className='tf-loading'>Loading statistics...</div>) : propertyStats ? (<div className='tf-stats-grid'><div className='tf-metric'><div className='tf-metric-value'>{realDataService.formatNumber(propertyStats.totalProperties)}</div><div className='tf-metric-label'>Total Properties</div></div><div className='tf-metric'><div className='tf-metric-value'>{realDataService.formatNumber(propertyStats.totalPermits)}</div><div className='tf-metric-label'>Building Permits</div></div><div className='tf-metric'><div className='tf-metric-value'>{realDataService.formatCurrency(propertyStats.totalAssessedValue)}</div><div className='tf-metric-label'>Total Assessed Value</div></div><div className='tf-metric'><div className='tf-metric-value'>{realDataService.formatCurrency(propertyStats.averageAssessedValue)}</div><div className='tf-metric-label'>Average Property Value</div></div></div>) : (<div className='tf-error'>Failed to load property statistics</div>)}</div><div className='tf-card'><h3>Real-Time Status</h3><div className='tf-status-grid'><div className='tf-status-item'><span className='tf-status-label'>Harris PACS:</span><span
                    className={`tf-status-indicator ${connectionStatus?.realPacsConnected ? 'connected' : 'disconnected'}`}
                  >{connectionStatus?.realPacsConnected ? '🟢 Connected' : '🔴 Disconnected'}</span></div><div className='tf-status-item'><span className='tf-status-label'>Terrafusion Sync:</span><span
                    className={`tf-status-indicator ${connectionStatus?.terrafusionSyncConnected ? 'connected' : 'disconnected'}`}
                  >{connectionStatus?.terrafusionSyncConnected
                      ? '🟢 Connected'
                      : '🔴 Disconnected'}</span></div><div className='tf-status-item'><span className='tf-status-label'>Properties DB:</span><span
                    className={`tf-status-indicator ${connectionStatus?.propertiesDbConnected ? 'connected' : 'disconnected'}`}
                  >{connectionStatus?.propertiesDbConnected ? '🟢 Connected' : '🔴 Disconnected'}</span></div></div>{connectionStatus?.lastChecked && (<div className='tf-last-updated'>Last checked: {realDataService.formatDate(connectionStatus.lastChecked)}</div>)}</div></div>)}

        {/* Properties Tab */}
        {activeTab === 'properties' && (<div className='tf-properties-tab'><div className='tf-search-section'><form onSubmit={handleSearch} className='tf-search-form'><div className='tf-search-input-group'><input
                    type='text'
                    placeholder='Search by parcel ID, address, or owner name...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='tf-search-input'
                  /><button type='submit' className='tf-btn-primary' disabled={isSearchLoading}>{isSearchLoading ? '⏳' : '🔍'} Search</button><button
                    type='button'
                    onClick={clearResults}
                    className='tf-btn-secondary'
                    disabled={properties.length === 0}
                  >Clear</button></div></form></div>{properties.length > 0 && (<div className='tf-properties-results'><h3>Search Results ({properties.length})</h3><div className='tf-properties-table'><div className='tf-table-header'><div>Parcel ID</div><div>Address</div><div>Owner</div><div>Assessed Value</div><div>Property Type</div></div>{properties.map((property) => (<div key={property.parcelId} className='tf-table-row'><div className='tf-parcel-id'>{property.parcelId}</div><div className='tf-address'>{property.address}</div><div className='tf-owner'>{property.ownerName}</div><div className='tf-value'>{realDataService.formatCurrency(property.assessedValue)}</div><div className='tf-type'>{property.propertyType}</div></div>))}</div></div>)}</div>)}

        {/* Permits Tab */}
        {activeTab === 'permits' && (<div className='tf-permits-tab'><div className='tf-permits-header'><h3>Recent Building Permits</h3><button
                onClick={handleLoadPermits}
                className='tf-btn-primary'
                disabled={isPermitsLoading}
              >{isPermitsLoading ? '⏳ Loading...' : '📋 Load Permits'}</button></div>{permits.length > 0 && (<div className='tf-permits-table'><div className='tf-table-header'><div>Permit #</div><div>Type</div><div>Parcel ID</div><div>Description</div><div>Status</div><div>Value</div></div>{permits.map((permit) => (<div key={permit.permitNumber} className='tf-table-row'><div className='tf-permit-number'>{permit.permitNumber}</div><div className='tf-permit-type'>{permit.permitType}</div><div className='tf-parcel-id'>{permit.parcelId}</div><div className='tf-description'>{permit.description}</div><div className={`tf-status ${permit.status.toLowerCase()}`}>{permit.status}</div><div className='tf-value'>{permit.estimatedValue
                        ? realDataService.formatCurrency(permit.estimatedValue)
                        : 'N/A'}</div></div>))}</div>)}</div>)}

        {/* Database Health Tab */}
        {activeTab === 'health' && (<div className='tf-health-tab'><h3>Database Health Monitor</h3>{isHealthLoading ? (<div className='tf-loading'>Checking database health...</div>) : databaseHealth ? (<div className='tf-health-grid'>{Object.entries(databaseHealth.databases).map(([name, info]) => (<div key={name} className='tf-db-health-card'><h4>{name}</h4><div className='tf-health-info'><div className='tf-health-row'><span>Status:</span><span
                          className={`tf-status ${info.isAccessible ? 'healthy' : 'unhealthy'}`}
                        >{info.isAccessible ? '✅ Accessible' : '❌ Not Accessible'}</span></div><div className='tf-health-row'><span>Size:</span><span>{realDataService.formatFileSize(info.sizeBytes)}</span></div><div className='tf-health-row'><span>Tables:</span><span>{info.tableCount}</span></div><div className='tf-health-row'><span>Records:</span><span>{realDataService.formatNumber(info.recordCount)}</span></div><div className='tf-health-row'><span>Last Modified:</span><span>{realDataService.formatDate(info.lastModified)}</span></div>{info.error && (<div className='tf-health-error'><strong>Error:</strong>{info.error}</div>)}</div></div>))}</div>) : (<div className='tf-error'>Failed to load database health information</div>)}</div>)}</div></div>
  );
};

export default RealDataDashboard;
