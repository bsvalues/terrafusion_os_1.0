// Terrafusion Dashboard - Complete Frontend Implementation
// File: app/dashboard/page.tsx

import { Suspense } from 'react';
import { Metadata } from 'next';
import { PropertySearch } from '@/components/property/PropertySearch';
import { AgentControlPanel } from '@/components/agents/AgentControlPanel';
import { PropertyMap } from '@/components/property/PropertyMap';
import { SystemMetrics } from '@/components/dashboard/SystemMetrics';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';

export const metadata: Metadata = {
  title: 'Terrafusion Dashboard - Property Assessment Control Center',
  description: 'Real-time property assessment dashboard with AI agent management',
};

export default async function DashboardPage() {
  // Server-side data fetching
  const systemStats = await getSystemMetrics();
  const recentActivities = await getRecentActivities();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TF</span>
              </div>
              <div>
<>
                <h1 className="text-2xl font-bold text-gray-900">Assessment Dashboard</h1>
                <p
</> className="text-sm text-gray-600">Benton County, Washington</p>
              </div>
            </div>
            <SystemStatusIndicator />
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Search & Actions */}
          <div className="lg:col-span-4 space-y-6">
            <Suspense fallback={<PropertySearchSkeleton />}>
<>
              <PropertySearch />
            </Suspense>
            
            <QuickActions
</> />
            
            <Suspense fallback={<ActivitySkeleton />}>
              <RecentActivity activities={recentActivities} />
            </Suspense>
          </div>

          {/* Center Column - Map */}
          <div className="lg:col-span-5">
            <Suspense fallback={<MapSkeleton />}>
              <PropertyMap />
            </Suspense>
          </div>

          {/* Right Column - Agents & Metrics */}
          <div className="lg:col-span-3 space-y-6">
            <SystemMetrics stats={systemStats} />
            
            <Suspense fallback={<AgentPanelSkeleton />}>
              <AgentControlPanel />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

// Server-side data functions
async function getSystemMetrics() {
  // In production, this would fetch from your Rust API
  return {
    activeAgents: 15,
    tasksCompleted: 2847,
    accuracyRate: 97.8,
    parcelsProcessed: 47831,
    systemUptime: 99.9,
    avgResponseTime: 234
  };
}

async function getRecentActivities() {
  return [
    {
      id: '1',
      type: 'assessment_completed',
      message: 'Property assessment completed for 123 Main St',
      timestamp: new Date().toISOString(),
      agent: 'NarratorAI',
      status: 'success'
    },
    {
      id: '2', 
      type: 'exemption_analyzed',
      message: 'Senior exemption eligibility confirmed',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      agent: 'ExemptionSeer',
      status: 'success'
    }
  ];
}

// ============================================================================
// PROPERTY SEARCH COMPONENT
// ============================================================================

// File: components/property/PropertySearch.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Calendar, DollarSign  } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Property } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function PropertySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.searchProperties(searchQuery, 'benton-county');
      if (response.success && response.data) {
        setResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
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
    router.push(`/property/${property.id}`);
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
                          <div>Parcel: {property.parcel_id}</div>
                          <div
</> className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(property.assessed_value)}
                            </span>
                            {property.square_feet && (
                              <span>{property.square_feet.toLocaleString()} sq ft</span>
                            )}
                            {property.year_built && (
                              <span>Built {property.year_built}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(property.last_assessment_date)}
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

// ============================================================================
// INTERACTIVE MAP COMPONENT
// ============================================================================

// File: components/property/PropertyMap.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, MapPin, Layers, Maximize2  } from '@mui/icons-material';

// Note: In production, this would use Mapbox GL JS
export function PropertyMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('satellite');

  useEffect(() => {
    // Initialize map here
    // For demo, we'll simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const layers = [
    { id: 'satellite', name: 'Satellite', icon: '🛰️' },
    { id: 'parcels', name: 'Parcels', icon: '🏘️' },
    { id: 'zoning', name: 'Zoning', icon: '📋' },
    { id: 'flood', name: 'Flood Zones', icon: '🌊' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] relative">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-10">
        <div className="flex justify-between items-center p-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
<>
            <Map className="w-5 h-5 text-blue-600" />
            Property Map
          </h3>
          <div
</> className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-20 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
<>
        <div className="text-xs font-medium text-gray-600 mb-2 px-2">Layers</div>
        <div
</> className="space-y-1">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                activeLayer === layer.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{layer.icon}</span>
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer}
        className="w-full h-full pt-16 bg-gradient-to-br from-green-100 to-blue-100 relative"
      >
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
<>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p
</> className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mock Map Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50">
              {/* Property Markers */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" />
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                    123 Main Street
                  </div>
                </div>
              </div>
              
              {/* Additional property markers */}
              <div className="absolute top-1/3 left-2/3">
<>
                <MapPin className="w-6 h-6 text-blue-500 drop-shadow-lg" />
              </div>
              <div
</> className="absolute bottom-1/3 right-1/3">
                <MapPin className="w-6 h-6 text-green-500 drop-shadow-lg" />
              </div>

              {/* Map Info */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
<>
                <div className="font-medium text-gray-800">Benton County, WA</div>
                <div
</> className="text-gray-600">47,831 parcels • 672 sq mi</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Property Info Panel */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="text-sm">
<>
          <div className="font-medium text-gray-800 mb-2">Selected Property</div>
          <div
</> className="space-y-1 text-gray-600">
<>
            <div>123 Main Street, Richland, WA</div>
            <div
</>>Parcel: 1102234412</div>
<>
            <div>Assessed: $485,200</div>
            <div
</>>Type: Residential</div>
          </div>
          <button className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors">
            View Property Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AGENT CONTROL PANEL
// ============================================================================

// File: components/agents/AgentControlPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings, Activity, CheckCircle, AlertCircle, Clock  } from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'processing';
  activeTasks: number;
  completedTasks: number;
  successRate: number;
  avgResponseTime: number;
}

export function AgentControlPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { messages, sendMessage } = useWebSocket();

  useEffect(() => {
    // Initialize with mock agents - replace with API call
    setAgents([
      {
        id: 'narrator-ai',
        name: 'NarratorAI',
        description: 'Assessment storyteller and explanation generator',
        status: 'active',
        activeTasks: 3,
        completedTasks: 1247,
        successRate: 98.2,
        avgResponseTime: 1340
      },
      {
        id: 'exemption-seer',
        name: 'ExemptionSeer',
        description: 'Tax exemption eligibility specialist',
        status: 'processing',
        activeTasks: 1,
        completedTasks: 487,
        successRate: 99.1,
        avgResponseTime: 890
      },
      {
        id: 'sales-validator',
        name: 'SalesValidator',
        description: 'Market analysis and sales validation expert',
        status: 'active',
        activeTasks: 2,
        completedTasks: 2156,
        successRate: 96.7,
        avgResponseTime: 2100
      },
      {
        id: 'cost-analyzer',
        name: 'CostAnalyzer',
        description: 'Replacement cost and depreciation analysis',
        status: 'idle',
        activeTasks: 0,
        completedTasks: 1543,
        successRate: 94.8,
        avgResponseTime: 1890
      }
    ]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'idle':
        return <Pause className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'idle':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
<>
          <Bot className="w-6 h-6 text-blue-600" />
          AI Agents
        </h3>
        <span
</> className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          {agents.filter(a => a.status === 'active').length} Active
        </span>
      </div>

      {/* Agent Grid */}
      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
              selectedAgent === agent.id 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(agent.status)}
<>
                  <h4 className="font-semibold text-gray-800">{agent.name}</h4>
                  <span
</> className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                
                {/* Agent Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
<>
                    <div className="text-gray-500">Active Tasks</div>
                    <div
</> className="font-semibold text-blue-600">{agent.activeTasks}</div>
                  </div>
                  <div>
<>
                    <div className="text-gray-500">Success Rate</div>
                    <div
</> className="font-semibold text-green-600">{agent.successRate}%</div>
                  </div>
                  <div>
<>
                    <div className="text-gray-500">Completed</div>
                    <div
</> className="font-semibold">{agent.completedTasks.toLocaleString()}</div>
                  </div>
                  <div>
<>
                    <div className="text-gray-500">Avg Response</div>
                    <div
</> className="font-semibold">{agent.avgResponseTime}ms</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 ml-4">
                <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
<>
                  <Play className="w-4 h-4" />
                </button>
                <button
</> className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Agent Details */}
            {selectedAgent === agent.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
<>
                    <h5 className="font-medium text-gray-800 mb-2">Recent Activity</h5>
                    <div
</> className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
<>
                        <span>Property assessment completed</span>
                        <span
</> className="text-gray-500">2m ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
<>
                        <span>Exemption analysis finished</span>
                        <span
</> className="text-gray-500">5m ago</span>
                      </div>
                    </div>
                  </div>
                  <div>
<>
                    <h5 className="font-medium text-gray-800 mb-2">Performance</h5>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between text-sm">
<>
                        <span>Tasks Today</span>
                        <span
</> className="font-semibold">24</span>
                      </div>
                      <div className="flex justify-between text-sm">
<>
                        <span>Avg Confidence</span>
                        <span
</> className="font-semibold">96.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
<>
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors">
                    Launch Agent
                  </button>
                  <button
</> className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-50 transition-colors">
                    View Logs
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Launch */}
      <div className="mt-6 pt-6 border-t border-gray-200">
<>
        <h4 className="font-medium text-gray-800 mb-3">Quick Actions</h4>
        <div
</> className="grid grid-cols-2 gap-3">
<>
          <button className="bg-purple-100 text-purple-700 py-2 px-3 rounded-md text-sm hover:bg-purple-200 transition-colors">
            Batch Assessment
          </button>
          <button
</> className="bg-green-100 text-green-700 py-2 px-3 rounded-md text-sm hover:bg-green-200 transition-colors">
            Exemption Scan
          </button>
<>
          <button className="bg-blue-100 text-blue-700 py-2 px-3 rounded-md text-sm hover:bg-blue-200 transition-colors">
            Market Analysis
          </button>
          <button
</> className="bg-orange-100 text-orange-700 py-2 px-3 rounded-md text-sm hover:bg-orange-200 transition-colors">
            Compliance Check
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SYSTEM METRICS COMPONENT
// ============================================================================

// File: components/dashboard/SystemMetrics.tsx

interface SystemMetricsProps {
  stats: {
    activeAgents: number;
    tasksCompleted: number;
    accuracyRate: number;
    parcelsProcessed: number;
    systemUptime: number;
    avgResponseTime: number;
  };
}

export function SystemMetrics({ stats }: SystemMetricsProps) {
  const metrics = [
    {
      label: 'Active Agents',
      value: stats.activeAgents,
      change: '+3 from yesterday',
      icon: '🤖',
      color: 'text-blue-600'
    },
    {
      label: 'Tasks Completed',
      value: stats.tasksCompleted.toLocaleString(),
      change: '+12% efficiency',
      icon: '⚡',
      color: 'text-green-600'
    },
    {
      label: 'Accuracy Rate',
      value: `${stats.accuracyRate}%`,
      change: 'IAAO Compliant',
      icon: '🎯',
      color: 'text-purple-600'
    },
    {
      label: 'Parcels Processed',
      value: stats.parcelsProcessed.toLocaleString(),
      change: 'Benton County',
      icon: '🏘️',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
<>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h3>
      
      <div
</> className="grid grid-cols-1 gap-4">
        {metrics.map((metric /* , index */) => (
          <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
<>
              <span className="text-2xl">{metric.icon}</span>
              <div
</> className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
            </div>
<>
            <div className="text-sm font-medium text-gray-800 mb-1">
              {metric.label}
            </div>
            <div
</> className="text-xs text-gray-500">
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
<>
          <span className="text-sm font-medium text-gray-700">System Health</span>
          <div
</> className="flex items-center gap-2">
<>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span
</> className="text-sm text-green-600 font-medium">Optimal</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Uptime: {stats.systemUptime}% • Response: {stats.avgResponseTime}ms
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WEBSOCKET HOOK
// ============================================================================

// File: hooks/useWebSocket.ts

import { useEffect, useRef, useState } from 'react';

export function useWebSocket() {
  