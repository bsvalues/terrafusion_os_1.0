import { MetricsCards } from "@/components/analytics/metrics-cards";
import { UsageChart } from "@/components/analytics/usage-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Database, Clock, ArrowRight, FolderOpen, Server } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { File, DataSource } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  
  const filesQuery = useQuery<File[]>({ 
    queryKey: ["/api/files"]
  });

  const sourcesQuery = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"]
  });

  const renderRecentFiles = () => {
    if (filesQuery.isLoading) {
      return Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      ));
    }

    if (filesQuery.error) {
      return (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Error Loading Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was a problem loading your recent files.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (filesQuery.data?.length === 0) {
      return (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>No Files Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't uploaded any files. Upload files to see them here.
            </p>
            <Button onClick={() => navigate("/files")}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Go to File Explorer
            </Button>
          </CardContent>
        </Card>
      );
    }

    return filesQuery.data?.slice(0, 4).map((file) => (
      <Card key={file.id}>
        <CardHeader className="flex flex-row items-start space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1">{file.name}</CardTitle>
            <CardDescription className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {file.type}
              <span className="mx-2">•</span>
              <Clock className="w-3 h-3 mr-1" />
              {new Date(file.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {file.aiSummary ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {file.aiSummary}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No summary available
            </p>
          )}
          {file.category && (
            <Badge variant="secondary" className="mt-2">{file.category}</Badge>
          )}
        </CardContent>
      </Card>
    ));
  };

  const renderDataSources = () => {
    if (sourcesQuery.isLoading) {
      return Array(3).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ));
    }

    if (sourcesQuery.error) {
      return (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Error Loading Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was a problem loading your data sources.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (sourcesQuery.data?.length === 0) {
      return (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>No Data Sources Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't connected any data sources. Connect a data source to see it here.
            </p>
            <Button onClick={() => navigate("/data-sources")}>
              <Database className="w-4 h-4 mr-2" />
              Set Up Data Sources
            </Button>
          </CardContent>
        </Card>
      );
    }

    return sourcesQuery.data?.slice(0, 3).map((source) => (
      <Card key={source.id}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {source.type === 'sql' && <Database className="w-4 h-4 mr-2" />}
            {source.type === 'api' && <Server className="w-4 h-4 mr-2" />}
            {source.type === 'cloud_storage' && <FolderOpen className="w-4 h-4 mr-2" />}
            {source.name}
          </CardTitle>
          <Badge>{source.type}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Status: <span className={source.status === 'active' ? 'text-green-500' : 'text-amber-500'}>
              {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
            </span>
          </p>
          <pre className="text-xs bg-muted p-2 rounded overflow-hidden">
            {JSON.stringify(source.config, null, 2).slice(0, 100)}...
          </pre>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="space-y-8">
        <MetricsCards />

        <div className="grid gap-4 md:grid-cols-4">
          <UsageChart />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Files</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/files")}
              className="text-sm"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {renderRecentFiles()}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Data Sources</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/data-sources")}
              className="text-sm"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderDataSources()}
          </div>
        </div>
      </div>
    </div>
  );
}