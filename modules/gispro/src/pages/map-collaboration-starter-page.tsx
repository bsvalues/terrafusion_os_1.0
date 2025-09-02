import React from 'react';
import { CollaborationMapStarter } from '@/components/maps/collaborative/collaboration-map-starter';

/**
 * Map Collaboration Starter Page
 * 
 * This page allows users to start or join a collaborative map session.
 */
export function MapCollaborationStarterPage() {
  // Set the document title directly instead of using Helmet
  React.useEffect(() => {
    document.title = 'Map Collaboration Starter - BentonGeoPro';
  }, []);
  
  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="mb-4"><>

        <h1 className="text-2xl font-bold">Map Collaboration Starter</h1>
        <p
</> className="text-muted-foreground">
          Start or join a collaborative map session with other users
        </p>
      </div>
      
      <div className="bg-card rounded-lg shadow-md overflow-hidden h-[calc(100%-4rem)]">
        <CollaborationMapStarter />
      </div>
    </div>
  );
}

export default MapCollaborationStarterPage;