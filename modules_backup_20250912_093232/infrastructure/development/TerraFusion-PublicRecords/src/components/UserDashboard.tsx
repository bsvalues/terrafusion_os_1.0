import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {User, Bell, FileText, Clock, DollarSign, Calendar, 
  Search, Download, Upload, CheckCircle, AlertCircle,
  Home, CreditCard, Briefcase, MapPin, Settings, LogOut,
  TrendingUp, Archive, Eye, Star, MessageSquare} from '@mui/icons-material';

interface UserDashboardProps {user: any;
  onLogout: () => void;}

interface Application {id: string;
  type: string;
  status: 'draft' | 'submitted' | 'review' | 'approved' | 'rejected';
  submittedDate: Date;
  property?: string;
  fee?: number;
  documents: string[];
  messages: any[];}

interface SavedSearch {id: string;
  query: string;
  filters: any;
  alerts: boolean;
  lastRun: Date;
  newResults: number;}

export const UserDashboard: React.FC<UserDashboardProps> = ({user, onLogout}) => {const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() =>{
    // Load user data from localStorage or API
    const loadUserData = () => {
      // Mock data for demonstration
      setApplications([
        {
          id: 'APP-2024-001',
          type: 'Building Permit',
          status: 'review',
          submittedDate: new Date('2024-01-10'),
          property: '123 Main St, Kennewick',
          fee: 450,
          documents: ['plans.pdf', 'site-survey.pdf'],
          messages: [
            { from: 'Inspector', text: 'Please provide updated electrical plans', date: new Date()}
          ]
        },
        {id: 'APP-2024-002',
          type: 'Business License',
          status: 'approved',
          submittedDate: new Date('2024-01-05'),
          fee: 125,
          documents: ['business-plan.pdf'],
          messages: []}
      ]);

      setSavedSearches([
        {id: 'search-1',
          query: 'permits near 123 Main St',
          filters: { radius: '500ft', type: 'construction'},
          alerts: true,
          lastRun: new Date(),
          newResults: 3
        },
        {
          id: 'search-2',
          query: 'Columbia Dr property records',
          filters: {},
          alerts: false,
          lastRun: new Date('2024-01-08'),
          newResults: 0
        }
      ]);

      setNotifications([
        {id: '1', type: 'info', message: 'Your building permit is under review', unread: true, date: new Date()},
        {id: '2', type: 'success', message: 'Business license approved!', unread: true, date: new Date('2024-01-05')},
        {id: '3', type: 'alert', message: '3 new properties match your saved search', unread: false, date: new Date('2024-01-09')}
      ]);

      setPayments([
        {id: 'pay-1', description: 'Building Permit Fee', amount: 450, status: 'paid', date: new Date('2024-01-10')},
        {id: 'pay-2', description: 'Business License', amount: 125, status: 'paid', date: new Date('2024-01-05')},
        {id: 'pay-3', description: 'Property Tax Q1', amount: 1250, status: 'due', dueDate: new Date('2024-01-31')}
      ]);

      setAppointments([
        {id: 'apt-1', type: 'Building Inspection', date: new Date('2024-01-20'), time: '10:00 AM', location: '123 Main St'},
        {id: 'apt-2', type: 'Permit Review Meeting', date: new Date('2024-01-15'), time: '2:00 PM', location: 'City Hall'}
      ]);
    };

    loadUserData();
  }, []);

  const getStatusColor = (status: string) => {switch(status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'review': return 'text-blue-600 bg-blue-50';
      case 'submitted': return 'text-purple-600 bg-purple-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';}
  };

  const tabs = [
    {id: 'overview', label: 'Overview', icon: Home},
    {id: 'applications', label: 'My Applications', icon: FileText},
    {id: 'searches', label: 'Saved Searches', icon: Search},
    {id: 'payments', label: 'Payments', icon: CreditCard},
    {id: 'appointments', label: 'Appointments', icon: Calendar},
    {id: 'documents', label: 'Documents', icon: Archive},
    {id: 'settings', label: 'Settings', icon: Settings}
  ];

  return (<div className="min-h-screen bg-gray-50">{/* Header */}<header className="bg-white shadow-sm border-b"><div className="container mx-auto px-4 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><><div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{user.name?.charAt(0).toUpperCase() || 'U'}</div><div
</></>><><h2 className="text-lg font-semibold text-gray-900">{user.name}</h2><p
</>
className="text-sm text-gray-500">{user.email}</p></div></div><div className="flex items-center gap-4">{/* Notifications */}<button className="relative p-2 text-gray-600 hover:text-gray-900"><Bell className="w-5 h-5" />{notifications.filter(n => n.unread).length > 0 && (<span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />)}</button>{/* Logout */}<button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
              ><LogOut className="w-4 h-4" /><span className="text-sm">Logout</span></button></div></div></div></header><div className="container mx-auto px-4 py-6"><div className="flex gap-6">{/* Sidebar */}<aside className="w-64"><nav className="space-y-1">{tabs.map((tab) => {
                const Icon = tab.icon;
                return (<button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                  ><Icon className="w-5 h-5" /><span className="font-medium">{tab.label}</span></button>);
              })}</nav></aside>{/* Main Content */}<main className="flex-1"><AnimatePresence mode="wait"><motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10}}
                animate={{ opacity: 1, y: 0}}
                exit={{ opacity: 0, y: -10}}
                className="bg-white rounded-xl shadow-sm p-6"
              >{/* Overview Tab */}
                {activeTab === 'overview' && (<div><h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back, {user.name}!</h1>{/* Quick Stats */}<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><motion.div
                        whileHover={{ scale: 1.05}}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
                      ><FileText className="w-8 h-8 mb-2 opacity-80" /><><div className="text-2xl font-bold">{applications.length}</div><div
</>
className="text-sm opacity-90">Active Applications</div></motion.div><motion.div
                        whileHover={{ scale: 1.05}}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
                      ><Search className="w-8 h-8 mb-2 opacity-80" /><><div className="text-2xl font-bold">{savedSearches.length}</div><div
</>
className="text-sm opacity-90">Saved Searches</div></motion.div><motion.div
                        whileHover={{ scale: 1.05}}
                        className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
                      ><DollarSign className="w-8 h-8 mb-2 opacity-80" /><><div className="text-2xl font-bold">$1,825</div><div
</>
className="text-sm opacity-90">Total Paid</div></motion.div><motion.div
                        whileHover={{ scale: 1.05}}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
                      ><Calendar className="w-8 h-8 mb-2 opacity-80" /><><div className="text-2xl font-bold">{appointments.length}</div><div
</>
className="text-sm opacity-90">Upcoming</div></motion.div></div>{/* Recent Activity */}<div><><h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3><div
</>className="space-y-3">
                        {notifications.slice(0, 5).map((notif) => (<div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">{notif.type === 'success' ? (<CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />) : notif.type === 'alert' ? (<AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />) : (<Bell className="w-5 h-5 text-blue-500 mt-0.5" />)}<div className="flex-1"><><p className="text-sm text-gray-900">{notif.message}</p><p
</>className="text-xs text-gray-500 mt-1">
                                {notif.date.toLocaleDateString()}</p></div>{notif.unread && (<span className="w-2 h-2 bg-blue-500 rounded-full" />)}</div>))}</div></div></div>)}

                {/* Applications Tab */}
                {activeTab === 'applications' && (<div><div className="flex items-center justify-between mb-6"><><h1 className="text-2xl font-bold text-gray-900">My Applications</h1><button
</>className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        + New Application</button></div><div className="space-y-4">{applications.map((app) => (<motion.div
                          key={app.id}
                          whileHover={{ scale: 1.02}}
                          className="border rounded-lg p-4"
                        ><div className="flex items-start justify-between"><div><div className="flex items-center gap-3 mb-2"><><h3 className="font-semibold text-gray-900">{app.type}</h3><span
</>className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                  {app.status.toUpperCase()}</span></div><p className="text-sm text-gray-600">Application ID: {app.id}</p>{app.property && (<p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{app.property}</p>)}<div className="flex items-center gap-4 mt-3 text-sm"><span className="text-gray-500">Submitted: {app.submittedDate.toLocaleDateString()}</span>{app.fee && (<span className="text-gray-500">Fee: ${app.fee}</span>)}</div></div><div className="flex flex-col gap-2"><button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Details</button>{app.messages.length > 0 && (<span className="flex items-center gap-1 text-xs text-orange-600"><MessageSquare className="w-3 h-3" />{app.messages.length} new message</span>)}</div></div>{app.documents.length > 0 && (<div className="mt-3 pt-3 border-t"><div className="flex items-center gap-2 text-sm text-gray-600"><FileText className="w-4 h-4" /><span>{app.documents.length} documents attached</span></div></div>)}</motion.div>))}</div></div>)}

                {/* Saved Searches Tab */}
                {activeTab === 'searches' && (<div><div className="flex items-center justify-between mb-6"><><h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1><button
</>className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        + New Search</button></div><div className="space-y-4">{savedSearches.map((search) => (<motion.div
                          key={search.id}
                          whileHover={{ scale: 1.02}}
                          className="border rounded-lg p-4"
                        ><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><h3 className="font-semibold text-gray-900">"{search.query}"</h3>{search.newResults > 0 && (<span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{search.newResults} new</span>)}</div><div className="flex items-center gap-4 text-sm text-gray-600"><span>Last run: {search.lastRun.toLocaleDateString()}</span>{search.alerts && (<span className="flex items-center gap-1 text-green-600"><Bell className="w-3 h-3" />Alerts enabled</span>)}</div></div><div className="flex items-center gap-2"><button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><><Eye className="w-4 h-4" /></button><button
</>
className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"><Settings className="w-4 h-4" /></button></div></div></motion.div>))}</div></div>)}

                {/* Payments Tab */}
                {activeTab === 'payments' && (<div><><h1 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h1><div
</>className="space-y-4">
                      {payments.map((payment) => (<motion.div
                          key={payment.id}
                          whileHover={{ scale: 1.02}}
                          className="border rounded-lg p-4"
                        ><div className="flex items-center justify-between"><div><><h3 className="font-semibold text-gray-900">{payment.description}</h3><p
</>className="text-sm text-gray-600 mt-1">
                                {payment.status === 'paid' 
                                  ? `Paid on ${payment.date.toLocaleDateString()}`
                                  : `Due by ${payment.dueDate.toLocaleDateString()}`
                                }</p></div><div className="text-right"><div className="text-xl font-bold text-gray-900">${payment.amount}</div>{payment.status === 'due' ? (<button className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">Pay Now</button>) : (<span className="text-sm text-green-600">✓ Paid</span>)}</div></div></motion.div>))}</div></div>)}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (<div><div className="flex items-center justify-between mb-6"><><h1 className="text-2xl font-bold text-gray-900">Appointments</h1><button
</>className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        + Schedule Appointment</button></div><div className="space-y-4">{appointments.map((apt) => (<motion.div
                          key={apt.id}
                          whileHover={{ scale: 1.02}}
                          className="border rounded-lg p-4"
                        ><div className="flex items-start justify-between"><div><><h3 className="font-semibold text-gray-900">{apt.type}</h3><div
</>
className="flex items-center gap-4 mt-2 text-sm text-gray-600"><span className="flex items-center gap-1"><><Calendar className="w-3 h-3" />{apt.date.toLocaleDateString()}</span><span
</>
className="flex items-center gap-1"><><Clock className="w-3 h-3" />{apt.time}</span><span
</>
className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span></div></div><button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Reschedule</button></div></motion.div>))}</div></div>)}</motion.div></AnimatePresence></main></div></div></div>
  );
};