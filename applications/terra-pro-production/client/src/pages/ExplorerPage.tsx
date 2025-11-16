import { useState } from "react";
import { Search, CheckCircle, Warning, Download, ExternalLink  } from '@mui/icons-material';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VerificationResult {
  job_id: string;
  root_hash: string;
  blockchain_tx_id: string;
  timestamp: string;
  verified: boolean;
  entry_count: number;
  comp_hashes: string[];
  metadata?: {
    county?: string;
    file_count?: number;
    source_formats?: string[];
  };
}

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/explorer?q=${encodeURIComponent(query)}`);

      if (response.status === 404) {
        setError("No records found for this search query");
        return;
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      search();
    }
  };

  const downloadLedger = async () => {
    if (!result) return;

    try {
      const response = await fetch(`/api/audit/export?format=json&jobId=${result.job_id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `terrafusion-audit-${result.job_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const openBlockchainExplorer = () => {
    if (result?.blockchain_tx_id) {
      window.open(`https://etherscan.io/tx/${result.blockchain_tx_id}`, "_blank");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">Terrafusion Explorer</h1>
          <p
</> className="text-gray-600 mt-1">
            Verify cryptographic integrity of property data imports
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Blockchain Verified</span>
        </div>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Search className="h-5 w-5" />
            Search Registry
          </CardTitle>
          <CardDescription
</>>
            Search by Job ID, Transaction Hash, Merkle Root, or Property Address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Job ID, TX Hash, Merkle Root, or Address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={search} disabled={loading || !query.trim()}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1"><>

            <div>Examples:</div>
            <div
</>>• Job ID: job_abc123-def456-ghi789</div><>

            <div>• TX Hash: 0x1a2b3c4d5e6f...</div>
            <div
</>>• Address: 123 Main St, Seattle, WA</div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Warning className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Verification Status */}
          <Card
            className={
              result.verified ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.verified ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Warning className="h-6 w-6 text-yellow-600" />
                  )}
                  <div><>

                    <div className="font-medium">
                      {result.verified ? "Cryptographically Verified" : "Verification Pending"}
                    </div>
                    <div
</> className="text-sm text-gray-600">
                      {result.verified
                        ? "Hash integrity confirmed on blockchain"
                        : "Blockchain confirmation in progress"}
                    </div>
                  </div>
                </div>
                <Badge variant={result.verified ? "default" : "secondary"}>
                  {result.verified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Import Details */}
          <Card>
            <CardHeader>
              <CardTitle>Import Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><>

                  <label className="text-sm font-medium text-gray-700">Job ID</label>
                  <div
</> className="font-mono text-sm bg-gray-100 p-2 rounded">{result.job_id}</div>
                </div>

                <div><>

                  <label className="text-sm font-medium text-gray-700">Records Processed</label>
                  <div
</> className="text-lg font-semibold">{result.entry_count}</div>
                </div>

                <div><>

                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <div
</> className="text-sm">{new Date(result.timestamp).toLocaleString()}</div>
                </div>

                {result.metadata?.county && (
                  <div><>

                    <label className="text-sm font-medium text-gray-700">County</label>
                    <div
</> className="text-sm">{result.metadata.county}</div>
                  </div>
                )}
              </div>

              {result.metadata?.source_formats && (
                <div><>

                  <label className="text-sm font-medium text-gray-700">Source Formats</label>
                  <div
</> className="flex gap-2 mt-1">
                    {result.metadata.source_formats.map((format /* , index */) => (
                      <Badge key={index} variant="outline">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cryptographic Proof */}
          <Card>
            <CardHeader>
              <CardTitle>Cryptographic Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><>

                <label className="text-sm font-medium text-gray-700">Merkle Root Hash</label>
                <div
</> className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {result.root_hash}
                </div>
              </div>

              <div><>

                <label className="text-sm font-medium text-gray-700">Blockchain Transaction</label>
                <div
</> className="flex items-center gap-2"><>

                  <div className="font-mono text-xs bg-gray-100 p-2 rounded flex-1 break-all">
                    {result.blockchain_tx_id}
                  </div>
                  <Button
</> variant="outline" size="sm" onClick={openBlockchainExplorer}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div><>

                <label className="text-sm font-medium text-gray-700">
                  Individual Record Hashes ({result.comp_hashes.length})
                </label>
                <div
</> className="max-h-32 overflow-y-auto bg-gray-100 p-2 rounded">
                  {result.comp_hashes.map((hash /* , index */) => (
                    <div
                      key={index}
                      className="font-mono text-xs py-1 border-b border-gray-200 last:border-b-0"
                    >
                      {hash}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={downloadLedger}><>

                  <Download className="h-4 w-4 mr-2" />
                  Download Audit Report
                </Button>
                <Button
</> variant="outline" onClick={openBlockchainExplorer}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Blockchain
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
