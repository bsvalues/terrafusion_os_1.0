import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader, Plus, FileCode, Calculator, Check, Activity, Database, Code, Settings } from 'lucide-react';
import DevelopmentWorkspaceLayout from '../layout/development-workspace-layout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import CreateModelDialog from '../components/workbench/CreateModelDialog';
import ViewModelDialog from '../components/workbench/ViewModelDialog';
import ModelDetailsPanel from '../components/workbench/ModelDetailsPanel';

type ModelType = 'cost_approach' | 'sales_comparison' | 'income_approach' | 'hybrid' | 'statistical' | 'specialized';
type ModelStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived' | 'deprecated';

interface AssessmentModel {
  id: number;
  modelId: string;
  name: string;
  type: ModelType;
  status: ModelStatus;
  description: string | null;
  createdById: number;
  lastModifiedById: number;
  createdAt: string;
  lastModifiedAt: string;
  version: string;
  tags: string[];
}

const getStatusBadgeVariant = (status: ModelStatus) => {
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

const getTypeBadgeVariant = (type: ModelType) => {
  switch (type) {
    case 'cost_approach': return 'outline';
    case 'sales_comparison': return 'default';
    case 'income_approach': return 'secondary';
    case 'hybrid': return 'warning';
    case 'statistical': return 'destructive';
    case 'specialized': return 'success';
    default: return 'outline';
  }
};

const AssessmentModelWorkbenchPage = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('models');
  const [selectedModel, setSelectedModel] = useState<AssessmentModel | null>(null);
  const [filterStatus, setFilterStatus] = useState<ModelStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ModelType | 'all'>('all');

  // Fetch assessment models
  const { 
    data: models, 
    isLoading: isLoadingModels,
    refetch: refetchModels 
  } = useQuery({
    queryKey: ['/api/assessment-workbench/models'],
  });

  // Fetch model types
  const { data: modelTypes } = useQuery({
    queryKey: ['/api/assessment-workbench/model-types'],
  });

  // Fetch model statuses
  const { data: modelStatuses } = useQuery({
    queryKey: ['/api/assessment-workbench/model-statuses'],
  });

  const handleCreateModel = async (modelData: any) => {
    try {
      await apiRequest('/api/assessment-workbench/models', {
        method: 'POST',
        data: modelData
      });
      
      toast({
        title: "Success",
        description: "Assessment model created successfully",
      });
      
      // Refresh models list
      queryClient.invalidateQueries({ queryKey: ['/api/assessment-workbench/models'] });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create assessment model:', error);
      toast({
        title: "Error",
        description: "Failed to create assessment model",
        variant: "destructive",
      });
    }
  };

  const handleSelectModel = (model: AssessmentModel) => {
    setSelectedModel(model);
    setIsViewDialogOpen(true);
  };

  const filteredModels = models?.filter(model => {
    if (filterStatus !== 'all' && model.status !== filterStatus) return false;
    if (filterType !== 'all' && model.type !== filterType) return false;
    return true;
  }) || [];

  const openModelDetails = (model: AssessmentModel) => {
    setSelectedModel(model);
    setActiveTab('details');
  };

  return (
    <DevelopmentWorkspaceLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Assessment Model Workbench</h1>
          <p className="text-gray-500">
            Design, test, and manage assessment models for property valuation
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Model
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models" className="flex items-center justify-center">
            <FileCode className="h-4 w-4 mr-1" />
            Models
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center justify-center">
            <Database className="h-4 w-4 mr-1" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center justify-center">
            <Code className="h-4 w-4 mr-1" />
            Components
          </TabsTrigger>
          <TabsTrigger value="calculations" className="flex items-center justify-center">
            <Calculator className="h-4 w-4 mr-1" />
            Calculations
          </TabsTrigger>
          <TabsTrigger value="validations" className="flex items-center justify-center">
            <Check className="h-4 w-4 mr-1" />
            Validations
          </TabsTrigger>
        </TabsList>
        
        {/* Tab for Model Details when a model is selected */}
        {selectedModel && (
          <TabsTrigger value="details" className="ml-2 flex items-center justify-center">
            <Activity className="h-4 w-4 mr-1" />
            {selectedModel.name} Details
          </TabsTrigger>
        )}

        <TabsContent value="models" className="mt-4">
          {isLoadingModels ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2">Loading models...</span>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex space-x-4 mb-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Filter by Status</label>
                  <select 
                    className="border rounded p-2 w-40"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as ModelStatus | 'all')}
                  >
                    <option value="all">All Statuses</option>
                    {modelStatuses && modelStatuses.map((status: string) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium">Filter by Type</label>
                  <select 
                    className="border rounded p-2 w-40"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as ModelType | 'all')}
                  >
                    <option value="all">All Types</option>
                    {modelTypes && modelTypes.map((type: string) => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Models Table */}
              {filteredModels.length > 0 ? (
                <Table>
                  <TableCaption>List of assessment models</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow 
                        key={model.modelId}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => openModelDetails(model)}
                      >
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(model.type)}>
                            {model.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(model.status)}>
                            {model.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{model.version}</TableCell>
                        <TableCell>{new Date(model.lastModifiedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectModel(model);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <p className="text-gray-500 mb-4">No assessment models found</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Model
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="variables" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Variables</CardTitle>
              <CardDescription>
                Define and manage variables used in assessment models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedModel ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Select a model first to manage its variables</p>
                </div>
              ) : (
                <p>Variables management interface will be implemented here</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Components</CardTitle>
              <CardDescription>
                Manage reusable components for assessment models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedModel ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Select a model first to manage its components</p>
                </div>
              ) : (
                <p>Components management interface will be implemented here</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calculations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Calculations</CardTitle>
              <CardDescription>
                Define calculation rules and formulas for assessment models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedModel ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Select a model first to manage its calculations</p>
                </div>
              ) : (
                <p>Calculations management interface will be implemented here</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="validations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Define validation rules to ensure data integrity and quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedModel ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Select a model first to manage its validation rules</p>
                </div>
              ) : (
                <p>Validation rules management interface will be implemented here</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Model Details Tab */}
        {selectedModel && (
          <TabsContent value="details" className="mt-4">
            <ModelDetailsPanel 
              model={selectedModel}
              onRefresh={() => {
                refetchModels();
                if (selectedModel) {
                  // Refresh the selected model data
                  apiRequest(`/api/assessment-workbench/models/${selectedModel.modelId}`)
                    .then(updatedModel => setSelectedModel(updatedModel))
                    .catch(err => console.error('Failed to refresh model details:', err));
                }
              }}
            />
          </TabsContent>
        )}
      </Tabs>
      
      {/* Create Model Dialog */}
      <CreateModelDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateModel}
        modelTypes={modelTypes || []}
      />
      
      {/* View Model Dialog */}
      {selectedModel && (
        <ViewModelDialog
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          model={selectedModel}
          onOpenDetails={() => {
            setIsViewDialogOpen(false);
            setActiveTab('details');
          }}
        />
      )}
    </DevelopmentWorkspaceLayout>
  );
};

export default AssessmentModelWorkbenchPage;