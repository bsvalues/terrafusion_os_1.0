import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, FileText, Network } from "lucide-react";

export function MetricsCards() {
  const metricsQuery = useQuery({
    queryKey: ["/api/analytics/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/metrics");
      if (!res.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return res.json();
    }
  });

  const metrics = metricsQuery.data ?? {
    totalProcessedFiles: 0,
    avgRagScore: 0,
    transformationCount: 0
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card data-testid="processed-files-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processed Files</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="processed-files-value">
            {metrics.totalProcessedFiles}
          </div>
        </CardContent>
      </Card>
      <Card data-testid="rag-score-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg RAG Score</CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="rag-score-value">
            {metrics.avgRagScore?.toFixed(2) ?? '0.00'}
          </div>
        </CardContent>
      </Card>
      <Card data-testid="transformations-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transformations</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="transformations-value">
            {metrics.transformationCount}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}