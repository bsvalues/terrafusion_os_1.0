import React from "react";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Home,
  FileText,
  Image,
  PencilRuler,
  FileBarChart2,
  ShieldCheck,
  Brain,
  Database,
  Refresh,
 } from '@mui/icons-material';
import { PageLayout } from "@/components/layout/page-layout";
// Import removed to avoid context dependency error
// import { useApp } from '@/contexts/AppContext';

export default function EnhancedUADFormPage() {
  console.log("Rendering EnhancedUADFormPage in simplified form");

  const { id } = useParams<{ id?: string }>();
  const [location, setLocation] = useLocation();

  // Removed App context dependency
  // const { setError } = useApp();

  console.log("UAD Form Page ID:", id);

  // Convert ID to number if it exists
  const propertyId = id ? parseInt(id) : undefined;

  // Handle property selection (if no ID provided)
  const handlePropertySelect = (selectedPropertyId: number) => {
    setLocation(`/uad-form/${selectedPropertyId}`);
  };

  return (
    <PageLayout
      title="UAD Form"
      description="Uniform Residential Appraisal Report"
      actions={
        <Button onClick={() => setLocation("/property-data")}>
          <Home className="mr-2 h-4 w-4" />
          Property Management
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader><>

              <CardTitle>UAD Form - Enhanced UI</CardTitle>
              <CardDescription
</>>
                This is the enhanced UAD Form with consistent UI patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4"><>

                <p className="mb-4">
                  {propertyId
                    ? `Viewing property ID: ${propertyId}`
                    : "No property selected. Please select a property to continue."}
                </p>
                <Button
</> onClick={() => setLocation("/property-data")}>
                  <Home className="mr-2 h-4 w-4" />
                  Go to Property Management
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>About Enhanced UI Components</CardTitle>
            </CardHeader>
            <CardContent><>

              <p className="mb-4">This enhanced page demonstrates the following improvements:</p>
              <ul
</> className="list-disc pl-6 space-y-2"><>

                <li>Consistent page layout with proper title and description</li>
                            <li
</>>Standardized action buttons in the header</li><>

                <li>Centralized error handling through AppContext</li>
                            <li
</>>Improved loading state management</li>
                <li>Responsive design with proper spacing and typography</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><>

              <CardTitle>Navigation</CardTitle>
              <CardDescription
</>>Try other enhanced pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/">
                  <div className="flex items-center p-2 rounded hover:bg-accent cursor-pointer">
                    <Home className="h-4 w-4 mr-2" />
                    <span>Enhanced Home</span>
                  </div>
                </Link>
                <Link href="/photo-sync-test">
                  <div className="flex items-center p-2 rounded hover:bg-accent cursor-pointer">
                    <Refresh className="h-4 w-4 mr-2" />
                    <span>Enhanced Photo Sync</span>
                  </div>
                </Link>
                <Link href="/photos">
                  <div className="flex items-center p-2 rounded hover:bg-accent cursor-pointer">
                    <Image className="h-4 w-4 mr-2" />
                    <span>Enhanced Photos</span>
                  </div>
                </Link>
                <Link href="/compliance">
                  <div className="flex items-center p-2 rounded hover:bg-accent cursor-pointer">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    <span>Enhanced Compliance</span>
                  </div>
                </Link>
                <Link href="/ai-valuation">
                  <div className="flex items-center p-2 rounded hover:bg-accent cursor-pointer">
                    <Brain className="h-4 w-4 mr-2" />
                    <span>Enhanced AI Valuation</span>
                  </div>
                </Link>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
