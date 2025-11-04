// TerraFusionGPT Suite: GPT Studio Component
// Elite Government OS Engineering - No-Code GPT Creation

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Sparkles,
  Settings,
  MessageSquare,
  Database,
  Code,
  Lock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { gptAPI, GPTConfiguration } from '@/services/gptAPI';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface GPTStudioProps {
  editingGPT?: GPTConfiguration;
  onSave?: (gpt: GPTConfiguration) => void;
  onCancel?: () => void;
}

/**
 * GPT Studio - No-code GPT creation wizard
 */
export const GPTStudio: React.FC<GPTStudioProps> = ({ editingGPT, onSave, onCancel }) => {
  // State
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<GPTConfiguration>>({
    name: editingGPT?.name || '',
    displayName: editingGPT?.displayName || '',
    description: editingGPT?.description || '',
    iconUrl: editingGPT?.iconUrl || '',
    category: editingGPT?.category || 'General',
    modelProvider: editingGPT?.modelProvider || 'OpenAI',
    modelName: editingGPT?.modelName || 'gpt-4o',
    systemPrompt: editingGPT?.systemPrompt || '',
    temperature: editingGPT?.temperature || 0.7,
    maxTokens: editingGPT?.maxTokens || 4000,
    topP: editingGPT?.topP || 1.0,
    frequencyPenalty: editingGPT?.frequencyPenalty || 0.0,
    presencePenalty: editingGPT?.presencePenalty || 0.0,
    enableRAG: editingGPT?.enableRAG || false,
    ragDatasetId: editingGPT?.ragDatasetId || undefined,
    ragTopK: editingGPT?.ragTopK || 5,
    ragScoreThreshold: editingGPT?.ragScoreThreshold || 0.7,
    enableFunctions: editingGPT?.enableFunctions || false,
    functionsJson: editingGPT?.functionsJson || '',
    requiredRole: editingGPT?.requiredRole || '',
    isPublic: editingGPT?.isPublic || false,
    price: editingGPT?.price || 0,
  });

  /**
   * Update form field
   */
  const updateField = (field: keyof GPTConfiguration, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Validate current step
   */
  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.displayName && formData.description);
      case 2:
        return !!(formData.modelProvider && formData.modelName);
      case 3:
        return !!formData.systemPrompt;
      case 4:
        return !formData.enableRAG || !!formData.ragDatasetId;
      case 5:
        return !formData.enableFunctions || !!formData.functionsJson;
      case 6:
        return true;
      default:
        return false;
    }
  };

  /**
   * Navigate to next step
   */
  const nextStep = () => {
    if (validateStep() && currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  /**
   * Save GPT
   */
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      let gpt: GPTConfiguration;

      if (editingGPT) {
        gpt = await gptAPI.updateGPT(editingGPT.id, formData);
      } else {
        gpt = await gptAPI.createGPT(formData);
      }

      onSave?.(gpt);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save GPT');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Get step icon
   */
  const getStepIcon = (step: Step) => {
    const icons = {
      1: Sparkles,
      2: Settings,
      3: MessageSquare,
      4: Database,
      5: Code,
      6: Lock,
    };
    return icons[step];
  };

  /**
   * Render step indicator
   */
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, name: 'Basic Info' },
      { number: 2, name: 'Model Config' },
      { number: 3, name: 'System Prompt' },
      { number: 4, name: 'RAG' },
      { number: 5, name: 'Functions' },
      { number: 6, name: 'Access Control' },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = getStepIcon(step.number as Step);
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                </div>
                <span
                  className={`mt-2 text-sm ${
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /**
   * Render Step 1: Basic Info
   */
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Internal Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="my-gpt"
        />
        <p className="text-sm text-gray-500 mt-1">Lowercase, no spaces (e.g., property-assistant)</p>
      </div>

      <div>
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => updateField('displayName', e.target.value)}
          placeholder="Property Assistant"
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Assists with property assessment and valuation questions..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="iconUrl">Icon URL</Label>
        <Input
          id="iconUrl"
          value={formData.iconUrl}
          onChange={(e) => updateField('iconUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => updateField('category', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="General">General</SelectItem>
            <SelectItem value="Property Assessment">Property Assessment</SelectItem>
            <SelectItem value="Tax">Tax</SelectItem>
            <SelectItem value="Citizen Service">Citizen Service</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
            <SelectItem value="Code Enforcement">Code Enforcement</SelectItem>
            <SelectItem value="Emergency Response">Emergency Response</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Budget">Budget</SelectItem>
            <SelectItem value="Procurement">Procurement</SelectItem>
            <SelectItem value="Data Analysis">Data Analysis</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  /**
   * Render Step 2: Model Configuration
   */
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="modelProvider">Model Provider *</Label>
        <Select
          value={formData.modelProvider}
          onValueChange={(v) => updateField('modelProvider', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OpenAI">OpenAI</SelectItem>
            <SelectItem value="Anthropic">Anthropic</SelectItem>
            <SelectItem value="Azure">Azure OpenAI</SelectItem>
            <SelectItem value="Local">Local Model</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="modelName">Model *</Label>
        <Select
          value={formData.modelName}
          onValueChange={(v) => updateField('modelName', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {formData.modelProvider === 'OpenAI' && (
              <>
                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cheap)</SelectItem>
              </>
            )}
            {formData.modelProvider === 'Anthropic' && (
              <>
                <SelectItem value="claude-sonnet-3.5">Claude Sonnet 3.5 (Recommended)</SelectItem>
                <SelectItem value="claude-opus-3">Claude Opus 3</SelectItem>
                <SelectItem value="claude-haiku-3">Claude Haiku 3 (Fast & Cheap)</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Temperature: {formData.temperature}</Label>
        <Slider
          value={[formData.temperature!]}
          onValueChange={(v) => updateField('temperature', v[0])}
          min={0}
          max={2}
          step={0.1}
          className="mt-2"
        />
        <p className="text-sm text-gray-500 mt-1">
          0 = Focused, 1 = Balanced, 2 = Creative
        </p>
      </div>

      <div>
        <Label htmlFor="maxTokens">Max Tokens: {formData.maxTokens}</Label>
        <Slider
          value={[formData.maxTokens!]}
          onValueChange={(v) => updateField('maxTokens', v[0])}
          min={100}
          max={16000}
          step={100}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Top P: {formData.topP}</Label>
        <Slider
          value={[formData.topP!]}
          onValueChange={(v) => updateField('topP', v[0])}
          min={0}
          max={1}
          step={0.1}
          className="mt-2"
        />
      </div>
    </div>
  );

  /**
   * Render Step 3: System Prompt
   */
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="systemPrompt">System Prompt *</Label>
        <Textarea
          id="systemPrompt"
          value={formData.systemPrompt}
          onChange={(e) => updateField('systemPrompt', e.target.value)}
          placeholder={`You are a helpful assistant specialized in property assessment for government agencies.

Your role is to:
- Answer questions about property valuation
- Explain assessment methodology
- Guide users through appeals process
- Provide comparable sales analysis

Always maintain professional, accurate, and helpful responses.`}
          rows={15}
          className="font-mono text-sm"
        />
        <p className="text-sm text-gray-500 mt-1">
          Define the GPT's behavior, role, and instructions
        </p>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-sm">Prompt Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Define the GPT's role and expertise area</p>
          <p>• List specific tasks it should help with</p>
          <p>• Set tone and style (professional, friendly, etc.)</p>
          <p>• Include any constraints or guidelines</p>
          <p>• For government GPTs, emphasize accuracy and compliance</p>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Render Step 4: RAG Configuration
   */
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable RAG (Retrieval Augmented Generation)</Label>
          <p className="text-sm text-gray-500 mt-1">
            Connect to document datasets for context-aware responses
          </p>
        </div>
        <Switch
          checked={formData.enableRAG}
          onCheckedChange={(checked) => updateField('enableRAG', checked)}
        />
      </div>

      {formData.enableRAG && (
        <>
          <div>
            <Label htmlFor="ragDatasetId">RAG Dataset *</Label>
            <Select
              value={formData.ragDatasetId?.toString()}
              onValueChange={(v) => updateField('ragDatasetId', parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dataset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Property Assessment Guidelines</SelectItem>
                <SelectItem value="2">Tax Code Documentation</SelectItem>
                <SelectItem value="3">County Policies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Top K Results: {formData.ragTopK}</Label>
            <Slider
              value={[formData.ragTopK!]}
              onValueChange={(v) => updateField('ragTopK', v[0])}
              min={1}
              max={20}
              step={1}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of document chunks to retrieve
            </p>
          </div>

          <div>
            <Label>Score Threshold: {formData.ragScoreThreshold}</Label>
            <Slider
              value={[formData.ragScoreThreshold!]}
              onValueChange={(v) => updateField('ragScoreThreshold', v[0])}
              min={0}
              max={1}
              step={0.05}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum relevance score (0-1)
            </p>
          </div>
        </>
      )}
    </div>
  );

  /**
   * Render Step 5: Functions
   */
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable Function Calling</Label>
          <p className="text-sm text-gray-500 mt-1">
            Allow GPT to call external functions and APIs
          </p>
        </div>
        <Switch
          checked={formData.enableFunctions}
          onCheckedChange={(checked) => updateField('enableFunctions', checked)}
        />
      </div>

      {formData.enableFunctions && (
        <div>
          <Label htmlFor="functionsJson">Function Definitions (JSON)</Label>
          <Textarea
            id="functionsJson"
            value={formData.functionsJson}
            onChange={(e) => updateField('functionsJson', e.target.value)}
            placeholder={`[
  {
    "name": "get_property_value",
    "description": "Get property assessment value",
    "parameters": {
      "type": "object",
      "properties": {
        "parcel_id": {
          "type": "string",
          "description": "Parcel ID"
        }
      }
    }
  }
]`}
            rows={15}
            className="font-mono text-sm"
          />
        </div>
      )}
    </div>
  );

  /**
   * Render Step 6: Access Control
   */
  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Make Public</Label>
          <p className="text-sm text-gray-500 mt-1">
            Allow all users in your county to access this GPT
          </p>
        </div>
        <Switch
          checked={formData.isPublic}
          onCheckedChange={(checked) => updateField('isPublic', checked)}
        />
      </div>

      <div>
        <Label htmlFor="requiredRole">Required Role (Optional)</Label>
        <Select
          value={formData.requiredRole}
          onValueChange={(v) => updateField('requiredRole', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No role requirement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No restriction</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Assessor">Assessor</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="price">Price (USD)</Label>
        <Input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) => updateField('price', parseFloat(e.target.value))}
          min={0}
          step={0.01}
        />
        <p className="text-sm text-gray-500 mt-1">
          0 = Free. Set price for marketplace monetization.
        </p>
      </div>

      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            Ready to Create
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Name:</strong> {formData.displayName}</p>
          <p><strong>Model:</strong> {formData.modelProvider} / {formData.modelName}</p>
          <p><strong>RAG:</strong> {formData.enableRAG ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Functions:</strong> {formData.enableFunctions ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Access:</strong> {formData.isPublic ? 'Public' : 'Private'}</p>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Render current step
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {editingGPT ? 'Edit GPT' : 'Create New GPT'}
          </CardTitle>
          <CardDescription>
            {editingGPT
              ? 'Update your GPT configuration'
              : 'Build a custom GPT with no code required'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Progress Bar */}
          <Progress value={(currentStep / 6) * 100} className="mb-8" />

          {/* Step Content */}
          <div className="min-h-96">{renderCurrentStep()}</div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
              disabled={isSaving}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < 6 ? (
              <Button onClick={nextStep} disabled={!validateStep()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : editingGPT ? 'Update GPT' : 'Create GPT'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTStudio;
