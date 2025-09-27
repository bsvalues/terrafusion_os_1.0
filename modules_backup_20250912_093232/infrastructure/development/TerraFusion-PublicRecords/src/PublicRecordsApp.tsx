import React, {useState} from 'react';
import {FileText, 
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  User,
  Download,
  Eye,
  MessageSquare,
  Paperclip,
  Filter,
  TrendingUp} from '@mui/icons-material';

interface RecordsRequest {id: string;
  requestorName: string;
  requestorEmail: string;
  requestorPhone?: string;
  dateSubmitted: Date;
  dateDue: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  description: string;
  department?: string;
  assignedTo?: string;
  documents?: string[];
  notes?: string;
  fee?: number;}

const PublicRecordsApp: React.FC = () => {const [view, setView] = useState<'public' | 'admin'>('public');
  const [requests, setRequests] = useState<RecordsRequest[]>([
    {
      id: 'REQ-2024-001',
      requestorName: 'Jane Smith',
      requestorEmail: 'jane.smith@email.com',
      dateSubmitted: new Date('2024-01-10'),
      dateDue: new Date('2024-01-15'),
      status: 'in_progress',
      description: 'All meeting minutes from County Commission for December 2023',
      department: 'County Commission',
      assignedTo: 'John Doe'},
    {id: 'REQ-2024-002',
      requestorName: 'Bob Johnson',
      requestorEmail: 'bob@email.com',
      dateSubmitted: new Date('2024-01-11'),
      dateDue: new Date('2024-01-16'),
      status: 'pending',
      description: 'Budget reports for Parks Department FY2023',
      department: 'Parks & Recreation'},
    {id: 'REQ-2024-003',
      requestorName: 'Alice Brown',
      requestorEmail: 'alice@email.com',
      dateSubmitted: new Date('2024-01-08'),
      dateDue: new Date('2024-01-13'),
      status: 'completed',
      description: 'Sheriff department incident reports for Main Street, January 2024',
      department: 'Sheriff',
      documents: ['incident_report_001.pdf', 'incident_report_002.pdf']}
  ]);

  const [newRequest, setNewRequest] = useState({name: '',
    email: '',
    phone: '',
    description: '',
    urgency: 'standard'});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSubmitRequest = () =>{
    const request: RecordsRequest = {
      id: `REQ-2024-${String(requests.length + 1).padStart(3, '0')}`,
      requestorName: newRequest.name,
      requestorEmail: newRequest.email,
      requestorPhone: newRequest.phone,
      dateSubmitted: new Date(),
      dateDue: new Date(Date.now() + (newRequest.urgency === 'urgent' ? 3 : 5) * 24 * 60 * 60 * 1000),
      status: 'pending',
      description: newRequest.description
    };
    
    setRequests([request, ...requests]);
    setNewRequest({name: '', email: '', phone: '', description: '', urgency: 'standard'});
    alert('Your public records request has been submitted successfully!');
  };

  const filteredRequests = requests.filter(req => {const matchesSearch = req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requestorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesFilter;});

  const getStatusColor = (status: string) => {switch(status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';}
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return<CheckCircle size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'pending': return <AlertCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">{/* Header */}<header className="bg-white border-b border-gray-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><><FileText className="text-white" size={20} /></div><div
</></>><><h1 className="text-xl font-bold text-gray-900">Terrafusion Public Records</h1><p
</>
className="text-sm text-gray-600">Benton County Records Request System</p></div></div><div className="flex gap-2"><><button
                onClick={() =>setView('public')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'public' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Public Portal</button><button
</>onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'admin' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Staff Dashboard</button></div></div></div></header>{/* Public Portal View */}
      {view === 'public' && (<div className="max-w-4xl mx-auto p-6">{/* Request Form */}<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"><><h2 className="text-lg font-semibold text-gray-900 mb-4">Submit a Public Records Request</h2><p
</>className="text-sm text-gray-600 mb-6">
              Washington State law requires that all public records be made available for public inspection and copying, 
              unless they fall within specific exemptions. Please provide as much detail as possible about the records you're requesting.</p><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><><label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label><input
</>

                    type="text"
                    value={newRequest.name}
                    onChange={(e) => setNewRequest({...newRequest, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  /></div><div><><label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label><input
</>

                    type="email"
                    value={newRequest.email}
                    onChange={(e) => setNewRequest({...newRequest, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  /></div></div><div><><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label><input
</>

                  type="tel"
                  value={newRequest.phone}
                  onChange={(e) => setNewRequest({...newRequest, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                /></div><div><><label className="block text-sm font-medium text-gray-700 mb-1">Describe the Records You're Requesting *</label><textarea
</>

                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please be as specific as possible. Include dates, departments, document types, etc."
                /></div><div><><label className="block text-sm font-medium text-gray-700 mb-1">Request Urgency</label><select
</>

                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ><><option value="standard">Standard (5 business days)</option><option
</>
value="urgent">Urgent (3 business days - additional fees may apply)</option></select></div><button
                onClick={handleSubmitRequest}
                disabled={!newRequest.name || !newRequest.email || !newRequest.description}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              ><Send className="inline mr-2" size={18} />Submit Request</button></div></div>{/* Track Your Request */}<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><><h2 className="text-lg font-semibold text-gray-900 mb-4">Track Your Request</h2><div
</>
className="flex gap-2 mb-4"><input
                type="text"
                placeholder="Enter your request ID or email..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /><button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"><Search size={18} /></button></div><p className="text-sm text-gray-600">You will receive an email confirmation with your request ID once submitted.</p></div></div>)}

      {/* Admin Dashboard View */}
      {view === 'admin' && (<div className="max-w-7xl mx-auto p-6">{/* Stats */}<div className="grid grid-cols-4 gap-4 mb-6"><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><AlertCircle className="text-yellow-600" size={20} /><span className="text-xs text-gray-500">This Week</span></div><><div className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'pending').length}</div><div
</>
className="text-sm text-gray-600">Pending Requests</div></div><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><Clock className="text-blue-600" size={20} /><span className="text-xs text-gray-500">Active</span></div><><div className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'in_progress').length}</div><div
</>
className="text-sm text-gray-600">In Progress</div></div><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><CheckCircle className="text-green-600" size={20} /><span className="text-xs text-gray-500">This Month</span></div><><div className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'completed').length}</div><div
</>
className="text-sm text-gray-600">Completed</div></div><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><TrendingUp className="text-purple-600" size={20} /><span className="text-xs text-gray-500">Avg</span></div><><div className="text-2xl font-bold text-gray-900">3.2</div><div
</>
className="text-sm text-gray-600">Days to Complete</div></div></div>{/* Filters and Search */}<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"><div className="flex gap-4"><div className="flex-1"><><input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                /></div><select
</>

                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ><><option value="all">All Status</option><option
</>
value="pending">Pending</option><><option value="in_progress">In Progress</option><option
</>
value="completed">Completed</option><option value="rejected">Rejected</option></select><button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"><Filter size={18} className="inline mr-2" />More Filters</button></div></div>{/* Requests Table */}<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th><><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th><><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="divide-y divide-gray-200">{filteredRequests.map(request => (<tr key={request.id} className="hover:bg-gray-50"><><td className="px-4 py-3 text-sm font-medium text-gray-900">{request.id}</td><td
</>
className="px-4 py-3 text-sm"><div><><div className="font-medium text-gray-900">{request.requestorName}</div><div
</>
className="text-gray-500">{request.requestorEmail}</div></div></td><><td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{request.description}</td><td
</>className="px-4 py-3 text-sm text-gray-600">
                      {request.department || 'Unassigned'}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>{getStatusIcon(request.status)}
                        {request.status.replace('_', ' ')}</span></td><><td className="px-4 py-3 text-sm text-gray-600">{request.dateDue.toLocaleDateString()}</td><td
</>
className="px-4 py-3"><div className="flex gap-2"><button className="text-blue-600 hover:text-blue-800"><><Eye size={16} /></button><button
</>
className="text-gray-600 hover:text-gray-800"><MessageSquare size={16} /></button>{request.documents && (<button className="text-green-600 hover:text-green-800"><Download size={16} /></button>)}</div></td></tr>))}</tbody></table></div></div>)}</div>
  );
};

export default PublicRecordsApp;