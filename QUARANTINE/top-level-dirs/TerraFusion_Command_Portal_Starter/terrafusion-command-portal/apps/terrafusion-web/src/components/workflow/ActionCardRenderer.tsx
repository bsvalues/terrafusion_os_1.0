"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, AlertCircle, Users, FileText, Shield } from 'lucide-react';

// Types for XMTP Action Cards
interface ActionCardData {
  id: string;
  title: string;
  description: string;
  type: 'approval' | 'form' | 'notification' | 'workflow' | 'compliance';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignee?: string;
  deadline?: string;
  jurisdiction: string;
  classification: 'unclassified' | 'cui' | 'confidential';
  workflow_id?: string;
  fields?: ActionCardField[];
  compliance_requirements?: string[];
  audit_trail: AuditEntry[];
}

interface ActionCardField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
  required: boolean;
  options?: string[];
  validation?: string;
  value?: string | boolean | string[];
}

interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

interface ActionCardRendererProps {
  card: ActionCardData;
  onComplete?: (cardId: string, data: Record<string, string | boolean | string[]>) => void;
  onReject?: (cardId: string, reason: string) => void;
  readonly?: boolean;
}

const ActionCardRenderer: React.FC<ActionCardRendererProps> = ({
  card,
  onComplete,
  onReject,
  readonly = false
}) => {
  const [formData, setFormData] = useState<Record<string, string | boolean | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  // Initialize form data from card fields
  useEffect(() => {
    if (card.fields) {
      const initialData: Record<string, string | boolean | string[]> = {};
      card.fields.forEach(field => {
        initialData[field.id] = field.value || '';
      });
      setFormData(initialData);
    }
  }, [card.fields]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get classification color
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'confidential': return 'bg-red-100 text-red-800 border-red-300';
      case 'cui': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'unclassified': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Handle form field changes
  const handleFieldChange = (fieldId: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Render form field based on type
  const renderField = (field: ActionCardField) => {
    const value = formData[field.id] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={readonly}
            placeholder={field.label}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={readonly}
            placeholder={field.label}
            required={field.required}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value === true}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              disabled={readonly}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={field.id} className="text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={readonly}
            required={field.required}
          />
        );
      
      default:
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={readonly}
            placeholder={field.label}
            required={field.required}
          />
        );
    }
  };

  // Handle card completion
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      const missingFields = card.fields?.filter(field => 
        field.required && (!formData[field.id] || formData[field.id] === '')
      );
      
      if (missingFields && missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      await onComplete?.(card.id, formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle card rejection
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject?.(card.id, rejectionReason);
    } finally {
      setIsSubmitting(false);
      setShowRejectionForm(false);
      setRejectionReason('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border border-gray-200">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              {card.title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {card.description}
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-2 items-end">
            {getStatusIcon(card.status)}
            <Badge className={getPriorityColor(card.priority)}>
              {card.priority.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4 text-gray-500" />
            <Badge className={getClassificationColor(card.classification)}>
              {card.classification.toUpperCase()}
            </Badge>
          </div>
          
          {card.jurisdiction && (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{card.jurisdiction}</span>
            </div>
          )}
          
          {card.deadline && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Due: {new Date(card.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {card.workflow_id && (
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 font-mono text-xs">
                WF-{card.workflow_id.slice(-6)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Compliance Requirements */}
        {card.compliance_requirements && card.compliance_requirements.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Compliance Requirements</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              {card.compliance_requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Fields */}
        {card.fields && card.fields.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Required Information</h4>
            {card.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label 
                  htmlFor={field.id} 
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {!readonly && card.status === 'pending' && (
          <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
            {!showRejectionForm ? (
              <div className="flex space-x-3">
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Action
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowRejectionForm(true)}
                  variant="outline"
                  className="px-6 border-red-300 text-red-600 hover:bg-red-50"
                >
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                />
                <div className="flex space-x-3">
                  <Button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionReason('');
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Trail */}
        {card.audit_trail && card.audit_trail.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Audit Trail</h4>
            <div className="space-y-2">
              {card.audit_trail.slice(-3).map((entry, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{entry.action}</span>
                    <span className="text-gray-600"> by {entry.user}</span>
                    {entry.details && (
                      <div className="text-gray-500 mt-1">{entry.details}</div>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap ml-4">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionCardRenderer;

// Example usage component for testing
export const ActionCardDemo: React.FC = () => {
  const [cards, setCards] = useState<ActionCardData[]>([
    {
      id: 'card-001',
      title: 'Compliance Review - Building Permit',
      description: 'Review and approve building permit application for commercial construction project.',
      type: 'approval',
      priority: 'high',
      status: 'pending',
      assignee: 'inspector@county-a.gov',
      deadline: '2025-10-20T17:00:00Z',
      jurisdiction: 'County A Planning Department',
      classification: 'cui',
      workflow_id: 'wf-compliance-check-001',
      fields: [
        {
          id: 'project_address',
          label: 'Project Address',
          type: 'text',
          required: true,
          value: '123 Commerce St, City, State 12345'
        },
        {
          id: 'approval_decision',
          label: 'Approval Decision',
          type: 'select',
          required: true,
          options: ['Approve', 'Approve with Conditions', 'Deny']
        },
        {
          id: 'inspection_notes',
          label: 'Inspection Notes',
          type: 'textarea',
          required: false
        },
        {
          id: 'conditions_met',
          label: 'All safety conditions have been verified',
          type: 'checkbox',
          required: true
        }
      ],
      compliance_requirements: [
        'Verify structural engineering approval',
        'Confirm zoning compliance',
        'Check environmental impact assessment',
        'Validate parking requirements'
      ],
      audit_trail: [
        {
          timestamp: '2025-10-15T09:00:00Z',
          action: 'Application Submitted',
          user: 'applicant@company.com',
          details: 'Initial permit application received'
        },
        {
          timestamp: '2025-10-15T14:30:00Z',
          action: 'Assigned for Review',
          user: 'system',
          details: 'Automatically assigned to inspector based on jurisdiction'
        },
        {
          timestamp: '2025-10-16T08:15:00Z',
          action: 'Review Started',
          user: 'inspector@county-a.gov',
          details: 'Initial document review completed'
        }
      ]
    }
  ]);

  const handleCardComplete = (cardId: string, data: Record<string, any>) => {
    console.log('Card completed:', cardId, data);
    setCards(prev => prev.map(card => 
      card.id === cardId 
        ? { 
            ...card, 
            status: 'completed' as const,
            audit_trail: [
              ...card.audit_trail,
              {
                timestamp: new Date().toISOString(),
                action: 'Completed',
                user: 'current_user@county-a.gov',
                details: `Completed with data: ${JSON.stringify(data)}`
              }
            ]
          }
        : card
    ));
  };

  const handleCardReject = (cardId: string, reason: string) => {
    console.log('Card rejected:', cardId, reason);
    setCards(prev => prev.map(card => 
      card.id === cardId 
        ? { 
            ...card, 
            status: 'rejected' as const,
            audit_trail: [
              ...card.audit_trail,
              {
                timestamp: new Date().toISOString(),
                action: 'Rejected',
                user: 'current_user@county-a.gov',
                details: `Rejection reason: ${reason}`
              }
            ]
          }
        : card
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏛️ TerraFusion Action Card Renderer
          </h1>
          <p className="text-gray-600">
            XMTP-powered interactive workflow cards for government services
          </p>
        </div>
        
        <div className="space-y-6">
          {cards.map(card => (
            <ActionCardRenderer
              key={card.id}
              card={card}
              onComplete={handleCardComplete}
              onReject={handleCardReject}
            />
          ))}
        </div>
        
        {/* System Integration Status */}
        <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🔗 System Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>XMTP Protocol: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Workflow Engine: Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Real-time Updates: Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};