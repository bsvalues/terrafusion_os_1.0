import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin,
  Users,
  Activity,
  Shield,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Server,
 } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";

interface CountyNode {
  name: string;
  type: "Type-1 Urban" | "Type-2 Regional" | "Type-3 Rural";
  status: "Live" | "Staging" | "Queued";
  appraisers: number;
  monthlyReports: number;
  averageValue: number;
  complianceScore: number;
}

interface CountyStats {
  totalProperties: number;
  totalValue: number;
  averageProcessingTime: string;
  complianceRate: number;
  nftsMinted: number;
}

export default function WACountyPortalPage() {
  const [selectedCounty, setSelectedCounty] = useState("King");
  const [countyStats, setCountyStats] = useState<CountyStats | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const waCounties: CountyNode[] = [
    {
      name: "King",
      type: "Type-1 Urban",
      status: "Live",
      appraisers: 187,
      monthlyReports: 2450,
      averageValue: 785000,
      complianceScore: 98.2,
    },
    {
      name: "Pierce",
      type: "Type-1 Urban",
      status: "Live",
      appraisers: 94,
      monthlyReports: 1320,
      averageValue: 485000,
      complianceScore: 96.8,
    },
    {
      name: "Snohomish",
      type: "Type-1 Urban",
      status: "Live",
      appraisers: 76,
      monthlyReports: 980,
      averageValue: 625000,
      complianceScore: 97.4,
    },
    // Phase 2 - PRIORITY: TRI-CITIES NEXUS (South-Eastern WA)
    {
      name: "Benton",
      type: "Type-2 Regional",
      status: "Staging",
      appraisers: 28,
      monthlyReports: 420,
      averageValue: 325000,
      complianceScore: 96.3,
    },
    {
      name: "Franklin",
      type: "Type-2 Regional",
      status: "Staging",
      appraisers: 15,
      monthlyReports: 240,
      averageValue: 285000,
      complianceScore: 95.8,
    },
    {
      name: "Walla Walla",
      type: "Type-3 Rural",
      status: "Queued",
      appraisers: 12,
      monthlyReports: 180,
      averageValue: 2await DynamicPropertyService.GetPropertyCountAsync(countyCode),
      complianceScore: 94.2,
    },
    {
      name: "Yakima",
      type: "Type-3 Rural",
      status: "Queued",
      appraisers: 34,
      monthlyReports: 510,
      averageValue: 195000,
      complianceScore: 93.7,
    },
    // Phase 3 - Secondary Expansion
    {
      name: "Spokane",
      type: "Type-2 Regional",
      status: "Queued",
      appraisers: 45,
      monthlyReports: 560,
      averageValue: 285000,
      complianceScore: 95.1,
    },
    {
      name: "Clark",
      type: "Type-2 Regional",
      status: "Queued",
      appraisers: 38,
      monthlyReports: 420,
      averageValue: 4await DynamicPropertyService.GetPropertyCountAsync(countyCode),
      complianceScore: 94.7,
    },
    {
      name: "Thurston",
      type: "Type-2 Regional",
      status: "Queued",
      appraisers: 32,
      monthlyReports: 380,
      averageValue: 375000,
      complianceScore: 93.9,
    },
  ];

  useEffect(() => {
    // Simulate fetching county-specific stats
    const mockStats: CountyStats = {
      totalProperties:
        selectedCounty === "King" ? 875432 : selectedCounty === "Pierce" ? 423891 : 298756,
      totalValue:
        selectedCounty === "King"
          ? 687000000000
          : selectedCounty === "Pierce"
            ? 205000000000
            : 186000000000,
      averageProcessingTime: "2.3 days",
      complianceRate: 98.2,
      nftsMinted: selectedCounty === "King" ? 24567 : selectedCounty === "Pierce" ? 13298 : 9834,
    };

    setCountyStats(mockStats);
  }, [selectedCounty]);

  const deployCountyNode = async (countyName: string) => {
    if (isDeploying) return;

    setIsDeploying(true);
    try {
      const response = await fetch(`/api/wa-counties/${countyName}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "County Node Deployed",
          description: `${countyName} County successfully deployed to production`,
        });

        // Update the county status in the UI
        const updatedCounties = waCounties.map((county) =>
          county.name === countyName ? { ...county, status: "Live" as const } : county
        );
        // You would typically refetch data here or update state
      } else {
        toast({
          title: "Deployment Failed",
          description: result.message || "Failed to deploy county node",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deploying county:", error);
      toast({
        title: "Deployment Error",
        description: "Network error occurred during deployment",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-green-100 text-green-800";
      case "Staging":
        return "bg-yellow-100 text-yellow-800";
      case "Queued":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "Type-1 Urban":
        return "bg-blue-100 text-blue-800";
      case "Type-2 Regional":
        return "bg-purple-100 text-purple-800";
      case "Type-3 Rural":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
<>

          <h1 className="text-3xl font-bold">Washington State County Portal</h1>
          <p
</> className="text-muted-foreground">Unified Terrafusion federation across 39 counties</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <MapPin className="w-4 h-4 mr-2" />
          WA Jurisdiction
        </Badge>
      </div>

      {/* County Selector */}
      <Card>
        <CardHeader>
<>

          <CardTitle>County Node Selection</CardTitle>
          <CardDescription
</>>
            Select a county to view detailed metrics and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-64">
<>

              <SelectValue placeholder="Select County" />
            </SelectTrigger>
            <SelectContent
</>>
              {waCounties.map((county) => (
                <SelectItem key={county.name} value={county.name}>
                  {county.name} County - {county.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* County Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {waCounties.map((county) => (
          <Card
            key={county.name}
            className={`hover:shadow-lg transition-shadow ${selectedCounty === county.name ? "ring-2 ring-blue-500" : ""}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
<>

                  <CardTitle className="text-lg">{county.name} County</CardTitle>
                  <CardDescription
</>>{county.appraisers} active appraisers</CardDescription>
                </div>
                <div className="text-right">
<>

                  <Badge className={getStatusColor(county.status)}>{county.status}</Badge>
                  <div
</> className="mt-1">
                    <Badge variant="outline" className={getNodeTypeColor(county.type)}>
                      {county.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
<>

                  <span className="text-muted-foreground">Monthly Reports:</span>
                  <span
</> className="font-medium">{county.monthlyReports.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
<>

                  <span className="text-muted-foreground">Avg Value:</span>
                  <span
</> className="font-medium">${county.averageValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
<>

                  <span className="text-muted-foreground">Compliance:</span>
                  <span
</> className="font-medium text-green-600">{county.complianceScore}%</span>
                </div>
              </div>
              <Button
                variant={selectedCounty === county.name ? "default" : "outline"}
                size="sm"
                className="w-full mt-3"
                onClick={() => setSelectedCounty(county.name)}
              >
                {selectedCounty === county.name ? "Selected" : "View Details"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed County View */}
      {countyStats && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
<>

            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
</> value="appraisers">Appraisers</TabsTrigger>
<>

            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger
</> value="federation">Federation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <FileText
</> className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
<>

                  <div className="text-2xl font-bold">
                    {countyStats.totalProperties.toLocaleString()}
                  </div>
                  <p
</> className="text-xs text-muted-foreground">Active in system</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <TrendingUp
</> className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
<>

                  <div className="text-2xl font-bold">
                    ${(countyStats.totalValue / 1000000000).toFixed(1)}B
                  </div>
                  <p
</> className="text-xs text-muted-foreground">Appraised value</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

                  <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                  <Activity
</> className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
<>

                  <div className="text-2xl font-bold">{countyStats.averageProcessingTime}</div>
                  <p
</> className="text-xs text-muted-foreground">Average turnaround</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

                  <CardTitle className="text-sm font-medium">NFTs Minted</CardTitle>
                  <Shield
</> className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
<>

                  <div className="text-2xl font-bold">
                    {countyStats.nftsMinted.toLocaleString()}
                  </div>
                  <p
</> className="text-xs text-muted-foreground">Blockchain verified</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appraisers" className="space-y-4">
            <Card>
              <CardHeader>
<>

                <CardTitle>Active Appraisers - {selectedCounty} County</CardTitle>
                <CardDescription
</>>Licensed professionals using Terrafusion platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
<>

                      <div className="text-2xl font-bold text-blue-600">
                        {waCounties.find((c) => c.name === selectedCounty)?.appraisers}
                      </div>
                      <p
</> className="text-sm text-muted-foreground">Total Active</p>
                    </div>
                    <div>
<>

                      <div className="text-2xl font-bold text-green-600">96%</div>
                      <p
</> className="text-sm text-muted-foreground">Adoption Rate</p>
                    </div>
                    <div>
<>

                      <div className="text-2xl font-bold text-purple-600">4.8</div>
                      <p
</> className="text-sm text-muted-foreground">Avg Rating</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
<>

                <CardTitle>USPAP & UCDP Compliance</CardTitle>
                <CardDescription
</>>Automated compliance monitoring and reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
<>

                    <span>USPAP Compliance</span>
                    <Badge
</> className="bg-green-100 text-green-800">98.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
<>

                    <span>UCDP Requirements</span>
                    <Badge
</> className="bg-green-100 text-green-800">97.8%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
<>

                    <span>State Regulations</span>
                    <Badge
</> className="bg-green-100 text-green-800">99.1%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="federation" className="space-y-4">
            <Card>
              <CardHeader>
<>

                <CardTitle>County Federation Status</CardTitle>
                <CardDescription
</>>Real-time mesh synchronization across WA counties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
<>

                    <span>Mesh Connectivity</span>
                    <Badge
</> className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
<>

                    <span>Data Sync Status</span>
                    <Badge
</> className="bg-green-100 text-green-800">Real-time</Badge>
                  </div>
                  <div className="flex justify-between items-center">
<>

                    <span>Cross-County Comps</span>
                    <Badge
</> className="bg-blue-100 text-blue-800">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Action Controls */}
      <Card>
        <CardHeader>
<>

          <CardTitle>County Operations</CardTitle>
          <CardDescription
</>>
            Administrative controls for county-specific configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={() => deployCountyNode(selectedCounty)}
              disabled={
                isDeploying || waCounties.find((c) => c.name === selectedCounty)?.status === "Live"
              }
            >
              {isDeploying ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 mr-2" />
                  Deploy County Node
                </>
              )}
            </Button>
            <Button variant="outline">
<>

              <MapPin className="w-4 h-4 mr-2" />
              Configure Zoning AI
            </Button>
            <Button
</> variant="outline">
<>

              <FileText className="w-4 h-4 mr-2" />
              Export County Report
            </Button>
            <Button
</> variant="outline">
              <Users className="w-4 h-4 mr-2" />
              DAO Governance
            </Button>
          </div>

          {/* Phase 2 Deployment Status */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
<>

                <h4 className="font-medium text-green-900">Phase 2 Deployment Active</h4>
                <p
</> className="text-sm text-green-700 mt-1">
                  King, Pierce, and Snohomish counties are live with unified Terrafusion platform.
                  Real-time mesh connectivity enabled for cross-county comparable sharing.
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-green-600">
<>

                  <span>• 357 active appraisers</span>
                  <span
</>>• 4,750 monthly reports</span>
<>

                  <span>• 98.2% USPAP compliance</span>
                  <span
</>>• 47,699 NFTs minted</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
