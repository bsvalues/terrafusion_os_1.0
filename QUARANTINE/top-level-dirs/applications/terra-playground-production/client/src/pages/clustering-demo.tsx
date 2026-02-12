import { useState } from 'react';
import { Helmet } from 'react-helmet';
import ClusteringDemo from '@/components/gis/ClusteringDemo';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Refresh  } from '@mui/icons-material';
import { Link } from 'wouter';

export default function ClusteringDemoPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get clustering data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/gis/clustering-demo/data'],
    staleTime: 60000,
  });

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <>
      <Helmet>
        <title>Animated Clustering Demo | Terrafusion</title>
      </Helmet>

      <div className="relative h-screen w-full overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/gis">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to GIS
              </Link>
            </Button>

            <h1 className="ml-4 text-xl font-bold">Animated Data Point Clustering</h1>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              <Refresh className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Main Clustering Demo Component */}
        <div className="h-full w-full pt-16">
          <ClusteringDemo />
        </div>
      </div>
    </>
  );
}
