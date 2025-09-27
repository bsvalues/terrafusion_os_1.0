import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Star, 
  TrendingUp,
  Calendar,
  Bell,
  Search,
  Filter,
  Download,
  Plus,
  MessageSquare,
  User,
  Settings,
  AlertCircle,
  BarChart3,
  FileCheck,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ServiceMetrics {
  activeServices: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  satisfactionScore: number;
  averageProcessingTime: string;
  digitalAdoptionRate: number;
}

interface ServiceRequest {
  id: string;
  type: string;
  status: string;
  submittedDate: string;
  estimatedCompletion: string;
  priority: string;
  citizen: string;
}

interface PopularService {
  name: string;
  usage: string;
  processingTime: string;
  requests: number;
}

const CitizenServicesDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ServiceMetrics>({
    activeServices: 156,
    totalRequests: 1847293,
    completedRequests: 1798475,
    pendingRequests: 48818,
    satisfactionScore: 94.7,
    averageProcessingTime: '3.2 days',
    digitalAdoptionRate: 89.7
  });

  const [recentRequests] = useState<ServiceRequest[]>([
    {
      id: 'REQ-2025-84739',
      type: 'Business License Application',
      status: 'Processing',
      submittedDate: '2025-01-15',
      estimatedCompletion: '2025-01-17',
      priority: 'High',
      citizen: 'Sarah Chen'
    },
    {
      id: 'REQ-2025-84738',
      type: 'Birth Certificate Request',
      status: 'Completed',
      submittedDate: '2025-01-14',
      estimatedCompletion: '2025-01-15',
      priority: 'Standard',
      citizen: 'Michael Rodriguez'
    },
    {
      id: 'REQ-2025-84737',
      type: 'Property Tax Payment',
      status: 'Completed',
      submittedDate: '2025-01-14',
      estimatedCompletion: '2025-01-14',
      priority: 'Standard',
      citizen: 'Jennifer Wilson'
    },
    {
      id: 'REQ-2025-84736',
      type: 'Parking Permit',
      status: 'Document Review',
      submittedDate: '2025-01-13',
      estimatedCompletion: '2025-01-16',
      priority: 'Low',
      citizen: 'David Thompson'
    },
    {
      id: 'REQ-2025-84735',
      type: 'Benefits Enrollment',
      status: 'Processing',
      submittedDate: '2025-01-12',
      estimatedCompletion: '2025-01-18',
      priority: 'High',
      citizen: 'Maria Garcia'
    }
  ]);

  const [popularServices] = useState<PopularService[]>([
    { name: 'Business License Application', usage: 'High', processingTime: '2.1 days', requests: 847 },
    { name: 'Birth Certificate Request', usage: 'Very High', processingTime: '1.2 days', requests: 1293 },
    { name: 'Property Tax Payment', usage: 'High', processingTime: 'Instant', requests: 2847 },
    { name: 'Parking Permit', usage: 'Medium', processingTime: '0.5 days', requests: 394 },
    { name: 'Benefits Enrollment', usage: 'High', processingTime: '4.7 days', requests: 629 }
  ]);

  const requestTrendData = [
    { month: 'Jul', requests: 12450, completed: 11890, satisfaction: 93.2 },
    { month: 'Aug', requests: 13200, completed: 12640, satisfaction: 94.1 },
    { month: 'Sep', requests: 14100, completed: 13580, satisfaction: 94.5 },
    { month: 'Oct', requests: 15300, completed: 14720, satisfaction: 94.3 },
    { month: 'Nov', requests: 16800, completed: 16190, satisfaction: 94.8 },
    { month: 'Dec', requests: 18200, completed: 17530, satisfaction: 94.7 },
    { month: 'Jan', requests: 19500, completed: 18740, satisfaction: 95.1 }
  ];

  const serviceDistributionData = [
    { name: 'Licensing & Permits', value: 35, color: '#0099ff' },
    { name: 'Vital Records', value: 25, color: '#00ffaa' },
    { name: 'Tax Services', value: 20, color: '#00ffee' },
    { name: 'Benefits & Social Services', value: 12, color: '#ffaa00' },
    { name: 'Other Services', value: 8, color: '#888888' }
  ];

  const digitalAdoptionData = [
    { month: 'Jul', digital: 85.2, inPerson: 14.8 },
    { month: 'Aug', digital: 86.1, inPerson: 13.9 },
    { month: 'Sep', digital: 87.3, inPerson: 12.7 },
    { month: 'Oct', digital: 88.1, inPerson: 11.9 },
    { month: 'Nov', digital: 89.0, inPerson: 11.0 },
    { month: 'Dec', digital: 89.7, inPerson: 10.3 },
    { month: 'Jan', digital: 90.4, inPerson: 9.6 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'Processing': return 'text-blue-600 bg-blue-50';
      case 'Document Review': return 'text-yellow-600 bg-yellow-50';
      case 'Pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Standard': return 'text-blue-600 bg-blue-50';
      case 'Low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 3),
        pendingRequests: prev.pendingRequests + Math.floor(Math.random() * 2) - 1
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="citizen-services-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Citizen Services Portal</h1>
            <p>Comprehensive service request management and delivery system</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary">
              <Plus size={16} />
              New Service Request
            </button>
            <button className="btn-secondary">
              <Download size={16} />
              Export Report
            </button>
            <button className="btn-icon">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Active Services</div>
            <div className="metric-value">{metrics.activeServices.toLocaleString()}</div>
            <div className="metric-change positive">+12 new services</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Requests</div>
            <div className="metric-value">{metrics.totalRequests.toLocaleString()}</div>
            <div className="metric-change positive">+15.2% this month</div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Pending Requests</div>
            <div className="metric-value">{metrics.pendingRequests.toLocaleString()}</div>
            <div className="metric-change neutral">-3.4% from last week</div>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-icon">
            <CheckCircle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Completion Rate</div>
            <div className="metric-value">{((metrics.completedRequests / metrics.totalRequests) * 100).toFixed(1)}%</div>
            <div className="metric-change positive">+2.1% improvement</div>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <Star size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Satisfaction Score</div>
            <div className="metric-value">{metrics.satisfactionScore}%</div>
            <div className="metric-change positive">+0.8% this quarter</div>
          </div>
        </div>

        <div className="metric-card transcend">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Digital Adoption</div>
            <div className="metric-value">{metrics.digitalAdoptionRate}%</div>
            <div className="metric-change positive">+4.2% year over year</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Service Request Trends */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Service Request Trends</h3>
            <div className="card-actions">
              <button className="btn-icon">
                <Filter size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={requestTrendData}>
                <defs>
                  <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0099ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0099ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ffaa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#0099ff" 
                  fill="url(#requestsGradient)" 
                  name="Total Requests"
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#00ffaa" 
                  fill="url(#completedGradient)" 
                  name="Completed Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Service Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Digital Adoption Progress */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Digital Adoption Progress</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={digitalAdoptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="digital" stackId="a" fill="#0099ff" name="Digital Services" />
                <Bar dataKey="inPerson" stackId="a" fill="#888888" name="In-Person Services" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Services */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Popular Services</h3>
            <button className="btn-text">View All</button>
          </div>
          <div className="service-list">
            {popularServices.map((service, index) => (
              <div key={index} className="service-item">
                <div className="service-info">
                  <div className="service-name">{service.name}</div>
                  <div className="service-meta">
                    <span className="processing-time">{service.processingTime}</span>
                    <span className="request-count">{service.requests} requests</span>
                  </div>
                </div>
                <div className={`usage-badge ${service.usage.toLowerCase().replace(' ', '-')}`}>
                  {service.usage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Service Requests */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Recent Service Requests</h3>
            <div className="card-actions">
              <button className="btn-icon">
                <Search size={16} />
              </button>
              <button className="btn-icon">
                <Filter size={16} />
              </button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Service Type</th>
                  <th>Citizen</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted</th>
                  <th>Est. Completion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="request-id">{request.id}</td>
                    <td className="service-type">{request.type}</td>
                    <td className="citizen-name">{request.citizen}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="date">{request.submittedDate}</td>
                    <td className="date">{request.estimatedCompletion}</td>
                    <td className="actions">
                      <button className="btn-icon" title="View Details">
                        <FileCheck size={14} />
                      </button>
                      <button className="btn-icon" title="Contact Citizen">
                        <MessageSquare size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="action-button">
              <Plus size={20} />
              <span>New Service Request</span>
            </button>
            <button className="action-button">
              <Calendar size={20} />
              <span>Schedule Appointment</span>
            </button>
            <button className="action-button">
              <Bell size={20} />
              <span>Send Notification</span>
            </button>
            <button className="action-button">
              <BarChart3 size={20} />
              <span>Generate Report</span>
            </button>
            <button className="action-button">
              <MessageSquare size={20} />
              <span>Citizen Feedback</span>
            </button>
            <button className="action-button">
              <User size={20} />
              <span>Citizen Lookup</span>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>System Status</h3>
          </div>
          <div className="status-indicators">
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div className="status-info">
                <div className="status-label">Portal Services</div>
                <div className="status-value">Online</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div className="status-info">
                <div className="status-label">Payment Processing</div>
                <div className="status-value">Online</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div className="status-info">
                <div className="status-label">Document Processing</div>
                <div className="status-value">Online</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator warning"></div>
              <div className="status-info">
                <div className="status-label">SMS Notifications</div>
                <div className="status-value">Degraded</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="dashboard-footer">
        <div className="contact-info">
          <div className="contact-item">
            <Phone size={16} />
            <span>1-800-GOV-SERV</span>
          </div>
          <div className="contact-item">
            <Mail size={16} />
            <span>support@terrafusion.gov</span>
          </div>
          <div className="contact-item">
            <Globe size={16} />
            <span>services.terrafusion.gov</span>
          </div>
          <div className="contact-item">
            <Clock size={16} />
            <span>8 AM - 6 PM EST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenServicesDashboard;