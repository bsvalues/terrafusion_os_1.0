import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ScenarioResults from "../components/scenarios/ScenarioResults";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2, Save, BarChartHorizontal } from "lucide-react";

// Benton County Reval Areas (PACS Cycle 1–6)
const REVAL_AREAS = [
  { id: 'Reval 1', label: 'Reval 1 — Kennewick (Urban Core)',      factor: 1.00 },
  { id: 'Reval 2', label: 'Reval 2 — West Richland / Badger Mtn',  factor: 1.05 },
  { id: 'Reval 3', label: 'Reval 3 — North Richland / Horn Rapids', factor: 1.10 },
  { id: 'Reval 4', label: 'Reval 4 — East Benton / Benton City',   factor: 0.95 },
  { id: 'Reval 5', label: 'Reval 5 — Prosser / Wine Country',      factor: 0.90 },
  { id: 'Reval 6', label: 'Reval 6 — Rural / Agricultural Lands',  factor: 0.82 },
];

// Define scenario types for TypeScript
interface Scenario {
  id: number;
  name: string;
  description: string;
  parameters: {
    buildingType: string;
    revalArea: string;
    baseYear: number;
    comparisonYear: number;
    adjustmentFactor: number;
    qualityFactor: number;
    conditionFactor: number;
    complexityFactor: number;
    [key: string]: any;
  };
  results: {
    baseCost: number;
    adjustedCost: number;
    difference: number;
    percentChange: number;
    details?: {
      factor: string;
      impact: number;
      percentImpact: number;
    }[];
    chartData?: any[];
  };
  is_saved: boolean;
  created_at: string;
}

export default function WhatIfScenariosPage() {
  const { toast } = useToast();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("scenarios");
  
  // Selected scenario
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  // Dialog states
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);
  const [editScenarioOpen, setEditScenarioOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Form data for new/edit scenario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    buildingType: "R1",
    revalArea: "Reval 1",
    baseYear: 2025,
    comparisonYear: 2025,
    adjustmentFactor: 1.0,
    qualityFactor: 1.0,
    conditionFactor: 1.0,
    complexityFactor: 1.0
  });
  
  const queryClient = useQueryClient();

  // Fetch scenarios — real TerraFusion OS endpoint (WhatIfScenariosController)
  const { data: scenarios, isLoading, error } = useQuery<Scenario[]>({
    queryKey: ["/api/what-if-scenarios"],
    queryFn: async () => {
      const res = await fetch('/api/what-if-scenarios');
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      return data?.scenarios ?? data?.Scenarios ?? data ?? [];
    },
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await fetch('/api/what-if-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          assumptions: {
            buildingType: payload.buildingType,
            revalArea: payload.revalArea,
            baseYear: payload.baseYear,
            comparisonYear: payload.comparisonYear,
            adjustmentFactor: payload.adjustmentFactor,
            qualityFactor: payload.qualityFactor,
            conditionFactor: payload.conditionFactor,
            complexityFactor: payload.complexityFactor,
          },
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/what-if-scenarios'] });
      toast({ title: "Scenario Created", description: `${formData.name} has been saved.` });
      setNewScenarioOpen(false);
      setFormData({ name: "", description: "", buildingType: "R1", revalArea: "Reval 1", baseYear: 2025, comparisonYear: 2025, adjustmentFactor: 1.0, qualityFactor: 1.0, conditionFactor: 1.0, complexityFactor: 1.0 });
    },
    onError: () => toast({ variant: "destructive", title: "Create Failed", description: "Could not save scenario." }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: typeof formData }) => {
      const res = await fetch(`/api/what-if-scenarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          assumptions: {
            buildingType: payload.buildingType,
            revalArea: payload.revalArea,
            baseYear: payload.baseYear,
            comparisonYear: payload.comparisonYear,
            adjustmentFactor: payload.adjustmentFactor,
            qualityFactor: payload.qualityFactor,
            conditionFactor: payload.conditionFactor,
            complexityFactor: payload.complexityFactor,
          },
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/what-if-scenarios'] });
      toast({ title: "Scenario Updated", description: `${formData.name} has been updated.` });
      setEditScenarioOpen(false);
    },
    onError: () => toast({ variant: "destructive", title: "Update Failed", description: "Could not update scenario." }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/what-if-scenarios/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/what-if-scenarios'] });
      toast({ title: "Scenario Deleted", description: "The scenario has been removed." });
      setDeleteConfirmOpen(false);
      setSelectedScenario(null);
      setActiveTab("scenarios");
    },
    onError: () => toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete scenario." }),
  });

  // Handle selecting a scenario
  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setActiveTab("results");
  };

  const handleCreateScenario = () => createMutation.mutate(formData);

  const handleUpdateScenario = () => {
    if (selectedScenario) updateMutation.mutate({ id: selectedScenario.id, payload: formData });
  };

  const handleDeleteScenario = () => {
    if (selectedScenario) deleteMutation.mutate(selectedScenario.id);
  };

  const handleSaveScenario = () => {
    if (selectedScenario) updateMutation.mutate({ id: selectedScenario.id, payload: formData });
  };
  
  // Handle edit scenario button
  const handleEditClick = (scenario: Scenario) => {
    setFormData({
      name: scenario.name,
      description: scenario.description,
      buildingType: scenario.parameters.buildingType,
      revalArea: scenario.parameters.revalArea ?? scenario.parameters.region ?? "Reval 1",
      baseYear: scenario.parameters.baseYear,
      comparisonYear: scenario.parameters.comparisonYear,
      adjustmentFactor: scenario.parameters.adjustmentFactor,
      qualityFactor: scenario.parameters.qualityFactor,
      conditionFactor: scenario.parameters.conditionFactor,
      complexityFactor: scenario.parameters.complexityFactor
    });
    setEditScenarioOpen(true);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <MainLayout pageTitle="What-If Scenarios" loading>
        <div />
      </MainLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <MainLayout
        pageTitle="What-If Scenarios"
        error={{ message: 'Error loading scenarios. Please try again.' }}
      >
        <div />
      </MainLayout>
    );
  }
  
  return (
    <MainLayout
      pageTitle="What-If Scenarios"
      pageDescription="Create and analyze different Benton County cost scenarios using the cost matrix. Reval Area (Cycle) factors are applied per PACS."
    >
      <div className="py-4">
        <div className="flex justify-end mb-6">
          <Button onClick={() => setNewScenarioOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="scenarios">Scenarios List</TabsTrigger>
            {selectedScenario && (
              <TabsTrigger value="results">Scenario Results</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="scenarios">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios && scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <Card key={scenario.id} className="h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="line-clamp-1">{scenario.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          {scenario.is_saved ? (
                            <Save className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleSaveScenario()}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditClick(scenario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteConfirmOpen(true)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {scenario.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Building Type:</span>
                          <p>{scenario.parameters.buildingType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reval Area (Cycle):</span>
                          <p>{scenario.parameters.revalArea ?? scenario.parameters.region ?? '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Base Year:</span>
                          <p>{scenario.parameters.baseYear}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comparison Year:</span>
                          <p>{scenario.parameters.comparisonYear}</p>
                        </div>
                      </div>
                      {scenario.results && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Base Cost:</span>
                            <span>${scenario.results.baseCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Adjusted Cost:</span>
                            <span>${scenario.results.adjustedCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium">
                            <span>Impact:</span>
                            <span className={
                              scenario.results.percentChange >= 0 
                                ? "text-green-600" 
                                : "text-red-600"
                            }>
                              {scenario.results.percentChange >= 0 ? "+" : ""}
                              {scenario.results.percentChange.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleSelectScenario(scenario)}
                      >
                        <BarChartHorizontal className="mr-2 h-4 w-4" />
                        View Analysis
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center p-8">
                  <h3 className="text-lg font-medium mb-2">No Scenarios Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first what-if scenario to analyze different building cost factors.
                  </p>
                  <Button onClick={() => setNewScenarioOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Scenario
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            {selectedScenario && (
              <ScenarioResults scenario={selectedScenario} />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Scenario Dialog */}
      <Dialog open={newScenarioOpen} onOpenChange={setNewScenarioOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New What-If Scenario</DialogTitle>
            <DialogDescription>
              Configure parameters to evaluate building cost variations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Residential Cost Analysis"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this scenario"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R1">Residential - Single Family</SelectItem>
                    <SelectItem value="R2">Residential - Multi-Family</SelectItem>
                    <SelectItem value="C1">Commercial - Retail</SelectItem>
                    <SelectItem value="C4">Commercial - Warehouse</SelectItem>
                    <SelectItem value="I1">Industrial - Manufacturing</SelectItem>
                    <SelectItem value="A1">Agricultural</SelectItem>
                    <SelectItem value="S1">Special Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="revalArea">Reval Area (Cycle)</Label>
                <Select
                  value={formData.revalArea}
                  onValueChange={(value) => {
                    const area = REVAL_AREAS.find(a => a.id === value);
                    setFormData({ ...formData, revalArea: value, adjustmentFactor: area ? area.factor : 1.0 });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reval Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVAL_AREAS.map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="baseYear">Base Year</Label>
                <Select
                  value={formData.baseYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, baseYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="comparisonYear">Comparison Year</Label>
                <Select
                  value={formData.comparisonYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, comparisonYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qualityFactor">Quality Factor</Label>
                <Select
                  value={formData.qualityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, qualityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">Low (0.8)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Very Good (1.2)</SelectItem>
                    <SelectItem value="1.5">Excellent (1.5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="conditionFactor">Condition Factor</Label>
                <Select
                  value={formData.conditionFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, conditionFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.7">Poor (0.7)</SelectItem>
                    <SelectItem value="0.85">Fair (0.85)</SelectItem>
                    <SelectItem value="1.0">Average (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Excellent (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="complexityFactor">Complexity Factor</Label>
                <Select
                  value={formData.complexityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, complexityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.9">Simple (0.9)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.05">Complex (1.05)</SelectItem>
                    <SelectItem value="1.1">Very Complex (1.1)</SelectItem>
                    <SelectItem value="1.2">Highly Complex (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Reval Area Factor</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  {formData.adjustmentFactor.toFixed(2)} — set by Reval Area above
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario}>
              Create Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Scenario Dialog */}
      <Dialog open={editScenarioOpen} onOpenChange={setEditScenarioOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Scenario</DialogTitle>
            <DialogDescription>
              Update parameters to refine your cost analysis.
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form as new scenario dialog */}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Scenario Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Residential Cost Analysis"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this scenario"
              />
            </div>
            
            {/* Same parameters as new scenario dialog */}
            {/* Building type and region */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-buildingType">Building Type</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R1">Residential - Single Family</SelectItem>
                    <SelectItem value="R2">Residential - Multi-Family</SelectItem>
                    <SelectItem value="C1">Commercial - Retail</SelectItem>
                    <SelectItem value="C4">Commercial - Warehouse</SelectItem>
                    <SelectItem value="I1">Industrial - Manufacturing</SelectItem>
                    <SelectItem value="A1">Agricultural</SelectItem>
                    <SelectItem value="S1">Special Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-revalArea">Reval Area (Cycle)</Label>
                <Select
                  value={formData.revalArea}
                  onValueChange={(value) => {
                    const area = REVAL_AREAS.find(a => a.id === value);
                    setFormData({ ...formData, revalArea: value, adjustmentFactor: area ? area.factor : 1.0 });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reval Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVAL_AREAS.map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Years */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-baseYear">Base Year</Label>
                <Select
                  value={formData.baseYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, baseYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-comparisonYear">Comparison Year</Label>
                <Select
                  value={formData.comparisonYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, comparisonYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Factors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-qualityFactor">Quality Factor</Label>
                <Select
                  value={formData.qualityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, qualityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">Low (0.8)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Very Good (1.2)</SelectItem>
                    <SelectItem value="1.5">Excellent (1.5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-conditionFactor">Condition Factor</Label>
                <Select
                  value={formData.conditionFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, conditionFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.7">Poor (0.7)</SelectItem>
                    <SelectItem value="0.85">Fair (0.85)</SelectItem>
                    <SelectItem value="1.0">Average (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Excellent (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-complexityFactor">Complexity Factor</Label>
                <Select
                  value={formData.complexityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, complexityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.9">Simple (0.9)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.05">Complex (1.05)</SelectItem>
                    <SelectItem value="1.1">Very Complex (1.1)</SelectItem>
                    <SelectItem value="1.2">Highly Complex (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Reval Area Factor</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  {formData.adjustmentFactor.toFixed(2)} — set by Reval Area above
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateScenario}>
              Update Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteScenario}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}