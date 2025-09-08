import React from 'react'
import { Shield, Clock, CheckCircle, Warning, Calendar  } from '@mui/icons-material'

const ComplianceMonitor = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="legislative-title">Compliance Monitor</h1>
          <p
</>
className="legislative-body mt-1">Track regulatory requirements and compliance deadlines</p>
        </div>
        <div className="flex space-x-3">
          <button className="legislative-button">
            <Calendar className="w-4 h-4 mr-2 inline" />
            Schedule Review
          </button>
        </div>
      </div>

      {/* Compliance Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="legislative-card">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-gray-600">Compliant</p>
              <p
</>
className="text-2xl font-bold text-green-600 mt-1">23</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="legislative-card">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p
</>
className="text-2xl font-bold text-yellow-600 mt-1">8</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="legislative-card">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-gray-600">At Risk</p>
              <p
</>
className="text-2xl font-bold text-red-600 mt-1">3</p>
            </div>
            <Warning className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="legislative-card">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-gray-600">Protected</p>
              <p
</>
className="text-2xl font-bold text-blue-600 mt-1">98%</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="legislative-card"><>

        <h2 className="legislative-subtitle mb-4">Upcoming Compliance Deadlines</h2>
        <div
</>
className="space-y-4">
          {[
            {
              title: 'Property Assessment Data Validation',
              requirement: 'Annual validation of assessment database accuracy',
              deadline: '2025-09-15',
              daysLeft: 17,
              status: 'pending',
              priority: 'high'
            },
            {
              title: 'FOIA Request Processing Update',
              requirement: 'Implement new transparency requirements',
              deadline: '2025-09-30',
              daysLeft: 32,
              status: 'in-progress', 
              priority: 'medium'
            },
            {
              title: 'Security Compliance Audit',
              requirement: 'Annual cybersecurity assessment',
              deadline: '2025-10-01',
              daysLeft: 33,
              status: 'pending',
              priority: 'critical'
            },
            {
              title: 'Public Records Portal Update',
              requirement: 'Enhanced public access features',
              deadline: '2025-11-01',
              daysLeft: 64,
              status: 'planning',
              priority: 'medium'
            }
          ].map((item /* , index */) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2"><>

                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span
</>
className={`status-badge text-xs ${
                      item.priority === 'critical' ? 'priority-critical' :
                      item.priority === 'high' ? 'priority-high' :
                      'priority-medium'
                    }`}>
                      {item.priority}
                    </span>
                    <span className={`status-badge text-xs ${
                      item.status === 'pending' ? 'status-bill-committee' :
                      item.status === 'in-progress' ? 'status-bill-active' :
                      'status-bill-passed'
                    }`}>
                      {item.status}
                    </span>
                  </div><>

                  <p className="text-sm text-gray-600 mb-2">{item.requirement}</p>
                  <div
</>
className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-500"><>

                      <Calendar className="w-4 h-4 mr-1" />
                      Due {new Date(item.deadline).toLocaleDateString()}
                    </div>
                    <div
</>
className={`flex items-center ${
                      item.daysLeft <= 14 ? 'text-red-600' :
                      item.daysLeft <= 30 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      <Clock className="w-4 h-4 mr-1" />
                      {item.daysLeft} days left
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {item.daysLeft <= 14 ? (
                    <Warning className="w-6 h-6 text-red-500" />
                  ) : item.daysLeft <= 30 ? (
                    <Clock className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Categories */}
      <div className="legislative-card"><>

        <h2 className="legislative-subtitle mb-4">Compliance Categories</h2>
        <div
</>
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              category: 'Data Privacy',
              requirements: 12,
              compliant: 10,
              status: 'good'
            },
            {
              category: 'Public Records',
              requirements: 8,
              compliant: 7,
              status: 'warning'
            },
            {
              category: 'Assessment Standards',
              requirements: 15,
              compliant: 13,
              status: 'good'
            },
            {
              category: 'Technology Security',
              requirements: 10,
              compliant: 8,
              status: 'warning'
            },
            {
              category: 'Financial Reporting',
              requirements: 6,
              compliant: 6,
              status: 'excellent'
            },
            {
              category: 'Accessibility',
              requirements: 9,
              compliant: 7,
              status: 'warning'
            }
          ].map((cat /* , index */) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2"><>

                <h3 className="font-medium text-gray-900">{cat.category}</h3>
                <div
</>
className={`w-3 h-3 rounded-full ${
                  cat.status === 'excellent' ? 'bg-green-500' :
                  cat.status === 'good' ? 'bg-blue-500' :
                  cat.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-1"><>

                  <span>{cat.compliant} of {cat.requirements} compliant</span>
                  <span
</>
</>>{Math.round((cat.compliant / cat.requirements) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      cat.status === 'excellent' ? 'bg-green-500' :
                      cat.status === 'good' ? 'bg-blue-500' :
                      cat.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${(cat.compliant / cat.requirements) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ComplianceMonitor