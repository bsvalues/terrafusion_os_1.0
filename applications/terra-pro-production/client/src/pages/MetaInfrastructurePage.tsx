import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Cpu,
  Plane,
  TrendingUp,
  Shield,
  MapPin,
  Coins,
  Activity,
  Zap,
  Globe,
  Users,
 } from '@mui/icons-material';

interface SystemStatus {
  nft: { configured: boolean; status: string };
  prediction: { status: string };
  drones: {
    totalDrones: number;
    activeDrones: number;
    pendingJobs: number;
    activeJobs: number;
  };
  federation: {
    nodeId: string;
    totalPeers: number;
    onlinePeers: number;
  };
}

interface PredictionResult {
  zipCode: string;
  predictedPricePerSqft: number;
  confidenceInterval: { lower: number; upper: number };
  riskScore: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: Array<{ name: string; impact: number; description: string }>;
}

export default function MetaInfrastructurePage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [predictionInput, setPredictionInput] = useState({ zipCode: "90210" });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [droneJobId, setDroneJobId] = useState<string | null>(null);
  const [nftResult, setNftResult] = useState<any>(null);
  const [loading, setLoading] = useState({
    status: false,
    prediction: false,
    drone: false,
    nft: false,
  });

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    setLoading((prev) => ({ ...prev, status: true }));
    try {
      const response = await fetch("/api/meta/status");
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error("Failed to fetch system status:", error);
    } finally {
      setLoading((prev) => ({ ...prev, status: false }));
    }
  };

  const generatePrediction = async () => {
    setLoading((prev) => ({ ...prev, prediction: true }));
    try {
      const response = await fetch("/api/meta/predict/zipcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: predictionInput.zipCode,
          features: {
            averageGLA: 1850,
            medianPrice: 450000,
            salesVolume: 75,
            daysOnMarket: 28,
            pricePerSqft: 280,
            zoningMix: { R1: 0.6, R2: 0.3, C1: 0.1 },
            neighboringZipTrends: {},
          },
        }),
      });
      const data = await response.json();
      setPrediction(data.prediction);
    } catch (error) {
      console.error("Failed to generate prediction:", error);
    } finally {
      setLoading((prev) => ({ ...prev, prediction: false }));
    }
  };

  const requestDroneScan = async () => {
    setLoading((prev) => ({ ...prev, drone: true }));
    try {
      const response = await fetch("/api/meta/drones/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: predictionInput.zipCode,
          coordinates: { lat: 34.0522, lng: -118.2437 },
          requirements: ["ocr", "camera"],
        }),
      });
      const data = await response.json();
      setDroneJobId(data.jobId);
    } catch (error) {
      console.error("Failed to request drone scan:", error);
    } finally {
      setLoading((prev) => ({ ...prev, drone: false }));
    }
  };

  const mintNFT = async () => {
    setLoading((prev) => ({ ...prev, nft: true }));
    try {
      const response = await fetch("/api/meta/nft/mint/demo_job_123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: "0x742d35Cc6634C0532925a3b8D93Adc9F84C823d5",
          address: "123 Main St",
          salePrice: 450000,
          gla: 1850,
          zipCode: predictionInput.zipCode,
          county: "Los Angeles",
          merkleHash: "hash_demo_123",
        }),
      });
      const data = await response.json();
      setNftResult(data);
    } catch (error) {
      console.error("Failed to mint NFT:", error);
    } finally {
      setLoading((prev) => ({ ...prev, nft: false }));
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "text-green-600";
      case "decreasing":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return "text-red-500";
    if (score > 40) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8"><>

        <h1 className="text-3xl font-bold mb-2">Terrafusion Meta-Infrastructure</h1>
        <p
</> className="text-muted-foreground">
          Autonomous AI-driven property intelligence with blockchain verification, predictive
          modeling, and drone coordination
        </p>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading.status ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div><>

                  <p className="text-sm font-medium">NFT System</p>
                  <p
</> className="text-2xl font-bold">
                    {systemStatus.nft.configured ? "Ready" : "Demo"}
                  </p>
                </div><>

                <Coins className="h-8 w-8 text-blue-500" />
              </div>

              <div
</> className="flex items-center justify-between p-4 rounded-lg border">
                <div><>

                  <p className="text-sm font-medium">Active Drones</p>
                  <p
</> className="text-2xl font-bold">{systemStatus.drones.activeDrones}</p>
                  <p className="text-xs text-muted-foreground">
                    of {systemStatus.drones.totalDrones} total
                  </p>
                </div><>

                <Plane className="h-8 w-8 text-green-500" />
              </div>

              <div
</> className="flex items-center justify-between p-4 rounded-lg border">
                <div><>

                  <p className="text-sm font-medium">Federation Peers</p>
                  <p
</> className="text-2xl font-bold">{systemStatus.federation.onlinePeers}</p>
                  <p className="text-xs text-muted-foreground">
                    of {systemStatus.federation.totalPeers} connected
                  </p>
                </div><>

                <Globe className="h-8 w-8 text-purple-500" />
              </div>

              <div
</> className="flex items-center justify-between p-4 rounded-lg border">
                <div><>

                  <p className="text-sm font-medium">Prediction Engine</p>
                  <p
</> className="text-2xl font-bold">Active</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to load system status</p>
          )}

          <div className="mt-4">
            <Button onClick={fetchSystemStatus} variant="outline" size="sm">
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="prediction" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="prediction">AI Prediction</TabsTrigger>
          <TabsTrigger
</> value="drones">Drone Fleet</TabsTrigger><>

          <TabsTrigger value="nft">NFT Minting</TabsTrigger>
          <TabsTrigger
</> value="federation">Federation</TabsTrigger>
        </TabsList>

        {/* AI Prediction Tab */}
        <TabsContent value="prediction">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <TrendingUp className="h-5 w-5" />
                Predictive Price Modeling
              </CardTitle>
              <CardDescription
</>>
                Generate AI-powered market predictions and risk assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1"><>

                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
</>
                    id="zipCode"
                    value={predictionInput.zipCode}
                    onChange={(e) => setPredictionInput({ zipCode: e.target.value })}
                    placeholder="Enter ZIP code"
                  />
                </div>
                <Button
                  onClick={generatePrediction}
                  disabled={loading.prediction}
                  className="flex items-center gap-2"
                >
                  {loading.prediction && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Generate Prediction
                </Button>
              </div>

              {prediction && (
                <div className="mt-6 p-4 border rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center"><>

                      <p className="text-sm text-muted-foreground">Predicted Price/sqft</p>
                      <p
</> className="text-2xl font-bold">${prediction.predictedPricePerSqft}</p>
                      <p className="text-xs text-muted-foreground">
                        Range: ${prediction.confidenceInterval.lower} - $
                        {prediction.confidenceInterval.upper}
                      </p>
                    </div>
                    <div className="text-center"><>

                      <p className="text-sm text-muted-foreground">Market Trend</p>
                      <p
</>
                        className={`text-2xl font-bold capitalize ${getTrendColor(prediction.trend)}`}
                      >
                        {prediction.trend}
                      </p>
                    </div>
                    <div className="text-center"><>

                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <p
</> className={`text-2xl font-bold ${getRiskColor(prediction.riskScore)}`}>
                        {prediction.riskScore}/100
                      </p>
                      <Progress value={prediction.riskScore} className="mt-2" />
                    </div>
                  </div>

                  <Separator />

                  <div><>

                    <h4 className="font-semibold mb-2">Key Factors</h4>
                    <div
</> className="space-y-2">
                      {prediction.factors.map((factor /* , index */) => (
                        <div key={index} className="flex justify-between items-center"><>

                          <span className="text-sm">{factor.name}</span>
                          <div
</> className="flex items-center gap-2"><>

                            <span
                              className={`text-sm ${factor.impact > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {factor.impact > 0 ? "+" : ""}
                              {(factor.impact * 100).toFixed(1)}%
                            </span>
                            <span
</> className="text-xs text-muted-foreground">
                              {factor.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drone Fleet Tab */}
        <TabsContent value="drones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Plane className="h-5 w-5" />
                Autonomous Drone Fleet
              </CardTitle>
              <CardDescription
</>>Deploy drones for property scanning and measurement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={requestDroneScan}
                  disabled={loading.drone}
                  className="flex items-center gap-2"
                >
                  {loading.drone && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <MapPin className="h-4 w-4" />
                  Request Property Scan
                </Button>
              </div>

              {droneJobId && (
                <div className="p-4 border rounded-lg"><>

                  <h4 className="font-semibold mb-2">Drone Job Created</h4>
                  <p
</> className="text-sm text-muted-foreground">Job ID: {droneJobId}</p>
                  <Badge variant="secondary" className="mt-2">
                    In Progress
                  </Badge>
                </div>
              )}

              {systemStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg"><>

                    <h4 className="font-semibold mb-2">Fleet Status</h4>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between"><>

                        <span>Total Drones:</span>
                        <span
</>>{systemStatus.drones.totalDrones}</span>
                      </div>
                      <div className="flex justify-between"><>

                        <span>Active Missions:</span>
                        <span
</>>{systemStatus.drones.activeJobs}</span>
                      </div>
                      <div className="flex justify-between"><>

                        <span>Pending Jobs:</span>
                        <span
</>>{systemStatus.drones.pendingJobs}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg"><>

                    <h4 className="font-semibold mb-2">Capabilities</h4>
                    <div
</> className="space-y-2"><>

                      <Badge variant="outline">OCR Document Scanning</Badge>
                      <Badge
</> variant="outline">LiDAR Measurements</Badge><>

                      <Badge variant="outline">GPS Navigation</Badge>
                      <Badge
</> variant="outline">HD Photography</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Minting Tab */}
        <TabsContent value="nft">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Coins className="h-5 w-5" />
                Comp NFT Minting
              </CardTitle>
              <CardDescription
</>>
                Mint blockchain-verified NFTs for property comparables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50"><>

                <h4 className="font-semibold mb-2">Demo NFT Minting</h4>
                <p
</> className="text-sm text-muted-foreground mb-4">
                  This creates a demonstration NFT with mock blockchain interaction. For production
                  use, configure blockchain credentials.
                </p>
                <Button
                  onClick={mintNFT}
                  disabled={loading.nft}
                  className="flex items-center gap-2"
                >
                  {loading.nft && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Mint Demo NFT
                </Button>
              </div>

              {nftResult && (
                <div className="p-4 border rounded-lg"><>

                  <h4 className="font-semibold mb-2">NFT Minted Successfully</h4>
                  <div
</> className="space-y-2">
                    <div className="flex justify-between"><>

                      <span>Token ID:</span>
                      <span
</> className="font-mono">{nftResult.tokenId}</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span>Transaction:</span>
                      <span
</> className="font-mono text-xs">{nftResult.transactionHash}</span>
                    </div>
                  </div>
                  <Badge variant="default" className="mt-2">
                    Verified
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Federation Tab */}
        <TabsContent value="federation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Shield className="h-5 w-5" />
                Zero-Trust Mesh Federation
              </CardTitle>
              <CardDescription
</>>
                Secure multi-county data sharing with cryptographic verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg"><>

                    <h4 className="font-semibold mb-2">Node Information</h4>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between"><>

                        <span>Node ID:</span>
                        <span
</> className="font-mono text-xs">{systemStatus.federation.nodeId}</span>
                      </div>
                      <div className="flex justify-between"><>

                        <span>Online Peers:</span>
                        <span
</>>{systemStatus.federation.onlinePeers}</span>
                      </div>
                      <div className="flex justify-between"><>

                        <span>Total Peers:</span>
                        <span
</>>{systemStatus.federation.totalPeers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg"><>

                    <h4 className="font-semibold mb-2">Security Features</h4>
                    <div
</> className="space-y-2"><>

                      <Badge variant="outline">mTLS Authentication</Badge>
                      <Badge
</> variant="outline">AES256-GCM Encryption</Badge><>

                      <Badge variant="outline">RSA Signatures</Badge>
                      <Badge
</> variant="outline">Certificate Verification</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
