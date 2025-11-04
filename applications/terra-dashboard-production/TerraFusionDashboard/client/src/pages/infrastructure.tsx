import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Warning, Activity, Shield, Zap, MapPin, Building2, Truck, Wifi, Droplets, Plus, Eye  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import type { InfrastructureAsset, ThreatAssessment, SimulationRequest } from "@shared/schema";

interface InfrastructureStats {
  totalAssets: number;
  operationalAssets: number;
  criticalThreats: number;
  activeSimulations: number;
  avgCriticalityScore: number;
}

function InfrastructureDashboard() {
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(null);
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [showCreateSimulation, setShowCreateSimulation] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch infrastructure data
  const { data: stats } = useQuery<InfrastructureStats>({
    queryKey: ["/api/infrastructure/dashboard/stats"],
  });

  const { data: assets = [] } = useQuery<InfrastructureAsset[]>({
    queryKey: ["/api/infrastructure/assets"],
  });

  const { data: threats = [] } = useQuery<ThreatAssessment[]>({
    queryKey: ["/api/threats"],
  });

  const { data: criticalThreats = [] } = useQuery<ThreatAssessment[]>({
    queryKey: ["/api/threats/critical"],
  });

  const { data: simulations = [] } = useQuery<SimulationRequest[]>({
    queryKey: ["/api/simulations"],
  });

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (asset: any) => {
      const response = await fetch("/api/infrastructure/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asset),
      });
      if (!response.ok) throw new Error("Failed to create asset");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/dashboard/stats"] });
      setShowCreateAsset(false);
      toast({ title: "Success", description: "Infrastructure asset created successfully" });
    },
  });

  const createSimulationMutation = useMutation({
    mutationFn: async (simulation: any) => {
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulation),
      });
      if (!response.ok) throw new Error("Failed to create simulation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/dashboard/stats"] });
      setShowCreateSimulation(false);
      setSelectedAssets([]);
      toast({ title: "Success", description: "Simulation created and queued for processing" });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "catastrophic": return "bg-red-600";
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "moderate": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      case "minimal": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case "transportation": return <Truck className="h-4 w-4" />;
      case "energy_grid": return <Zap className="h-4 w-4" />;
      case "communications": return <Wifi className="h-4 w-4" />;
      case "water_management": return <Droplets className="h-4 w-4" />;
      case "emergency_services": return <Shield className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-500";
      case "maintenance": return "bg-yellow-500";
      case "degraded": return "bg-orange-500";
      case "offline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
<>
        <h2 className="text-3xl font-bold tracking-tight">Infrastructure Management</h2>
        <div
</> className="flex items-center space-x-2">
          <Dialog open={showCreateSimulation} onOpenChange={setShowCreateSimulation}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                New Simulation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
<>
                <DialogTitle>Create Infrastructure Simulation</DialogTitle>
                <DialogDescription
</>>
                  Run disaster scenarios and impact assessments on your infrastructure assets.
                </DialogDescription>
              </DialogHeader>
              <SimulationForm 
                assets={assets}
                selectedAssets={selectedAssets}
                setSelectedAssets={setSelectedAssets}
                onSubmit={(data) => createSimulationMutation.mutate(data)}
                isLoading={createSimulationMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateAsset} onOpenChange={setShowCreateAsset}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
<>
                <DialogTitle>Add Infrastructure Asset</DialogTitle>
                <DialogDescription
</>>
                  Register a new infrastructure asset for monitoring and analysis.
                </DialogDescription>
              </DialogHeader>
              <AssetForm onSubmit={(data) => createAssetMutation.mutate(data)} isLoading={createAssetMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building2
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{stats?.totalAssets || 0}</div>
            <p
</> className="text-xs text-muted-foreground">Infrastructure components</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <Activity
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold text-green-600">{stats?.operationalAssets || 0}</div>
            <p
</> className="text-xs text-muted-foreground">Systems online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <Warning
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold text-red-600">{stats?.criticalThreats || 0}</div>
            <p
</> className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Active Simulations</CardTitle>
            <Zap
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold text-blue-600">{stats?.activeSimulations || 0}</div>
            <p
</> className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Avg Criticality</CardTitle>
            <Shield
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{stats?.avgCriticalityScore?.toFixed(1) || "0.0"}</div>
            <p
</> className="text-xs text-muted-foreground">Out of 10.0</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
<>
          <TabsTrigger value="assets">Infrastructure Assets</TabsTrigger>
          <TabsTrigger
</> value="threats">Threat Assessment</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedAsset(asset)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getAssetTypeIcon(asset.assetType)}
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                    </div>
                    <Badge className={`${getStatusColor(asset.operationalStatus)} text-white`}>
                      {asset.operationalStatus}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{asset.assetType.replace('_', ' ')}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
<>
                      <span>Criticality Score:</span>
                      <span
</> className="font-semibold">{asset.criticalityScore}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(parseFloat(asset.criticalityScore) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          {criticalThreats.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center">
                  <Warning className="mr-2 h-5 w-5" />
                  Critical Threats Requiring Immediate Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalThreats.filter(t => t.requiresImmediateAction).map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="space-y-1">
<>
                      <div className="font-medium">{threat.threatType.replace('_', ' ')}</div>
                      <div
</> className="text-sm text-gray-600">Asset: {threat.assetId}</div>
                    </div>
                    <Badge className={`${getSeverityColor(threat.severity)} text-white`}>
                      {threat.severity}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {threats.map((threat) => (
              <Card key={threat.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
<>
                    <CardTitle className="text-lg">{threat.threatType.replace('_', ' ')}</CardTitle>
                    <Badge
</> className={`${getSeverityColor(threat.severity)} text-white`}>
                      {threat.severity}
                    </Badge>
                  </div>
                  <CardDescription>
                    Asset: {threat.assetId} • Probability: {(parseFloat(threat.probability) * 100).toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
<>
                      <Label className="text-sm font-medium">Impact Assessment</Label>
                      <div
</> className="text-sm text-gray-600 mt-1">
                        {typeof threat.impactAssessment === 'object' 
                          ? Object.entries(threat.impactAssessment).map(([key, value]) => (
                              <div key={key}>{key}: {value}</div>
                            ))
                          : threat.impactAssessment
                        }
                      </div>
                    </div>
                    {threat.mitigationStrategies && Array.isArray(threat.mitigationStrategies) && (
                      <div>
<>
                        <Label className="text-sm font-medium">Mitigation Strategies</Label>
                        <ul
</> className="text-sm text-gray-600 mt-1 list-disc list-inside">
                          {threat.mitigationStrategies.map((strategy /* , index */) => (
                            <li key={index}>{strategy}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="simulations" className="space-y-4">
          <div className="grid gap-4">
            {simulations.map((simulation) => (
              <Card key={simulation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
<>
                    <CardTitle className="text-lg">{simulation.scenarioName}</CardTitle>
                    <Badge
</> variant={simulation.status === 'completed' ? 'default' : simulation.status === 'failed' ? 'destructive' : 'secondary'}>
                      {simulation.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Duration: {simulation.durationHours}h • Priority: {simulation.priority}/10 • By: {simulation.requestedBy}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
<>
                      <Label className="text-sm font-medium">Assets Involved</Label>
                      <div
</> className="text-sm text-gray-600 mt-1">
                        {Array.isArray(simulation.assetIds) ? simulation.assetIds.join(', ') : simulation.assetIds}
                      </div>
                    </div>
                    {simulation.results && (
                      <div>
<>
                        <Label className="text-sm font-medium">Results</Label>
                        <div
</> className="text-sm text-gray-600 mt-1 space-y-1">
                          {typeof simulation.results === 'object' ? (
                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                              {JSON.stringify(simulation.results, null, 2)}
                            </pre>
                          ) : (
                            <div>{simulation.results}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getAssetTypeIcon(selectedAsset.assetType)}
                <span>{selectedAsset.name}</span>
              </DialogTitle>
              <DialogDescription>Asset ID: {selectedAsset.assetId}</DialogDescription>
            </DialogHeader>
            <AssetDetail asset={selectedAsset} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Asset Form Component
function AssetForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    assetType: '',
    location: { latitude: 0, longitude: 0 },
    criticalityScore: 5,
    operationalStatus: 'operational'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
<>
        <Label htmlFor="assetId">Asset ID</Label>
        <Input
</>
          id="assetId"
          value={formData.assetId}
          onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
          required
        />
      </div>
      <div>
<>
        <Label htmlFor="name">Name</Label>
        <Input
</>
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
<>
        <Label htmlFor="assetType">Asset Type</Label>
        <Select
</> value={formData.assetType} onValueChange={(value) => setFormData({ ...formData, assetType: value })}>
          <SelectTrigger>
<>
            <SelectValue placeholder="Select asset type" />
          </SelectTrigger>
          <SelectContent
</>>
<>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem
</> value="utilities">Utilities</SelectItem>
<>
            <SelectItem value="communications">Communications</SelectItem>
            <SelectItem
</> value="water_management">Water Management</SelectItem>
<>
            <SelectItem value="energy_grid">Energy Grid</SelectItem>
            <SelectItem
</> value="emergency_services">Emergency Services</SelectItem>
<>
            <SelectItem value="waste_management">Waste Management</SelectItem>
            <SelectItem
</> value="public_facilities">Public Facilities</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
<>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
</>
            id="latitude"
            type="number"
            step="any"
            value={formData.location.latitude}
            onChange={(e) => setFormData({ 
              ...formData, 
              location: { ...formData.location, latitude: parseFloat(e.target.value) }
            })}
            required
          />
        </div>
        <div>
<>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
</>
            id="longitude"
            type="number"
            step="any"
            value={formData.location.longitude}
            onChange={(e) => setFormData({ 
              ...formData, 
              location: { ...formData.location, longitude: parseFloat(e.target.value) }
            })}
            required
          />
        </div>
      </div>
      <div>
<>
        <Label htmlFor="criticalityScore">Criticality Score (1-10)</Label>
        <Input
</>
          id="criticalityScore"
          type="number"
          min="1"
          max="10"
          step="0.1"
          value={formData.criticalityScore}
          onChange={(e) => setFormData({ ...formData, criticalityScore: parseFloat(e.target.value) })}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Asset"}
      </Button>
    </form>
  );
}

// Simulation Form Component
function SimulationForm({ 
  assets, 
  selectedAssets, 
  setSelectedAssets, 
  onSubmit, 
  isLoading 
}: { 
  assets: InfrastructureAsset[], 
  selectedAssets: string[], 
  setSelectedAssets: (assets: string[]) => void,
  onSubmit: (data: any) => void, 
  isLoading: boolean 
}) {
  const [formData, setFormData] = useState({
    simulationId: `sim-${Date.now()}`,
    scenarioName: '',
    durationHours: 24,
    priority: 5,
    requestedBy: 'admin',
    simulationParameters: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      assetIds: selectedAssets
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
<>
        <Label htmlFor="scenarioName">Scenario Name</Label>
        <Input
</>
          id="scenarioName"
          value={formData.scenarioName}
          onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })}
          placeholder="e.g., Hurricane Impact Assessment"
          required
        />
      </div>
      <div>
<>
        <Label>Select Assets for Simulation</Label>
        <div
</> className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
          {assets.map((asset) => (
            <label key={asset.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAssets.includes(asset.assetId)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAssets([...selectedAssets, asset.assetId]);
                  } else {
                    setSelectedAssets(selectedAssets.filter(id => id !== asset.assetId));
                  }
                }}
              />
              <span className="text-sm">{asset.name} ({asset.assetType})</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
<>
          <Label htmlFor="durationHours">Duration (hours)</Label>
          <Input
</>
            id="durationHours"
            type="number"
            min="1"
            max="168"
            value={formData.durationHours}
            onChange={(e) => setFormData({ ...formData, durationHours: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div>
<>
          <Label htmlFor="priority">Priority (1-10)</Label>
          <Input
</>
            id="priority"
            type="number"
            min="1"
            max="10"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || selectedAssets.length === 0}>
        {isLoading ? "Creating..." : "Start Simulation"}
      </Button>
    </form>
  );
}

// Asset Detail Component
function AssetDetail({ asset }: { asset: InfrastructureAsset }) {
  const { data: assetThreats = [] } = useQuery<ThreatAssessment[]>({
    queryKey: ["/api/threats/asset", asset.assetId],
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
<>
          <Label>Asset Type</Label>
          <div
</> className="flex items-center space-x-2 mt-1">
            {asset.assetType === 'transportation' && <Truck className="h-4 w-4" />}
            {asset.assetType === 'energy_grid' && <Zap className="h-4 w-4" />}
            {asset.assetType === 'communications' && <Wifi className="h-4 w-4" />}
            {asset.assetType === 'water_management' && <Droplets className="h-4 w-4" />}
            {asset.assetType === 'emergency_services' && <Shield className="h-4 w-4" />}
            <span className="capitalize">{asset.assetType.replace('_', ' ')}</span>
          </div>
        </div>
        <div>
<>
          <Label>Operational Status</Label>
          <div
</> className="mt-1">
            <Badge className={`${asset.operationalStatus === 'operational' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {asset.operationalStatus}
            </Badge>
          </div>
        </div>
        <div>
<>
          <Label>Criticality Score</Label>
          <div
</> className="text-lg font-semibold mt-1">{asset.criticalityScore}/10</div>
        </div>
        <div>
<>
          <Label>Last Inspection</Label>
          <div
</> className="text-sm mt-1">{new Date(asset.lastInspection).toLocaleDateString()}</div>
        </div>
      </div>

      {asset.realTimeMetrics && typeof asset.realTimeMetrics === 'object' && (
        <div>
<>
          <Label>Real-time Metrics</Label>
          <div
</> className="mt-2 space-y-2">
            {Object.entries(asset.realTimeMetrics as Record<string, any>).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
<>
                <span className="capitalize">{key.replace('_', ' ')}:</span>
                <span
</> className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value.toString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assetThreats.length > 0 && (
        <div>
<>
          <Label>Active Threats</Label>
          <div
</> className="mt-2 space-y-2">
            {assetThreats.map((threat) => (
              <div key={threat.id} className="flex items-center justify-between p-2 border rounded">
                <div>
<>
                  <div className="font-medium text-sm">{threat.threatType.replace('_', ' ')}</div>
                  <div
</> className="text-xs text-gray-600">Probability: {(parseFloat(threat.probability) * 100).toFixed(1)}%</div>
                </div>
                <Badge className={`${threat.severity === 'high' || threat.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'} text-white text-xs`}>
                  {threat.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InfrastructureDashboard;