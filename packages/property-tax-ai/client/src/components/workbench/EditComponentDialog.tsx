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
import { Save, X } from 'lucide-react';

interface ComponentType {
  id: string;
  name: string;
  value: string;
}

interface ModelComponent {
  id?: number;
  name: string;
  type: string;
  description: string;
  code: string;
  modelId: string;
}

interface EditComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: ModelComponent) => Promise<void>;
  component?: ModelComponent;
  modelId: string;
  componentTypes?: ComponentType[];
}

const defaultComponent: ModelComponent = {
  name: '',
  type: 'standard',
  description: '',
  code: '// Component code here\n\nfunction calculate(input) {\n  // Implementation goes here\n  return input;\n}\n\nexport default calculate;',
  modelId: ''
};

const EditComponentDialog: React.FC<EditComponentDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  component,
  modelId,
  componentTypes = []
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ModelComponent>(
    component || { ...defaultComponent, modelId }
  );
  
  const handleChange = (field: keyof ModelComponent, value: string) => {
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
      console.error('Error saving component:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{component ? 'Edit Component' : 'Create New Component'}</DialogTitle>
          <DialogDescription>
            {component 
              ? 'Update an existing assessment model component'
              : 'Create a new component for your assessment model'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="code">Component Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="name">Component Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Enter component name"
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
                    {componentTypes.length > 0 ? (
                      componentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="calculation">Calculation</SelectItem>
                        <SelectItem value="validation">Validation</SelectItem>
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
                placeholder="Describe what this component does"
                rows={5}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="py-4">
            <div className="mb-2">
              <Label htmlFor="code">Component Code</Label>
              <p className="text-sm text-gray-500 mb-2">
                Write the JavaScript code for this component. The component should export a function as default.
              </p>
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
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Component'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditComponentDialog;