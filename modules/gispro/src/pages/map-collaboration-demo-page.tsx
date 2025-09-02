import React from 'react';
import MapCollaborationDemo from '@/components/collaborative/map-collaboration-demo';
import { useTitle } from '@/hooks/use-title';

export default function MapCollaborationDemoPage() {
  useTitle('Map Collaboration Demo | BentonGeoPro');
  
  return (
    <div className="container mx-auto py-8"><>

      <h1 className="text-3xl font-bold mb-6 text-center">Map Collaboration Demo</h1>
      <p
</>
className="text-center mb-8 max-w-3xl mx-auto text-muted-foreground">
        This demo showcases real-time collaboration capabilities on maps using WebSockets. Multiple users 
        can see each other's cursors, drawings, and chat in real-time.
      </p>
      
      <MapCollaborationDemo />
      
      <div className="mt-10 p-4 bg-muted/30 rounded-lg max-w-3xl mx-auto"><>

        <h2 className="text-xl font-semibold mb-3">Map Collaboration Features</h2>
        <ul
</>
className="list-disc pl-5 space-y-2"><>

          <li>Join map-specific collaboration rooms with multiple users</li>
                            <li
</>
</>>See other users' cursor positions in real-time</li><>

          <li>Simulate drawing points, lines, and polygons</li>
                            <li
</>
</>>Chat with other users while viewing the same map</li><>

          <li>View active users in the current room</li>
                            <li
</>
</>>Automatic reconnection on network issues</li>
        </ul>
      </div>
    </div>
  );
}