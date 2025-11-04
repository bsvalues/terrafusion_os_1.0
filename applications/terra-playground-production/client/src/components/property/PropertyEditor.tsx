/**
 * Property Editor
 *
 * Component for editing property data with offline sync and conflict resolution.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { usePropertyDoc } from '@terrafusion/offline-sync/src/hooks';
import { ConflictManager } from '@terrafusion/ui-components/src/conflict-resolution';
import { CRDTDocumentManagerImpl } from '@terrafusion/offline-sync/src/crdt-sync';
import { ConflictResolutionManager } from '@terrafusion/offline-sync/src/conflict-resolution';
import { IndexedDBStorageProvider } from '@terrafusion/offline-sync/src/storage';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2  } from '@mui/icons-material';
import { PropertyForm } from './PropertyForm';

/**
 * Property editor props interface
 */
export interface PropertyEditorProps {
  /**
   * Property ID
   */
  propertyId: string;

  /**
   * API endpoint
   */
  apiEndpoint?: string;

  /**
   * User ID
   */
  userId?: string;

  /**
   * On save callback
   */
  onSave?: (data: any) => void;
}

/**
 * Property editor component
 */
export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  propertyId,
  apiEndpoint = '/api/sync',
  userId = 'anonymous',
  onSave,
}) => {
  // CRDT document manager
  const [crdtManager] = useState(() => new CRDTDocumentManagerImpl());

  // Conflict resolution manager
  const [conflictManager] = useState(() => new ConflictResolutionManager());

  // Storage provider
  const [storageProvider] = useState(() => new IndexedDBStorageProvider());

  // Initialize storage provider
  useEffect(() => {
    storageProvider.initialize();
  }, [storageProvider]);

  // Use property document hook
  const {
    local,
    remote,
    shared,
    isLoading,
    error,
    syncStatus,
    hasConflict,
    updateLocal,
    debouncedUpdate,
    syncWithRemote,
    resolveConflict,
    resetError,
  } = usePropertyDoc(propertyId, crdtManager, conflictManager, {
    autoSync: true,
    autoSyncInterval: 30000, // 30 seconds
    userId,
    apiEndpoint,
  });

  // Handle property change
  const handlePropertyChange = (data: any) => {
    debouncedUpdate(data);
  };

  // Handle sync request
  const handleSyncRequest = () => {
    syncWithRemote();
  };

  // Handle conflict resolution
  const handleResolveConflict = (resolved: any) => {
    resolveConflict(resolved);

    // Call onSave callback
    if (onSave) {
      onSave(resolved);
    }
  };

  // Handle property save
  const handlePropertySave = () => {
    // Call onSave callback
    if (onSave) {
      onSave(local);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" /><>

          <AlertTitle>Error</AlertTitle>
          <AlertDescription
</>>{error.message}</AlertDescription>
          <Button variant="outline" size="sm" onClick={resetError} className="mt-2">
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading property data...</span>
        </div>
      )}

      {/* Conflict resolution */}
      {hasConflict && remote && (
        <Card className="border-yellow-300 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-600 dark:text-yellow-400"><>

              <AlertCircle className="mr-2 h-5 w-5" />
              Conflict Detected
            </CardTitle>
            <CardDescription
</>>
              The property data has been modified remotely. Please resolve the conflict.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConflictManager
              conflictId={propertyId}
              local={local}
              remote={remote}
              onResolve={handleResolveConflict}
              userId={userId}
            />
          </CardContent>
        </Card>
      )}

      {/* Property form */}
      {!isLoading && (
        <Card>
          <CardHeader><>

            <CardTitle>Edit Property</CardTitle>
            <CardDescription
</>>
              Update property details below. Changes are automatically saved locally and synced when
              online.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropertyForm
              data={hasConflict ? local : shared}
              isLoading={isLoading}
              syncStatus={syncStatus}
              onChange={handlePropertyChange}
              onSyncRequest={handleSyncRequest}
            />

            <div className="mt-6 flex justify-end">
              <Button onClick={handlePropertySave} disabled={isLoading || hasConflict}>
                Save Property
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
