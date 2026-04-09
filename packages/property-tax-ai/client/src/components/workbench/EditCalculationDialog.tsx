import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeEditor from '@/components/development/CodeEditor';
import { Save, X, PlayCircle } from 'lucide-react';

interface CalculationType {
  id: string;
  name: string;
  value: string;
}

interface ModelCalculation {
  id?: number;
  name: string;
  type: string;
  description: string;
  formula: string;
  code: string;
  modelId: string;
  variables?: string[];
}

interface EditCalculationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (calculation: ModelCalculation) => Promise<void>;
  onTest?: (calculation: ModelCalculation) => Promise<any>;
  calculation?: ModelCalculation;
  modelId: string;
  calculationTypes?: CalculationType[];
  modelVariables?: Array<{ id: string; name: string; type: string }>;
}

const defaultCalculation: ModelCalculation = {
  name: '',
  type: 'standard',
  description: '',
  formula: 'base_value * multiplier',
  code: `// Calculation implementation
function calculate(input) {
  // This is where you implement the calculation logic
  // Example:
  const baseValue = input.base_value || 0;
  const multiplier = input.multiplier || 1;
  
  return baseValue * multiplier;
}

export default calculate;`,
  modelId: '',
  variables: []
};

const EditCalculationDialog: React.FC<EditCalculationDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onTest,
  calculation,
  modelId,
  calculationTypes = [],
  modelVariables = []
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [formData, setFormData] = useState<ModelCalculation>(
    calculation || { ...defaultCalculation, modelId }
  );
  
  const handleChange = (field: keyof ModelCalculation, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving calculation:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestCalculation = async () => {
    if (!onTest) return;
    
    try {
      setIsTesting(true);
      setTestResult(null);
      const result = await onTest(formData);
      setTestResult(result);
    } catch (error) {
      console.error('Error testing calculation:', error);
      setTestResult({ error: 'Failed to test calculation' });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{calculation ? 'Edit Calculation' : 'Create New Calculation'}</DialogTitle>
          <DialogDescription>
            {calculation 
              ? 'Update an existing assessment model calculation'
              : 'Create a new calculation for your assessment model'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="name">Calculation Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Enter calculation name"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={value => handleChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationTypes.length > 0 ? (
                      calculationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="depreciation">Depreciation</SelectItem>
                        <SelectItem value="specialized">Specialized</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe what this calculation does"
                rows={5}
              />
            </div>
            
            {modelVariables.length > 0 && (
              <div>
                <Label>Required Variables</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {modelVariables.map(variable => (
                    <div key={variable.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`var-${variable.id}`}
                        checked={formData.variables?.includes(variable.id) || false}
                        onChange={e => {
                          const updatedVariables = e.target.checked
                            ? [...(formData.variables || []), variable.id]
                            : (formData.variables || []).filter(id => id !== variable.id);
                          handleChange('variables', updatedVariables);
                        }}
                        className="rounded-sm"
                      />
                      <Label htmlFor={`var-${variable.id}`} className="font-normal text-sm">
                        {variable.name} <span className="text-gray-500">({variable.type})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="formula" className="py-4">
            <div>
              <Label htmlFor="formula">Calculation Formula</Label>
              <p className="text-sm text-gray-500 mb-2">
                Enter the mathematical formula or expression for this calculation.
              </p>
              <Textarea
                id="formula"
                value={formData.formula}
                onChange={e => handleChange('formula', e.target.value)}
                placeholder="e.g., base_value * area * quality_factor"
                rows={3}
                className="font-mono"
              />
            </div>
            
            {modelVariables.length > 0 && (
              <div className="mt-4">
                <Label>Available Variables</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <div className="grid grid-cols-3 gap-2">
                    {modelVariables.map(variable => (
                      <div key={variable.id} className="text-sm font-mono bg-white px-2 py-1 rounded-sm border">
                        {variable.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="implementation" className="py-4">
            <div className="mb-2 flex justify-between items-start">
              <div>
                <Label htmlFor="code">Implementation Code</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Write the JavaScript implementation of this calculation. The function should take an input object with variables and return a calculated value.
                </p>
              </div>
              
              {onTest && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleTestCalculation}
                  disabled={isTesting}
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  {isTesting ? 'Testing...' : 'Test Calculation'}
                </Button>
              )}
            </div>
            
            <div className="h-[400px] border rounded-md">
              <CodeEditor
                value={formData.code}
                onChange={value => handleChange('code', value || '')}
                language="javascript"
                height="400px"
                theme="dark"
              />
            </div>
            
            {testResult && (
              <div className="mt-4 p-3 border rounded-md bg-slate-50">
                <Label>Test Result</Label>
                <pre className="mt-1 p-2 bg-slate-100 rounded-sm text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Calculation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCalculationDialog;