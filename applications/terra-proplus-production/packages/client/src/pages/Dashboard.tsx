import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Clock,
  CheckCircle,
  Warning,
  XCircle,
  ChevronRight
 } from '@mui/icons-material';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');

  // Fetch deployment data
  const { data: deployments, isLoading: isLoadingDeployments } = useQuery({
    queryKey: ['/api/deployments'],
    staleTime: 60000,
  });

  // Fetch pipeline metrics
  const { data: pipelineMetrics, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ['/api/pipelines/metrics/summary'],
    staleTime: 60000,
  });

  // Fetch monitoring data
  const { data: monitoringData, isLoading: isLoadingMonitoring } = useQuery({
    queryKey: ['/api/monitoring/metrics'],
    staleTime: 60000,
  });

  // Fetch alerts
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/monitoring/alerts', { acknowledged: false }],
    staleTime: 60000,
  });

  // Mock/demo data for charts
  const deploymentStatusData = [
    { name: 'Completed', value: 48, color: '#22c55e' },
    { name: 'In Progress', value: 12, color: '#3b82f6' },
    { name: 'Failed', value: 8, color: '#ef4444' },
    { name: 'Scheduled', value: 6, color: '#a855f7' },
  ];

  const deploymentTimelineData = [
    { date: 'May 13', count: 5, success: 4, failed: 1 },
    { date: 'May 14', count: 7, success: 6, failed: 1 },
    { date: 'May 15', count: 10, success: 10, failed: 0 },
    { date: 'May 16', count: 8, success: 6, failed: 2 },
    { date: 'May 17', count: 12, success: 10, failed: 2 },
    { date: 'May 18', count: 9, success: 8, failed: 1 },
    { date: 'May 19', count: 14, success: 12, failed: 2 },
  ];

  const systemMetricsData = [
    { time: '12:00', cpu: 35, memory: 45, disk: 68 },
    { time: '13:00', cpu: 28, memory: 47, disk: 68 },
    { time: '14:00', cpu: 42, memory: 53, disk: 69 },
    { time: '15:00', cpu: 64, memory: 58, disk: 69 },
    { time: '16:00', cpu: 52, memory: 61, disk: 70 },
    { time: '17:00', cpu: 38, memory: 62, disk: 71 },
    { time: '18:00', cpu: 40, memory: 60, disk: 73 },
    { time: '19:00', cpu: 42, memory: 64, disk: 75 },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div><>

          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p
</> className="mt-1 text-sm text-gray-500">
            Overview of your infrastructure and deployments
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            ><>

              <option value="day">Last 24 hours</option>
              <option
</> value="week">Last 7 days</option><>

              <option value="month">Last 30 days</option>
              <option
</> value="quarter">Last 90 days</option>
            </select>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card"><>

          <div className="stat-title">Total Deployments</div>
          <div
</> className="stat-value">74</div>
          <div className="stat-desc flex items-center text-green-600"><>

            <span className="font-medium">+12%</span>
            <span
</> className="ml-1">vs. last {timeRange}</span>
          </div>
        </div>
        <div className="stat-card"><>

          <div className="stat-title">Success Rate</div>
          <div
</> className="stat-value">92.3%</div>
          <div className="stat-desc flex items-center text-green-600"><>

            <span className="font-medium">+3.5%</span>
            <span
</> className="ml-1">vs. last {timeRange}</span>
          </div>
        </div>
        <div className="stat-card"><>

          <div className="stat-title">Avg. Deployment Time</div>
          <div
</> className="stat-value">12:35</div>
          <div className="stat-desc flex items-center text-red-600"><>

            <span className="font-medium">+2:10</span>
            <span
</> className="ml-1">vs. last {timeRange}</span>
          </div>
        </div>
        <div className="stat-card"><>

          <div className="stat-title">Active Alerts</div>
          <div
</> className="stat-value">5</div>
          <div className="stat-desc flex items-center text-gray-500">
            <span className="font-medium">3 critical</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Deployment Timeline */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Deployment Timeline</h2>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={deploymentTimelineData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" stackId="a" name="Successful" fill="#22c55e" />
                <Bar dataKey="failed" stackId="a" name="Failed" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Deployment Status</h2>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart width={400} height={300}>
                <Pie
                  data={deploymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {deploymentStatusData.map((entry /* , index */) => (<>

                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
</> />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System metrics */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">System Metrics</h2>
        </div>
        <div className="card-body" style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              width={500}
              height={300}
              data={systemMetricsData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Legend />
              <Line type="monotone" dataKey="cpu" name="CPU Usage" stroke="#3b82f6" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="memory" name="Memory Usage" stroke="#8b5cf6" />
              <Line type="monotone" dataKey="disk" name="Disk Usage" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active alerts */}
      <div className="card">
        <div className="card-header flex items-center justify-between"><>

          <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
          <button
</> className="text-sm text-blue-600 hover:text-blue-900">View all</button>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Severity
                </th>
                <th
</>
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Source
                </th><>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Message
                </th>
                <th
</>
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Time
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge badge-danger">Critical</span>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">API Gateway</td>
                <td
</> className="px-6 py-4 text-sm text-gray-500">High CPU usage on API Gateway server</td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">35 min ago</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Acknowledge
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge badge-warning">Warning</span>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Auth Database</td>
                <td
</> className="px-6 py-4 text-sm text-gray-500">Database connection pool nearing capacity</td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">55 min ago</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Acknowledge
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge badge-warning">Warning</span>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Search Service</td>
                <td
</> className="px-6 py-4 text-sm text-gray-500">High memory usage on search service</td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1h 15m ago</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Acknowledge
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent deployments */}
      <div className="card">
        <div className="card-header flex items-center justify-between"><>

          <h2 className="text-lg font-medium text-gray-900">Recent Deployments</h2>
          <button
</> className="text-sm text-blue-600 hover:text-blue-900">View all</button>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
</>
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th><>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Environment
                </th>
                <th
</>
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Initiated by
                </th><>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Time
                </th>
                <th
</> scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center"><>

                    <div className="status-dot status-success mr-2"></div>
                    <span
</>>Completed</span>
                  </div>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">API Gateway Update</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Production</span>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">jenkins-ci</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">30 min ago</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Details
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center"><>

                    <div className="status-dot status-danger mr-2"></div>
                    <span
</>>Failed</span>
                  </div>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Payment Processor Update</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Staging</span>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">maria.dev</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2h ago</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Details
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center"><>

                    <div className="status-dot status-info mr-2"></div>
                    <span
</>>In Progress</span>
                  </div>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">User Service Update</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Development</span>
                </td><>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">alex.ops</td>
                <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1h 20m ago</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    Details
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;