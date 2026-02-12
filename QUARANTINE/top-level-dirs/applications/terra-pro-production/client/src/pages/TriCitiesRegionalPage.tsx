import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MapPin,
  Users,
  Activity,
  Wheat,
  Droplets,
  TreePine,
  Building,
  CheckCircle,
  Settings,
  Database,
 } from '@mui/icons-material';

interface TriCitiesCounty {
  name: string;
  nodeType: "Master" | "Sync";
  status: "Active" | "Staging" | "Queued";
  appraisers: number;
  agProperties: number;
  mixedZoneProperties: number;
  waterRightsTracked: number;
  soilTypesIntegrated: number;
  compliance: number;
}

interface AgricultureConfig {
  waterRightsEnabled: boolean;
  soilTypeMapping: boolean;
  parcelOverlays: boolean;
  cropYieldFactors: boolean;
  irrigationAdjustments: boolean;
  farmResidentialSplits: boolean;
}

export default function TriCitiesRegionalPage() {
  const [selectedCounty, setSelectedCounty] = useState("Benton");
  const [agConfig, setAgConfig] = useState<AgricultureConfig>({
    waterRightsEnabled: true,
    soilTypeMapping: true,
    parcelOverlays: true,
    cropYieldFactors: true,
    irrigationAdjustments: true,
    farmResidentialSplits: true,
  });

  const triCitiesCounties: TriCitiesCounty[] = [
    {
      name: "Benton",
      nodeType: "Master",
      status: "Active",
      appraisers: 28,
      agProperties: 1847,
      mixedZoneProperties: 892,
      waterRightsTracked: 456,
      soilTypesIntegrated: 23,
      compliance: 96.3,
    },
    {
      name: "Franklin",
      nodeType: "Master",
      status: "Active",
      appraisers: 15,
      agProperties: 1234,
      mixedZoneProperties: 567,
      waterRightsTracked: 298,
      soilTypesIntegrated: 18,
      compliance: 95.8,
    },
    {
      name: "Walla Walla",
      nodeType: "Sync",
      status: "Staging",
      appraisers: 12,
      agProperties: 987,
      mixedZoneProperties: 234,
      waterRightsTracked: 187,
      soilTypesIntegrated: 15,
      compliance: 94.2,
    },
    {
      name: "Yakima",
      nodeType: "Sync",
      status: "Staging",
      appraisers: 34,
      agProperties: 2156,
      mixedZoneProperties: 1089,
      waterRightsTracked: 567,
      soilTypesIntegrated: 31,
      compliance: 93.7,
    },
    {
      name: "Columbia",
      nodeType: "Sync",
      status: "Staging",
      appraisers: 6,
      agProperties: 423,
      mixedZoneProperties: 89,
      waterRightsTracked: 76,
      soilTypesIntegrated: 8,
      compliance: 92.1,
    },
    {
      name: "Asotin",
      nodeType: "Sync",
      status: "Queued",
      appraisers: 4,
      agProperties: 298,
      mixedZoneProperties: 67,
      waterRightsTracked: 45,
      soilTypesIntegrated: 6,
      compliance: 91.8,
    },
    {
      name: "Garfield",
      nodeType: "Sync",
      status: "Queued",
      appraisers: 3,
      agProperties: 189,
      mixedZoneProperties: 34,
      waterRightsTracked: 28,
      soilTypesIntegrated: 4,
      compliance: 90.9,
    },
    {
      name: "Whitman",
      nodeType: "Sync",
      status: "Queued",
      appraisers: 8,
      agProperties: 567,
      mixedZoneProperties: 123,
      waterRightsTracked: 89,
      soilTypesIntegrated: 12,
      compliance: 93.4,
    },
  ];

  const zoneBotData = {
    trainingStatus: "Fine-tuning on regional planning data",
    dataIngested: "12,847 appraisals",
    narrativeStyles: ["ag-res hybrid", "rural outbuilding usage", "multi-parcel comp linking"],
    zoningMapsIntegrated: 4,
    completionPercentage: 78,
  };

  const deploymentObjectives = [
    { task: "Establish Benton & Franklin as dual master nodes", status: "Active", progress: 95 },
    { task: "Enable multi-county cross-boundary comp sharing", status: "Active", progress: 88 },
    {
      task: "Integrate Yakima & Walla Walla via lightweight sync nodes",
      status: "In Progress",
      progress: 67,
    },
    { task: "Train LLM agents on rural narrative styles", status: "Active", progress: 92 },
    { task: "Deploy farm/residential split valuation logic", status: "Complete", progress: 100 },
    {
      task: "Configure Columbia/Asotin/Garfield lightweight nodes",
      status: "In Progress",
      progress: 23,
    },
    { task: "Deploy Whitman/Lincoln/Adams predictive nodes", status: "Queued", progress: 8 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Staging":
        return "bg-yellow-100 text-yellow-800";
      case "Queued":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNodeTypeColor = (nodeType: string) => {
    return nodeType === "Master" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
  };

  const selectedCountyData = triCitiesCounties.find((c) => c.name === selectedCounty);

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4"><>

        <h1 className="text-3xl font-bold text-gray-900">
          Terrafusion Tri-Cities Regional Control
        </h1>
        <p
</> className="text-gray-600 mt-2">
          Agricultural + Mixed-Zone Modeling for South-Eastern Washington
        </p>
        <div className="flex items-center space-x-4 mt-4"><>

          <Badge className="bg-orange-100 text-orange-800">Phase 2 Priority</Badge>
          <Badge
</> className="bg-green-100 text-green-800">Agricultural Intelligence Enabled</Badge>
          <Badge className="bg-blue-100 text-blue-800">Dual Master Node Architecture</Badge>
        </div>
      </div>

      {/* County Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {triCitiesCounties.map((county) => (
          <Card
            key={county.name}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCounty === county.name ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedCounty(county.name)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2"><>

                <h3 className="font-semibold">{county.name} County</h3>
                <Badge
</> className={getNodeTypeColor(county.nodeType)}>{county.nodeType}</Badge>
              </div><>

              <Badge className={getStatusColor(county.status)} size="sm">
                {county.status}
              </Badge>
              <div
</> className="mt-3 space-y-1 text-sm text-gray-600">
                <div className="flex items-center"><>

                  <Users className="w-3 h-3 mr-1" />
                  {county.appraisers} appraisers
                </div>
                <div
</> className="flex items-center"><>

                  <Wheat className="w-3 h-3 mr-1" />
                  {county.agProperties} ag properties
                </div>
                <div
</> className="flex items-center">
                  <Building className="w-3 h-3 mr-1" />
                  {county.mixedZoneProperties} mixed-zone
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ZoneBot-TC Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><>

            <Settings className="w-5 h-5 mr-2" />
            ZoneBot-TC Training Status
          </CardTitle>
          <CardDescription
</>>
            AI agent fine-tuned for Tri-Cities regional planning and zoning intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2"><>

                <span className="text-sm font-medium">Training Progress</span>
                <span
</> className="text-sm text-gray-600">{zoneBotData.completionPercentage}%</span>
              </div>
              <Progress value={zoneBotData.completionPercentage} className="mb-4" />

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Database className="w-4 h-4 mr-2 text-blue-500" /><>

                  <span className="font-medium">Data Ingested:</span>
                  <span
</> className="ml-2 text-gray-600">{zoneBotData.dataIngested}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" /><>

                  <span className="font-medium">Status:</span>
                  <span
</> className="ml-2 text-gray-600">{zoneBotData.trainingStatus}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-purple-500" /><>

                  <span className="font-medium">Zoning Maps:</span>
                  <span
</> className="ml-2 text-gray-600">
                    {zoneBotData.zoningMapsIntegrated} integrated
                  </span>
                </div>
              </div>
            </div>

            <div><>

              <h4 className="font-medium mb-3">Specialized Narrative Styles</h4>
              <div
</> className="space-y-2">
                {zoneBotData.narrativeStyles.map((style /* , index */) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span>{style}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected County Details */}
      {selectedCountyData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4"><>

            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
</> value="agriculture">Agriculture Config</TabsTrigger><>

            <TabsTrigger value="deployment">Deployment Status</TabsTrigger>
            <TabsTrigger
</> value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>{selectedCountyData.name} County Status</CardTitle>
                <CardDescription
</>>
                  {selectedCountyData.nodeType} node configuration for agricultural and mixed-zone
                  properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-blue-600">
                      {selectedCountyData.agProperties}
                    </div>
                    <div
</> className="text-sm text-gray-600">Agricultural Properties</div>
                  </div>
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-green-600">
                      {selectedCountyData.mixedZoneProperties}
                    </div>
                    <div
</> className="text-sm text-gray-600">Mixed-Zone Properties</div>
                  </div>
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-cyan-600">
                      {selectedCountyData.waterRightsTracked}
                    </div>
                    <div
</> className="text-sm text-gray-600">Water Rights Tracked</div>
                  </div>
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-purple-600">
                      {selectedCountyData.soilTypesIntegrated}
                    </div>
                    <div
</> className="text-sm text-gray-600">Soil Types Integrated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agriculture" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><>

                  <Wheat className="w-5 h-5 mr-2" />
                  Agricultural Intelligence Configuration
                </CardTitle>
                <CardDescription
</>>
                  Specialized settings for farm and rural property valuation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(agConfig).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {key === "waterRightsEnabled" && (
                          <Droplets className="w-5 h-5 text-blue-500" />
                        )}
                        {key === "soilTypeMapping" && (
                          <TreePine className="w-5 h-5 text-green-500" />
                        )}
                        {key === "parcelOverlays" && <MapPin className="w-5 h-5 text-purple-500" />}
                        {key === "cropYieldFactors" && (
                          <Wheat className="w-5 h-5 text-yellow-500" />
                        )}
                        {key === "irrigationAdjustments" && (
                          <Activity className="w-5 h-5 text-cyan-500" />
                        )}
                        {key === "farmResidentialSplits" && (
                          <Building className="w-5 h-5 text-orange-500" />
                        )}
                        <div><>

                          <div className="font-medium">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </div>
                          <div
</> className="text-sm text-gray-600">
                            {key === "waterRightsEnabled" &&
                              "Track and factor water rights into valuations"}
                            {key === "soilTypeMapping" && "Integrate soil quality and type data"}
                            {key === "parcelOverlays" && "Visual parcel boundary overlays"}
                            {key === "cropYieldFactors" && "Historical crop yield impact analysis"}
                            {key === "irrigationAdjustments" &&
                              "Irrigation system value adjustments"}
                            {key === "farmResidentialSplits" &&
                              "Handle mixed farm/residential properties"}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={
                          value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }
                      >
                        {value ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Deployment Objectives Progress</CardTitle>
                <CardDescription
</>>
                  Track progress of Tri-Cities region rollout objectives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentObjectives.map((objective /* , index */) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center"><>

                        <span className="font-medium text-sm">{objective.task}</span>
                        <Badge
</> className={getStatusColor(objective.status)}>
                          {objective.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={objective.progress} className="flex-1" />
                        <span className="text-sm text-gray-600 w-12">{objective.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Regional Analytics Dashboard</CardTitle>
                <CardDescription
</>>
                  Tri-Cities agricultural and mixed-zone property insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg"><>

                    <div className="text-2xl font-bold text-blue-600">89</div>
                    <div
</> className="text-sm text-blue-800">Active Appraisers</div>
                    <div className="text-xs text-blue-600 mt-1">Across 4 counties</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg"><>

                    <div className="text-2xl font-bold text-green-600">6,224</div>
                    <div
</> className="text-sm text-green-800">Agricultural Properties</div>
                    <div className="text-xs text-green-600 mt-1">With water rights tracking</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg"><>

                    <div className="text-2xl font-bold text-purple-600">2,782</div>
                    <div
</> className="text-sm text-purple-800">Mixed-Zone Properties</div>
                    <div className="text-xs text-purple-600 mt-1">Farm/residential splits</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Action Controls */}
      <Card>
        <CardHeader><>

          <CardTitle>Tri-Cities Deployment Controls</CardTitle>
          <CardDescription
</>>
            Manage regional deployment and configuration for agricultural properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap"><>

            <Button>Finalize Eastern WA Deployment</Button>
            <Button
</> variant="outline">Run EWA Batch Ingestion Simulation</Button><>

            <Button variant="outline">Launch Regional DAO Governance</Button>
            <Button
</> variant="outline">Initiate WA Statewide Mesh Expansion</Button>
            <Button variant="outline">Deploy TFFormEngine WA-EAST Mode</Button>
          </div>

          {/* Eastern Washington Grid Status */}
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div><>

                <h4 className="font-medium text-orange-900">Eastern Washington Grid Active</h4>
                <p
</> className="text-sm text-orange-700 mt-1">
                  Comprehensive agricultural intelligence deployment across 8 Eastern WA counties.
                  Dual master nodes (Benton/Franklin) coordinating with 6 sync nodes for regional
                  mesh coverage.
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-orange-600"><>

                  <span>• 110 active appraisers</span>
                  <span
</>>• 7,901 agricultural properties</span><>

                  <span>• 3,218 mixed-zone properties</span>
                  <span
</>>• 1,746 water rights tracked</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
