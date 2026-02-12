
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export function UsageChart() {
  const usageQuery = useQuery({
    queryKey: ["/api/analytics/usage"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/usage");
      return res.json();
    }
  });

  const data = usageQuery.data ?? [];

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>File Usage Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              files: { theme: { light: "#0097FB", dark: "#0097FB" } },
              queries: { theme: { light: "#10B981", dark: "#10B981" } }
            }}
          >
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip />
              <Bar dataKey="files" name="Files Processed" />
              <Bar dataKey="queries" name="RAG Queries" />
            </RechartsBarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
