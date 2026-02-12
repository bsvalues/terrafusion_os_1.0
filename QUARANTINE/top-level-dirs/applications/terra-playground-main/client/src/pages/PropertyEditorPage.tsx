/**
 * Property Editor Page
 *
 * Page component for the property editor with navigation and layout.
 */

import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { PropertyEditor } from '@/components/property/PropertyEditor';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Save, InfoIcon, Settings  } from '@mui/icons-material';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Property editor page component
 */
export default function PropertyEditorPage() {
  // Get property ID from route params
  const { id } = useParams();

  // Toast hook
  const { toast } = useToast();

  // Default property ID
  const propertyId = id || 'default-property';

  // Current user ID
  const userId = 'user-' + Math.floor(Math.random() * 1000).toString();

  // Handle save
  const handleSave = (data: any) => {
    // Show toast
    toast({
      title: 'Property Saved',
      description: `Property ${data.id} has been saved successfully.`,
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/properties">Properties</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Property</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/properties">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
<>

        <h1 className="text-2xl font-bold mt-4">Edit Property</h1>
        <p
</> className="text-muted-foreground">
          View and update property details with offline support and automatic sync.
        </p>
      </header>

      {/* Main content */}
      <main>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
<>
            <TabsTrigger value="details">Property Details</TabsTrigger>
            <TabsTrigger
</> value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
<>
            <PropertyEditor propertyId={propertyId} userId={userId} onSave={handleSave} />
          </TabsContent>

          <TabsContent
</> value="history">
            <div className="bg-muted rounded-lg p-6 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <InfoIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
<>
                <h3 className="text-xl font-medium mb-2">Property History</h3>
                <p
</> className="text-muted-foreground max-w-md">
                  View the change history and previous versions of this property. Feature coming
                  soon in a future update.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-muted rounded-lg p-6 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
<>
                <h3 className="text-xl font-medium mb-2">Sync Settings</h3>
                <p
</> className="text-muted-foreground max-w-md">
                  Configure synchronization settings, offline data storage, and conflict resolution
                  preferences. Feature coming soon in a future update.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t text-sm text-muted-foreground">
        <div className="flex justify-between items-center">
          <div>
            <p>Terrafusion &copy; 2025</p>
          </div>
          <div>
            <p>
              User ID: <code className="bg-muted px-1 py-0.5 rounded">{userId}</code>
              {' | '}
              Property ID: <code className="bg-muted px-1 py-0.5 rounded">{propertyId}</code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
