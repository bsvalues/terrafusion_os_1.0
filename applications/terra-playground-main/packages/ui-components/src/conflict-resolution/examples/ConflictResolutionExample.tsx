/**
 * Conflict Resolution Example
 *
 * Example component for demonstrating conflict resolution.
 */

import React, { useState } from 'react';
import { ConflictManager } from '../ConflictManager';
import { ResolutionStrategy } from '@terrafusion/offline-sync/src/conflict-resolution';

/**
 * Example property data
 */
const exampleLocalData = {
  id: 'property-123',
  address: '123 Main St',
  owner: 'John Doe',
  value: 350000,
  lastInspection: '2025-01-15',
  features: ['3 bedrooms', '2 baths', 'garage'],
  notes: 'This property has been well-maintained.',
};

/**
 * Example remote data
 */
const exampleRemoteData = {
  id: 'property-123',
  address: '123 Main Street',
  owner: 'John A. Doe',
  value: 375000,
  lastInspection: '2025-02-20',
  features: ['3 bedrooms', '2 bathrooms', 'attached garage', 'updated kitchen'],
  notes: 'This property has been well-maintained. Recent kitchen renovation adds value.',
};

/**
 * Example component props
 */
export interface ConflictResolutionExampleProps {
  /**
   * User ID
   */
  userId?: string;
}

/**
 * Example component
 */
export const ConflictResolutionExample: React.FC<ConflictResolutionExampleProps> = ({
  userId = 'user-123',
}) => {
  // Resolved data
  const [resolvedData, setResolvedData] = useState<any>(null);

  // Is resolved
  const [isResolved, setIsResolved] = useState(false);

  // Handle resolve
  const handleResolve = (data: any) => {
    setResolvedData(data);
    setIsResolved(true);
  };

  // Handle reset
  const handleReset = () => {
    setResolvedData(null);
    setIsResolved(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg">
<>
        <h2 className="text-xl font-bold mb-2">Conflict Resolution Example</h2>
        <p
</> className="text-muted-foreground">
          This example demonstrates how the conflict resolution UI works. It allows users to compare
          and merge conflicting versions of property data.
        </p>
      </div>

      {!isResolved ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-card p-4 border-b">
<>
            <h3 className="text-lg font-semibold">Property Conflict</h3>
            <p
</> className="text-muted-foreground text-sm">
              The property data has been modified both locally and remotely. Please resolve the
              conflict.
            </p>
          </div>

          <div className="p-4">
            <ConflictManager
              conflictId="property-123"
              local={exampleLocalData}
              remote={exampleRemoteData}
              userId={userId}
              onResolve={handleResolve}
            />
          </div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-card p-4 border-b">
<>
            <h3 className="text-lg font-semibold text-green-600">Conflict Resolved</h3>
            <p
</> className="text-muted-foreground text-sm">
              The conflict has been successfully resolved with the following data:
            </p>
          </div>

          <div className="p-4">
<>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">
              {JSON.stringify(resolvedData, null, 2)}
            </pre>

            <div
</> className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Reset Example
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictResolutionExample;
