import React from 'react'
import {Search, Filter, Download, Eye, Star} from '@mui/icons-material'

const BillTracker = () =>{
  return (<div className="space-y-6"><div className="flex items-center justify-between"><div><><h1 className="legislative-title">Bill Tracker</h1><p
</>
className="legislative-body mt-1">Track and monitor legislative bills and resolutions</p></div><div className="flex space-x-3"><button className="legislative-button"><><Download className="w-4 h-4 mr-2 inline" />Export</button><button
</>
className="legislative-button"><Star className="w-4 h-4 mr-2 inline" />Watchlist</button></div></div>{/* Search and Filters */}<div className="legislative-card"><div className="flex flex-col md:flex-row gap-4"><div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input
                type="text"
                placeholder="Search bills by title, number, or keyword..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-government focus:border-transparent" /></div></div><div className="flex space-x-3"><select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-government"><><option>All Status</option><option
</></>>Active</option><><option>Committee</option><option
</></>>Passed</option><option>Failed</option></select><select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-government"><><option>All Priority</option><option
</></>>Critical</option><><option>High</option><option
</></>>Medium</option><option>Low</option></select><button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Filter className="w-4 h-4" /></button></div></div></div>{/* Bills List */}<div className="legislative-card"><><h2 className="legislative-subtitle mb-4">Tracked Bills</h2><div
</>className="space-y-1">
          {[
            {id: 'HB-2024-0123',
              title: 'Property Assessment Modernization Act',
              sponsor: 'Rep. Johnson',
              status: 'Committee Review',
              priority: 'High',
              lastAction: 'Referred to House Finance Committee',
              lastUpdate: '2 hours ago',
              watching: true},
            {id: 'SB-2024-0456', 
              title: 'Government Data Transparency Initiative',
              sponsor: 'Sen. Williams',
              status: 'Second Reading',
              priority: 'Medium',
              lastAction: 'Passed first reading 15-3',
              lastUpdate: '1 day ago',
              watching: false},
            {id: 'HB-2024-0789',
              title: 'Local Government Technology Funding',
              sponsor: 'Rep. Davis',
              status: 'Passed House',
              priority: 'Critical', 
              lastAction: 'Passed House 45-20, sent to Senate',
              lastUpdate: '3 days ago',
              watching: true}
          ].map((bill /* , index */) => (<div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center space-x-3 mb-2"><><span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{bill.id}</span><span
</>className={`status-badge text-xs ${
                      bill.priority === 'Critical' ? 'priority-critical' :
                      bill.priority === 'High' ? 'priority-high' :
                      'priority-medium'}`}>
                      {bill.priority}</span><span className={`status-badge text-xs ${
                      bill.status === 'Passed House' ? 'status-bill-passed' :
                      bill.status === 'Committee Review' ? 'status-bill-committee' :
                      'status-bill-active'}`}>{bill.status}</span></div><><h3 className="font-semibold text-gray-900 mb-1">{bill.title}</h3><p
</>
className="text-sm text-gray-600 mb-2">Sponsored by {bill.sponsor}</p><><p className="text-sm text-gray-700 mb-2">{bill.lastAction}</p><p
</>
className="text-xs text-gray-500">Updated {bill.lastUpdate}</p></div><div className="flex items-center space-x-2 ml-4"><button className="p-2 text-gray-400 hover:text-government"><><Eye className="w-4 h-4" /></button><button
</>
className={`p-2 ${bill.watching ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}><Star className="w-4 h-4" /></button></div></div></div>))}</div></div></div>
  )
}

export default BillTracker