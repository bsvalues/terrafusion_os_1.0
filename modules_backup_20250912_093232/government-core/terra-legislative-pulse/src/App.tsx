import React from 'react'
import {Switch, Route} from 'wouter'
import LegislativeDashboard from './pages/LegislativeDashboard'
import BillTracker from './pages/BillTracker'
import PolicyAnalysis from './pages/PolicyAnalysis'
import ComplianceMonitor from './pages/ComplianceMonitor'
import StakeholderHub from './pages/StakeholderHub'
import './terrafusion-brand.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><header className="bg-[#27374D] text-white p-4 shadow-lg"><div className="container mx-auto flex items-center"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">LP</span></div><div><><h1 className="text-xl font-bold">Terrafusion Legislative Pulse</h1><p
</>
className="text-sm text-blue-200">Government Legislative Intelligence System</p></div></div></div></header><main className="container mx-auto p-6"><Switch><Route path="/" component={LegislativeDashboard} /><Route path="/bills" component={BillTracker} /><Route path="/analysis" component={PolicyAnalysis} /><Route path="/compliance" component={ComplianceMonitor} /><Route path="/stakeholders" component={StakeholderHub} /><Route><div className="text-center py-12"><><h2 className="text-2xl font-bold text-gray-700 mb-4">Page Not Found</h2><p
</>
className="text-gray-600">The requested page could not be found.</p></div></Route></Switch></main></div>
  )
}

export default App