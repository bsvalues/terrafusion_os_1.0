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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Data Sources</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add Data Source</h2>
          <Card>
            <CardContent className="pt-6">
              <DataSourceForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Connected Sources</h2>
          {sourcesQuery.isLoading ? (
            <p>Loading sources...</p>
          ) : sourcesQuery.error ? (
            <p>Error loading sources</p>
          ) : (
            <div className="space-y-4">
              {sourcesQuery.data?.map((source) => (
                <Card key={source.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{source.name}</CardTitle>
                      <Badge>{source.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-2 rounded">
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
