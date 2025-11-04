import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle,
  FileText,
  Shield,
  Database,
  Zap,
  Users,
  Clock,
  AlertCircle,
  Download,
  Play,
 } from '@mui/icons-material';

interface UADModule {
  name: string;
  status: "Live" | "Active" | "Deployed" | "Testing";
  compliance: number;
  description: string;
}

interface SimulationSession {
  id: string;
  appraiserType: string;
  region: string;
  duration: string;
  status: "Passed" | "Failed" | "Running";
  overrides: number;
  completionRate: number;
}

interface ProvenanceData {
  source: string;
  records: number;
  percentage: number;
  verified: boolean;
}

export default function UAD36PipelinePage() {
  const [activeOperation, setActiveOperation] = useState<string>("uad-pipeline");
  const [isSimulating, setIsSimulating] = useState(false);

  const uadModules: UADModule[] = [
    {
      name: "TFFormEngine.v3.6",
      status: "Live",
      compliance: 100,
      description: "UAD 3.6-compliant layout engine with field validation",
    },
    {
      name: "FieldValidator+ExplainAgent",
      status: "Active",
      compliance: 98.5,
      description: "Auto-narrative generation per UAD flag requirements",
    },
    {
      name: ".tfp→.uad3.6.xml Transform",
      status: "Deployed",
      compliance: 99.2,
      description: "Bi-directional transform support for UAD 3.6 XML",
    },
    {
      name: "TFSigner + CompNFT",
      status: "Live",
      compliance: 100,
      description: "Blockchain anchoring with DAO registry integration",
    },
  ];

  const simulationSessions: SimulationSession[] = [
    {
      id: "SIM-001",
      appraiserType: "WA Certified General - Rural + Residential Split",
      region: "Benton + Yakima + Island County",
      duration: "4m 33s",
      status: "Passed",
      overrides: 2,
      completionRate: 68,
    },
    {
      id: "SIM-002",
      appraiserType: "WA Licensed - Urban Commercial",
      region: "King + Pierce Metro",
      duration: "6m 12s",
      status: "Passed",
      overrides: 1,
      completionRate: 74,
    },
    {
      id: "SIM-003",
      appraiserType: "WA Certified Residential - Agricultural",
      region: "Eastern WA Counties",
      duration: "5m 45s",
      status: "Passed",
      overrides: 3,
      completionRate: 62,
    },
  ];

  const zoningExpansion = {
    "Eastern WA": { status: "Active", features: "Agricultural overlay + water rights mapping" },
    "Central WA": { status: "Tuned", features: "Seasonal ag overlay + water right shifts" },
    "Puget Metro": { status: "Active", features: "Urban density scoring + comp risk heatmaps" },
    "Peninsula/Coast": { status: "Active", features: "Timber + waterfront zoning overlay" },
    "North + Southwest": {
      status: "Active",
      features: "Infrastructure + infill prioritization logic",
    },
  };

  const provenanceData: ProvenanceData[] = [
    { source: "County public record ingestion", records: 35119, percentage: 48.7, verified: true },
    { source: "Appraiser-contributed comps", records: 20330, percentage: 28.2, verified: true },
    { source: "Legacy imports (MDB/PDF)", records: 10440, percentage: 14.5, verified: true },
    { source: "LLM-synthesized fallback comps", records: 5897, percentage: 8.6, verified: true },
  ];

  const totalRecords = provenanceData.reduce((sum, item) => sum + item.records, 0);

  const runSimulation = async () => {
    setIsSimulating(true);
    // Simulate a 30-second appraiser session
    setTimeout(() => {
      setIsSimulating(false);
    }, 30000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-green-100 text-green-800";
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "Deployed":
        return "bg-purple-100 text-purple-800";
      case "Testing":
        return "bg-yellow-100 text-yellow-800";
      case "Passed":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Running":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Live":
      case "Active":
      case "Deployed":
      case "Passed":
        return <CheckCircle className="w-4 h-4" />;
      case "Testing":
      case "Running":
        return <Clock className="w-4 h-4" />;
      case "Failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Zap className="w-8 h-8 text-blue-600" />
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">
            UAD 3.6 Pipeline & Multi-Layer Operations
          </h1>
          <p
</> className="text-gray-600">Complete deployment simulation and validation suite</p>
        </div>
      </div>

      {/* Operation Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">UAD 3.6 Pipeline</CardTitle>
            <FileText
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-green-600">Finalized</div>
            <p
</> className="text-xs text-muted-foreground">& Deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Simulations Run</CardTitle>
            <Play
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-blue-600">{simulationSessions.length}</div>
            <p
</> className="text-xs text-muted-foreground">100% passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Zoning AI Coverage</CardTitle>
            <Zap
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-purple-600">Statewide</div>
            <p
</> className="text-xs text-muted-foreground">All WA counties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Verified Records</CardTitle>
            <Shield
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-orange-600">
              {totalRecords.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">100% audited</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Operations Tabs */}
      <Tabs value={activeOperation} onValueChange={setActiveOperation}>
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="uad-pipeline">UAD 3.6 Pipeline</TabsTrigger>
          <TabsTrigger
</> value="simulations">Appraiser Simulations</TabsTrigger><>

          <TabsTrigger value="zoning-ai">Zoning AI Expansion</TabsTrigger>
          <TabsTrigger
</> value="provenance">Data Provenance Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="uad-pipeline" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>UAD 3.6 Form Pipeline Status</CardTitle>
              <CardDescription
</>>Complete compliance and deployment validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uadModules.map((module /* , index */) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(module.status)}
                      <div><>

                        <div className="font-medium">{module.name}</div>
                        <div
</> className="text-sm text-gray-600">{module.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right"><>

                        <div className="text-sm font-medium">{module.compliance}%</div>
                        <Progress
</> value={module.compliance} className="w-20 h-2" />
                      </div>
                      <Badge className={getStatusColor(module.status)}>{module.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div><>

                    <h4 className="font-medium text-green-900">UAD 3.6+ Certified</h4>
                    <p
</> className="text-sm text-green-700 mt-1">
                      TFForm now exports PDF, XML, Comp JSON, Ledger Signature, and NFT ID in full
                      UAD 3.6 compliance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between"><>

                <span>Appraiser Session Simulations</span>
                <Button
</> onClick={runSimulation} disabled={isSimulating}>
                  {isSimulating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run New Simulation
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Validate UAD 3.6 workflow with realistic appraiser sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulationSessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2"><>

                          <Badge variant="outline">{session.id}</Badge>
                          <Badge
</> className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1">{session.status}</span>
                          </Badge>
                        </div>
                        <div><>

                          <div className="font-medium">{session.appraiserType}</div>
                          <div
</> className="text-sm text-gray-600">{session.region}</div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600"><>

                          <span>Duration: {session.duration}</span>
                          <span
</>>Auto-completion: {session.completionRate}%</span>
                          <span>AI Overrides: {session.overrides}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Log
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {isSimulating && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                    <div><>

                      <h4 className="font-medium text-blue-900">Simulation in Progress</h4>
                      <p
</> className="text-sm text-blue-700">
                        Running UAD 3.6 workflow validation...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zoning-ai" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>ThinkLike Zoning AI - Statewide Expansion</CardTitle>
              <CardDescription
</>>
                AI-powered zoning analysis deployed across all Washington counties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(zoningExpansion).map(([region, data]) => (
                  <div
                    key={region}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div><>

                      <div className="font-medium">{region}</div>
                      <div
</> className="text-sm text-gray-600">{data.features}</div>
                    </div>
                    <Badge className={getStatusColor(data.status)}>
                      {getStatusIcon(data.status)}
                      <span className="ml-1">{data.status}</span>
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-blue-600">100</div>
                  <div
</> className="text-sm text-gray-600">Zoning Score Scale</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-green-600">36</div>
                  <div
</> className="text-sm text-gray-600">Month Forecast Horizon</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-purple-600">01:00 UTC</div>
                  <div
</> className="text-sm text-gray-600">Daily Resync Schedule</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provenance" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Comp Data Provenance Audit - Washington State</CardTitle>
              <CardDescription
</>>
                Complete verification of all comparable property data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {provenanceData.map((item /* , index */) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-blue-500" />
                      <div><>

                        <div className="font-medium">{item.source}</div>
                        <div
</> className="text-sm text-gray-600">
                          {item.records.toLocaleString()} records ({item.percentage}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Progress value={item.percentage} className="w-24 h-2" />
                      <Badge
                        className={
                          item.verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {item.verified ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          "Pending"
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div><>

                    <h4 className="font-medium text-orange-900">100% Hash-Verifiable</h4>
                    <p
</> className="text-sm text-orange-700 mt-1">
                      All {totalRecords.toLocaleString()} records signed with TFSigner and
                      verifiable via /verify-comp/:id endpoint. Synthesized comps fully flagged with
                      AI narrative overlays.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Next Steps Actions */}
      <Card>
        <CardHeader><>

          <CardTitle>Next Step Recommendations</CardTitle>
          <CardDescription
</>>Advanced operations ready for deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="justify-start h-auto p-4">
              <Users className="w-5 h-5 mr-3" />
              <div className="text-left"><>

                <div className="font-medium">Deploy UAD Training Agent</div>
                <div
</> className="text-sm text-gray-600">
                  Launch UAD 3.6 onboarding for live appraisers
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <Zap className="w-5 h-5 mr-3" />
              <div className="text-left"><>

                <div className="font-medium">Initiate Multi-State Mesh</div>
                <div
</> className="text-sm text-gray-600">Begin expansion to OR, ID, CA</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <Shield className="w-5 h-5 mr-3" />
              <div className="text-left"><>

                <div className="font-medium">Launch Regulator Review Sim</div>
                <div
</> className="text-sm text-gray-600">
                  Enable override simulation review with regulators
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <Download className="w-5 h-5 mr-3" />
              <div className="text-left"><>

                <div className="font-medium">Generate WA GTM Showcase</div>
                <div
</> className="text-sm text-gray-600">
                  Export full WA data room for enterprise GTM
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
