import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin,
  Users,
  Building,
  Zap,
  Shield,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
 } from '@mui/icons-material';

interface WACounty {
  name: string;
  region: string;
  status: "Live" | "Active" | "Staging" | "Syncing" | "Queued";
  nodeType: "Core" | "Regional" | "Edge" | "Light" | "Predictive";
  appraisers: number;
  properties: number;
  compliance: number;
  specialization?: string;
}

export default function WAStatewidePage() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const waCounties: WACounty[] = [
    // Eastern WA (Completed)
    {
      name: "Benton",
      region: "Eastern WA",
      status: "Live",
      nodeType: "Core",
      appraisers: 28,
      properties: 1847,
      compliance: 96.3,
      specialization: "Agricultural",
    },
    {
      name: "Franklin",
      region: "Eastern WA",
      status: "Live",
      nodeType: "Core",
      appraisers: 15,
      properties: 1234,
      compliance: 95.8,
      specialization: "Agricultural",
    },
    {
      name: "Yakima",
      region: "Eastern WA",
      status: "Live",
      nodeType: "Regional",
      appraisers: 34,
      properties: 2156,
      compliance: 93.7,
      specialization: "Mixed-Zone",
    },
    {
      name: "Walla Walla",
      region: "Eastern WA",
      status: "Live",
      nodeType: "Edge",
      appraisers: 12,
      properties: 987,
      compliance: 94.2,
      specialization: "Wine Country",
    },
    {
      name: "Columbia",
      region: "Eastern WA",
      status: "Active",
      nodeType: "Light",
      appraisers: 6,
      properties: 423,
      compliance: 92.1,
    },
    {
      name: "Asotin",
      region: "Eastern WA",
      status: "Active",
      nodeType: "Light",
      appraisers: 4,
      properties: 298,
      compliance: 91.8,
    },
    {
      name: "Garfield",
      region: "Eastern WA",
      status: "Active",
      nodeType: "Light",
      appraisers: 3,
      properties: 189,
      compliance: 90.9,
    },
    {
      name: "Whitman",
      region: "Eastern WA",
      status: "Active",
      nodeType: "Predictive",
      appraisers: 8,
      properties: 567,
      compliance: 93.4,
      specialization: "University",
    },

    // Central WA (Active)
    {
      name: "Chelan",
      region: "Central WA",
      status: "Active",
      nodeType: "Regional",
      appraisers: 18,
      properties: 892,
      compliance: 94.5,
      specialization: "Recreation",
    },
    {
      name: "Kittitas",
      region: "Central WA",
      status: "Active",
      nodeType: "Edge",
      appraisers: 9,
      properties: 456,
      compliance: 93.2,
    },
    {
      name: "Grant",
      region: "Central WA",
      status: "Active",
      nodeType: "Regional",
      appraisers: 22,
      properties: 1456,
      compliance: 92.8,
      specialization: "Agricultural",
    },
    {
      name: "Douglas",
      region: "Central WA",
      status: "Active",
      nodeType: "Edge",
      appraisers: 7,
      properties: 334,
      compliance: 91.9,
    },

    // Puget Metro (Hardened - Original Counties)
    {
      name: "King",
      region: "Puget Metro",
      status: "Live",
      nodeType: "Core",
      appraisers: 187,
      properties: 8934,
      compliance: 98.2,
      specialization: "Urban Dense",
    },
    {
      name: "Pierce",
      region: "Puget Metro",
      status: "Live",
      nodeType: "Core",
      appraisers: 94,
      properties: 5678,
      compliance: 96.8,
      specialization: "Suburban",
    },
    {
      name: "Snohomish",
      region: "Puget Metro",
      status: "Live",
      nodeType: "Core",
      appraisers: 76,
      properties: 4321,
      compliance: 97.4,
      specialization: "Mixed Urban",
    },

    // Northwest WA (Live)
    {
      name: "Whatcom",
      region: "Northwest WA",
      status: "Live",
      nodeType: "Regional",
      appraisers: 32,
      properties: 1876,
      compliance: 95.1,
      specialization: "Border",
    },
    {
      name: "Skagit",
      region: "Northwest WA",
      status: "Live",
      nodeType: "Regional",
      appraisers: 28,
      properties: 1432,
      compliance: 94.7,
      specialization: "Agricultural",
    },
    {
      name: "Island",
      region: "Northwest WA",
      status: "Live",
      nodeType: "Edge",
      appraisers: 14,
      properties: 789,
      compliance: 93.8,
      specialization: "Island",
    },
    {
      name: "San Juan",
      region: "Northwest WA",
      status: "Live",
      nodeType: "Edge",
      appraisers: 8,
      properties: 456,
      compliance: 92.6,
      specialization: "Island Premium",
    },

    // Southwest WA (Federated)
    {
      name: "Clark",
      region: "Southwest WA",
      status: "Active",
      nodeType: "Regional",
      appraisers: 89,
      properties: 4567,
      compliance: 96.1,
      specialization: "Metro Adjacent",
    },
    {
      name: "Thurston",
      region: "Southwest WA",
      status: "Active",
      nodeType: "Regional",
      appraisers: 45,
      properties: 2234,
      compliance: 95.3,
      specialization: "Capital",
    },
    {
      name: "Lewis",
      region: "Southwest WA",
      status: "Active",
      nodeType: "Edge",
      appraisers: 19,
      properties: 987,
      compliance: 93.9,
    },
    {
      name: "Cowlitz",
      region: "Southwest WA",
      status: "Staging",
      nodeType: "Edge",
      appraisers: 16,
      properties: 876,
      compliance: 92.7,
    },
    {
      name: "Wahkiakum",
      region: "Southwest WA",
      status: "Staging",
      nodeType: "Light",
      appraisers: 3,
      properties: 123,
      compliance: 89.4,
    },

    // Peninsula & Coast (Synced)
    {
      name: "Jefferson",
      region: "Peninsula & Coast",
      status: "Active",
      nodeType: "Edge",
      appraisers: 11,
      properties: 567,
      compliance: 93.1,
      specialization: "Rural Coastal",
    },
    {
      name: "Grays Harbor",
      region: "Peninsula & Coast",
      status: "Active",
      nodeType: "Regional",
      appraisers: 24,
      properties: 1234,
      compliance: 92.8,
      specialization: "Timber",
    },
    {
      name: "Pacific",
      region: "Peninsula & Coast",
      status: "Active",
      nodeType: "Edge",
      appraisers: 8,
      properties: 345,
      compliance: 91.6,
      specialization: "Coastal",
    },
    {
      name: "Clallam",
      region: "Peninsula & Coast",
      status: "Staging",
      nodeType: "Edge",
      appraisers: 15,
      properties: 789,
      compliance: 92.3,
      specialization: "Peninsula",
    },
    {
      name: "Mason",
      region: "Peninsula & Coast",
      status: "Staging",
      nodeType: "Edge",
      appraisers: 12,
      properties: 654,
      compliance: 91.8,
    },

    // Additional counties to complete all 39
    {
      name: "Okanogan",
      region: "Central WA",
      status: "Syncing",
      nodeType: "Edge",
      appraisers: 13,
      properties: 678,
      compliance: 90.8,
      specialization: "Remote",
    },
    {
      name: "Ferry",
      region: "Central WA",
      status: "Syncing",
      nodeType: "Light",
      appraisers: 4,
      properties: 234,
      compliance: 89.7,
    },
    {
      name: "Stevens",
      region: "Central WA",
      status: "Syncing",
      nodeType: "Edge",
      appraisers: 9,
      properties: 456,
      compliance: 90.4,
    },
    {
      name: "Pend Oreille",
      region: "Central WA",
      status: "Syncing",
      nodeType: "Light",
      appraisers: 5,
      properties: 289,
      compliance: 89.2,
    },
    {
      name: "Lincoln",
      region: "Eastern WA",
      status: "Syncing",
      nodeType: "Light",
      appraisers: 4,
      properties: 267,
      compliance: 88.9,
    },
    {
      name: "Adams",
      region: "Eastern WA",
      status: "Syncing",
      nodeType: "Light",
      appraisers: 6,
      properties: 334,
      compliance: 89.6,
    },
    {
      name: "Spokane",
      region: "Eastern WA",
      status: "Active",
      nodeType: "Regional",
      appraisers: 67,
      properties: 3456,
      compliance: 95.7,
      specialization: "Urban Regional",
    },
    {
      name: "Kitsap",
      region: "Puget Metro",
      status: "Active",
      nodeType: "Regional",
      appraisers: 42,
      properties: 2134,
      compliance: 94.8,
      specialization: "Naval",
    },
    {
      name: "Skamania",
      region: "Southwest WA",
      status: "Queued",
      nodeType: "Light",
      appraisers: 5,
      properties: 289,
      compliance: 87.3,
    },
  ];

  const regions = [
    "Eastern WA",
    "Central WA",
    "Puget Metro",
    "Northwest WA",
    "Southwest WA",
    "Peninsula & Coast",
  ];

  const filteredCounties =
    selectedRegion === "all"
      ? waCounties
      : waCounties.filter((county) => county.region === selectedRegion);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-green-100 text-green-800";
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "Staging":
        return "bg-yellow-100 text-yellow-800";
      case "Syncing":
        return "bg-purple-100 text-purple-800";
      case "Queued":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Live":
        return <CheckCircle className="w-4 h-4" />;
      case "Active":
        return <Zap className="w-4 h-4" />;
      case "Staging":
        return <Clock className="w-4 h-4" />;
      case "Syncing":
        return <AlertCircle className="w-4 h-4" />;
      case "Queued":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalAppraisers = waCounties.reduce((sum, county) => sum + county.appraisers, 0);
  const totalProperties = waCounties.reduce((sum, county) => sum + county.properties, 0);
  const averageCompliance =
    waCounties.reduce((sum, county) => sum + county.compliance, 0) / waCounties.length;

  const statusCounts = {
    live: waCounties.filter((c) => c.status === "Live").length,
    active: waCounties.filter((c) => c.status === "Active").length,
    staging: waCounties.filter((c) => c.status === "Staging").length,
    syncing: waCounties.filter((c) => c.status === "Syncing").length,
    queued: waCounties.filter((c) => c.status === "Queued").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Globe className="w-8 h-8 text-blue-600" />
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">Washington State Deployment</h1>
          <p
</> className="text-gray-600">Complete Terrafusion coverage across all 39 counties</p>
        </div>
      </div>

      {/* Statewide Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Counties</CardTitle>
            <MapPin
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">39</div>
            <p
</> className="text-xs text-muted-foreground">Complete WA coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Active Appraisers</CardTitle>
            <Users
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{totalAppraisers.toLocaleString()}</div>
            <p
</> className="text-xs text-muted-foreground">Statewide network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Properties Tracked</CardTitle>
            <Building
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{totalProperties.toLocaleString()}</div>
            <p
</> className="text-xs text-muted-foreground">All property types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <Shield
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{averageCompliance.toFixed(1)}%</div>
            <p
</> className="text-xs text-muted-foreground">Statewide standard</p>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Status Overview */}
      <Card>
        <CardHeader><>

          <CardTitle>Deployment Status Overview</CardTitle>
          <CardDescription
</>>Regional rollout progress across Washington State</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center"><>

              <div className="text-2xl font-bold text-green-600">{statusCounts.live}</div>
              <div
</> className="text-sm text-gray-600">Live</div>
            </div>
            <div className="text-center"><>

              <div className="text-2xl font-bold text-blue-600">{statusCounts.active}</div>
              <div
</> className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center"><>

              <div className="text-2xl font-bold text-yellow-600">{statusCounts.staging}</div>
              <div
</> className="text-sm text-gray-600">Staging</div>
            </div>
            <div className="text-center"><>

              <div className="text-2xl font-bold text-purple-600">{statusCounts.syncing}</div>
              <div
</> className="text-sm text-gray-600">Syncing</div>
            </div>
            <div className="text-center"><>

              <div className="text-2xl font-bold text-gray-600">{statusCounts.queued}</div>
              <div
</> className="text-sm text-gray-600">Queued</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2"><>

              <span>Overall Deployment Progress</span>
              <span
</>>
                {Math.round(((statusCounts.live + statusCounts.active) / 39) * 100)}% Complete
              </span>
            </div>
            <Progress
              value={((statusCounts.live + statusCounts.active) / 39) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedRegion === "all" ? "default" : "outline"}
          onClick={() => setSelectedRegion("all")}
        >
          All Regions
        </Button>
        {regions.map((region) => (
          <Button
            key={region}
            variant={selectedRegion === region ? "default" : "outline"}
            onClick={() => setSelectedRegion(region)}
          >
            {region}
          </Button>
        ))}
      </div>

      {/* County Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCounties.map((county) => (
          <Card key={county.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between"><>

                <CardTitle className="text-lg">{county.name} County</CardTitle>
                <Badge
</> className={getStatusColor(county.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(county.status)}
                    <span>{county.status}</span>
                  </div>
                </Badge>
              </div>
              <CardDescription>
                {county.region} • {county.nodeType} Node
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><>

                  <span>Appraisers:</span>
                  <span
</> className="font-medium">{county.appraisers}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span>Properties:</span>
                  <span
</> className="font-medium">{county.properties.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span>Compliance:</span>
                  <span
</> className="font-medium">{county.compliance}%</span>
                </div>
                {county.specialization && (
                  <div className="flex justify-between text-sm"><>

                    <span>Specialization:</span>
                    <span
</> className="font-medium text-blue-600">{county.specialization}</span>
                  </div>
                )}
                <Progress value={county.compliance} className="h-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Actions */}
      <Card>
        <CardHeader><>

          <CardTitle>Statewide Operations</CardTitle>
          <CardDescription
</>>Manage Washington State Terrafusion deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap"><>

            <Button>Simulate WA Form Flow Statewide</Button>
            <Button
</> variant="outline">Generate WA Showcase Portal Package</Button><>

            <Button variant="outline">Tune Agents for 2025 UAD Spec</Button>
            <Button
</> variant="outline">Begin Expansion to Oregon</Button>
            <Button variant="outline">Launch Interstate Mesh Network</Button>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div><>

                <h4 className="font-medium text-green-900">Washington State Deployment Complete</h4>
                <p
</> className="text-sm text-green-700 mt-1">
                  Terrafusion sovereign valuation infrastructure successfully deployed across all 39
                  counties. System is operational with {totalAppraisers.toLocaleString()} appraisers
                  managing {totalProperties.toLocaleString()} properties.
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-green-600"><>

                  <span>• 72,113+ verifiable appraisal forms on ledger</span>
                  <span
</>>• 98,391 NFT comp records minted</span><>

                  <span>• 2,127 MyAgent profiles active</span>
                  <span
</>>• 34,088 DAO votes recorded</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
