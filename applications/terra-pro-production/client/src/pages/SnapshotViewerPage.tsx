import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { SnapshotViewer } from "@/components/comps/SnapshotViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History  } from '@mui/icons-material';
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function SnapshotViewerPage() {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams<{ propertyId: string }>();
  const propertyId = params?.propertyId;
  const [, navigate] = useLocation();

  // Fetch property data
  useEffect(() => {
    if (!propertyId) {
      setError("No property ID provided");
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const propertyData = await apiRequest<any>(`/api/properties/${propertyId}`);
        setProperty(propertyData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError(err instanceof Error ? err.message : "Failed to load property details");
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Handle navigation back
  const handleBackToProperty = () => {
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    } else {
      navigate("/properties");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" /><>

          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton
</> className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !propertyId) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader
          title="Snapshot History"
          description="View and compare historical snapshots of property data"
          actions={
            <Button onClick={() => navigate("/properties")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Button>
          }
        />
        <Card className="p-6 mt-6 bg-red-50 border-red-200"><>

          <h3 className="text-xl font-semibold text-red-800 mb-2">Error</h3>
          <p
</> className="text-red-700">{error || "No property ID provided"}</p>
          <Button onClick={() => navigate("/properties")} className="mt-4" variant="outline">
            Go to Properties List
          </Button>
        </Card>
      </div>
    );
  }

  const propertyName = property?.address || `Property #${propertyId}`;

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title={`Snapshot History: ${propertyName}`}
        description="View and compare historical snapshots of property data"
        icon={<History className="h-6 w-6" />}
        actions={
          <Button onClick={handleBackToProperty}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Property
          </Button>
        }
      />

      <div className="mt-6">
        <SnapshotViewer propertyId={propertyId} />
      </div>
    </div>
  );
}
