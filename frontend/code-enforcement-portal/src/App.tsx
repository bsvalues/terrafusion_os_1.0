import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MapPin,
  DollarSign,
  Users,
  Clock,
  Search,
  Filter,
  Eye,
  Edit,
  XCircle,
  HardHat,
  Clipboard,
  Home,
  Zap,
  Wrench,
  Flame,
  Shield,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

interface BuildingPermit {
  permit_id: string;
  permit_type: string;
  property_address: string;
  parcel_id: string;
  applicant_name: string;
  contractor_info: {
    name: string;
    license: string;
    phone: string;
  };
  project_description: string;
  estimated_value: number;
  permit_fee: number;
  application_date: string;
  status: string;
  inspections_required: string[];
  inspections_completed: Array<{
    type: string;
    date: string;
    result: string;
  }>;
  approval_conditions: string[];
}

interface CodeViolation {
  violation_id: string;
  property_address: string;
  violation_type: string;
  code_section: string;
  description: string;
  severity_level: number;
  status: string;
  citation_date: string;
  compliance_deadline: string;
  enforcement_actions: Array<{
    action: string;
    date: string;
  }>;
  resolution_notes: string;
}

interface InspectionRecord {
  inspection_id: string;
  permit_id: string;
  inspection_type: string;
  scheduled_date: string;
  inspector_id: string;
  status: string;
  findings: string[];
  violations_noted: string[];
  approval_status: string;
  reinspection_required: boolean;
}

const CodeEnforcementPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [permits, setPermits] = useState<BuildingPermit[]>([]);
  const [violations, setViolations] = useState<CodeViolation[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permitsRes, violationsRes, inspectionsRes] = await Promise.all([
        fetch('http://localhost:\${{TF_PORT_5380:-5380}}/permits'),
        fetch('http://localhost:\${{TF_PORT_5380:-5380}}/violations'),
        fetch('http://localhost:\${{TF_PORT_5380:-5380}}/inspections')
      ]);

      const [permitsData, violationsData, inspectionsData] = await Promise.all([
        permitsRes.json(),
        violationsRes.json(),
        inspectionsRes.json()
      ]);

      setPermits(permitsData);
      setViolations(violationsData);
      setInspections(inspectionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardMetrics = () => {
    const totalPermits = permits.length;
    const activePermits = permits.filter(p => p.status === 'Under Review' || p.status === 'Ready for Inspection').length;
    const totalRevenue = permits.reduce((sum, p) => sum + p.permit_fee, 0);
    const openViolations = violations.filter(v => v.status === 'Open').length;
    const pendingInspections = inspections.filter(i => i.status === 'Scheduled').length;
    const totalValue = permits.reduce((sum, p) => sum + p.estimated_value, 0);

    return {
      totalPermits,
      activePermits,
      totalRevenue,
      openViolations,
      pendingInspections,
      totalValue
    };
  };

  const getPermitTypeData = () => {
    const typeCounts = permits.reduce((acc, permit) => {
      acc[permit.permit_type] = (acc[permit.permit_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const getMonthlyPermitData = () => {
    const monthlyData = permits.reduce((acc, permit) => {
      const month = format(new Date(permit.application_date), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, count]) => ({ month, permits: count }));
  };

  const getViolationSeverityData = () => {
    const severityCounts = violations.reduce((acc, violation) => {
      const severity = violation.severity_level === 3 ? 'High' : violation.severity_level === 2 ? 'Medium' : 'Low';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity,
      value: count
    }));
  };

  const getInspectionStatusData = () => {
    const statusCounts = inspections.reduce((acc, inspection) => {
      acc[inspection.status] = (acc[inspection.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.toUpperCase(),
      count
    }));
  };

  const filteredPermits = permits.filter(permit => {
    const matchesSearch = permit.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permit.permit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permit.applicant_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || permit.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const metrics = getDashboardMetrics();

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Permits</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalPermits}</p>
              <p className="text-sm text-blue-600">{metrics.activePermits} Active</p>
            </div>
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Permit Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">Total Collected</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Violations</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.openViolations}</p>
              <p className="text-sm text-red-600">Requires Action</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Inspections</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.pendingInspections}</p>
              <p className="text-sm text-yellow-600">Scheduled</p>
            </div>
            <HardHat className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Construction Value</p>
              <p className="text-3xl font-bold text-gray-900">${(metrics.totalValue / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-purple-600">Total Investment</p>
            </div>
            <Building2 className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Code Officers</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
              <p className="text-sm text-indigo-600">Active Staff</p>
            </div>
            <Users className="h-12 w-12 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permit Types Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Permit Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getPermitTypeData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getPermitTypeData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Permit Applications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Permit Applications</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyPermitData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="permits" stroke={TERRAFUSION_COLORS.primary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Severity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Violation Severity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getViolationSeverityData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={TERRAFUSION_COLORS.error} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inspection Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getInspectionStatusData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={TERRAFUSION_COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPermits = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Building Permits</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New Permit Application
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search permits by address, ID, or applicant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Ready for Inspection">Ready for Inspection</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermits.map((permit) => (
                <tr key={permit.permit_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {permit.permit_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {permit.permit_type === 'Single Family Residential' && <Home className="h-4 w-4 mr-2 text-green-600" />}
                      {permit.permit_type === 'Commercial Building' && <Building2 className="h-4 w-4 mr-2 text-blue-600" />}
                      {permit.permit_type === 'Electrical' && <Zap className="h-4 w-4 mr-2 text-yellow-600" />}
                      {permit.permit_type === 'Plumbing' && <Wrench className="h-4 w-4 mr-2 text-blue-400" />}
                      {permit.permit_type === 'Mechanical/HVAC' && <Flame className="h-4 w-4 mr-2 text-red-600" />}
                      {permit.permit_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permit.property_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permit.applicant_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      permit.status === 'Approved' 
                        ? 'bg-green-100 text-green-800' 
                        : permit.status === 'Under Review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : permit.status === 'Ready for Inspection'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {permit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${permit.estimated_value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Clipboard className="h-4 w-4" />
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

  const renderViolations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Code Violations</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          Report Violation
        </button>
      </div>

      <div className="space-y-4">
        {violations.map((violation) => (
          <div key={violation.violation_id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            violation.severity_level === 3 ? 'border-red-600' :
            violation.severity_level === 2 ? 'border-yellow-500' : 'border-blue-500'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className={`h-6 w-6 mr-3 ${
                  violation.severity_level === 3 ? 'text-red-600' :
                  violation.severity_level === 2 ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{violation.violation_id}</h3>
                  <p className="text-sm text-gray-600">{violation.violation_type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  violation.severity_level === 3 ? 'bg-red-100 text-red-800' :
                  violation.severity_level === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {violation.severity_level === 3 ? 'High' : violation.severity_level === 2 ? 'Medium' : 'Low'} Severity
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  violation.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {violation.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {violation.property_address}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                Code Section: {violation.code_section}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Cited: {format(new Date(violation.citation_date), 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                Deadline: {format(new Date(violation.compliance_deadline), 'MMM dd, yyyy')}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
              <p className="text-gray-600">{violation.description}</p>
            </div>

            {violation.enforcement_actions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Enforcement Actions:</h4>
                <div className="space-y-1">
                  {violation.enforcement_actions.map((action, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{action.action}</span>
                      <span className="text-gray-500">{action.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {violation.resolution_notes && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-1">Resolution Notes:</h4>
                <p className="text-blue-800 text-sm">{violation.resolution_notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
                <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors">
                  View Details
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Days remaining: {Math.ceil((new Date(violation.compliance_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInspections = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inspections</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Schedule Inspection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspection ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inspections.map((inspection) => (
                <tr key={inspection.inspection_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {inspection.inspection_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <HardHat className="h-4 w-4 mr-2 text-gray-600" />
                      {inspection.inspection_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {inspection.permit_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(inspection.scheduled_date), 'MMM dd, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.inspector_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      inspection.status === 'Scheduled' 
                        ? 'bg-blue-100 text-blue-800' 
                        : inspection.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : inspection.status === 'Failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Calendar className="h-4 w-4" />
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'permits', label: 'Building Permits', icon: FileText },
    { id: 'violations', label: 'Code Violations', icon: AlertTriangle },
    { id: 'inspections', label: 'Inspections', icon: HardHat }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TerraFusion Code Enforcement & Permitting</h1>
                <p className="text-sm text-gray-500">Benton County Building Department • Washington State</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Building Official: James Mitchell, PE</div>
                <div className="text-xs text-gray-500">Code Enforcement Officers: 12 Active</div>
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
            {activeTab === 'permits' && renderPermits()}
            {activeTab === 'violations' && renderViolations()}
            {activeTab === 'inspections' && renderInspections()}
          </>
        )}
      </main>
    </div>
  );
};

export default CodeEnforcementPortal;