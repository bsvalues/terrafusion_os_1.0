import React, { useState, useEffect } from 'react';
import { Building, 
  FileText, 
  BarChart, 
  ChevronRight, 
  Calendar, 
  Clock,
  User,
  DollarSign,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clipboard
 } from '@mui/icons-material';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';

// Define types for our data
type Property = {
  id: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  square_feet: number;
  bedrooms: number;
  bathrooms: number;
  last_appraisal_value?: number;
  last_appraisal_date?: string;
};

type Appraisal = {
  id: number;
  property_address: string;
  status: string;
  client_name: string;
  due_date: string;
  appraiser_name: string;
  appraisal_value?: number;
};

type Task = {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  related_to?: {
    type: 'property' | 'appraisal' | 'other';
    id: number;
    name: string;
  };
};

type Metric = {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
  }[];
};

const DashboardComponent = () => {
  // State for dashboard data
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [upcomingAppraisals, setUpcomingAppraisals] = useState<Appraisal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real implementation, these would be API calls
        // setRecentProperties(await fetchRecentProperties());
        // setUpcomingAppraisals(await fetchUpcomingAppraisals());
        // setTasks(await fetchTasks());
        // setMetrics(await fetchMetrics());
        
        // Using mock data for demo
        setRecentProperties(mockProperties);
        setUpcomingAppraisals(mockAppraisals);
        setTasks(mockTasks);
        setMetrics(mockMetrics);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return <span className="text-green-600 flex items-center text-xs"><ArrowUp size={12} className="mr-1" />{change}%</span>;
    } else if (change < 0) {
      return <span className="text-red-600 flex items-center text-xs"><ArrowDown size={12} className="mr-1" />{Math.abs(change)}%</span>;
    } else {
      return <span className="text-gray-600 text-xs">0%</span>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6"><>

          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
            Dashboard
          </h1>
          <p
</> className="text-gray-600">Welcome back, John! Here's an overview of your properties and appraisals.</p>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric /* , index */) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {metric.icon}
                </div>
                {getChangeIndicator(metric.change)}
              </div><>

              <div className="text-sm text-gray-500">{metric.label}</div>
              <div
</> className="text-2xl font-bold mt-1">
                {metric.label.includes('Value') 
                  ? formatCurrency(metric.value) 
                  : formatNumber(metric.value)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Properties */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium flex items-center"><>

                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Recent Properties
              </h2>
              <a
</> href="/properties" className="text-sm text-blue-600 hover:underline flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th><>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Appraised
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/properties/${property.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap"><>

                        <div className="text-sm font-medium text-gray-900">{property.address}</div>
                        <div
</> className="text-sm text-gray-500">{property.city}, {property.state} {property.zip_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{property.property_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><>

                        <div className="text-sm text-gray-900">{formatNumber(property.square_feet)} sq.ft.</div>
                        <div
</> className="text-sm text-gray-500">{property.bedrooms} bd, {property.bathrooms} ba</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {property.last_appraisal_value ? (
                          <><>

                            <div className="text-sm font-medium text-gray-900">{formatCurrency(property.last_appraisal_value)}</div>
                            <div
</> className="text-sm text-gray-500">{property.last_appraisal_date ? formatDate(property.last_appraisal_date) : 'N/A'}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Not Appraised</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Tasks */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium flex items-center"><>

                <Clipboard className="w-5 h-5 mr-2 text-purple-600" />
                My Tasks
              </h2>
              <button
</> className="text-sm text-blue-600 hover:underline flex items-center">
                Add Task <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2"><>

                      <h3 className="font-medium">{task.title}</h3>
                      <span
</> className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div><>

                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div
</> className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Due: {formatDate(task.due_date)}
                      </div>
                      {task.related_to && (
                        <div>
                          {task.related_to.type === 'property' ? (
                            <span className="flex items-center">
                              <Building className="w-3 h-3 mr-1" />
                              {task.related_to.name}
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {task.related_to.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Appraisals */}
        <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium flex items-center"><>

              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Upcoming Appraisals
            </h2>
            <a
</> href="/appraisals" className="text-sm text-blue-600 hover:underline flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appraiser
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingAppraisals.map((appraisal) => (
                  <tr key={appraisal.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/appraisals/${appraisal.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appraisal.property_address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appraisal.status)}`}>
                        {appraisal.status}
                      </span>
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appraisal.client_name}
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(appraisal.due_date)}
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appraisal.appraiser_name}
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appraisal.appraisal_value ? formatCurrency(appraisal.appraisal_value) : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock data
const mockProperties: Property[] = [
  {
    id: 1,
    address: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    property_type: 'Single Family',
    square_feet: 2450,
    bedrooms: 3,
    bathrooms: 2.5,
    last_appraisal_value: 975000,
    last_appraisal_date: '2025-04-15',
  },
  {
    id: 2,
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zip_code: '78704',
    property_type: 'Condo',
    square_feet: 1750,
    bedrooms: 2,
    bathrooms: 2,
    last_appraisal_value: 650000,
    last_appraisal_date: '2025-04-02',
  },
  {
    id: 3,
    address: '789 Elm Drive',
    city: 'Austin',
    state: 'TX',
    zip_code: '78745',
    property_type: 'Single Family',
    square_feet: 3200,
    bedrooms: 4,
    bathrooms: 3.5,
    last_appraisal_value: 1250000,
    last_appraisal_date: '2025-03-28',
  },
  {
    id: 4,
    address: '101 Pine Road',
    city: 'Austin',
    state: 'TX',
    zip_code: '78735',
    property_type: 'Townhouse',
    square_feet: 1950,
    bedrooms: 3,
    bathrooms: 2,
  },
];

const mockAppraisals: Appraisal[] = [
  {
    id: 1,
    property_address: '123 Main Street, Austin, TX 78701',
    status: 'In Progress',
    client_name: 'First National Bank',
    due_date: '2025-05-28',
    appraiser_name: 'John Smith',
    appraisal_value: 975000,
  },
  {
    id: 2,
    property_address: '456 Oak Avenue, Austin, TX 78704',
    status: 'Pending',
    client_name: 'Capital Mortgage Co.',
    due_date: '2025-06-03',
    appraiser_name: 'Jane Doe',
  },
  {
    id: 3,
    property_address: '789 Elm Drive, Austin, TX 78745',
    status: 'Completed',
    client_name: 'Homebuyers LLC',
    due_date: '2025-05-15',
    appraiser_name: 'John Smith',
    appraisal_value: 1250000,
  },
  {
    id: 4,
    property_address: '555 Cedar Lane, Austin, TX 78703',
    status: 'Overdue',
    client_name: 'Residential Finance Inc.',
    due_date: '2025-05-10',
    appraiser_name: 'Robert Johnson',
  },
];

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Complete site inspection',
    description: 'Perform on-site inspection of property including interior and exterior photos',
    due_date: '2025-05-23',
    priority: 'high',
    related_to: {
      type: 'property',
      id: 1,
      name: '123 Main Street'
    }
  },
  {
    id: 2,
    title: 'Gather comparable data',
    description: 'Research and compile relevant comparable properties for market analysis',
    due_date: '2025-05-24',
    priority: 'medium',
    related_to: {
      type: 'appraisal',
      id: 1,
      name: 'Appraisal #A-2025-042'
    }
  },
  {
    id: 3,
    title: 'Client follow-up call',
    description: 'Call client to discuss additional requirements for appraisal report',
    due_date: '2025-05-22',
    priority: 'low',
    related_to: {
      type: 'appraisal',
      id: 2,
      name: 'Appraisal #A-2025-047'
    }
  },
  {
    id: 4,
    title: 'Submit final report',
    description: 'Finalize appraisal report and submit to client for review',
    due_date: '2025-05-25',
    priority: 'high',
  },
];

const mockMetrics: Metric[] = [
  {
    label: 'Total Properties',
    value: 243,
    change: 5.2,
    icon: <Building size={24} className="text-blue-500" />
  },
  {
    label: 'Active Appraisals',
    value: 18,
    change: 12.5,
    icon: <FileText size={24} className="text-green-500" />
  },
  {
    label: 'Average Value',
    value: 875000,
    change: 3.8,
    icon: <DollarSign size={24} className="text-purple-500" />
  },
  {
    label: 'Completed This Month',
    value: 24,
    change: -2.5,
    icon: <TrendingUp size={24} className="text-amber-500" />
  }
];

export default DashboardComponent;