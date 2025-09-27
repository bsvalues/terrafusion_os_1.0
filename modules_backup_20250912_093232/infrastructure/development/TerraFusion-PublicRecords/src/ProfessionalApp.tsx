import React, {useState} from 'react';
import {Search, 
  FileText, 
  Home,
  Users,
  Building,
  DollarSign,
  Menu,
  Bell,
  Settings,
  LogOut,
  ChevronRight} from '@mui/icons-material';
import {InstantSearch} from './components/InstantSearch';
import {DocumentViewer} from './components/DocumentViewer';
import {PermitApplication} from './components/PermitApplication';
import {UserDashboard} from './components/UserDashboard';
import {PaymentProcessor} from './components/PaymentProcessor';
import {BentonCountyData} from './data/bentonCounty';
import './index.css';

interface User {name: string;
  email: string;
  role: string;}

const ProfessionalApp: React.FC = () => {const [activeView, setActiveView] = useState<'search' | 'permits' | 'documents' | 'dashboard' | 'payments'>('search');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showPermitForm, setShowPermitForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [user] = useState<User>({
    name: 'John Doe',
    email: 'john.doe@bentoncounty.gov',
    role: 'Staff'});
  const [notifications] = useState(2);

  const navigationItems = [
    {id: 'search', label: 'Property Search', icon: Search},
    {id: 'documents', label: 'Documents', icon: FileText},
    {id: 'permits', label: 'Permits', icon: Building},
    {id: 'dashboard', label: 'Dashboard', icon: Home},
    {id: 'payments', label: 'Payments', icon: DollarSign}
  ];

  const recentDocuments = [
    {id: '1', name: 'Deed - 123 Main St', type: 'deed', date: '2024-01-15', size: '245 KB'},
    {id: '2', name: 'Permit #2024-0142', type: 'permit', date: '2024-01-14', size: '180 KB'},
    {id: '3', name: 'Tax Assessment 2024', type: 'assessment', date: '2024-01-10', size: '320 KB'}
  ];

  const handleDocumentView = (doc: any) =>{setSelectedDocument(doc);};

  const handlePermitSubmit = (application: any) => {console.log('Permit application submitted:', application);
    setShowPermitForm(false);
    // Show payment processor for permit fees
    setShowPayment(true);};

  const handlePaymentComplete = (payment: any) => {console.log('Payment completed:', payment);
    setShowPayment(false);};

  return (<div className="min-h-screen bg-gray-50 flex">{/* Sidebar Navigation */}<div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white"><div className="p-4 border-b border-blue-700"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">TF</span></div><h1 className="text-xl font-bold">Terrafusion</h1></div><><p className="text-sm text-blue-200">Public Records System</p><p
</>
className="text-xs text-blue-300 mt-1">Benton County, WA</p></div><nav className="p-4"><ul className="space-y-1">{navigationItems.map(item => (<li key={item.id}><button
                  onClick={() => setActiveView(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10'}`}
                ><item.icon size={18} /><span className="font-medium">{item.label}</span>{item.id === 'permits' && notifications > 0 && (<span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications}</span>)}</button></li>))}</ul></nav><div className="mt-auto p-4 border-t border-blue-700"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"><><Users size={16} className="text-white" /></div><div
</>
className="flex-1"><><p className="text-sm font-medium text-white">{user.name}</p><p
</>
className="text-xs text-blue-200">{user.role}</p></div></div><div className="flex gap-2"><button className="flex-1 p-2 text-blue-200 hover:bg-white/10 rounded-lg transition-colors"><><Settings size={16} /></button><button
</>
className="flex-1 p-2 text-blue-200 hover:bg-white/10 rounded-lg transition-colors"><><Bell size={16} /></button><button
</>
className="flex-1 p-2 text-blue-200 hover:bg-white/10 rounded-lg transition-colors"><LogOut size={16} /></button></div></div></div>{/* Main Content Area */}<div className="flex-1 flex flex-col">{/* Header */}<header className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 px-6 py-4"><div className="flex items-center justify-between"><div><><h2 className="text-2xl font-semibold text-gray-900">{navigationItems.find(item => item.id === activeView)?.label}</h2><p
</>className="text-sm text-gray-600 mt-1">
                Terrafusion OS • Government Edition • Benton County, Washington</p></div><div className="flex items-center gap-6"><div className="text-sm"><span className="text-gray-500">Properties:</span>{' '}<><span className="font-semibold text-blue-700">{BentonCountyData.statistics.totalParcels.toLocaleString()}</span><span
</>
className="text-gray-400 mx-2">|</span><span className="text-gray-500">Citizens:</span>{' '}
                <span className="font-semibold text-blue-700">{BentonCountyData.county.population.toLocaleString()}</span></div><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span
</>
className="text-xs text-gray-600">System Online</span></div></div></div></header>{/* Content Area */}<main className="flex-1 p-6 overflow-auto">{/* Property Search View */}
          {activeView === 'search' && (<div className="space-y-6">{/* Terrafusion Search Card */}<div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><><Search className="text-white" size={20} /></div><div
</></>><><h3 className="text-lg font-bold text-gray-900">Terrafusion Instant Search</h3><p
</>
className="text-xs text-gray-600">AI-Powered Property Intelligence</p></div></div><InstantSearch 
                  onSearch={(query) => console.log('Searching:', query)}
                  recordCount={BentonCountyData.statistics.totalParcels}
                /></div>{/* Quick Stats with Terrafusion styling */}<div className="grid grid-cols-4 gap-4"><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><div className="flex items-center justify-between mb-2"><Building className="text-blue-600" size={20} /><span className="text-xs text-green-600 font-semibold">LIVE</span></div><><div className="text-sm text-gray-600">Total Parcels</div><div
</>className="text-2xl font-bold text-blue-900 mt-1">
                    {BentonCountyData.statistics.totalParcels.toLocaleString()}</div></div><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><div className="flex items-center justify-between mb-2"><DollarSign className="text-green-600" size={20} /><span className="text-xs text-green-600 font-semibold">2024</span></div><><div className="text-sm text-gray-600">Total Value</div><div
</>className="text-2xl font-bold text-blue-900 mt-1">
                    ${(BentonCountyData.statistics.totalAssessedValue / 1e9).toFixed(1)}B</div></div><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><div className="flex items-center justify-between mb-2"><Home className="text-purple-600" size={20} /><span className="text-xs text-blue-600 font-semibold">AVG</span></div><><div className="text-sm text-gray-600">Property Value</div><div
</>className="text-2xl font-bold text-blue-900 mt-1">
                    ${(BentonCountyData.statistics.averageValue / 1000).toFixed(0)}K</div></div><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><div className="flex items-center justify-between mb-2"><FileText className="text-orange-600" size={20} /><span className="text-xs text-orange-600 font-semibold">INDEXED</span></div><><div className="text-sm text-gray-600">Documents</div><div
</>className="text-2xl font-bold text-blue-900 mt-1">
                    1.2M+</div></div></div></div>)}

          {/* Documents View */}
          {activeView === 'documents' && (<div className="space-y-6"><div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><><FileText className="text-white" size={20} /></div><div
</></>><><h3 className="text-lg font-bold text-gray-900">Terrafusion Document Archive</h3><p
</>
className="text-xs text-gray-600">Recent Documents & Records</p></div></div><div className="space-y-2">{recentDocuments.map(doc => (<div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-blue-200"
                      onClick={() => handleDocumentView(doc)}
                    ><div className="flex items-center gap-3"><FileText className="text-gray-400" size={20} /><div><><p className="font-medium text-gray-900">{doc.name}</p><p
</>
className="text-sm text-gray-600">{doc.date} • {doc.size}</p></div></div><ChevronRight className="text-gray-400" size={20} /></div>))}</div></div><div className="grid grid-cols-3 gap-4"><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><FileText className="text-blue-600 mb-2" size={24} /><><div className="text-lg font-semibold text-gray-900">Property Deeds</div><div
</>
className="text-sm text-gray-600 mt-1">342 documents</div></div><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><Building className="text-green-600 mb-2" size={24} /><><div className="text-lg font-semibold text-gray-900">Building Permits</div><div
</>
className="text-sm text-gray-600 mt-1">89 active permits</div></div><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><DollarSign className="text-purple-600 mb-2" size={24} /><><div className="text-lg font-semibold text-gray-900">Tax Records</div><div
</>
className="text-sm text-gray-600 mt-1">1,847 assessments</div></div></div></div>)}

          {/* Permits View */}
          {activeView === 'permits' && (<div className="space-y-6"><div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center"><><Building className="text-white" size={20} /></div><div
</></>><><h3 className="text-lg font-bold text-gray-900">Terrafusion Permit System</h3><p
</>
className="text-xs text-gray-600">Digital Permit Applications</p></div></div><button
                    onClick={() =>setShowPermitForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    New Application</button></div><p className="text-gray-600">Apply for building permits, electrical permits, and other construction-related permissions.</p></div><div className="grid grid-cols-2 gap-4"><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><><div className="text-sm text-gray-600">Active Permits</div><div
</>
className="text-2xl font-semibold text-gray-900 mt-1">23</div></div><div className="bg-white rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow p-4"><><div className="text-sm text-gray-600">Pending Review</div><div
</>
className="text-2xl font-semibold text-gray-900 mt-1">7</div></div></div></div>)}

          {/* Dashboard View */}
          {activeView === 'dashboard' && (<UserDashboard user={user} />)}

          {/* Payments View */}
          {activeView === 'payments' && (<div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"><><DollarSign className="text-white" size={20} /></div><div
</></>><><h3 className="text-lg font-bold text-gray-900">Terrafusion Payment Center</h3><p
</>
className="text-xs text-gray-600">Secure Online Payment Processing</p></div></div><><p className="text-gray-600 mb-4">Pay for permits, licenses, and other county services online.</p><button
</>onClick={() => setShowPayment(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Make a Payment</button></div>)}</main>{/* Footer with Terrafusion branding */}<footer className="bg-gradient-to-r from-blue-900 to-purple-900 text-white px-6 py-3 border-t border-blue-800"><div className="flex items-center justify-between text-sm"><div className="flex items-center gap-4"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded flex items-center justify-center"><span className="text-white font-bold text-xs">TF</span></div><span className="font-semibold">Terrafusion OS</span></div><span className="text-blue-200">Government Edition v2.0</span></div><div className="flex items-center gap-6 text-blue-200"><><span>© 2024 Terrafusion</span><span
</>
className="text-blue-400">•</span><span>Government. Transcended.</span></div></div></footer></div>{/* Modals */}
      {selectedDocument && (<DocumentViewer
          document={selectedDocument}
          onClose={() =>setSelectedDocument(null)}
          onExtractText={(text) => console.log('Extracted text:', text)}
        />
      )}

      {showPermitForm && (<PermitApplication
          user={user}
          onClose={() =>setShowPermitForm(false)}
          onSubmit={handlePermitSubmit}
        />
      )}

      {showPayment && (<PaymentProcessor
          amount={450}
          description="Building Permit Fee"
          onComplete={handlePaymentComplete}
          onCancel={() =>setShowPayment(false)}
        />
      )}</div>
  );
};

export default ProfessionalApp;