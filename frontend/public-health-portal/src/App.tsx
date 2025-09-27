import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Shield, 
  Users, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  Calendar, 
  Phone,
  FileText,
  TrendingUp,
  Hospital,
  Baby,
  UserCheck,
  Brain,
  Home,
  Utensils,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
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

interface HealthAlert {
  id: string;
  alert_type: string;
  level: string;
  title: string;
  description: string;
  affected_area: string;
  population_at_risk: number;
  issued_date: string;
  expires_date?: string;
  recommendations: string[];
  contact_info: string;
}

interface SocialServiceCase {
  id: string;
  case_number: string;
  service_type: string;
  status: string;
  client_id: string;
  assigned_worker: string;
  opened_date: string;
  last_update: string;
  priority_level: number;
  services_provided: string[];
  case_notes: string;
  next_review_date?: string;
}

interface PublicHealthProgram {
  id: string;
  name: string;
  program_type: string;
  status: string;
  description: string;
  eligibility_criteria: string[];
  current_enrollment: number;
  max_capacity: number;
  budget_allocated: number;
  budget_used: number;
  start_date: string;
  end_date?: string;
  coordinator: string;
}

interface HealthFacility {
  id: string;
  name: string;
  facility_type: string;
  address: string;
  phone: string;
  services_offered: string[];
  capacity: number;
  current_occupancy: number;
  operating_hours: string;
  emergency_services: boolean;
  coordinates: { lat: number; lon: number };
}

const PublicHealthPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [socialCases, setSocialCases] = useState<SocialServiceCase[]>([]);
  const [healthPrograms, setHealthPrograms] = useState<PublicHealthProgram[]>([]);
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, casesRes, programsRes, facilitiesRes] = await Promise.all([
        fetch('http://localhost:\${{TF_PORT_5300:-5300}}/health-alerts'),
        fetch('http://localhost:\${{TF_PORT_5300:-5300}}/social-cases'),
        fetch('http://localhost:\${{TF_PORT_5300:-5300}}/health-programs'),
        fetch('http://localhost:\${{TF_PORT_5300:-5300}}/health-facilities')
      ]);

      const [alerts, cases, programs, facilities] = await Promise.all([
        alertsRes.json(),
        casesRes.json(),
        programsRes.json(),
        facilitiesRes.json()
      ]);

      setHealthAlerts(alerts);
      setSocialCases(cases);
      setHealthPrograms(programs);
      setHealthFacilities(facilities);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardMetrics = () => {
    const activeAlerts = healthAlerts.filter(alert => 
      alert.level === 'high' || alert.level === 'critical' || alert.level === 'emergency'
    ).length;
    
    const activeCases = socialCases.filter(c => c.status === 'open' || c.status === 'active').length;
    const totalProgramEnrollment = healthPrograms.reduce((sum, p) => sum + p.current_enrollment, 0);
    const facilityOccupancy = healthFacilities.reduce((sum, f) => sum + f.current_occupancy, 0);
    const totalCapacity = healthFacilities.reduce((sum, f) => sum + f.capacity, 0);
    const occupancyRate = totalCapacity > 0 ? (facilityOccupancy / totalCapacity) * 100 : 0;

    return {
      activeAlerts,
      activeCases,
      totalProgramEnrollment,
      occupancyRate,
      totalPopulationAtRisk: healthAlerts.reduce((sum, alert) => sum + alert.population_at_risk, 0)
    };
  };

  const getAlertLevelData = () => {
    const levelCounts = healthAlerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(levelCounts).map(([level, count]) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: count
    }));
  };

  const getProgramEnrollmentData = () => {
    return healthPrograms.map(program => ({
      name: program.name.substring(0, 15) + '...',
      enrollment: program.current_enrollment,
      capacity: program.max_capacity,
      utilization: (program.current_enrollment / program.max_capacity) * 100
    }));
  };

  const getCaseStatusData = () => {
    const statusCounts = socialCases.reduce((acc, socialCase) => {
      acc[socialCase.status] = (acc[socialCase.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').toUpperCase(),
      count
    }));
  };

  const getFacilityOccupancyData = () => {
    return healthFacilities.map(facility => ({
      name: facility.name.substring(0, 20) + '...',
      occupancy: facility.current_occupancy,
      capacity: facility.capacity,
      rate: (facility.current_occupancy / facility.capacity) * 100
    }));
  };

  const metrics = getDashboardMetrics();

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Health Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.activeAlerts}</p>
              <p className="text-sm text-red-600">High Priority+</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Social Cases</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.activeCases}</p>
              <p className="text-sm text-blue-600">Currently Open</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Program Enrollment</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalProgramEnrollment.toLocaleString()}</p>
              <p className="text-sm text-green-600">Total Participants</p>
            </div>
            <UserCheck className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Facility Occupancy</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.occupancyRate.toFixed(1)}%</p>
              <p className="text-sm text-yellow-600">Average Rate</p>
            </div>
            <Hospital className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Levels Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Alert Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getAlertLevelData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getAlertLevelData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Program Utilization */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getProgramEnrollmentData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="enrollment" fill={TERRAFUSION_COLORS.primary} name="Current Enrollment" />
              <Bar dataKey="capacity" fill={TERRAFUSION_COLORS.accent} name="Max Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Case Status and Facility Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Service Case Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Service Case Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getCaseStatusData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={TERRAFUSION_COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facility Occupancy Rates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Facility Occupancy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getFacilityOccupancyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rate" fill={TERRAFUSION_COLORS.warning} name="Occupancy Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderHealthAlerts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Health Alerts</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          Issue New Alert
        </button>
      </div>

      <div className="space-y-4">
        {healthAlerts.map((alert) => (
          <div key={alert.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            alert.level === 'emergency' ? 'border-red-600' :
            alert.level === 'critical' ? 'border-orange-500' :
            alert.level === 'high' ? 'border-yellow-500' :
            alert.level === 'moderate' ? 'border-blue-500' : 'border-green-500'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className={`h-6 w-6 mr-3 ${
                  alert.level === 'emergency' ? 'text-red-600' :
                  alert.level === 'critical' ? 'text-orange-500' :
                  alert.level === 'high' ? 'text-yellow-500' :
                  alert.level === 'moderate' ? 'text-blue-500' : 'text-green-500'
                }`} />
                <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${
                alert.level === 'emergency' ? 'bg-red-100 text-red-800' :
                alert.level === 'critical' ? 'bg-orange-100 text-orange-800' :
                alert.level === 'high' ? 'bg-yellow-100 text-yellow-800' :
                alert.level === 'moderate' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {alert.level}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600">{alert.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Area: {alert.affected_area}
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  At Risk: {alert.population_at_risk.toLocaleString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Issued: {format(new Date(alert.issued_date), 'MMM dd, yyyy')}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  {alert.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact: {alert.contact_info}
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                    Update Alert
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialCases = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Social Service Cases</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New Case
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {socialCases.map((socialCase) => (
                <tr key={socialCase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {socialCase.case_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {socialCase.service_type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      socialCase.status === 'active' || socialCase.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : socialCase.status === 'pending' || socialCase.status === 'under_review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {socialCase.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {socialCase.assigned_worker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      socialCase.priority_level >= 8 
                        ? 'bg-red-100 text-red-800' 
                        : socialCase.priority_level >= 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {socialCase.priority_level >= 8 ? 'High' : socialCase.priority_level >= 5 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(socialCase.last_update), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-green-600 hover:text-green-900 mr-3">Update</button>
                    <button className="text-gray-600 hover:text-gray-900">Notes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHealthPrograms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Public Health Programs</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New Program
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {healthPrograms.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {program.program_type === 'nutrition_assistance' && <Utensils className="h-6 w-6 text-green-600 mr-3" />}
                {program.program_type === 'protective_services' && <Shield className="h-6 w-6 text-blue-600 mr-3" />}
                {program.program_type === 'disease_prevention' && <Activity className="h-6 w-6 text-red-600 mr-3" />}
                {program.program_type === 'mental_health' && <Brain className="h-6 w-6 text-purple-600 mr-3" />}
                {program.program_type === 'elderly_services' && <Heart className="h-6 w-6 text-pink-600 mr-3" />}
                <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                program.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : program.status === 'enrollment_open'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {program.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">{program.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{program.current_enrollment.toLocaleString()}</div>
                  <div className="text-sm text-blue-600">Current Enrollment</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{program.max_capacity.toLocaleString()}</div>
                  <div className="text-sm text-green-600">Max Capacity</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget Utilization</span>
                  <span>{((program.budget_used / program.budget_allocated) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(program.budget_used / program.budget_allocated) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Used: ${program.budget_used.toLocaleString()}</span>
                  <span>Total: ${program.budget_allocated.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Coordinator:</strong> {program.coordinator}
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHealthFacilities = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Health Facilities</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Facility
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {healthFacilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Hospital className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
              </div>
              {facility.emergency_services && (
                <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded-full">
                  Emergency
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Type:</strong> {facility.facility_type.replace('_', ' ').toUpperCase()}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {facility.address}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {facility.phone}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {facility.operating_hours}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Occupancy</span>
                  <span>{facility.current_occupancy} / {facility.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (facility.current_occupancy / facility.capacity) > 0.9 
                        ? 'bg-red-600' 
                        : (facility.current_occupancy / facility.capacity) > 0.7 
                        ? 'bg-yellow-500' 
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${(facility.current_occupancy / facility.capacity) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  {((facility.current_occupancy / facility.capacity) * 100).toFixed(1)}% Capacity
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Services Offered:</h4>
                <div className="flex flex-wrap gap-1">
                  {facility.services_offered.map((service, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  View Details
                </button>
                <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'alerts', label: 'Health Alerts', icon: AlertTriangle },
    { id: 'cases', label: 'Social Cases', icon: FileText },
    { id: 'programs', label: 'Health Programs', icon: Users },
    { id: 'facilities', label: 'Health Facilities', icon: Hospital }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TerraFusion Public Health & Social Services</h1>
                <p className="text-sm text-gray-500">Benton Franklin Health District • Benton County, Washington</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Director: Dr. Amy Person</div>
                <div className="text-xs text-gray-500">Population Served: 206,873</div>
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
                      ? 'border-red-600 text-red-600'
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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'alerts' && renderHealthAlerts()}
            {activeTab === 'cases' && renderSocialCases()}
            {activeTab === 'programs' && renderHealthPrograms()}
            {activeTab === 'facilities' && renderHealthFacilities()}
          </>
        )}
      </main>
    </div>
  );
};

export default PublicHealthPortal;