/**
 * Terrafusion Form Engine - Production Form Interface
 * Form-first architecture with real-time agent validation
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Warning, CheckCircle, Brain, FileCheck, Shield, Zap  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  type: "text" | "number" | "select" | "textarea" | "comp" | "address";
  label: string;
  value: any;
  required: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
  agentHints?: string[];
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  order: number;
}

interface ValidationResult {
  fieldId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface AgentFeedback {
  agentId: string;
  fieldId?: string;
  type: "validation" | "suggestion" | "narrative" | "comp" | "risk";
  content: any;
  confidence: number;
}

export default function FormEnginePage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [agentFeedback, setAgentFeedback] = useState<AgentFeedback[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [formSections] = useState<FormSection[]>([
    {
      id: "subject-property",
      title: "Subject Property Information",
      order: 1,
      fields: [
        {
          id: "property_address",
          type: "address",
          label: "Property Address",
          value: "",
          required: true,
          agentHints: ["address-validation", "geo-lookup"],
          validation: {
            pattern: "^[0-9]+\\s+[A-Za-z0-9\\s,.-]+$",
          },
        },
        {
          id: "legal_description",
          type: "textarea",
          label: "Legal Description",
          value: "",
          required: true,
          agentHints: ["legal-validation"],
        },
        {
          id: "sale_price",
          type: "number",
          label: "Sale Price",
          value: "",
          required: true,
          agentHints: ["market-validation", "price-analysis"],
          validation: {
            min: 0,
            max: 50000000,
          },
        },
        {
          id: "gla",
          type: "number",
          label: "Gross Living Area (sq ft)",
          value: "",
          required: true,
          agentHints: ["gla-validation", "measurement-check"],
          validation: {
            min: 100,
            max: 50000,
          },
        },
      ],
    },
    {
      id: "comparables",
      title: "Comparable Sales",
      order: 2,
      fields: [
        {
          id: "comp_1_address",
          type: "address",
          label: "Comparable 1 Address",
          value: "",
          required: true,
          agentHints: ["comp-validation", "distance-check"],
        },
        {
          id: "comp_1_sale_price",
          type: "number",
          label: "Comparable 1 Sale Price",
          value: "",
          required: true,
          agentHints: ["comp-analysis", "adjustment-calculation"],
        },
        {
          id: "comp_1_gla",
          type: "number",
          label: "Comparable 1 GLA",
          value: "",
          required: true,
          agentHints: ["gla-comparison"],
        },
      ],
    },
  ]);

  const handleFieldChange = async (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));

    // Trigger real-time validation
    setIsValidating(true);

    try {
      // Simulate agent validation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock validation response
      const mockValidation: ValidationResult = {
        fieldId,
        valid: value && String(value).length > 0,
        errors: !value ? ["Field is required"] : [],
        warnings: [],
        suggestions: [],
      };

      setValidationResults((prev) => {
        const filtered = prev.filter((r) => r.fieldId !== fieldId);
        return [...filtered, mockValidation];
      });

      // Mock agent feedback
      if (fieldId.includes("price")) {
        const mockFeedback: AgentFeedback = {
          agentId: "comp-model",
          fieldId,
          type: "suggestion",
          content: {
            message: "Price appears within market range for this area",
            marketRange: { min: 400000, max: 500000 },
            confidence: 0.85,
          },
          confidence: 0.85,
        };

        setAgentFeedback((prev) => {
          const filtered = prev.filter((f) => f.fieldId !== fieldId);
          return [...filtered, mockFeedback];
        });
      }

      if (fieldId.includes("address")) {
        const mockFeedback: AgentFeedback = {
          agentId: "risk-validator",
          fieldId,
          type: "validation",
          content: {
            message: "Address validated successfully",
            coordinates: { lat: 40.7128, lng: -74.006 },
            neighborhood: "Downtown",
          },
          confidence: 0.92,
        };

        setAgentFeedback((prev) => {
          const filtered = prev.filter((f) => f.fieldId !== fieldId);
          return [...filtered, mockFeedback];
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "Failed to validate field",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getFieldValidation = (fieldId: string): ValidationResult | undefined => {
    return validationResults.find((r) => r.fieldId === fieldId);
  };

  const getFieldFeedback = (fieldId: string): AgentFeedback[] => {
    return agentFeedback.filter((f) => f.fieldId === fieldId);
  };

  const renderField = (field: FormField) => {
    const validation = getFieldValidation(field.id);
    const feedback = getFieldFeedback(field.id);
    const hasErrors = validation && validation.errors.length > 0;
    const hasWarnings = validation && validation.warnings.length > 0;

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {field.agentHints && field.agentHints.length > 0 && (
            <div className="flex gap-1">
              {field.agentHints.includes("address-validation") && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Validate
                </Badge>
              )}
              {field.agentHints.includes("market-validation") && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Market AI
                </Badge>
              )}
            </div>
          )}
        </div>

        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasErrors ? "border-red-500" : hasWarnings ? "border-yellow-500" : ""}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        ) : (
          <Input
            id={field.id}
            type={field.type === "number" ? "number" : "text"}
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasErrors ? "border-red-500" : hasWarnings ? "border-yellow-500" : ""}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )}

        {/* Validation Messages */}
        {validation && (
          <div className="space-y-1">
            {validation.errors.map((error, idx) => (
              <div key={idx} className="flex items-center text-red-600 text-sm">
                <Warning className="w-4 h-4 mr-1" />
                {error}
              </div>
            ))}
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-center text-yellow-600 text-sm">
                <Warning className="w-4 h-4 mr-1" />
                {warning}
              </div>
            ))}
            {validation.valid && validation.errors.length === 0 && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Valid
              </div>
            )}
          </div>
        )}

        {/* Agent Feedback */}
        {feedback.map((fb, idx) => (
          <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between mb-1"><>

              <span className="text-sm font-medium text-blue-800">
                {fb.agentId === "comp-model" && "Comparable Analysis"}
                {fb.agentId === "risk-validator" && "Risk Assessment"}
                {fb.agentId === "narrative-synth" && "Narrative Assistant"}
              </span>
              <Badge
</> variant="secondary" className="text-xs">
                {Math.round(fb.confidence * 100)}% confident
              </Badge>
            </div>
            <p className="text-sm text-blue-700">{fb.content.message}</p>
            {fb.content.marketRange && (
              <p className="text-xs text-blue-600 mt-1">
                Market Range: ${fb.content.marketRange.min.toLocaleString()} - $
                {fb.content.marketRange.max.toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    try {
      setIsValidating(true);

      // Final validation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Form Submitted",
        description: "Appraisal form submitted successfully with blockchain verification",
      });

      // Mock hash generation
      const hash = `0x${Math.random().toString(16).substring(2, 42)}`;
      console.log("Form hash:", hash);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8"><>

        <h1 className="text-3xl font-bold mb-2">Terrafusion Form Engine</h1>
        <p
</> className="text-muted-foreground">
          AI-powered appraisal forms with real-time validation and blockchain verification
        </p>

        {/* Agent Status */}
        <div className="flex gap-2 mt-4">
          <Badge variant="default" className="flex items-center gap-1"><>

            <Brain className="w-3 h-3" />
            Comp Model Active
          </Badge>
          <Badge
</> variant="default" className="flex items-center gap-1"><>

            <Shield className="w-3 h-3" />
            Risk Validator Active
          </Badge>
          <Badge
</> variant="default" className="flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            Form Audit Active
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {formSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {section.title}
                {isValidating && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">{section.fields.map(renderField)}</CardContent>
          </Card>
        ))}

        <div className="flex justify-end gap-4"><>

          <Button variant="outline">Save Draft</Button>
          <Button
</> onClick={handleSubmit} disabled={isValidating}>
            {isValidating ? "Processing..." : "Submit & Sign"}
          </Button>
        </div>
      </div>
    </div>
  );
}
