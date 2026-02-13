import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Zap,
  Settings,
  Eye,
  Edit3,
  Send,
  RefreshCw,
  ExternalLink,
  Shield,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

/**
 * TerraFusion Action Card Renderer
 * 
 * Renders interactive workflow cards for XMTP-powered government services
 * Supports citizen requests, permit applications, emergency responses, etc.
 * 
 * Features:
 * - Dynamic form rendering based on action type
 * - Real-time status updates via WebSocket
 * - Multi-step workflow support
 * - Government compliance tracking
 * - Citizen-facing and internal interfaces
 */

// Simple UI Components (inline for demonstration)
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h2>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string }> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const Button: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  variant?: string;
  size?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizeStyles = size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4';
  const variantStyles = variant === 'outline' 
    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
    : 'bg-blue-600 text-white hover:bg-blue-700';
    
  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{ 
  type?: string;
  id?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ 
  type = 'text', 
  id, 
  value, 
  placeholder, 
  disabled = false, 
  className = '',
  onChange
}) => (
  <input
    type={type}
    id={id}
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100' : ''} ${className}`}
  />
);

const Textarea: React.FC<{ 
  id?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({ 
  id, 
  value, 
  placeholder, 
  disabled = false, 
  className = '',
  rows = 3,
  onChange
}) => (
  <textarea
    id={id}
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    rows={rows}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${disabled ? 'bg-gray-100' : ''} ${className}`}
  />
);

const Select: React.FC<{ 
  children: React.ReactNode;
  value?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}> = ({ children, value, disabled = false, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100' : 'bg-white'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{value || 'Select...'}</span>
        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
};

const SelectItem: React.FC<{ 
  children: React.ReactNode;
  value: string;
  onSelect?: (value: string) => void;
}> = ({ children, value, onSelect }) => (
  <button
    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
    onClick={() => onSelect?.(value)}
  >
    {children}
  </button>
);

const Progress: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const Separator = () => <hr className="my-4 border-gray-200" />;

export interface ActionCardProps {
  action: ActionCardData;
  mode?: 'citizen' | 'employee' | 'admin';
  onActionUpdate?: (actionId: string, updates: Partial<ActionCardData>) => void;
  onSubmit?: (actionId: string, formData: Record<string, any>) => void;
  className?: string;
}

export interface ActionCardData {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  status: ActionStatus;
  priority: ActionPriority;
  
  // Workflow data
  currentStep: number;
  totalSteps: number;
  steps: WorkflowStep[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignedTo?: string;
  department: string;
  county: string;
  
  // Form data
  formFields: FormField[];
  submittedData?: Record<string, any>;
  
  // Progress tracking
  completionPercentage: number;
  estimatedCompletion?: string;
  
  // Compliance and audit
  complianceStatus: ComplianceStatus;
  auditTrail: AuditEntry[];
  
  // Integration data
  externalSystems?: ExternalSystemStatus[];
  notifications?: NotificationConfig[];
}

export type ActionType = 
  | 'permit_application'
  | 'public_record_request'
  | 'citizen_service_request'
  | 'emergency_report'
  | 'complaint_filing'
  | 'meeting_scheduling'
  | 'payment_processing'
  | 'document_submission'
  | 'status_inquiry'
  | 'federation_request';

export type ActionStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'expired'
  | 'cancelled';

export type ActionPriority = 'emergency' | 'high' | 'normal' | 'low';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
  assignedRole: string;
  estimatedDuration?: string;
  requiredFields?: string[];
  dependencies?: string[];
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'date' | 'checkbox' | 'number' | 'email' | 'phone';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: FieldValidation;
  helpText?: string;
  governmentCompliance?: boolean;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customValidation?: string;
}

export type ComplianceStatus = 'compliant' | 'pending_review' | 'non_compliant' | 'exempt';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  systemGenerated: boolean;
}

export interface ExternalSystemStatus {
  systemId: string;
  systemName: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  dataExchanged?: number;
}

export interface NotificationConfig {
  type: 'email' | 'sms' | 'push' | 'mail';
  recipient: string;
  template: string;
  triggerCondition: string;
}

const ActionCardRenderer: React.FC<ActionCardProps> = ({
  action,
  mode = 'citizen',
  onActionUpdate,
  onSubmit,
  className = ''
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(action.submittedData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    form: true,
    workflow: false,
    audit: false,
    compliance: false,
  });

  // Real-time updates via WebSocket (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time status updates
      if (action.status === 'under_review' && Math.random() < 0.1) {
        onActionUpdate?.(action.id, {
          completionPercentage: Math.min(action.completionPercentage + 5, 100),
          updatedAt: new Date().toISOString(),
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [action.id, action.status, action.completionPercentage, onActionUpdate]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    action.formFields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required && (!value || value.toString().trim() === '')) {
        errors[field.id] = `${field.label} is required`;
        return;
      }
      
      if (field.validation && value) {
        const validation = field.validation;
        
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          errors[field.id] = `${field.label} format is invalid`;
        }
        
        if (validation.minLength && value.length < validation.minLength) {
          errors[field.id] = `${field.label} must be at least ${validation.minLength} characters`;
        }
        
        if (validation.maxLength && value.length > validation.maxLength) {
          errors[field.id] = `${field.label} must not exceed ${validation.maxLength} characters`;
        }
        
        if (validation.min && parseFloat(value) < validation.min) {
          errors[field.id] = `${field.label} must be at least ${validation.min}`;
        }
        
        if (validation.max && parseFloat(value) > validation.max) {
          errors[field.id] = `${field.label} must not exceed ${validation.max}`;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, action.formFields]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      alert('Please fix validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit?.(action.id, formData);
      
      alert('Action submitted successfully');
      
      // Update action status
      onActionUpdate?.(action.id, {
        status: 'submitted',
        submittedData: formData,
        updatedAt: new Date().toISOString(),
        completionPercentage: 25,
      });
      
    } catch (error) {
      alert('Failed to submit action. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit, action.id, formData, onActionUpdate]);

  // Handle field changes
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  }, [validationErrors]);

  // Status styling
  const getStatusStyle = (status: ActionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Priority styling and icon
  const getPriorityDisplay = (priority: ActionPriority) => {
    switch (priority) {
      case 'emergency':
        return { icon: <Zap className="w-4 h-4" />, class: 'bg-red-500 text-white' };
      case 'high':
        return { icon: <AlertTriangle className="w-4 h-4" />, class: 'bg-orange-500 text-white' };
      case 'normal':
        return { icon: <Clock className="w-4 h-4" />, class: 'bg-blue-500 text-white' };
      case 'low':
        return { icon: <Calendar className="w-4 h-4" />, class: 'bg-gray-500 text-white' };
    }
  };

  // Render form field
  const renderFormField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = validationErrors[field.id];
    const isDisabled = action.status === 'completed' || action.status === 'cancelled';
    
    const commonProps = {
      id: field.id,
      value,
      disabled: isDisabled,
      className: error ? 'border-red-300' : '',
      onChange: (e: any) => handleFieldChange(field.id, e.target.value),
    };

    let fieldElement;
    
    switch (field.type) {
      case 'textarea':
        fieldElement = (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder}
            rows={4}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
        break;
        
      case 'select':
        fieldElement = (
          <Select
            value={value}
            onValueChange={(newValue: string) => handleFieldChange(field.id, newValue)}
            disabled={isDisabled}
          >
            <SelectTrigger className={error ? 'border-red-300' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;
        
      case 'file':
        fieldElement = (
          <div className="space-y-2">
            <Input
              type="file"
              {...commonProps}
              onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
            />
            {value && (
              <div className="text-sm text-gray-600">
                Selected: {typeof value === 'object' ? value.name : value}
              </div>
            )}
          </div>
        );
        break;
        
      case 'checkbox':
        fieldElement = (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor={field.id} className="text-sm">
              {field.label}
            </label>
          </div>
        );
        break;
        
      default:
        fieldElement = (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
          />
        );
    }
    
    if (field.type === 'checkbox') {
      return (
        <div key={field.id} className="space-y-2">
          {fieldElement}
          {field.helpText && (
            <p className="text-sm text-gray-600">{field.helpText}</p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.governmentCompliance && (
            <Badge variant="secondary" className="ml-2 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Gov Required
            </Badge>
          )}
        </label>
        {fieldElement}
        {field.helpText && (
          <p className="text-sm text-gray-600">{field.helpText}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  // Calculate workflow progress
  const workflowProgress = useMemo(() => {
    const completedSteps = action.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / action.totalSteps) * 100;
  }, [action.steps, action.totalSteps]);

  const priorityDisplay = getPriorityDisplay(action.priority);

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-xl font-semibold">
                {action.title}
              </CardTitle>
              <Badge className={priorityDisplay.class}>
                {priorityDisplay.icon}
                <span className="ml-1 capitalize">{action.priority}</span>
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{action.county} County</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{action.department}</span>
              </div>
              {action.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusStyle(action.status)}>
              {action.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="text-right">
              <div className="text-sm font-medium">
                {action.completionPercentage}% Complete
              </div>
              <Progress value={action.completionPercentage} className="w-24" />
            </div>
          </div>
        </div>
        
        {action.description && (
          <p className="text-gray-600 mt-2">{action.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Workflow Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Workflow Progress</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedSections(prev => ({ ...prev, workflow: !prev.workflow }))}
            >
              {expandedSections.workflow ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {action.currentStep} of {action.totalSteps}</span>
              <span>{Math.round(workflowProgress)}% Complete</span>
            </div>
            <Progress value={workflowProgress} className="w-full" />
          </div>
          
          {expandedSections.workflow && (
            <div className="space-y-2 mt-4">
              {action.steps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {step.status === 'active' && <Clock className="w-5 h-5 text-blue-500" />}
                    {step.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                    {step.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                    {step.assignedRole && (
                      <div className="text-xs text-gray-500 mt-1">
                        Assigned to: {step.assignedRole}
                      </div>
                    )}
                  </div>
                  {step.estimatedDuration && (
                    <div className="text-xs text-gray-500">
                      {step.estimatedDuration}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Form Section */}
        {action.formFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {mode === 'citizen' ? 'Your Information' : 'Application Details'}
              </h3>
              {mode !== 'citizen' && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View Only
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {action.formFields.map(renderFormField)}
            </div>
            
            {mode === 'citizen' && action.status === 'draft' && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">
                  Save Draft
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Compliance Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Compliance Status</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedSections(prev => ({ ...prev, compliance: !prev.compliance }))}
            >
              {expandedSections.compliance ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {action.complianceStatus === 'compliant' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Compliant
              </Badge>
            )}
            {action.complianceStatus === 'pending_review' && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="w-4 h-4 mr-1" />
                Pending Review
              </Badge>
            )}
            {action.complianceStatus === 'non_compliant' && (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="w-4 h-4 mr-1" />
                Non-Compliant
              </Badge>
            )}
          </div>
          
          {expandedSections.compliance && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="text-sm">
                <strong>Regulatory Requirements:</strong>
              </div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• FOIA Compliance: ✅ Met</li>
                <li>• ADA Accessibility: ✅ Met</li>
                <li>• Data Retention Policy: ✅ Applied</li>
                <li>• Public Records Act: ✅ Compliant</li>
              </ul>
            </div>
          )}
        </div>

        {/* External Systems Status */}
        {action.externalSystems && action.externalSystems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">System Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {action.externalSystems.map(system => (
                <div key={system.systemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">{system.systemName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {system.status === 'connected' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    {system.status === 'error' && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                    {system.status === 'syncing' && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                    <span className="text-sm capitalize">{system.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        {mode !== 'citizen' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Audit Trail</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedSections(prev => ({ ...prev, audit: !prev.audit }))}
              >
                {expandedSections.audit ? 'Collapse' : 'Expand'}
              </Button>
            </div>
            
            {expandedSections.audit && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {action.auditTrail.map(entry => (
                  <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {entry.systemGenerated ? (
                        <Settings className="w-4 h-4 text-blue-500 mt-0.5" />
                      ) : (
                        <Users className="w-4 h-4 text-green-500 mt-0.5" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm font-medium">{entry.action}</div>
                      <div className="text-xs text-gray-600">{entry.details}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(entry.timestamp).toLocaleString()} by {entry.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {mode !== 'citizen' && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View in System
            </Button>
            {action.status === 'under_review' && (
              <>
                <Button variant="outline" className="text-red-600 hover:bg-red-50">
                  Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Approve
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionCardRenderer;