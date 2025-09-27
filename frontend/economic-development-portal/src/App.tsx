import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Map, 
  FileText, 
  Award, 
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

interface BusinessLicense {
  id: number;
  business_name: string;
  license_type: string;
  license_number: string;
  issue_date: string;
  expiration_date: string;
  status: string;
  description: string;
  fee: number;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

interface EconomicDevelopmentProject {
  id: number;
  project_name: string;
  project_type: string;
  description: string;
  location: string;
  total_investment: number;
  jobs_created: number;
  start_date: string;
  completion_date: string;
  status: string;
  lead_developer: string;
  contact_email: string;
  impact_area: string;
}

interface BusinessIncentive {
  id: number;
  incentive_name: string;
  incentive_type: string;
  description: string;
  eligibility_criteria: string;
  benefit_amount: number;
  application_deadline: string;
  contact_person: string;
  requirements: string;
}

interface BusinessResource {
  id: number;
  resource_name: string;
  resource_type: string;
  description: string;
  website: string;
  contact_person: string;
  phone: string;
  email: string;
  services_offered: string;
  target_audience: string;
}

const EconomicDevelopmentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [businessLicenses, setBusinessLicenses] = useState<BusinessLicense[]>([]);
  const [developmentProjects, setDevelopmentProjects] = useState<EconomicDevelopmentProject[]>([]);
  const [businessIncentives, setBusinessIncentives] = useState<BusinessIncentive[]>([]);
  const [businessResources, setBusinessResources] = useState<BusinessResource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licensesRes, projectsRes, incentivesRes, resourcesRes] = await Promise.all([
        fetch('http://localhost:\${{TF_PORT_5310:-5310}}/licenses'),
        fetch('http://localhost:\${{TF_PORT_5310:-5310}}/projects'),
        fetch('http://localhost:\${{TF_PORT_5310:-5310}}/incentives'),
        fetch('http://localhost:\${{TF_PORT_5310:-5310}}/resources')
      ]);

      const [licenses, projects, incentives, resources] = await Promise.all([
        licensesRes.json(),
        projectsRes.json(),
        incentivesRes.json(),
        resourcesRes.json()
      ]);

      setBusinessLicenses(licenses);
      setDevelopmentProjects(projects);
      setBusinessIncentives(incentives);
      setBusinessResources(resources);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardMetrics = () => {
    const totalLicenses = businessLicenses.length;
    const activeLicenses = businessLicenses.filter(l => l.status === 'Active').length;
    const totalInvestment = developmentProjects.reduce((sum, p) => sum + p.total_investment, 0);
    const totalJobs = developmentProjects.reduce((sum, p) => sum + p.jobs_created, 0);
    const activeProjects = developmentProjects.filter(p => p.status === 'In Progress').length;
    const availableIncentives = businessIncentives.length;

    return {
      totalLicenses,
      activeLicenses,
      totalInvestment,
      totalJobs,
      activeProjects,
      availableIncentives
    };
  };

  const getLicenseTypeData = () => {
    const typeCounts = businessLicenses.reduce((acc, license) => {
      acc[license.license_type] = (acc[license.license_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const getProjectInvestmentData = () => {
    return developmentProjects.map(project => ({
      name: project.project_name.substring(0, 20) + '...',
      investment: project.total_investment / 1000000, // Convert to millions
      jobs: project.jobs_created
    }));
  };

  const getMonthlyLicenseData = () => {
    const monthlyData = businessLicenses.reduce((acc, license) => {
      const month = new Date(license.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, count]) => ({ month, licenses: count }));
  };

  const metrics = getDashboardMetrics();

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Business Licenses</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalLicenses}</p>
              <p className="text-sm text-green-600">{metrics.activeLicenses} Active</p>
            </div>
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Investment</p>
              <p className="text-3xl font-bold text-gray-900">${(metrics.totalInvestment / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-gray-600">{metrics.activeProjects} Active Projects</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jobs Created</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalJobs}</p>
              <p className="text-sm text-gray-600">{metrics.availableIncentives} Incentives Available</p>
            </div>
            <Users className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Types Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">License Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getLicenseTypeData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getLicenseTypeData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly License Issuance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly License Issuance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyLicenseData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="licenses" stroke={TERRAFUSION_COLORS.primary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Investment Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Projects - Investment & Jobs</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={getProjectInvestmentData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="investment" fill={TERRAFUSION_COLORS.primary} name="Investment ($M)" />
            <Bar yAxisId="right" dataKey="jobs" fill={TERRAFUSION_COLORS.accent} name="Jobs Created" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBusinessLicenses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Licenses</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New License Application
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessLicenses.map((license) => (
                <tr key={license.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{license.business_name}</div>
                      <div className="text-sm text-gray-500">{license.contact_person}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {license.license_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {license.license_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      license.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : license.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(license.expiration_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-green-600 hover:text-green-900 mr-3">Renew</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDevelopmentProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Development Projects</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {developmentProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{project.project_name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                project.status === 'In Progress' 
                  ? 'bg-blue-100 text-blue-800' 
                  : project.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Map className="h-4 w-4 mr-2" />
                {project.location}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2" />
                Investment: ${(project.total_investment / 1000000).toFixed(1)}M
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                Jobs Created: {project.jobs_created}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {new Date(project.start_date).toLocaleDateString()} - {new Date(project.completion_date).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">{project.description}</p>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  View Details
                </button>
                <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBusinessIncentives = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Incentives</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          New Incentive Program
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {businessIncentives.map((incentive) => (
          <div key={incentive.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Award className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{incentive.incentive_name}</h3>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-semibold rounded-full">
                {incentive.incentive_type}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">{incentive.description}</p>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center text-sm font-medium text-green-800">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Benefit: ${incentive.benefit_amount.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Eligibility Criteria:</h4>
                <p className="text-sm text-gray-600">{incentive.eligibility_criteria}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Requirements:</h4>
                <p className="text-sm text-gray-600">{incentive.requirements}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Deadline: {new Date(incentive.application_deadline).toLocaleDateString()}
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBusinessResources = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Resources</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {businessResources.map((resource) => (
          <div key={resource.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{resource.resource_name}</h3>
              </div>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 text-xs font-semibold rounded-full">
                {resource.resource_type}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">{resource.description}</p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Services Offered:</h4>
                <p className="text-sm text-gray-600">{resource.services_offered}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Target Audience:</h4>
                <p className="text-sm text-gray-600">{resource.target_audience}</p>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Contact: {resource.contact_person}</div>
                  <div>Phone: {resource.phone}</div>
                  <div>Email: {resource.email}</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => window.open(resource.website, '_blank')}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Visit Website
                </button>
                <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                  Contact
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
    { id: 'licenses', label: 'Business Licenses', icon: FileText },
    { id: 'projects', label: 'Development Projects', icon: Building2 },
    { id: 'incentives', label: 'Business Incentives', icon: Award },
    { id: 'resources', label: 'Business Resources', icon: BookOpen }
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
                <h1 className="text-2xl font-bold text-gray-900">TerraFusion Economic Development</h1>
                <p className="text-sm text-gray-500">Benton County Business Services Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Director: Diahann Howard</div>
                <div className="text-xs text-gray-500">Economic Development Authority</div>
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
            {activeTab === 'licenses' && renderBusinessLicenses()}
            {activeTab === 'projects' && renderDevelopmentProjects()}
            {activeTab === 'incentives' && renderBusinessIncentives()}
            {activeTab === 'resources' && renderBusinessResources()}
          </>
        )}
      </main>
    </div>
  );
};

export default EconomicDevelopmentPortal;