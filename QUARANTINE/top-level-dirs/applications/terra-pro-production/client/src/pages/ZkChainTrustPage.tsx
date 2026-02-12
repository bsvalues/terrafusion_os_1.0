import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield,
  Lock,
  Eye,
  CheckCircle,
  Warning,
  Hash,
  Database,
  Activity,
  Clock,
  Users,
 } from '@mui/icons-material';

interface ProofRecord {
  id: string;
  type: "Comp Override" | "Agent Insertion" | "Zoning Prediction" | "Valuation Adjustment";
  propertyId: string;
  timestamp: string;
  zkProofHash: string;
  verificationStatus: "Verified" | "Pending" | "Failed";
  auditorAccess: boolean;
  dataPrivacy: "Protected" | "Public" | "Restricted";
  rollupBatch: string;
}

interface AuditTrail {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  justification: string;
  proofHash: string;
  sensitiveDataMasked: boolean;
}

interface ZkMetrics {
  totalProofs: number;
  verifiedProofs: number;
  rollupBatches: number;
  compressionRatio: number;
  auditorVerifications: number;
  privacyPreservingQueries: number;
}

export default function ZkChainTrustPage() {
  const [selectedRecord, setSelectedRecord] = useState<string>("");
  const [verificationMode, setVerificationMode] = useState<"auditor" | "public">("public");

  const recentProofs: ProofRecord[] = [
    {
      id: "ZK-001847",
      type: "Comp Override",
      propertyId: "PROP-98052-1234",
      timestamp: "2025-05-29T23:45:00Z",
      zkProofHash: "zk_9f8e7d6c5b4a3210fedcba9876543210",
      verificationStatus: "Verified",
      auditorAccess: true,
      dataPrivacy: "Protected",
      rollupBatch: "BATCH-20250529-047",
    },
    {
      id: "ZK-001848",
      type: "Agent Insertion",
      propertyId: "PROP-99301-5678",
      timestamp: "2025-05-29T23:42:00Z",
      zkProofHash: "zk_8e7d6c5b4a321098765432109876fedc",
      verificationStatus: "Verified",
      auditorAccess: true,
      dataPrivacy: "Protected",
      rollupBatch: "BATCH-20250529-047",
    },
    {
      id: "ZK-001849",
      type: "Zoning Prediction",
      propertyId: "PROP-98004-9012",
      timestamp: "2025-05-29T23:38:00Z",
      zkProofHash: "zk_7d6c5b4a32109876543210987654321f",
      verificationStatus: "Verified",
      auditorAccess: false,
      dataPrivacy: "Public",
      rollupBatch: "BATCH-20250529-047",
    },
    {
      id: "ZK-001850",
      type: "Valuation Adjustment",
      propertyId: "PROP-98661-3456",
      timestamp: "2025-05-29T23:35:00Z",
      zkProofHash: "zk_6c5b4a321098765432109876543210fe",
      verificationStatus: "Pending",
      auditorAccess: true,
      dataPrivacy: "Restricted",
      rollupBatch: "BATCH-20250529-046",
    },
  ];

  const auditTrails: AuditTrail[] = [
    {
      id: "AUDIT-2847",
      action: "Comparable property override due to unique zoning variance",
      actor: "WA-Appraiser-1247",
      timestamp: "2025-05-29T23:45:00Z",
      justification: "Property has ADU development rights not reflected in standard comps",
      proofHash: "zk_9f8e7d6c5b4a3210fedcba9876543210",
      sensitiveDataMasked: true,
    },
    {
      id: "AUDIT-2848",
      action: "AI agent valuation model insertion for rural property",
      actor: "TF-Agent-Neural-003",
      timestamp: "2025-05-29T23:42:00Z",
      justification: "Water rights valuation requires specialized agricultural model",
      proofHash: "zk_8e7d6c5b4a321098765432109876fedc",
      sensitiveDataMasked: true,
    },
    {
      id: "AUDIT-2849",
      action: "Zoning development probability forecast update",
      actor: "TF-ZoningAI-Core",
      timestamp: "2025-05-29T23:38:00Z",
      justification: "Municipal budget allocation indicates infrastructure investment",
      proofHash: "zk_7d6c5b4a32109876543210987654321f",
      sensitiveDataMasked: false,
    },
  ];

  const zkMetrics: ZkMetrics = {
    totalProofs: 187423,
    verifiedProofs: 186891,
    rollupBatches: 1247,
    compressionRatio: 87.3,
    auditorVerifications: 12847,
    privacyPreservingQueries: 45621,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case "Protected":
        return "bg-blue-100 text-blue-800";
      case "Public":
        return "bg-green-100 text-green-800";
      case "Restricted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const maskHash = (hash: string, show: number = 8) => {
    return `${hash.substring(0, show)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Shield className="w-8 h-8 text-green-600" />
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">zkChain of Trust (ZCT)</h1>
          <p
</> className="text-gray-600">
            Zero-knowledge proof verification for appraisal integrity without data exposure
          </p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Proofs</CardTitle>
            <Hash
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-green-600">
              {zkMetrics.totalProofs.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-blue-600">
              {zkMetrics.verifiedProofs.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">99.7% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Rollup Batches</CardTitle>
            <Database
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-purple-600">{zkMetrics.rollupBatches}</div>
            <p
</> className="text-xs text-muted-foreground">Compressed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Compression</CardTitle>
            <Activity
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-orange-600">{zkMetrics.compressionRatio}%</div>
            <p
</> className="text-xs text-muted-foreground">Efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Auditor Access</CardTitle>
            <Users
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-indigo-600">
              {zkMetrics.auditorVerifications.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">Verifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Privacy Queries</CardTitle>
            <Eye
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-red-600">
              {zkMetrics.privacyPreservingQueries.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">Protected</p>
          </CardContent>
        </Card>
      </div>

      {/* Verification Mode Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2"><>

          <span className="text-sm font-medium">Verification Mode:</span>
          <Button
</>
            variant={verificationMode === "public" ? "default" : "outline"}
            size="sm"
            onClick={() => setVerificationMode("public")}
          ><>

            <Eye className="w-4 h-4 mr-2" />
            Public
          </Button>
          <Button
</>
            variant={verificationMode === "auditor" ? "default" : "outline"}
            size="sm"
            onClick={() => setVerificationMode("auditor")}
          >
            <Shield className="w-4 h-4 mr-2" />
            Auditor
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="proofs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="proofs">ZK Proof Records</TabsTrigger>
          <TabsTrigger
</> value="audit">Audit Trails</TabsTrigger>
          <TabsTrigger value="verification">Verification Center</TabsTrigger>
        </TabsList>

        <TabsContent value="proofs" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Recent Zero-Knowledge Proof Records</CardTitle>
              <CardDescription
</>>
                Cryptographic proofs of appraisal actions without revealing sensitive data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRecord === proof.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedRecord(proof.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3"><>

                          <div className="font-medium">{proof.id}</div>
                          <Badge
</> variant="outline">{proof.type}</Badge><>

                          <Badge className={getStatusColor(proof.verificationStatus)}>
                            {proof.verificationStatus}
                          </Badge>
                          <Badge
</> className={getPrivacyColor(proof.dataPrivacy)}>
                            <Lock className="w-3 h-3 mr-1" />
                            {proof.dataPrivacy}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div><>

                            <span className="text-gray-600">Property ID:</span>
                            <div
</> className="font-medium">{proof.propertyId}</div>
                          </div>
                          <div><>

                            <span className="text-gray-600">ZK Proof Hash:</span>
                            <div
</> className="font-mono text-xs bg-gray-100 p-1 rounded">
                              {verificationMode === "auditor"
                                ? proof.zkProofHash
                                : maskHash(proof.zkProofHash)}
                            </div>
                          </div>
                          <div><>

                            <span className="text-gray-600">Rollup Batch:</span>
                            <div
</> className="font-medium">{proof.rollupBatch}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimestamp(proof.timestamp)}</span>
                          </div>
                          {proof.auditorAccess && (
                            <div className="flex items-center space-x-1">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span>Auditor Accessible</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Cryptographic Audit Trails</CardTitle>
              <CardDescription
</>>
                Full verification paths with privacy-preserving justifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrails.map((trail) => (
                  <div key={trail.id} className="p-4 border rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3"><>

                        <div className="font-medium">{trail.id}</div>
                        <div
</> className="text-sm text-gray-600">by {trail.actor}</div>
                        {trail.sensitiveDataMasked && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Privacy Protected
                          </Badge>
                        )}
                      </div>

                      <div><>

                        <div className="font-medium text-gray-900">{trail.action}</div>
                        <div
</> className="text-sm text-gray-600 mt-1">{trail.justification}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><>

                          <span className="text-gray-600">Timestamp:</span>
                          <div
</>>{formatTimestamp(trail.timestamp)}</div>
                        </div>
                        <div><>

                          <span className="text-gray-600">Proof Hash:</span>
                          <div
</> className="font-mono text-xs bg-gray-100 p-1 rounded">
                            {verificationMode === "auditor"
                              ? trail.proofHash
                              : maskHash(trail.proofHash)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>System Status</CardTitle>
                <CardDescription
</>>ZK-SNARK ledger and rollup health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Proof Generation Rate</span>
                    <span
</>>100%</span>
                  </div><>

                  <Progress value={100} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Verification Success</span>
                    <span
</>>99.7%</span>
                  </div><>

                  <Progress value={99.7} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Rollup Efficiency</span>
                    <span
</>>87.3%</span>
                  </div><>

                  <Progress value={87.3} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Privacy Preservation</span>
                    <span
</>>100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Regulator Dashboard</CardTitle>
                <CardDescription
</>>Compliance verification without data exposure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start"><>

                  <Shield className="w-4 h-4 mr-2" />
                  Enable Regulator Mode
                </Button>
                <Button
</> variant="outline" className="w-full justify-start"><>

                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Comp Integrity
                </Button>
                <Button
</> variant="outline" className="w-full justify-start"><>

                  <Hash className="w-4 h-4 mr-2" />
                  Generate Audit Report
                </Button>
                <Button
</> variant="outline" className="w-full justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Privacy Compliance Check
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-200 bg-green-50">
            <CardHeader><>

              <CardTitle className="text-green-900">ZK-Proof Verification Active</CardTitle>
              <CardDescription
</> className="text-green-700">
                TFLedger v3 operating in zk-rollup mode with on-chain compression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><>

                  <div className="text-green-800 font-medium">100% Proof Compliant</div>
                  <div
</> className="text-green-600">
                    All comp overrides and agent insertions verified
                  </div>
                </div>
                <div><>

                  <div className="text-green-800 font-medium">Regulator Ready</div>
                  <div
</> className="text-green-600">Full audit trail without data leakage</div>
                </div>
                <div><>

                  <div className="text-green-800 font-medium">Privacy Preserved</div>
                  <div
</> className="text-green-600">Sensitive data encrypted in zk-SNARK proofs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
