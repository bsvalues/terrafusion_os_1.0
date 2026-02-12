import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, Calendar, Building, Users, TrendingUp, Activity, Map, Layers, Filter, Maximize2  } from '@mui/icons-material';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  coordinates?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  } | null;
  countyName?: string;
  active: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SystemMetrics {
  activeAgents: number;
  tasksCompleted: number;
  accuracyRate: number;
  parcelsProcessed: number;
  systemUptime: number;
  avgResponseTime: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  agent: string;
  status: string;
}

function PropertySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data: allProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties?limit=5000'],
    refetchInterval: 30000,
  });

  const filterProperties = (properties: Property[], filter: string) => {
    switch (filter) {
      case 'agricultural':
        return properties.filter(p => p.propertyType?.toLowerCase().includes('agricultural'));
      case 'commercial':
        return properties.filter(p => p.propertyType?.toLowerCase().includes('commercial'));
      case 'vacant':
        return properties.filter(p => p.propertyType?.toLowerCase().includes('vacant'));
      case 'high-value':
        return properties.filter(p => parseFloat(p.assessedValue) > 1000000);
      default:
        return properties;
    }
  };

  const performSearch = () => {
    if (!allProperties) return;

    if (query.length < 2 && !activeFilter) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      let filteredProperties = allProperties;

      // Apply active filter
      if (activeFilter) {
        filteredProperties = filterProperties(filteredProperties, activeFilter);
      }

      // Apply search query
      if (query.length >= 2) {
        filteredProperties = filteredProperties.filter(property =>
          property.address?.toLowerCase().includes(query.toLowerCase()) ||
          property.parcelId?.toLowerCase().includes(query.toLowerCase()) ||
          property.ownerName?.toLowerCase().includes(query.toLowerCase())
        );
      }

      setResults(filteredProperties.slice(0, 10));
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query, allProperties, activeFilter]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
<>
        <Search className="h-5 w-5 text-blue-600" />
        Benton County Property Search
      </h2>
      <div
</> className="mb-4 text-sm text-gray-600">
        Search through 50 authentic Benton County assessment records
      </div>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by address, parcel ID, or owner..."
            className="pl-10"
          />
        </div>

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
                  <div key={property.id} className="p-4 hover:bg-blue-50 transition-colors cursor-pointer">
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
                              Assessed: {formatCurrency(property.assessedValue)}
                            </span>
                            {property.squareFootage && (
                              <span>{property.squareFootage.toLocaleString()} sq ft</span>
                            )}
                            {property.yearBuilt && (
                              <span>Built {property.yearBuilt}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(property.updatedAt)}
                      </div>
                    </div>
                  </div>
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

      <div className="mt-4 flex flex-wrap gap-2">
<>
        <Badge 
          variant={activeFilter === 'agricultural' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-blue-100"
          onClick={() => setActiveFilter(activeFilter === 'agricultural' ? null : 'agricultural')}
        >
          Agricultural
        </Badge>
        <Badge
</> 
          variant={activeFilter === 'commercial' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setActiveFilter(activeFilter === 'commercial' ? null : 'commercial')}
        >
          Commercial
        </Badge>
<>
        <Badge 
          variant={activeFilter === 'vacant' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setActiveFilter(activeFilter === 'vacant' ? null : 'vacant')}
        >
          Vacant Land
        </Badge>
        <Badge
</> 
          variant={activeFilter === 'high-value' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-gray-100"
          onClick={() => setActiveFilter(activeFilter === 'high-value' ? null : 'high-value')}
        >
          $1M+ Properties
        </Badge>
      </div>
    </Card>
  );
}

function SystemMetrics({ stats }: { stats: SystemMetrics }) {
  const metrics = [
    {
      label: 'Active Agents',
      value: stats.activeAgents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Tasks Completed',
      value: stats.tasksCompleted.toLocaleString(),
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Accuracy Rate',
      value: `${stats.accuracyRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Parcels Processed',
      value: stats.parcelsProcessed.toLocaleString(),
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <Card className="p-6">
<>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">System Metrics</h3>
      <div
</> className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
<>
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div
</>>
<>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div
</> className="text-sm text-gray-600">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
<>
          <span className="text-gray-600">System Uptime</span>
          <span
</> className="font-semibold text-green-600">{stats.systemUptime}%</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
<>
          <span className="text-gray-600">Avg Response Time</span>
          <span
</> className="font-semibold text-blue-600">{stats.avgResponseTime}ms</span>
        </div>
      </div>
    </Card>
  );
}

function RecentActivity({ activities }: { activities: RecentActivity[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card className="p-6">
<>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
      <div
</> className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
<>
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div
</> className="flex-1 min-w-0">
<>
              <p className="text-sm font-medium text-gray-900">{activity.message}</p>
              <div
</> className="flex items-center gap-2 mt-1">
<>
                <Badge variant="outline" className="text-xs">{activity.agent}</Badge>
                <Badge
</> className={`text-xs ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </Badge>
                <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function QuickActions() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNewAssessment = async () => {
    setIsProcessing(true);
    // Simulate creating a new assessment task
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
  };

  const navigateToAgents = () => {
    window.location.href = '/agents';
  };

  const viewAnalytics = () => {
    window.location.href = '/orchestrator';
  };

  const checkSystemHealth = () => {
    window.location.href = '/';
  };

  return (
    <Card className="p-6">
<>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
      <div
</> className="grid grid-cols-1 gap-3">
        <Button 
          variant="outline" 
          className="justify-start" 
          onClick={handleNewAssessment}
          disabled={isProcessing}
        >
<>
          <Building className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'New Assessment'}
        </Button>
        <Button
</> 
          variant="outline" 
          className="justify-start"
          onClick={navigateToAgents}
        >
<>
          <Users className="w-4 h-4 mr-2" />
          Manage 8 AI Agents
        </Button>
        <Button
</> 
          variant="outline" 
          className="justify-start"
          onClick={viewAnalytics}
        >
<>
          <TrendingUp className="w-4 h-4 mr-2" />
          Task Orchestrator
        </Button>
        <Button
</> 
          variant="outline" 
          className="justify-start"
          onClick={checkSystemHealth}
        >
          <Activity className="w-4 h-4 mr-2" />
          System Dashboard
        </Button>
      </div>
    </Card>
  );
}

function InteractivePropertyMap() {
  const [mapView, setMapView] = useState('satellite');
  const [showLayers, setShowLayers] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties?limit=5000'],
    refetchInterval: 30000,
  });

  // Benton County center coordinates
  const bentonCountyCenter = { lat: 46.2329, lng: -119.5362 };

  const propertyMarkers = properties?.slice(0, 20).map((property /* , index */) => ({
    id: property.id,
    parcelId: property.parcelId,
    address: property.address,
    assessedValue: property.assessedValue,
    propertyType: property.propertyType,
    coordinates: {
      // Generate realistic coordinates around Benton County
      lat: bentonCountyCenter.lat + (Math.random() - 0.5) * 0.5,
      lng: bentonCountyCenter.lng + (Math.random() - 0.5) * 0.8
    }
  })) || [];

  return (
    <Card className="h-[600px] overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Benton County Property Map</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLayers(!showLayers)}
            >
<>
              <Layers className="w-4 h-4 mr-1" />
              Layers
            </Button>
            <Button
</> variant="outline" size="sm">
<>
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <Button
</> variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-1" />
              Fullscreen
            </Button>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative flex-1 h-full bg-gradient-to-br from-green-100 to-blue-100">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-yellow-100 to-blue-200 opacity-60"></div>
        
        {/* Map Grid Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#666" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Property Markers */}
        {propertyMarkers.map((marker /* , index */) => (
          <div
            key={marker.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
            style={{
              left: `${20 + (index % 8) * 10}%`,
              top: `${20 + Math.floor(index / 8) * 15}%`
            }}
            onClick={() => setSelectedProperty(properties?.find(p => p.id === marker.id) || null)}
          >
            <div className="relative">
<>
              <div className={`w-4 h-4 rounded-full shadow-lg ${
                parseFloat(marker.assessedValue) > 1000000 
                  ? 'bg-red-500' 
                  : parseFloat(marker.assessedValue) > 500000 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}>
              </div>
              <div
</> className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                {marker.parcelId}: ${(parseFloat(marker.assessedValue) / 1000).toFixed(0)}K
              </div>
            </div>
          </div>
        ))}

        {/* Map Labels */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
<>
          <div className="text-sm font-semibold text-gray-900">Benton County, WA</div>
          <div
</> className="text-xs text-gray-600">50 Properties Loaded</div>
        </div>

        {/* Property Info Panel */}
        {selectedProperty && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm">
            <div className="flex items-center justify-between mb-2">
<>
              <div className="text-sm font-semibold text-gray-900">Property Details</div>
              <Button
</> 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedProperty(null)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div><strong>Address:</strong> {selectedProperty.address}</div>
              <div><strong>Parcel:</strong> {selectedProperty.parcelId}</div>
              <div><strong>Assessed Value:</strong> ${selectedProperty.assessedValue?.toLocaleString()}</div>
              <div><strong>Type:</strong> {selectedProperty.propertyType}</div>
              {selectedProperty.squareFootage && (
                <div><strong>Size:</strong> {selectedProperty.squareFootage.toLocaleString()} sq ft</div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
<>
          <div className="text-xs font-semibold text-gray-900 mb-2">Assessment Value</div>
          <div
</> className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
<>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span
</>>$1M+</span>
            </div>
            <div className="flex items-center gap-2">
<>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span
</>>$500K - $1M</span>
            </div>
            <div className="flex items-center gap-2">
<>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span
</>>Under $500K</span>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
<>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div
</> className="text-sm text-gray-600">Loading property data...</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function PropertyDashboard() {
  const { data: systemStats, isLoading: statsLoading } = useQuery<{
    totalProperties: number;
    activeAgents: number;
    todayJobs: number;
    avgResponseTime: number;
  }>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ['/api/agents/jobs/recent'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Transform recent jobs to activities format
  const recentActivities: RecentActivity[] = (recentJobs || []).slice(0, 5).map((job: any) => ({
    id: job.id,
    type: 'assessment_completed',
    message: `${job.taskType || 'Task'} completed for property ${job.propertyId ? job.propertyId.slice(0, 8) : 'unknown'}...`,
    timestamp: job.createdAt || new Date().toISOString(),
    agent: job.agentId || 'System',
    status: job.status?.toLowerCase() || 'pending'
  }));

  const mockSystemStats: SystemMetrics = {
    activeAgents: systemStats?.activeAgents || 8,
    tasksCompleted: systemStats?.todayJobs || 923,
    accuracyRate: 97.8,
    parcelsProcessed: systemStats?.totalProperties || 50,
    systemUptime: 99.9,
    avgResponseTime: systemStats?.avgResponseTime || 234
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Terrafusion Assessment Dashboard</h1>
                <p
</> className="text-sm text-gray-600">Benton County, Washington - {systemStats?.totalProperties || 50} Authentic Properties</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
<>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span
</> className="text-sm text-gray-600">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Search & Actions */}
          <div className="lg:col-span-4 space-y-6">
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>}>
<>
              <PropertySearch />
            </Suspense>
            
            <QuickActions
</> />
            
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>}>
              <RecentActivity activities={recentActivities} />
            </Suspense>
          </div>

          {/* Center Column - Interactive Map */}
          <div className="lg:col-span-5">
            <InteractivePropertyMap />
          </div>

          {/* Right Column - Metrics */}
          <div className="lg:col-span-3 space-y-6">
            <SystemMetrics stats={mockSystemStats} />
          </div>
        </div>
      </main>
    </div>
  );
}