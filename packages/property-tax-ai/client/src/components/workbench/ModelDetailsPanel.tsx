import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Pencil, 
  Save, 
  XCircle, 
  Database, 
  Code, 
  Calculator, 
  Check, 
  Plus,
  History,
  Play,
  FileSymlink
} from 'lucide-react';
import EditComponentDialog from './EditComponentDialog';
import EditCalculationDialog from './EditCalculationDialog';

// Model status badge variants
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary';
    case 'in_review': return 'warning';
    case 'approved': return 'success';
    case 'published': return 'success';
    case 'archived': return 'outline';
    case 'deprecated': return 'destructive';
    default: return 'secondary';
  }
};

interface ModelDetailsPanelProps {
  model: any; // AssessmentModel
  onRefresh: () => void;
}

const ModelDetailsPanel: React.FC<ModelDetailsPanelProps> = ({ model, onRefresh }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState({
    name: model.name,
    description: model.description || '',
    status: model.status
  });
  
  // Dialog states
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [isCalculationDialogOpen, setIsCalculationDialogOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);

  // Fetch variables
  const { 
    data: variables, 
    isLoading: isLoadingVariables 
  } = useQuery({
    queryKey: [`/api/assessment-workbench/models/${model.modelId}/variables`],
  });

  // Fetch components
  const { 
    data: components, 
    isLoading: isLoadingComponents 
  } = useQuery({
    queryKey: [`/api/assessment-workbench/models/${model.modelId}/components`],
  });

  // Fetch calculations
  const { 
    data: calculations, 
    isLoading: isLoadingCalculations 
  } = useQuery({
    queryKey: [`/api/assessment-workbench/models/${model.modelId}/calculations`],
  });

  // Fetch validation rules
  const { 
    data: validationRules, 
    isLoading: isLoadingValidationRules 
  } = useQuery({
    queryKey: [`/api/assessment-workbench/models/${model.modelId}/validation-rules`],
  });

  // Fetch model versions
  const { 
    data: versions, 
    isLoading: isLoadingVersions 
  } = useQuery({
    queryKey: [`/api/assessment-workbench/models/${model.modelId}/versions`],
  });

  // Fetch model statuses for dropdown
  const { data: modelStatuses } = useQuery({
    queryKey: ['/api/assessment-workbench/model-statuses'],
  });

  const handleInputChange = (field: string, value: string) => {
    setEditableFields({
      ...editableFields,
      [field]: value
    });
  };

  const handleSaveChanges = async () => {
    try {
      await apiRequest(`/api/assessment-workbench/models/${model.modelId}`, {
        method: 'PUT',
        data: {
          ...editableFields,
          lastModifiedById: 1 // Assuming current user ID
        }
      });
      
      toast({
        title: "Success",
        description: "Model details updated successfully",
      });
      
      // Refresh data
      onRefresh();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update model:', error);
      toast({
        title: "Error",
        description: "Failed to update model details",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditableFields({
      name: model.name,
      description: model.description || '',
      status: model.status
    });
    setIsEditing(false);
  };

  // Count model components
  const counts = {
    variables: variables?.length || 0,
    components: components?.length || 0,
    calculations: calculations?.length || 0,
    validationRules: validationRules?.length || 0,
    versions: versions?.length || 0
  };

  return (
    <>
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <input
                type="text"
                className="text-2xl font-bold border-b-2 border-indigo-300 focus:outline-none focus:border-indigo-500 bg-transparent w-full"
                value={editableFields.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            ) : (
              <CardTitle className="text-2xl">{model.name}</CardTitle>
            )}

            <div className="flex items-center mt-1 space-x-2">
              <Badge variant={getStatusBadgeVariant(model.status)}>
                {isEditing ? (
                  <select
                    className="bg-transparent border-none text-xs font-medium focus:outline-none"
                    value={editableFields.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    {modelStatuses?.map((status: string) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  model.status.replace('_', ' ')
                )}
              </Badge>
              <Badge variant="outline">v{model.version}</Badge>
              <span className="text-xs text-gray-500">
                Type: {model.type.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveChanges}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit Model
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="variables" className="flex items-center justify-center">
              <Database className="h-4 w-4 mr-1" />
              Variables
              <span className="ml-1 text-xs bg-gray-100 px-1 rounded-full">{counts.variables}</span>
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center justify-center">
              <Code className="h-4 w-4 mr-1" />
              Components
              <span className="ml-1 text-xs bg-gray-100 px-1 rounded-full">{counts.components}</span>
            </TabsTrigger>
            <TabsTrigger value="calculations" className="flex items-center justify-center">
              <Calculator className="h-4 w-4 mr-1" />
              Calculations
              <span className="ml-1 text-xs bg-gray-100 px-1 rounded-full">{counts.calculations}</span>
            </TabsTrigger>
            <TabsTrigger value="validations" className="flex items-center justify-center">
              <Check className="h-4 w-4 mr-1" />
              Validations
              <span className="ml-1 text-xs bg-gray-100 px-1 rounded-full">{counts.validationRules}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                {isEditing ? (
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    value={editableFields.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-700">
                    {model.description || 'No description provided.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Model Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span className="font-mono text-sm">{model.modelId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{new Date(model.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Modified:</span>
                      <span>{new Date(model.lastModifiedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Version:</span>
                      <span>{model.version}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Model Components</h3>
                  <div className="bg-gray-50 p-4 rounded-md grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center p-3 border rounded-md bg-white">
                      <Database className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="font-medium">{counts.variables}</span>
                      <span className="text-xs text-gray-500">Variables</span>
                    </div>
                    <div className="flex flex-col items-center p-3 border rounded-md bg-white">
                      <Code className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="font-medium">{counts.components}</span>
                      <span className="text-xs text-gray-500">Components</span>
                    </div>
                    <div className="flex flex-col items-center p-3 border rounded-md bg-white">
                      <Calculator className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="font-medium">{counts.calculations}</span>
                      <span className="text-xs text-gray-500">Calculations</span>
                    </div>
                    <div className="flex flex-col items-center p-3 border rounded-md bg-white">
                      <Check className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="font-medium">{counts.validationRules}</span>
                      <span className="text-xs text-gray-500">Validations</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Model Versions</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {isLoadingVersions ? (
                    <div className="text-center py-4">Loading versions...</div>
                  ) : versions && versions.length > 0 ? (
                    <div className="space-y-2">
                      {versions.map((version: any) => (
                        <div key={version.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div className="flex items-center">
                            <History className="h-4 w-4 text-indigo-600 mr-2" />
                            <span>Version {version.versionNumber}</span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant={getStatusBadgeVariant(version.status)}>
                              {version.status}
                            </Badge>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(version.createdAt).toLocaleDateString()}
                            </span>
                            <Button variant="ghost" size="sm">
                              <FileSymlink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">No versions available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" className="flex items-center">
                <History className="h-4 w-4 mr-1" />
                Create New Version
              </Button>
              <Button className="flex items-center">
                <Play className="h-4 w-4 mr-1" />
                Test Model
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="variables">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Model Variables</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </Button>
            </div>
            
            {isLoadingVariables ? (
              <div className="text-center py-8">Loading variables...</div>
            ) : variables && variables.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {variables.map((variable: any) => (
                      <tr key={variable.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{variable.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{variable.type}</td>
                        <td className="px-6 py-4">{variable.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-gray-50">
                <p className="text-gray-500 mb-4">No variables defined for this model yet</p>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Variable
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="components">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Model Components</h3>
              <Button size="sm" onClick={() => setIsComponentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Component
              </Button>
            </div>
            
            {isLoadingComponents ? (
              <div className="text-center py-8">Loading components...</div>
            ) : components && components.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {components.map((component: any) => (
                      <tr key={component.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{component.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{component.type}</td>
                        <td className="px-6 py-4">{component.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedComponent(component);
                              setIsComponentDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-gray-50">
                <p className="text-gray-500 mb-4">No components defined for this model yet</p>
                <Button onClick={() => setIsComponentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Component
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calculations">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Model Calculations</h3>
              <Button size="sm" onClick={() => setIsCalculationDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Calculation
              </Button>
            </div>
            
            {isLoadingCalculations ? (
              <div className="text-center py-8">Loading calculations...</div>
            ) : calculations && calculations.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formula</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculations.map((calculation: any) => (
                      <tr key={calculation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{calculation.name}</td>
                        <td className="px-6 py-4">{calculation.description}</td>
                        <td className="px-6 py-4 font-mono text-sm">{calculation.formula}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCalculation(calculation);
                              setIsCalculationDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-gray-50">
                <p className="text-gray-500 mb-4">No calculations defined for this model yet</p>
                <Button onClick={() => setIsCalculationDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Calculation
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validations">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Validation Rules</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Validation Rule
              </Button>
            </div>
            
            {isLoadingValidationRules ? (
              <div className="text-center py-8">Loading validation rules...</div>
            ) : validationRules && validationRules.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationRules.map((rule: any) => (
                      <tr key={rule.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{rule.name}</td>
                        <td className="px-6 py-4">{rule.description}</td>
                        <td className="px-6 py-4 font-mono text-sm">{rule.condition}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-gray-50">
                <p className="text-gray-500 mb-4">No validation rules defined for this model yet</p>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Validation Rule
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CardFooter className="flex justify-between mt-6">
        <Button variant="outline">
          Back to Models
        </Button>
      </CardFooter>
    </Card>

    {/* Component Dialog */}
    <EditComponentDialog
      isOpen={isComponentDialogOpen}
      onClose={() => {
        setIsComponentDialogOpen(false);
        setSelectedComponent(null);
      }}
      onSave={async (component) => {
        try {
          if (component.id) {
            // Update existing component
            await apiRequest(`/api/assessment-workbench/models/${model.modelId}/components/${component.id}`, {
              method: 'PUT',
              data: component
            });
            toast({
              title: "Success",
              description: "Component updated successfully",
            });
          } else {
            // Create new component
            await apiRequest(`/api/assessment-workbench/models/${model.modelId}/components`, {
              method: 'POST',
              data: component
            });
            toast({
              title: "Success",
              description: "Component created successfully",
            });
          }
          
          // Refresh components data
          queryClient.invalidateQueries({ queryKey: [`/api/assessment-workbench/models/${model.modelId}/components`] });
          setIsComponentDialogOpen(false);
          setSelectedComponent(null);
        } catch (error) {
          console.error('Failed to save component:', error);
          toast({
            title: "Error",
            description: "Failed to save component",
            variant: "destructive",
          });
        }
      }}
      component={selectedComponent}
      modelId={model.modelId}
    />

    {/* Calculation Dialog */}
    <EditCalculationDialog
      isOpen={isCalculationDialogOpen}
      onClose={() => {
        setIsCalculationDialogOpen(false);
        setSelectedCalculation(null);
      }}
      onSave={async (calculation) => {
        try {
          if (calculation.id) {
            // Update existing calculation
            await apiRequest(`/api/assessment-workbench/models/${model.modelId}/calculations/${calculation.id}`, {
              method: 'PUT',
              data: calculation
            });
            toast({
              title: "Success",
              description: "Calculation updated successfully",
            });
          } else {
            // Create new calculation
            await apiRequest(`/api/assessment-workbench/models/${model.modelId}/calculations`, {
              method: 'POST',
              data: calculation
            });
            toast({
              title: "Success",
              description: "Calculation created successfully",
            });
          }
          
          // Refresh calculations data
          queryClient.invalidateQueries({ queryKey: [`/api/assessment-workbench/models/${model.modelId}/calculations`] });
          setIsCalculationDialogOpen(false);
          setSelectedCalculation(null);
        } catch (error) {
          console.error('Failed to save calculation:', error);
          toast({
            title: "Error",
            description: "Failed to save calculation",
            variant: "destructive",
          });
        }
      }}
      onTest={async (calculation) => {
        try {
          // Test the calculation
          const result = await apiRequest(`/api/assessment-workbench/models/${model.modelId}/calculations/test`, {
            method: 'POST',
            data: calculation
          });
          
          toast({
            title: "Test Result",
            description: `Calculation test result: ${JSON.stringify(result)}`,
          });
          
          return result;
        } catch (error) {
          console.error('Failed to test calculation:', error);
          toast({
            title: "Error",
            description: "Failed to test calculation",
            variant: "destructive",
          });
          return null;
        }
      }}
      calculation={selectedCalculation}
      modelId={model.modelId}
      modelVariables={variables}
    />
  </>
  );
};

export default ModelDetailsPanel;