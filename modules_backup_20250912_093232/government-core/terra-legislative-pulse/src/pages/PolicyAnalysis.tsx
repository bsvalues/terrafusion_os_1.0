import React from 'react'
import {BarChart3, TrendingUp, AlertCircle, FileText} from '@mui/icons-material'

const PolicyAnalysis = () =>{
  return (<div className="space-y-6"><div className="flex items-center justify-between"><div><><h1 className="legislative-title">Policy Analysis</h1><p
</>
className="legislative-body mt-1">AI-powered analysis of legislative impact and policy trends</p></div><div className="flex space-x-3"><button className="legislative-button"><FileText className="w-4 h-4 mr-2 inline" />Generate Report</button></div></div>{/* Impact Analysis */}<div className="legislative-card"><><h2 className="legislative-subtitle mb-4">Impact Analysis</h2><div
</>
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><><h3 className="font-medium">Budget Impact</h3><TrendingUp
</>
className="w-5 h-5 text-green-500" /></div><><p className="text-2xl font-bold text-green-600 mb-1">+$2.3M</p><p
</>
className="text-sm text-gray-600">Potential funding increase</p></div><div className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><><h3 className="font-medium">Operational Changes</h3><AlertCircle
</>
className="w-5 h-5 text-yellow-500" /></div><><p className="text-2xl font-bold text-yellow-600 mb-1">7</p><p
</>
className="text-sm text-gray-600">Process modifications required</p></div><div className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><><h3 className="font-medium">Compliance Items</h3><BarChart3
</>
className="w-5 h-5 text-blue-500" /></div><><p className="text-2xl font-bold text-blue-600 mb-1">12</p><p
</>
className="text-sm text-gray-600">New requirements to implement</p></div></div></div>{/* Policy Trends */}<div className="legislative-card"><><h2 className="legislative-subtitle mb-4">Policy Trends</h2><div
</>
className="space-y-4"><div className="p-4 border-l-4 border-blue-500 bg-blue-50"><><h3 className="font-medium text-blue-900">Technology Modernization</h3><p
</>className="text-sm text-blue-800 mt-1">
              Increasing focus on digital transformation and technology funding across multiple bills.</p><div className="flex items-center mt-2 text-xs text-blue-700"><><span>Confidence: 85%</span><span
</>
className="mx-2">•</span><span>5 related bills</span></div></div><div className="p-4 border-l-4 border-green-500 bg-green-50"><><h3 className="font-medium text-green-900">Transparency Initiatives</h3><p
</>className="text-sm text-green-800 mt-1">
              Growing emphasis on government transparency and public data access.</p><div className="flex items-center mt-2 text-xs text-green-700"><><span>Confidence: 92%</span><span
</>
className="mx-2">•</span><span>8 related bills</span></div></div><div className="p-4 border-l-4 border-yellow-500 bg-yellow-50"><><h3 className="font-medium text-yellow-900">Assessment Reform</h3><p
</>className="text-sm text-yellow-800 mt-1">
              Property assessment processes under review for modernization and efficiency.</p><div className="flex items-center mt-2 text-xs text-yellow-700"><><span>Confidence: 78%</span><span
</>
className="mx-2">•</span><span>3 related bills</span></div></div></div></div>{/* Detailed Analysis */}<div className="legislative-card"><><h2 className="legislative-subtitle mb-4">Detailed Impact Assessments</h2><div
</>
className="space-y-6"><div className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><><h3 className="font-medium">HB-2024-0123: Property Assessment Modernization</h3><span
</>
className="status-badge priority-high">High Impact</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div><><p className="text-sm font-medium text-gray-600">Budget Impact</p><p
</>
className="text-lg font-bold text-green-600">+$1.2M</p></div><div><><p className="text-sm font-medium text-gray-600">Implementation Time</p><p
</>
className="text-lg font-bold text-blue-600">18 months</p></div><div><><p className="text-sm font-medium text-gray-600">Staff Training</p><p
</>
className="text-lg font-bold text-yellow-600">Required</p></div></div><div className="space-y-2"><><h4 className="font-medium">Key Changes:</h4><ul
</>
className="text-sm text-gray-600 space-y-1"><><li>• Mandatory electronic filing for all assessments</li><li
</></>>• New appeal process with online portal</li><><li>• Integration with state assessment database</li><li
</></>>• Enhanced data validation requirements</li></ul></div></div><div className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><><h3 className="font-medium">SB-2024-0456: Government Data Transparency</h3><span
</>
className="status-badge priority-medium">Medium Impact</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div><><p className="text-sm font-medium text-gray-600">Budget Impact</p><p
</>
className="text-lg font-bold text-yellow-600">+$400K</p></div><div><><p className="text-sm font-medium text-gray-600">Implementation Time</p><p
</>
className="text-lg font-bold text-blue-600">12 months</p></div><div><><p className="text-sm font-medium text-gray-600">System Changes</p><p
</>
className="text-lg font-bold text-red-600">Significant</p></div></div><div className="space-y-2"><><h4 className="font-medium">Key Changes:</h4><ul
</>
className="text-sm text-gray-600 space-y-1"><><li>• Public data portal implementation</li><li
</></>>• Automated FOIA request processing</li><><li>• Enhanced metadata requirements</li><li
</></>>• Regular data quality audits</li></ul></div></div></div></div></div>
  )
}

export default PolicyAnalysis