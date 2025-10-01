'use client'

import { useState, useEffect } from 'react'

// Mock data for demonstration - in production, this would come from APIs
const mockSystemStatus = {
  overall: 'healthy',
  services: [
    { name: 'TerraFusion API', status: 'healthy', uptime: '99.8%' },
    { name: 'Database', status: 'healthy', uptime: '99.9%' },
    { name: 'AI Coordination', status: 'healthy', uptime: '99.7%' },
    { name: 'Module Ecosystem', status: 'healthy', uptime: '99.5%' },
  ],
  aiAgents: {
    supremeCommander: 'active',
    fieldGenerals: 1220,
    operationalForces: 48779,
    rustEngine: 50000,
    total: 51008 + 50000
  },
  compliance: {
    fisma: 'compliant',
    nist: 'level-3',
    score: 98.5
  }
}

const mockTestResults = [
  {
    suite: 'Government Personas',
    tests: 24,
    passed: 24,
    failed: 0,
    status: 'passed',
    lastRun: '2024-01-15T10:30:00Z'
  },
  {
    suite: 'AI Agent Coordination',
    tests: 18,
    passed: 18,
    failed: 0,
    status: 'passed',
    lastRun: '2024-01-15T10:25:00Z'
  },
  {
    suite: 'Module Ecosystem',
    tests: 35,
    passed: 34,
    failed: 1,
    status: 'warning',
    lastRun: '2024-01-15T10:20:00Z'
  },
  {
    suite: 'FISMA/NIST Compliance',
    tests: 47,
    passed: 47,
    failed: 0,
    status: 'passed',
    lastRun: '2024-01-15T10:15:00Z'
  }
]

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState(mockSystemStatus)
  const [testResults, setTestResults] = useState(mockTestResults)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">UAT Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Benton County Washington - TerraFusion OS User Acceptance Testing
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="metric-label">System Status</div>
          <div className="metric-value text-green-600">
            {systemStatus.overall === 'healthy' ? '✅ Healthy' : '❌ Issues'}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">AI Agents Active</div>
          <div className="metric-value">{systemStatus.aiAgents.total.toLocaleString()}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Compliance Score</div>
          <div className="metric-value text-blue-600">{systemStatus.compliance.score}%</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Test Success Rate</div>
          <div className="metric-value text-green-600">
            {Math.round((testResults.reduce((acc, suite) => acc + suite.passed, 0) / 
                        testResults.reduce((acc, suite) => acc + suite.tests, 0)) * 100)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Status */}
        <div className="government-card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          
          <div className="space-y-4">
            {systemStatus.services.map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-600">Uptime: {service.uptime}</div>
                </div>
                <span className={`status-indicator ${
                  service.status === 'healthy' ? 'status-active' : 'status-error'
                }`}>
                  {service.status === 'healthy' ? '✅ Healthy' : '❌ Error'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h3 className="font-medium text-gray-900 mb-3">AI Agent Coordination</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Supreme Commander</div>
                <div className="font-medium">Claude (Active)</div>
              </div>
              <div>
                <div className="text-gray-600">Field Generals</div>
                <div className="font-medium">{systemStatus.aiAgents.fieldGenerals.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Operational Forces</div>
                <div className="font-medium">{systemStatus.aiAgents.operationalForces.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Rust Engine</div>
                <div className="font-medium">{systemStatus.aiAgents.rustEngine.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="government-card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
          
          <div className="space-y-4">
            {testResults.map((suite, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{suite.suite}</div>
                  <span className={`status-indicator ${
                    suite.status === 'passed' ? 'status-active' : 
                    suite.status === 'warning' ? 'status-warning' : 'status-error'
                  }`}>
                    {suite.status === 'passed' ? '✅ Passed' : 
                     suite.status === 'warning' ? '⚠️ Warning' : '❌ Failed'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {suite.passed}/{suite.tests} tests passed
                  {suite.failed > 0 && `, ${suite.failed} failed`}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      suite.status === 'passed' ? 'bg-green-500' : 
                      suite.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(suite.passed / suite.tests) * 100}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Last run: {new Date(suite.lastRun).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="mt-8">
        <div className="government-card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="compliance-badge compliance-fisma mb-2">
                FISMA Moderate
              </div>
              <div className="text-2xl font-bold text-green-600">✅ Compliant</div>
              <div className="text-sm text-gray-600">47/47 Controls Implemented</div>
            </div>
            
            <div className="text-center">
              <div className="compliance-badge compliance-nist mb-2">
                NIST Framework
              </div>
              <div className="text-2xl font-bold text-blue-600">Level 3</div>
              <div className="text-sm text-gray-600">Repeatable (96.8%)</div>
            </div>
            
            <div className="text-center">
              <div className="compliance-badge bg-green-100 text-green-800 mb-2">
                Data Protection
              </div>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">89,247 Parcels Secured</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="government-card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 text-left border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <div className="font-medium text-blue-600">🧪 Run All Tests</div>
              <div className="text-sm text-gray-600">Execute complete test suite</div>
            </button>
            
            <button className="p-4 text-left border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <div className="font-medium text-purple-600">🔒 Security Scan</div>
              <div className="text-sm text-gray-600">Validate FISMA compliance</div>
            </button>
            
            <button className="p-4 text-left border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <div className="font-medium text-green-600">📊 Generate Report</div>
              <div className="text-sm text-gray-600">Create compliance report</div>
            </button>
            
            <button className="p-4 text-left border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <div className="font-medium text-orange-600">🤖 AI Status</div>
              <div className="text-sm text-gray-600">Monitor agent coordination</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}