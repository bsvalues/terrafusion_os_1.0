import { useState, useCallback } from 'react';

interface ComplianceValidationRequest {
  code: string;
  language: string;
  projectType: string;
  standards: string[];
}

interface ComplianceValidationResponse {
  isCompliant: boolean;
  score: number;
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  auditTrail: AuditEntry[];
}

interface ComplianceViolation {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  length: number;
  standard: string;
  rule: string;
  quickFix?: string;
}

interface ComplianceRecommendation {
  type: 'security' | 'audit' | 'accessibility' | 'performance';
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
}

interface AuditEntry {
  timestamp: Date;
  action: string;
  user: string;
  details: Record<string, any>;
}

interface ComplianceStatus {
  isCompliant: boolean;
  score: number;
  lastValidated: Date;
  standards: {
    FISMA: { score: number; status: 'compliant' | 'warning' | 'violation' };
    NIST: { score: number; status: 'compliant' | 'warning' | 'violation' };
    Section508: { score: number; status: 'compliant' | 'warning' | 'violation' };
  };
}

export const useGovernmentCompliance = () => {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCompliance = useCallback(async (
    request: ComplianceValidationRequest
  ): Promise<ComplianceValidationResponse> => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/ide/compliance/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('terrafusion-token')}`
        },
        body: JSON.stringify({
          ...request,
          governmentGrade: true,
          realTimeValidation: true,
          auditRequired: true
        })
      });

      if (!response.ok) {
        throw new Error(`Compliance validation failed: ${response.statusText}`);
      }

      const validation: ComplianceValidationResponse = await response.json();

      // Update compliance status
      setComplianceStatus({
        isCompliant: validation.isCompliant,
        score: validation.score,
        lastValidated: new Date(),
        standards: {
          FISMA: {
            score: calculateStandardScore(validation.violations, 'FISMA'),
            status: getStandardStatus(validation.violations, 'FISMA')
          },
          NIST: {
            score: calculateStandardScore(validation.violations, 'NIST'),
            status: getStandardStatus(validation.violations, 'NIST')
          },
          Section508: {
            score: calculateStandardScore(validation.violations, 'Section508'),
            status: getStandardStatus(validation.violations, 'Section508')
          }
        }
      });

      return validation;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown compliance validation error';
      setError(errorMessage);
      console.error('Compliance Validation Error:', err);
      
      // Return fallback compliance check
      return getFallbackComplianceValidation(request);
      
    } finally {
      setIsValidating(false);
    }
  }, []);

  const generateComplianceReport = useCallback(async (
    projectId: string,
    includeAuditTrail: boolean = true
  ) => {
    try {
      const response = await fetch(`/api/ide/compliance/report/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('terrafusion-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Compliance report generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Compliance Report Error:', err);
      throw err;
    }
  }, []);

  const fixComplianceViolation = useCallback(async (
    violationId: string,
    code: string,
    autoFix: boolean = true
  ) => {
    try {
      const response = await fetch('/api/ide/compliance/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('terrafusion-token')}`
        },
        body: JSON.stringify({
          violationId,
          code,
          autoFix,
          governmentGrade: true
        })
      });

      if (!response.ok) {
        throw new Error(`Compliance fix failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Compliance Fix Error:', err);
      throw err;
    }
  }, []);

  const getComplianceTemplate = useCallback(async (
    templateType: 'FISMA' | 'NIST' | 'Section508',
    language: string,
    componentType: string
  ) => {
    try {
      const response = await fetch('/api/ide/compliance/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('terrafusion-token')}`
        },
        body: JSON.stringify({
          templateType,
          language,
          componentType,
          governmentGrade: true,
          includeAuditTrail: true
        })
      });

      if (!response.ok) {
        throw new Error(`Compliance template generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Compliance Template Error:', err);
      throw err;
    }
  }, []);

  return {
    validateCompliance,
    generateComplianceReport,
    fixComplianceViolation,
    getComplianceTemplate,
    complianceStatus,
    isValidating,
    error
  };
};

// Helper functions
const calculateStandardScore = (violations: ComplianceViolation[], standard: string): number => {
  const standardViolations = violations.filter(v => v.standard === standard);
  const errorCount = standardViolations.filter(v => v.severity === 'error').length;
  const warningCount = standardViolations.filter(v => v.severity === 'warning').length;
  
  const maxScore = 100;
  const errorPenalty = 10;
  const warningPenalty = 3;
  
  return Math.max(0, maxScore - (errorCount * errorPenalty) - (warningCount * warningPenalty));
};

const getStandardStatus = (
  violations: ComplianceViolation[], 
  standard: string
): 'compliant' | 'warning' | 'violation' => {
  const standardViolations = violations.filter(v => v.standard === standard);
  
  if (standardViolations.some(v => v.severity === 'error')) {
    return 'violation';
  }
  
  if (standardViolations.some(v => v.severity === 'warning')) {
    return 'warning';
  }
  
  return 'compliant';
};

// Fallback compliance validation when service is unavailable
const getFallbackComplianceValidation = (
  request: ComplianceValidationRequest
): ComplianceValidationResponse => {
  const violations: ComplianceViolation[] = [];
  
  // Basic static analysis for common compliance issues
  if (request.code.includes('console.log') && request.language === 'typescript') {
    violations.push({
      id: 'console-log-violation',
      severity: 'warning',
      message: 'Console.log statements should be removed in production code for FISMA compliance',
      line: 1,
      column: 1,
      length: 11,
      standard: 'FISMA',
      rule: 'No Debug Output',
      quickFix: 'Replace with proper logging service'
    });
  }
  
  if (!request.code.includes('audit') && request.projectType === 'government-module') {
    violations.push({
      id: 'missing-audit-trail',
      severity: 'error',
      message: 'Government modules must implement audit trail logging',
      line: 1,
      column: 1,
      length: 0,
      standard: 'FISMA',
      rule: 'Audit Trail Required',
      quickFix: 'Add audit logging service'
    });
  }
  
  if (!request.code.includes('Authorization') && request.language === 'csharp') {
    violations.push({
      id: 'missing-authorization',
      severity: 'error',
      message: 'Government API endpoints must have proper authorization',
      line: 1,
      column: 1,
      length: 0,
      standard: 'NIST',
      rule: 'Access Control Required',
      quickFix: 'Add [Authorize] attribute'
    });
  }

  const score = violations.length === 0 ? 100 : 
    Math.max(0, 100 - violations.filter(v => v.severity === 'error').length * 20 - 
    violations.filter(v => v.severity === 'warning').length * 5);

  return {
    isCompliant: violations.filter(v => v.severity === 'error').length === 0,
    score,
    violations,
    recommendations: [
      {
        type: 'security',
        priority: 'high',
        description: 'Implement comprehensive audit logging',
        implementation: 'Add AuditService dependency and log all user actions'
      },
      {
        type: 'audit',
        priority: 'high',
        description: 'Add proper error handling with audit trail',
        implementation: 'Use try-catch blocks with audit logging for exceptions'
      }
    ],
    auditTrail: [
      {
        timestamp: new Date(),
        action: 'compliance_validation_fallback',
        user: 'system',
        details: { request }
      }
    ]
  };
};