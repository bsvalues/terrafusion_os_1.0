import React, { useState, useEffect } from 'react';
import { Users, 
  User, 
  UserPlus, 
  Mail, 
  Phone, 
  Check, 
  X, 
  Edit, 
  Lock, 
  ShieldCheck,
  BarChart,
  FileText,
  Building,
  ChevronDown,
  Search,
  Filter,
  MoreVertical,
  Eye
 } from '@mui/icons-material';
import { formatDate } from '../lib/utils';

// Types for team management
type TeamMember = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'appraiser' | 'reviewer' | 'assistant';
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  licenseNumber?: string;
  licenseExpiration?: string;
  joinedDate: string;
  recentActivity?: {
    action: string;
    date: string;
    item: string;
  };
  performanceMetrics?: {
    completedAppraisals: number;
    averageTurnaround: number;
    clientSatisfaction: number;
  };
};

type Invitation = {
  id: number;
  email: string;
  role: 'appraiser' | 'reviewer' | 'assistant';
  invitedBy: string;
  invitedDate: string;
  status: 'pending' | 'accepted' | 'expired';
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

type FilterOptions = {
  role: string;
  status: string;
  searchTerm: string;
};

const TeamManagementComponent = () => {
  // State for team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    status: 'all',
    searchTerm: '',
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('members');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // In a real implementation, these would be API calls
        // const membersResponse = await fetch('/api/team-members');
        // const membersData = await membersResponse.json();
        // setTeamMembers(membersData);
        
        // Using mock data for demo
        setTeamMembers(mockTeamMembers);
        setInvitations(mockInvitations);
        setRoles(mockRoles);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };
    
    fetchTeamData();
  }, []);
  
  // Update filtered members when filters change
  useEffect(() => {
    let filtered = [...teamMembers];
    
    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(member => member.status === filters.status);
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        member => 
          member.firstName.toLowerCase().includes(term) ||
          member.lastName.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term) ||
          (member.licenseNumber && member.licenseNumber.toLowerCase().includes(term))
      );
    }
    
    setFilteredMembers(filtered);
  }, [teamMembers, filters]);
  
  // Handler for filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handler for viewing member details
  const handleViewMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberDetailsModal(true);
  };
  
  // Get appropriate status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get appropriate role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'appraiser':
        return 'bg-blue-100 text-blue-800';
      case 'reviewer':
        return 'bg-teal-100 text-teal-800';
      case 'assistant':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div><>

            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              Team Management
            </h1>
            <p
</> className="text-gray-600">Manage your appraisal team members and permissions</p>
          </div>
          
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </button>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex"><>

              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'members'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Members
              </button>
              <button
</>
                onClick={() => setActiveTab('invitations')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'invitations'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invitations
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'roles'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Roles & Permissions
              </button>
            </nav>
          </div>
          
          {/* Team Members Tab */}
          {activeTab === 'members' && (
            <div>
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
</>
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search team members..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    />
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                    ><>

                      <option value="all">All Roles</option>
                      <option
</> value="admin">Admin</option><>

                      <option value="appraiser">Appraiser</option>
                      <option
</> value="reviewer">Reviewer</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    ><>

                      <option value="all">All Statuses</option>
                      <option
</> value="active">Active</option><>

                      <option value="inactive">Inactive</option>
                      <option
</> value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Team Members List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recent Activity
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {member.avatar ? (
                                <img className="h-10 w-10 rounded-full" src={member.avatar} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4"><>

                              <div className="text-sm font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </div>
                              <div
</> className="text-sm text-gray-500">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(member.status)}`}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {member.licenseNumber ? (
                            <div><>

                              <div className="text-sm text-gray-900">{member.licenseNumber}</div>
                              <div
</> className="text-sm text-gray-500">
                                {member.licenseExpiration ? `Expires: ${formatDate(member.licenseExpiration)}` : 'No expiration'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td><>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(member.joinedDate)}
                        </td>
                        <td
</> className="px-6 py-4 whitespace-nowrap">
                          {member.recentActivity ? (
                            <div className="text-sm text-gray-900"><>

                              <div>{member.recentActivity.action}</div>
                              <div
</> className="text-xs text-gray-500">{formatDate(member.recentActivity.date)}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No recent activity</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          ><>

                            <Eye className="h-4 w-4" />
                          </button>
                          <button
</>
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" /><>

                  <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
                  <p
</> className="mt-1 text-sm text-gray-500">
                    No team members match your current search criteria.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invited By
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invited Date
                      </th>
                      <th
</> scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invitation.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invitation.status)}`}>
                            {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                          </span>
                        </td><>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.invitedBy}
                        </td>
                        <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invitation.invitedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {invitation.status === 'pending' && (
                            <><>

                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                Resend
                              </button>
                              <button
</> className="text-red-600 hover:text-red-900">
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {invitations.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" /><>

                  <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations</h3>
                  <p
</> className="mt-1 text-sm text-gray-500">
                    There are no pending invitations at the moment.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Roles & Permissions Tab */}
          {activeTab === 'roles' && (
            <div className="p-6">
              <div className="space-y-6">
                {roles.map((role) => (
                  <div key={role.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div><>

                        <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                        <p
</> className="text-sm text-gray-600 mt-1">{role.description}</p>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Edit Role
                      </button>
                    </div><>

                    
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                    <ul
</> className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {role.permissions.map((permission /* , index */) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Team Performance Overview */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-blue-600" />
              Team Performance Overview
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4"><>

                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Appraisals</h3>
                <div
</> className="flex items-center justify-between"><>

                  <div className="text-2xl font-bold">257</div>
                  <span
</> className="text-green-600 text-sm flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    12%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4"><>

                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg. Completion Time</h3>
                <div
</> className="flex items-center justify-between"><>

                  <div className="text-2xl font-bold">3.2 days</div>
                  <span
</> className="text-green-600 text-sm flex items-center">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    8%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">vs. previous period</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4"><>

                <h3 className="text-sm font-medium text-gray-600 mb-2">Client Satisfaction</h3>
                <div
</> className="flex items-center justify-between"><>

                  <div className="text-2xl font-bold">4.8/5</div>
                  <span
</> className="text-green-600 text-sm flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    3%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Based on client feedback</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4"><>

                <h3 className="text-sm font-medium text-gray-600 mb-2">Active Team Members</h3>
                <div
</> className="flex items-center justify-between"><>

                  <div className="text-2xl font-bold">8</div>
                  <span
</> className="text-blue-600 text-sm">
                    of 9 total
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">1 pending invitation</p>
              </div>
            </div>
            
            <div className="mt-8"><>

              <h3 className="text-sm font-medium text-gray-700 mb-4">Top Performers This Month</h3>
              <div
</> className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appraiser
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed Appraisals
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Turnaround
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Satisfaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers
                      .filter(member => member.role === 'appraiser' && member.performanceMetrics)
                      .sort((a, b) => (b.performanceMetrics?.completedAppraisals || 0) - (a.performanceMetrics?.completedAppraisals || 0))
                      .slice(0, 3)
                      .map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                {member.avatar ? (
                                  <img className="h-8 w-8 rounded-full" src={member.avatar} alt="" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.firstName} {member.lastName}
                                </div>
                              </div>
                            </div>
                          </td><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.performanceMetrics?.completedAppraisals || 0}
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.performanceMetrics?.averageTurnaround || 0} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center"><>

                              <div className="text-sm font-medium text-gray-900 mr-2">
                                {member.performanceMetrics?.clientSatisfaction || 0}/5
                              </div>
                              <div
</> className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`h-4 w-4 ${i < (member.performanceMetrics?.clientSatisfaction || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Member Modal (simplified - would be more interactive in a real implementation) */}
      {showAddMemberModal && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"><>

            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span
</> className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10"><>

                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div
</> className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><>

                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Invite Team Member
                    </h3>
                    <div
</> className="mt-2">
                      <p className="text-sm text-gray-500">
                        Send an invitation to join your appraisal team. They will receive an email with instructions to create their account.
                      </p>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <div><>

                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
</>
                          type="email"
                          name="email"
                          id="email"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div><>

                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
</>
                          id="role"
                          name="role"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        ><>

                          <option value="appraiser">Appraiser</option>
                          <option
</> value="reviewer">Reviewer</option><>

                          <option value="assistant">Assistant</option>
                          <option
</> value="admin">Admin</option>
                        </select>
                      </div>
                      
                      <div><>

                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                          Personalized Message (Optional)
                        </label>
                        <textarea
</>
                          id="message"
                          name="message"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Add a personal message to the invitation"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><>

                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Send Invitation
                </button>
                <button
</>
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock data
const mockTeamMembers: TeamMember[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    role: 'admin',
    status: 'active',
    joinedDate: '2023-05-15',
    licenseNumber: 'APP12345',
    licenseExpiration: '2026-06-30',
    recentActivity: {
      action: 'Completed appraisal for 123 Main St',
      date: '2025-05-18',
      item: 'Appraisal #A-2025-042'
    },
    performanceMetrics: {
      completedAppraisals: 28,
      averageTurnaround: 2.8,
      clientSatisfaction: 4.9
    }
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '(555) 987-6543',
    role: 'appraiser',
    status: 'active',
    joinedDate: '2023-07-22',
    licenseNumber: 'APP98765',
    licenseExpiration: '2025-12-15',
    recentActivity: {
      action: 'Started new appraisal for 456 Oak Ave',
      date: '2025-05-19',
      item: 'Appraisal #A-2025-047'
    },
    performanceMetrics: {
      completedAppraisals: 22,
      averageTurnaround: 3.1,
      clientSatisfaction: 4.7
    }
  },
  {
    id: 3,
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.j@example.com',
    phone: '(555) 456-7890',
    role: 'appraiser',
    status: 'active',
    joinedDate: '2024-02-10',
    licenseNumber: 'APP45678',
    licenseExpiration: '2026-02-28',
    recentActivity: {
      action: 'Updated comparable data for 789 Elm Dr',
      date: '2025-05-17',
      item: 'Appraisal #A-2025-043'
    },
    performanceMetrics: {
      completedAppraisals: 18,
      averageTurnaround: 3.5,
      clientSatisfaction: 4.6
    }
  },
  {
    id: 4,
    firstName: 'Emily',
    lastName: 'Wilson',
    email: 'emily.w@example.com',
    role: 'reviewer',
    status: 'active',
    joinedDate: '2024-01-05',
    licenseNumber: 'REV34567',
    licenseExpiration: '2026-01-15',
    recentActivity: {
      action: 'Reviewed and approved appraisal report',
      date: '2025-05-16',
      item: 'Appraisal #A-2025-040'
    }
  },
  {
    id: 5,
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.b@example.com',
    role: 'assistant',
    status: 'active',
    joinedDate: '2024-03-20',
    recentActivity: {
      action: 'Uploaded property photos to database',
      date: '2025-05-19',
      item: 'Property #P-2025-156'
    }
  },
  {
    id: 6,
    firstName: 'Sarah',
    lastName: 'Miller',
    email: 'sarah.m@example.com',
    role: 'appraiser',
    status: 'inactive',
    joinedDate: '2024-04-12',
    licenseNumber: 'APP54321',
    licenseExpiration: '2026-04-30'
  },
  {
    id: 7,
    firstName: 'David',
    lastName: 'Garcia',
    email: 'david.g@example.com',
    role: 'appraiser',
    status: 'active',
    joinedDate: '2024-06-05',
    licenseNumber: 'APP65432',
    licenseExpiration: '2026-08-31',
    recentActivity: {
      action: 'Finalized valuation for commercial property',
      date: '2025-05-18',
      item: 'Appraisal #A-2025-044'
    },
    performanceMetrics: {
      completedAppraisals: 15,
      averageTurnaround: 3.4,
      clientSatisfaction: 4.8
    }
  },
  {
    id: 8,
    firstName: 'Jennifer',
    lastName: 'Lee',
    email: 'jennifer.l@example.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2023-09-15',
    recentActivity: {
      action: 'Created new team performance report',
      date: '2025-05-17',
      item: 'Monthly Analytics'
    }
  }
];

const mockInvitations: Invitation[] = [
  {
    id: 1,
    email: 'thomas.rodriguez@example.com',
    role: 'appraiser',
    invitedBy: 'John Smith',
    invitedDate: '2025-05-15',
    status: 'pending'
  },
  {
    id: 2,
    email: 'amanda.williams@example.com',
    role: 'reviewer',
    invitedBy: 'John Smith',
    invitedDate: '2025-05-10',
    status: 'accepted'
  },
  {
    id: 3,
    email: 'chris.taylor@example.com',
    role: 'assistant',
    invitedBy: 'Jennifer Lee',
    invitedDate: '2025-05-01',
    status: 'expired'
  }
];

const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with user management capabilities',
    permissions: [
      'Manage team members',
      'Create/edit/delete all resources',
      'Access all reports and analytics',
      'Configure system settings',
      'Manage roles and permissions',
      'View billing information',
      'Access audit logs'
    ]
  },
  {
    id: 'appraiser',
    name: 'Appraiser',
    description: 'Creates and manages property appraisals',
    permissions: [
      'Create new appraisals',
      'Edit own appraisals',
      'Add/edit comparable properties',
      'Upload property photos',
      'Generate appraisal reports',
      'Access market analysis tools',
      'Use valuation calculator'
    ]
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Reviews and approves appraisal reports',
    permissions: [
      'Review appraisal reports',
      'Add comments and feedback',
      'Approve or reject appraisals',
      'View all appraisals',
      'Access market analysis tools',
      'Generate review reports',
      'View team performance metrics'
    ]
  },
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'Supports appraisers with data entry and research',
    permissions: [
      'View assigned properties',
      'Add/edit property information',
      'Upload property photos',
      'Research comparable properties',
      'Generate basic reports',
      'Schedule appointments',
      'Send client communications'
    ]
  }
];

export default TeamManagementComponent;