import React from 'react'
import { Users, Phone, Mail, MessageSquare, Calendar, MapPin  } from '@mui/icons-material'

const StakeholderHub = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="legislative-title">Stakeholder Hub</h1>
          <p
</> className="legislative-body mt-1">Manage relationships with legislators, officials, and community stakeholders</p>
        </div>
        <div className="flex space-x-3">
          <button className="legislative-button"><>

            <MessageSquare className="w-4 h-4 mr-2 inline" />
            New Message
          </button>
          <button
</> className="legislative-button">
            <Users className="w-4 h-4 mr-2 inline" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Key Stakeholders */}
      <div className="legislative-card"><>

        <h2 className="legislative-subtitle mb-4">Key Stakeholders</h2>
        <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Rep. Sarah Johnson',
              title: 'House Finance Committee Chair',
              district: 'District 15',
              party: 'D',
              contact: '(555) 123-4567',
              email: 's.johnson@legislature.gov',
              lastContact: '3 days ago',
              relationship: 'strong',
              interests: ['Technology Funding', 'Assessment Reform']
            },
            {
              name: 'Sen. Michael Williams',
              title: 'Senate Government Operations',
              district: 'District 8',
              party: 'R', 
              contact: '(555) 987-6543',
              email: 'm.williams@legislature.gov',
              lastContact: '1 week ago',
              relationship: 'neutral',
              interests: ['Transparency', 'Efficiency']
            },
            {
              name: 'Commissioner Lisa Davis',
              title: 'County Commissioner',
              district: 'Benton County',
              party: 'NP',
              contact: '(555) 555-1234',
              email: 'l.davis@bentoncounty.gov',
              lastContact: '2 days ago',
              relationship: 'strong',
              interests: ['Budget Impact', 'Operations']
            }
          ].map((stakeholder /* , index */) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div><>

                  <h3 className="font-semibold text-gray-900">{stakeholder.name}</h3>
                  <p
</> className="text-sm text-gray-600">{stakeholder.title}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    {stakeholder.district}
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {stakeholder.party}
                    </span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  stakeholder.relationship === 'strong' ? 'bg-green-500' :
                  stakeholder.relationship === 'neutral' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600"><>

                  <Phone className="w-4 h-4 mr-2" />
                  {stakeholder.contact}
                </div>
                <div
</> className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {stakeholder.email}
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100"><>

                <p className="text-xs text-gray-500 mb-2">Last contact: {stakeholder.lastContact}</p>
                <div
</> className="flex flex-wrap gap-1">
                  {stakeholder.interests.map((interest, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 mt-3"><>

                <button className="flex-1 text-xs bg-government text-white py-1 px-2 rounded hover:bg-opacity-90">
                  Contact
                </button>
                <button
</> className="flex-1 text-xs border border-gray-300 py-1 px-2 rounded hover:bg-gray-50">
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Communications */}
      <div className="legislative-card"><>

        <h2 className="legislative-subtitle mb-4">Recent Communications</h2>
        <div
</> className="space-y-4">
          {[
            {
              type: 'email',
              stakeholder: 'Rep. Sarah Johnson',
              subject: 'HB-2024-0123 Support Request',
              date: '2 hours ago',
              status: 'sent',
              content: 'Requesting support for property assessment modernization bill...'
            },
            {
              type: 'meeting',
              stakeholder: 'Commissioner Lisa Davis',
              subject: 'Budget Impact Discussion',
              date: '1 day ago',
              status: 'completed',
              content: 'Discussed budget implications of pending legislation...'
            },
            {
              type: 'call',
              stakeholder: 'Sen. Michael Williams',
              subject: 'Data Transparency Concerns',
              date: '3 days ago',
              status: 'follow-up-needed',
              content: 'Addressed concerns about implementation timeline...'
            }
          ].map((comm /* , index */) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-full ${
                      comm.type === 'email' ? 'bg-blue-100' :
                      comm.type === 'meeting' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      {comm.type === 'email' ? <Mail className="w-4 h-4 text-blue-600" /> :
                       comm.type === 'meeting' ? <Users className="w-4 h-4 text-green-600" /> :<>

                       <Phone className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div
</>><>

                      <h3 className="font-medium text-gray-900">{comm.subject}</h3>
                      <p
</> className="text-sm text-gray-600">{comm.stakeholder}</p>
                    </div>
                  </div><>

                  <p className="text-sm text-gray-700 mb-2">{comm.content}</p>
                  <div
</> className="flex items-center space-x-4 text-xs text-gray-500"><>

                    <span>{comm.date}</span>
                    <span
</> className={`px-2 py-1 rounded ${
                      comm.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      comm.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {comm.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <button className="text-government hover:underline text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="legislative-card"><>

        <h2 className="legislative-subtitle mb-4">Upcoming Meetings & Events</h2>
        <div
</> className="space-y-3">
          {[
            {
              title: 'House Finance Committee Hearing',
              date: '2025-09-02',
              time: '10:00 AM',
              location: 'Capitol Building, Room 205',
              attendees: ['Rep. Johnson', 'Rep. Wilson'],
              type: 'hearing'
            },
            {
              title: 'Stakeholder Briefing',
              date: '2025-09-05',
              time: '2:00 PM',
              location: 'County Office, Conference Room A',
              attendees: ['Commissioner Davis', 'Director Smith'],
              type: 'meeting'
            },
            {
              title: 'Legislative Reception',
              date: '2025-09-10',
              time: '6:00 PM',
              location: 'State Capitol Rotunda',
              attendees: ['Multiple legislators'],
              type: 'event'
            }
          ].map((event /* , index */) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className={`w-5 h-5 ${
                      event.type === 'hearing' ? 'text-blue-600' :
                      event.type === 'meeting' ? 'text-green-600' :
                      'text-purple-600'
                    }`} />
                    <div><>

                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p
</> className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2"><>

                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    <span
</>>{event.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Attendees: {Array.isArray(event.attendees) ? event.attendees.join(', ') : event.attendees}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-xs bg-government text-white py-1 px-3 rounded hover:bg-opacity-90">
                    Attend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StakeholderHub