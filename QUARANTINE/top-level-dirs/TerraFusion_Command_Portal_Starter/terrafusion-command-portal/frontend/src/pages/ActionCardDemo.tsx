import React from 'react'
import ActionCardRenderer from '../components/workflow/ActionCardRenderer'

// Mock action card data for demonstration
const mockActionCard = {
  id: 'card-gov-001',
  title: 'Federal Tax Document Processing',
  description: 'Process and verify federal tax documentation with government compliance requirements.',
  type: 'form' as const,
  priority: 'high' as const,
  status: 'pending' as const,
  jurisdiction: 'US-FED-IRS',
  classification: 'confidential' as const,
  compliance_requirements: ['FedRAMP', 'SOC2', 'IRS-1075'],
  fields: [
    {
      id: 'ssn',
      label: 'Social Security Number',
      type: 'text' as const,
      required: true,
      validation: '^\\d{3}-\\d{2}-\\d{4}$'
    },
    {
      id: 'document_type',
      label: 'Document Type', 
      type: 'select' as const,
      required: true,
      options: ['W-2', '1099', 'Schedule K-1', 'Other']
    },
    {
      id: 'filing_year',
      label: 'Tax Year',
      type: 'date' as const,
      required: true
    },
    {
      id: 'notes',
      label: 'Processing Notes',
      type: 'textarea' as const,
      required: false
    }
  ],
  audit_trail: [
    {
      timestamp: '2024-01-15T09:00:00Z',
      action: 'created',
      user: 'system',
      details: 'Action card created for tax document processing'
    }
  ]
}

export default function ActionCardDemo() {
  const handleActionComplete = (cardId: string, data: Record<string, string | boolean | string[]>) => {
    console.log('Action card completed:', { cardId, data })
    
    // Mock API call to submit action card data
    // In real implementation, this would call the backend API
    alert(`Action card ${cardId} completed successfully!`)
  }

  const handleActionReject = (cardId: string, reason: string) => {
    console.log('Action card rejected:', { cardId, reason })
    
    // Mock API call to handle rejection
    // In real implementation, this would update the card status
    alert(`Action card ${cardId} rejected: ${reason}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            TerraFusion Action Card Demo
          </h1>
          <p className="text-slate-600">
            Interactive XMTP workflow processing for government and commercial services
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Government Workflow Processing
            </h2>
            <p className="text-slate-600 mb-6">
              This demo showcases secure, compliant workflow processing using XMTP messaging
              with government-grade security and audit trails.
            </p>
            
            <ActionCardRenderer
              card={mockActionCard}
              onComplete={handleActionComplete}
              onReject={handleActionReject}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Features Demonstrated
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">Security & Compliance</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• End-to-end XMTP encryption</li>
                  <li>• Security classification handling</li>
                  <li>• Compliance framework validation</li>
                  <li>• Audit trail generation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">Workflow Processing</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Multi-step form processing</li>
                  <li>• Approval workflow management</li>
                  <li>• Real-time status updates</li>
                  <li>• Government service integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}