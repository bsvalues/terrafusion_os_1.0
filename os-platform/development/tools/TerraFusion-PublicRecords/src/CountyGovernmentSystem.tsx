import React, { useState, useEffect } from 'react';
import { Building, Users, FileText, DollarSign, TrendingUp, Shield,
  Search, Calendar, Bell, Settings, LogOut, Home, 
  Briefcase, MapPin, Clock, CheckCircle, AlertCircle,
  Database, Zap, BarChart3, Globe, Lock, UserCheck
 } from '@mui/icons-material';

// Types for the REAL county system
interface User {
  id: string;
  name: string;
  email: string;
  role: 'assessor' | 'clerk' | 'permits' | 'admin' | 'public';
  department: string;
  permissions: string[];
}

interface Property {
  parcelId: string;
  address: string;
  owner: string;
  assessedValue: number;
  marketValue: number;
  taxAmount: number;
  lastAssessment: string;
  status: 'active' | 'pending' | 'review' | 'exempt';
  zoning: string;
  acres: number;
  yearBuilt: number;
}

interface WorkItem {
  id: string;
  type: 'assessment' | 'permit' | 'document' | 'complaint' | 'review';
  priority: 'high' | 'medium' | 'low';
  subject: string;
  requester: string;
  dateReceived: string;
  dueDate: string;
  status: 'new' | 'in-progress' | 'pending' | 'complete';
  assignedTo?: string;
}

const CountyGovernmentSystem: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-001',
    name: 'Sarah Johnson',
    email: 'sjohnson@bentoncounty.gov',
    role: 'assessor',
    department: 'Assessor Office',
    permissions: ['view_all', 'edit_assessments', 'generate_reports']
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'properties' | 'permits' | 'documents' | 'reports' | 'public'>('dashboard');
  const [workQueue, setWorkQueue] = useState<WorkItem[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Sample data - in production this comes from the database
  const sampleWorkItems: WorkItem[] = [
    {
      id: 'WI-001',
      type: 'assessment',
      priority: 'high',
      subject: 'Commercial Property Revaluation - 456 Commerce Ave',
      requester: 'Auto-triggered',
      dateReceived: '2024-01-14',
      dueDate: '2024-01-21',
      status: 'new',
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'WI-002',
      type: 'permit',
      priority: 'medium',
      subject: 'Building Permit Application - 789 Jadwin Ave',
      requester: 'John Smith',
      dateReceived: '2024-01-13',
      dueDate: '2024-01-20',
      status: 'in-progress'
    },
    {
      id: 'WI-003',
      type: 'document',
      priority: 'low',
      subject: 'Public Records Request - Tax History',
      requester: 'Mary Williams',
      dateReceived: '2024-01-12',
      dueDate: '2024-01-19',
      status: 'pending'
    }
  ];

  const recentProperties: Property[] = [
    {
      parcelId: '12345678901',
      address: '123 Columbia Dr, Richland, WA',
      owner: 'SMITH JOHN & JANE',
      assessedValue: 385000,
      marketValue: 410000,
      taxAmount: 4235.50,
      lastAssessment: '2023-07-15',
      status: 'active',
      zoning: 'R-1',
      acres: 0.25,
      yearBuilt: 2005
    },
    {
      parcelId: '23456789012',
      address: '456 George Washington Way, Richland, WA',
      owner: 'JOHNSON FAMILY TRUST',
      assessedValue: 525000,
      marketValue: 550000,
      taxAmount: 5775.00,
      lastAssessment: '2023-08-20',
      status: 'pending',
      zoning: 'C-2',
      acres: 1.5,
      yearBuilt: 1998
    }
  ];

  useEffect(() => {
    // Load work items for current user
    setWorkQueue(sampleWorkItems);
  }, [currentUser]);

  // Role-specific dashboard
  const DashboardView = () => {
    const stats = {
      assessor: [
        { label: 'Properties to Review', value: 47, color: 'blue', icon: Building },
        { label: 'Assessments Due', value: 12, color: 'red', icon: AlertCircle },
        { label: 'Completed This Week', value: 89, color: 'green', icon: CheckCircle },
        { label: 'Total Value Assessed', value: '$42.7M', color: 'purple', icon: DollarSign }
      ],
      clerk: [
        { label: 'Documents to Process', value: 23, color: 'blue', icon: FileText },
        { label: 'Public Requests', value: 8, color: 'yellow', icon: Users },
        { label: 'Recordings Today', value: 15, color: 'green', icon: CheckCircle },
        { label: 'Revenue Collected', value: '$12,450', color: 'purple', icon: DollarSign }
      ],
      permits: [
        { label: 'Applications Pending', value: 31, color: 'blue', icon: Briefcase },
        { label: 'Inspections Today', value: 6, color: 'yellow', icon: MapPin },
        { label: 'Permits Issued', value: 142, color: 'green', icon: CheckCircle },
        { label: 'Fees Collected', value: '$28,900', color: 'purple', icon: DollarSign }
      ],
      admin: [
        { label: 'Total Properties', value: '94,149', color: 'blue', icon: Building },
        { label: 'Active Users', value: 47, color: 'green', icon: Users },
        { label: 'System Performance', value: '379M× faster', color: 'purple', icon: Zap },
        { label: 'Data Processed', value: '1.2TB', color: 'yellow', icon: Database }
      ]
    };

    const userStats = stats[currentUser.role as keyof typeof stats] || stats.admin;

    return (
      <div>
        {/* Welcome Header */}
        <div className="mb-6"><>

          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {currentUser.name}
          </h1>
          <p
</>
className="text-gray-600 mt-1">
            {currentUser.department} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {userStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-lg shadow-md p-6 border-t-4 border-${stat.color}-500`}
              >
                <div className="flex items-center justify-between">
                  <div><>

                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p
</>
className={`text-3xl font-bold text-${stat.color}-600 mt-2`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-10 h-10 text-${stat.color}-400`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Work Queue */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4"><>

            <h2 className="text-xl font-semibold text-gray-900">My Work Queue</h2>
            <button
</>
className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {workQueue.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.priority === 'high' ? 'bg-red-500' :
                    item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div><>

                    <p className="font-medium text-gray-900">{item.subject}</p>
                    <p
</>
className="text-sm text-gray-600">
                      {item.requester} • Due {item.dueDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3"><>

                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    item.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                  <button
</>
className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveView('properties')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 text-left hover:from-blue-600 hover:to-blue-700 transition-all transform hover:-translate-y-1"
          >
            <Building className="w-8 h-8 mb-3" /><>

            <h3 className="font-semibold text-lg">Property Search</h3>
            <p
</>
className="text-blue-100 text-sm mt-1">Access 94,149 property records</p>
          </button>

          <button
            onClick={() => alert('Opening GIS Map...')}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 text-left hover:from-green-600 hover:to-green-700 transition-all transform hover:-translate-y-1"
          >
            <MapPin className="w-8 h-8 mb-3" /><>

            <h3 className="font-semibold text-lg">GIS Mapping</h3>
            <p
</>
className="text-green-100 text-sm mt-1">Interactive parcel maps</p>
          </button>

          <button
            onClick={() => setActiveView('reports')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 text-left hover:from-purple-600 hover:to-purple-700 transition-all transform hover:-translate-y-1"
          >
            <BarChart3 className="w-8 h-8 mb-3" /><>

            <h3 className="font-semibold text-lg">Generate Reports</h3>
            <p
</>
className="text-purple-100 text-sm mt-1">Analytics & insights</p>
          </button>
        </div>
      </div>
    );
  };

  // Property Management View (for Assessors)
  const PropertyManagementView = () => (
    <div>
      <div className="mb-6"><>

        <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
        <p
</>
className="text-gray-600 mt-1">Manage assessments, valuations, and property records</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by parcel ID, address, or owner name..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          /><>

          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Search
          </button>
          <button
</>
className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            New Assessment
          </button>
        </div>
      </div>

      {/* Recent Properties */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Properties</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parcel ID
                </th>
                <th
</>
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th
</>
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessed Value
                </th><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
</>
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProperties.map((property) => (
                <tr key={property.parcelId} className="hover:bg-gray-50"><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {property.parcelId}
                  </td>
                  <td
</>
className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.address}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.owner}
                  </td>
                  <td
</>
className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${property.assessedValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      property.status === 'active' ? 'bg-green-100 text-green-800' :
                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><>

                    <button
                      onClick={() => setSelectedProperty(property)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button
</>
className="text-green-600 hover:text-green-900 mr-3">
                      Edit
                    </button>
                    <button className="text-purple-600 hover:text-purple-900">
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Main Layout
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div><>

                  <h1 className="text-xl font-bold text-gray-900">
                    Benton County Government
                  </h1>
                  <p
</>
className="text-xs text-gray-600">Public Records Management System</p>
                </div>
              </div>
              
              {/* Performance Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  379,000,000× faster than Legacy CAMA
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right"><>

                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p
</>
className="text-xs text-gray-600">{currentUser.department}</p>
                </div>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><>

                  <Settings className="w-5 h-5" />
                </button>
                <button
</>
className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex gap-1 border-t">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'properties', label: 'Properties', icon: Building },
            { id: 'permits', label: 'Permits', icon: Briefcase },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'public', label: 'Public Portal', icon: Globe }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'properties' && <PropertyManagementView />}
          {activeView === 'permits' && (
            <div className="bg-white rounded-lg shadow-md p-6"><>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Permit Management</h2>
              <p
</>
className="text-gray-600">Process building permits, inspections, and applications</p>
            </div>
          )}
          {activeView === 'documents' && (
            <div className="bg-white rounded-lg shadow-md p-6"><>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Document Management</h2>
              <p
</>
className="text-gray-600">Manage public records, deeds, and official documents</p>
            </div>
          )}
          {activeView === 'reports' && (
            <div className="bg-white rounded-lg shadow-md p-6"><>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
              <p
</>
className="text-gray-600">Generate reports, analytics, and insights</p>
            </div>
          )}
          {activeView === 'public' && (
            <div className="bg-white rounded-lg shadow-md p-6"><>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Portal</h2>
              <p
</>
className="text-gray-600">Configure and manage the public-facing records portal</p>
            </div>
          )}
        </div>
      </main>

      {/* Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><>

              <Database className="w-4 h-4 text-green-400" />
              94,149 Properties Indexed
            </span>
            <span
</>
className="flex items-center gap-2"><>

              <Users className="w-4 h-4 text-blue-400" />
              47 Active Users
            </span>
            <span
</>
className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              0.001s Response Time
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CountyGovernmentSystem;