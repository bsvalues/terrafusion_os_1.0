import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Shield, Hash, FileText, ExternalLink  } from '@mui/icons-material';

interface LedgerEntry {
  id: string;
  appraisalId: string;
  signature: string;
  hash: string;
  timestamp: Date;
  appraiser: string;
  propertyAddress: string;
  value: number;
  status: "verified" | "pending" | "disputed";
  nftToken?: string;
}

export default function PublicLedgerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"id" | "signature" | "hash">("id");

  // Mock ledger data - in production this would come from blockchain
  const [ledgerEntries] = useState<LedgerEntry[]>([
    {
      id: "TF-001-2024",
      appraisalId: "URAR-31241-WA",
      signature: "0x9823f4d2a1b8c5e7f9d0e3a6b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5",
      hash: "SHA256:d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7",
      timestamp: new Date("2024-01-15T10:30:00Z"),
      appraiser: "Sarah Chen, SRA",
      propertyAddress: "406 Stardust Ct, Grandview, WA 98930",
      value: 485000,
      status: "verified",
      nftToken: "TF-COMP-0x9823f",
    },
    {
      id: "TF-002-2024",
      appraisalId: "URAR-31242-WA",
      signature: "0xa1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4",
      hash: "SHA256:f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3",
      timestamp: new Date("2024-01-14T14:45:00Z"),
      appraiser: "Michael Rodriguez, MAI",
      propertyAddress: "1247 Oak Ridge Dr, Seattle, WA 98105",
      value: 750000,
      status: "verified",
    },
    {
      id: "TF-003-2024",
      appraisalId: "URAR-31243-WA",
      signature: "0xb2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5",
      hash: "SHA256:a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6",
      timestamp: new Date("2024-01-13T09:15:00Z"),
      appraiser: "Jennifer Walsh, SRA",
      propertyAddress: "2156 Pine Ave, Tacoma, WA 98402",
      value: 425000,
      status: "pending",
    },
  ]);

  const filteredEntries = ledgerEntries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    switch (searchType) {
      case "id":
        return (
          entry.id.toLowerCase().includes(query) || entry.appraisalId.toLowerCase().includes(query)
        );
      case "signature":
        return entry.signature.toLowerCase().includes(query);
      case "hash":
        return entry.hash.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "disputed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold">Public Ledger Explorer</h1>
          <p
</> className="text-muted-foreground">Searchable blockchain-verified appraisal records</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-2" />
          Cryptographically Verified
        </Badge>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Search className="w-5 h-5" />
            Search Ledger
          </CardTitle>
          <CardDescription
</>>
            Search by Appraisal ID, Cryptographic Signature, or Hash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex gap-2"><>

              <Button
                variant={searchType === "id" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType("id")}
              >
                ID
              </Button>
              <Button
</>
                variant={searchType === "signature" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType("signature")}
              >
                Signature
              </Button>
              <Button
                variant={searchType === "hash" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType("hash")}
              >
                Hash
              </Button>
            </div>
            <Input
              placeholder={`Search by ${searchType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div><>

                  <CardTitle className="text-xl">{entry.id}</CardTitle>
                  <CardDescription
</>>{entry.propertyAddress}</CardDescription>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(entry.status)}>
                    {entry.status.toUpperCase()}
                  </Badge>
                  {entry.nftToken && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        NFT: {entry.nftToken}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><>

                  <p className="text-sm text-muted-foreground">Appraisal ID</p>
                  <p
</> className="font-mono text-sm">{entry.appraisalId}</p>
                </div>
                <div><>

                  <p className="text-sm text-muted-foreground">Appraiser</p>
                  <p
</> className="text-sm">{entry.appraiser}</p>
                </div>
                <div><>

                  <p className="text-sm text-muted-foreground">Appraised Value</p>
                  <p
</> className="text-lg font-bold text-green-600">
                    ${entry.value.toLocaleString()}
                  </p>
                </div>
                <div><>

                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p
</> className="text-sm">{entry.timestamp.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div><>

                  <p className="text-sm text-muted-foreground mb-1">Cryptographic Signature</p>
                  <div
</> className="flex items-center gap-2 p-2 bg-gray-50 rounded font-mono text-xs">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="break-all">{entry.signature}</span>
                  </div>
                </div>

                <div><>

                  <p className="text-sm text-muted-foreground mb-1">SHA256 Hash</p>
                  <div
</> className="flex items-center gap-2 p-2 bg-gray-50 rounded font-mono text-xs">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="break-all">{entry.hash}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm"><>

                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Blockchain
                </Button>
                <Button
</> variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Download TFP Bundle
                </Button>
                {entry.nftToken && (
                  <Button variant="outline" size="sm">
                    View NFT Metadata
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No ledger entries found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
