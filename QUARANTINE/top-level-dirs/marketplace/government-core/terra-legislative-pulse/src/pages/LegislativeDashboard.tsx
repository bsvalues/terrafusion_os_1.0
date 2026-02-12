import React from 'react'
import { Calendar, Warning, Users, FileText, TrendingUp, Clock  } from '@mui/icons-material'

const LegislativeDashboard = () => {
  const stats = [
    { label: 'Active Bills', value: '24', icon: FileText, change: '+3 this week', trend: 'up' },
    { label: 'Critical Alerts', value: '5', icon: Warning, change: '2 urgent', trend: 'alert' },
    { label: 'Stakeholders', value: '18', icon: Users, change: '3 new contacts', trend: 'up' },
    { label: 'Deadlines', value: '7', icon: Clock, change: 'Next: 3 days', trend: 'neutral' }
  ]

  const recentBills = [
    {
      id: 'HB-2024-0123',
      title: 'Property Assessment Modernization Act',
      status: 'Committee Review',
      priority: 'High',
      lastUpdate: '2 hours ago',
      impact: 'Direct impact on assessment processes'
    },
    {
      id: 'SB-2024-0456',
      title: 'Government Data Transparency Initiative', 
      status: 'Second Reading',
      priority: 'Medium',
      lastUpdate: '1 day ago',
      impact: 'Affects public records access'
    },
    {
      id: 'HB-2024-0789',
      title: 'Local Government Technology Funding',
      status: 'Passed House',
      priority: 'Critical',
      lastUpdate: '3 days ago',
      impact: 'Potential funding for system upgrades'
    }
  ]

  const upcomingEvents = [
    {
      date: '2025-09-02',
      time: '10:00 AM',
      title: 'House Committee on Government Operations',
      description: 'Review of HB-2024-0123'
    },
    {
      date: '2025-09-05',
      time: '2:00 PM', 
      title: 'Senate Finance Committee',
      description: 'Budget hearings for technology initiatives'
    },
    {
      date: '2025-09-08',
      time: '9:00 AM',
      title: 'Public Comment Period Ends',
      description: 'Final comments on data transparency rules'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="legislative-title">Legislative Dashboard</h1>
          <p
</>
className="legislative-body mt-1">Monitor legislative activity and regulatory changes</p>
        </div>
        <div className="flex space-x-3">
          <button className="legislative-button"><>

            <FileText className="w-4 h-4 mr-2 inline" />
            New Alert
          </button>
          <button
</>
className="legislative-button">
            <Calendar className="w-4 h-4 mr-2 inline" />
            Schedule
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat /* , index */) => (
          <div key={index} className="legislative-card">
            <div className="flex items-center justify-between">
              <div><>

                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p
</>
className="text-2xl font-bold text-government mt-1">{stat.value}</p>
                <p className={`text-xs mt-1 ${
                  stat.trend === 'up' ? 'text-green-600' :
                  stat.trend === 'alert' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                stat.trend === 'alert' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.trend === 'alert' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills */}
        <div className="lg:col-span-2">
          <div className="legislative-card">
            <div className="flex items-center justify-between mb-4"><>

              <h2 className="legislative-subtitle">Recent Legislative Activity</h2>
              <button
</>
className="text-sm text-government hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {recentBills.map((bill /* , index */) => (
                <div key={index} className="border-l-4 border-government border-opacity-20 pl-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3"><>

                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {bill.id}
                        </span>
                        <span
</>
className={`status-badge ${
                          bill.priority === 'Critical' ? 'priority-critical' :
                          bill.priority === 'High' ? 'priority-high' :
                          'priority-medium'
                        }`}>
                          {bill.priority}
                        </span>
                      </div><>

                      <h3 className="font-semibold mt-1 text-gray-900">{bill.title}</h3>
                      <p
</>
className="text-sm text-gray-600 mt-1">{bill.impact}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500"><>

                        <span>Status: {bill.status}</span>
                        <span
</>
</>>•</span>
                        <span>Updated {bill.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="legislative-card"><>

            <h2 className="legislative-subtitle mb-4">Upcoming Events</h2>
            <div
</>
className="space-y-4">
              {upcomingEvents.map((event /* , index */) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-12 text-center"><>

                      <div className="text-lg font-bold text-government">
                        {new Date(event.date).getDate()}
                      </div>
                      <div
</>
className="text-xs text-gray-500 uppercase">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1"><>

                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p
</>
className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-government hover:underline">
              View Full Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="legislative-card"><>

        <h2 className="legislative-subtitle mb-4">Quick Actions</h2>
        <div
</>
className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-8 h-8 text-government mb-2" />
            <span className="text-sm font-medium">Track Bill</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Warning className="w-8 h-8 text-government mb-2" />
            <span className="text-sm font-medium">Set Alert</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-8 h-8 text-government mb-2" />
            <span className="text-sm font-medium">Contact Rep</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-8 h-8 text-government mb-2" />
            <span className="text-sm font-medium">View Trends</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LegislativeDashboard