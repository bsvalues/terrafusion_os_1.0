import React, { useState, useEffect } from 'react';
import { 
  Construction, 
  Wrench, 
  ClipboardList, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MapPin,
  Activity,
  Users,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  Truck,
  Building,
  Settings,
  Zap,
  Droplets,
  Waves,
  Traffic,
  TreePine,
  Home,
  AlertCircle,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';

const TERRAFUSION_COLORS = {
  primary: '#2B4F7D',
  secondary: '#1C3A5C',
  accent: '#4A90A4',
  success: '#8FBC8F',
  warning: '#F4A460',
  error: '#CD5C5C',
  text: '#2D3748',
  background: '#F7FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0'
};

const CHART_COLORS = ['#2B4F7D', '#4A90A4', '#8FBC8F', '#F4A460', '#87CEEB', '#DDA0DD'];

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
  specifications: Record<string, any>;
}

interface WorkOrder {
  id: string;
  work_order_number: string;
  asset_id: string;
  priority: number;
  title: string;
  description: string;
  created_date: string;
  requested_by: string;
  assigned_to: string;
  estimated_hours: number;
  estimated_cost: number;
  status: string;
  due_date: string;
  completion_date: string | null;
  materials_required: string[];
  safety_requirements: string[];
}

interface CapitalProject {
  id: string;
  project_number: string;
  project_name: string;
  project_type: string;
  status: string;
  description: string;
  budget_allocated: number;
  budget_spent: number;
  start_date: string;
  estimated_completion: string;
  actual_completion: string | null;
  project_manager: string;
  contractor: string;
  location: string;
  assets_affected: string[];
  environmental_impact: string;
  community_impact: string;
}

const PublicWorksPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [capitalProjects, setCapitalProjects] = useState<CapitalProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, assetsRes, workOrdersRes, projectsRes] = await Promise.all([
        fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/status'),
        fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/assets'),
        fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/work-orders'),
        fetch('http://localhost:\${{TF_PORT_5320:-5320}}/api/public-works/capital-projects')
      ]);

      const [statusData, assetsData, workOrdersData, projectsData] = await Promise.all([
        statusRes.json(),
        assetsRes.json(),
        workOrdersRes.json(),
        projectsRes.json()
      ]);

      setSystemStatus(statusData);
      setAssets(assetsData.assets || []);
      setWorkOrders(workOrdersData.work_orders || []);
      setCapitalProjects(projectsData.capital_projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType) {
      case 'road': return <Construction className="h-5 w-5" />;
      case 'bridge': return <Building className="h-5 w-5" />;
      case 'water_main': return <Droplets className="h-5 w-5" />;
      case 'sewer_line': return <Waves className="h-5 w-5" />;
      case 'traffic_signal': return <Traffic className="h-5 w-5" />;
      case 'street_light': return <Zap className="h-5 w-5" />;
      case 'park_facility': return <TreePine className="h-5 w-5" />;
      case 'building': return <Home className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'failed': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-700 bg-red-100';
      case 2: return 'text-orange-700 bg-orange-100';
      case 3: return 'text-yellow-700 bg-yellow-100';
      case 4: return 'text-blue-700 bg-blue-100';
      case 5: return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Emergency';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      case 5: return 'Routine';
      default: return 'Unknown';
    }
  };

  const getAssetConditionData = () => {
    const conditionCounts = assets.reduce((acc, asset) => {
      acc[asset.current_condition] = (acc[asset.current_condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(conditionCounts).map(([condition, count]) => ({
      name: condition.charAt(0).toUpperCase() + condition.slice(1),
      value: count
    }));
  };

  const getAssetTypeData = () => {
    const typeCounts = assets.reduce((acc, asset) => {
      const type = asset.asset_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const getWorkOrderPriorityData = () => {
    const priorityCounts = workOrders.reduce((acc, wo) => {
      const priorityLabel = getPriorityLabel(wo.priority);
      acc[priorityLabel] = (acc[priorityLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count
    }));
  };

  const getProjectBudgetData = () => {
    return capitalProjects.map(project => ({
      name: project.project_name.substring(0, 20) + '...',
      allocated: project.budget_allocated,
      spent: project.budget_spent,
      remaining: project.budget_allocated - project.budget_spent
    }));
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || asset.asset_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* System Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900">{systemStatus.infrastructure_overview?.total_assets || 0}</p>
                <p className="text-sm text-blue-600">{systemStatus.infrastructure_overview?.critical_assets || 0} Critical</p>
              </div>
              <Construction className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-3xl font-bold text-gray-900">{systemStatus.infrastructure_overview?.average_condition_score || 0}%</p>
                <p className="text-sm text-green-600">Average Condition</p>
              </div>
              <Activity className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Work Orders</p>
                <p className="text-3xl font-bold text-gray-900">{systemStatus.work_management?.active_work_orders || 0}</p>
                <p className="text-sm text-yellow-600">{systemStatus.work_management?.emergency_orders || 0} Emergency</p>
              </div>
              <ClipboardList className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capital Budget</p>
                <p className="text-3xl font-bold text-gray-900">${((systemStatus.capital_projects?.budget_allocated || 0) / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-purple-600">{systemStatus.capital_projects?.active_projects || 0} Active Projects</p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Statistics */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Road Network</h3>
              <Construction className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{systemStatus.infrastructure_overview?.road_miles || 0}</p>
            <p className="text-sm text-gray-600">Miles Managed</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Bridges</h3>
              <Building className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{systemStatus.infrastructure_overview?.bridges_managed || 0}</p>
            <p className="text-sm text-gray-600">Structures</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Water System</h3>
              <Droplets className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{systemStatus.infrastructure_overview?.water_main_miles || 0}</p>
            <p className="text-sm text-gray-600">Miles of Mains</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Sewer System</h3>
              <Waves className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{systemStatus.infrastructure_overview?.sewer_line_miles || 0}</p>
            <p className="text-sm text-gray-600">Miles of Lines</p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Condition Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Condition Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getAssetConditionData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getAssetConditionData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Type Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getAssetTypeData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={TERRAFUSION_COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Work Order Priorities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Order Priorities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getWorkOrderPriorityData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={TERRAFUSION_COLORS.warning} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Capital Project Budgets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Capital Project Budgets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getProjectBudgetData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, 'Budget']} />
              <Bar dataKey="allocated" fill={TERRAFUSION_COLORS.accent} name="Allocated" />
              <Bar dataKey="spent" fill={TERRAFUSION_COLORS.success} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      {systemStatus?.performance_metrics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{systemStatus.performance_metrics.system_reliability}%</div>
              <div className="text-sm text-gray-600">System Reliability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{systemStatus.performance_metrics.maintenance_efficiency}%</div>
              <div className="text-sm text-gray-600">Maintenance Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{systemStatus.performance_metrics.customer_satisfaction}%</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{systemStatus.performance_metrics.budget_utilization}%</div>
              <div className="text-sm text-gray-600">Budget Utilization</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Infrastructure Assets</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add New Asset
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search assets by name, number, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="road">Roads</option>
            <option value="bridge">Bridges</option>
            <option value="water_main">Water Mains</option>
            <option value="sewer_line">Sewer Lines</option>
            <option value="traffic_signal">Traffic Signals</option>
            <option value="street_light">Street Lights</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criticality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Inspection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full">
                        {getAssetTypeIcon(asset.asset_type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-500">{asset.asset_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.asset_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {asset.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(asset.current_condition)}`}>
                        {asset.current_condition}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">{asset.condition_score.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${asset.criticality_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{asset.criticality_score.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(asset.next_inspection), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        <Wrench className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWorkOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Work Orders</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Create Work Order
        </button>
      </div>

      <div className="space-y-4">
        {workOrders.map((workOrder) => (
          <div key={workOrder.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <ClipboardList className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{workOrder.title}</h3>
                  <p className="text-sm text-gray-600">{workOrder.work_order_number}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(workOrder.priority)}`}>
                  {getPriorityLabel(workOrder.priority)}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  workOrder.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  workOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {workOrder.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                Assigned: {workOrder.assigned_to}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                Est. Hours: {workOrder.estimated_hours}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2" />
                Est. Cost: ${workOrder.estimated_cost.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Created: {format(new Date(workOrder.created_date), 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="h-4 w-4 mr-2" />
                Due: {format(new Date(workOrder.due_date), 'MMM dd, yyyy')}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
              <p className="text-gray-600">{workOrder.description}</p>
            </div>

            {workOrder.materials_required.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Materials Required:</h4>
                <div className="flex flex-wrap gap-2">
                  {workOrder.materials_required.map((material, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {workOrder.safety_requirements.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Safety Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                  {workOrder.safety_requirements.map((requirement, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {requirement}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Requested by: {workOrder.requested_by}
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
                <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Capital Projects</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New Project
        </button>
      </div>

      <div className="space-y-6">
        {capitalProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{project.project_name}</h3>
                <p className="text-sm text-gray-600">{project.project_number} • {project.project_type}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'construction' ? 'bg-blue-100 text-blue-800' :
                project.status === 'design' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                PM: {project.project_manager}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Truck className="h-4 w-4 mr-2" />
                Contractor: {project.contractor}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                Location: {project.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Expected: {format(new Date(project.estimated_completion), 'MMM dd, yyyy')}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Project Description:</h4>
              <p className="text-gray-600">{project.description}</p>
            </div>

            {/* Budget Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Budget Progress</h4>
                <span className="text-sm text-gray-600">
                  ${project.budget_spent.toLocaleString()} / ${project.budget_allocated.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full" 
                  style={{ width: `${(project.budget_spent / project.budget_allocated) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {((project.budget_spent / project.budget_allocated) * 100).toFixed(1)}% utilized
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Environmental Impact:</h4>
                <p className="text-blue-800 text-sm">{project.environmental_impact}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Community Impact:</h4>
                <p className="text-green-800 text-sm">{project.community_impact}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Started: {format(new Date(project.start_date), 'MMM dd, yyyy')}
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                  Update Progress
                </button>
                <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors">
                  View Timeline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Infrastructure Dashboard', icon: BarChart3 },
    { id: 'assets', label: 'Asset Management', icon: Construction },
    { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
    { id: 'projects', label: 'Capital Projects', icon: Building }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Construction className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TerraFusion Public Works Infrastructure</h1>
                <p className="text-sm text-gray-500">
                  {systemStatus ? `${systemStatus.county} • Director: ${systemStatus.public_works_director}` : 'Benton County, Washington'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {systemStatus ? `${systemStatus.operations?.maintenance_crews || 0} Crews` : 'System Loading...'}
                </div>
                <div className="text-xs text-gray-500">
                  {systemStatus ? `${systemStatus.operations?.fleet_vehicles || 0} Fleet Vehicles` : 'Please wait...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'assets' && renderAssets()}
            {activeTab === 'work-orders' && renderWorkOrders()}
            {activeTab === 'projects' && renderProjects()}
          </>
        )}
      </main>
    </div>
  );
};

export default PublicWorksPortal;