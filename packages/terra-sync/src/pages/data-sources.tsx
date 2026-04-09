import { useQuery } from "@tanstack/react-query";
import { DataSourceForm } from "@/components/data-source-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DataSource } from "@shared/schema";

export default function DataSources() {
  const sourcesQuery = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"]
  });

  return (
    <div className="container mx-auto p-6 tf-government-badge">
      <h1 className="text-3xl font-bold mb-8 tf-transcendence-glow">Data Sources</h1>

      <div className="grid gap-6 md:grid-cols-2 tf-clarity-gradient">
        <div>
          <h2 className="text-xl font-semibold mb-4 tf-government-badge">Add Data Source</h2>
          <Card className="tf-transcendence-glow">
            <CardContent className="pt-6">
              <DataSourceForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 tf-government-badge">Connected Sources</h2>
          {sourcesQuery.isLoading ? (
            <p className="tf-clarity-gradient">Loading sources...</p>
          ) : sourcesQuery.error ? (
            <p className="text-red-500 tf-transcendence-glow">Error loading sources</p>
          ) : (
            <div className="space-y-4">
              {sourcesQuery.data?.map((source) => (
                <Card key={source.id} className="tf-government-badge">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="tf-transcendence-glow">{source.name}</CardTitle>
                      <Badge className="tf-clarity-gradient">{source.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-2 rounded tf-government-badge">
                      {JSON.stringify(source.config, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
