/**
 * Property Form
 *
 * Form for editing property data.
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import { SyncStatus } from '@terrafusion/offline-sync/src/crdt-sync';
import { PropertyDocState } from '@terrafusion/offline-sync/src/hooks/usePropertyDoc';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Cloud, CloudOff, Refresh  } from '@mui/icons-material';

/**
 * Property form props interface
 */
export interface PropertyFormProps {
  /**
   * Property data
   */
  data: PropertyDocState;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Sync status
   */
  syncStatus?: SyncStatus;

  /**
   * On change callback
   */
  onChange?: (data: Partial<PropertyDocState>) => void;

  /**
   * On sync request callback
   */
  onSyncRequest?: () => void;
}

/**
 * Property form component
 */
export const PropertyForm: React.FC<PropertyFormProps> = ({
  data,
  isLoading = false,
  syncStatus = SyncStatus.UNSYNCED,
  onChange,
  onSyncRequest,
}) => {
  // Local state to track form values
  const [formValues, setFormValues] = useState<Partial<PropertyDocState>>({});

  // Update form values when data changes
  useEffect(() => {
    setFormValues(data);
  }, [data]);

  // Handle field change
  const handleChange = (field: keyof PropertyDocState, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));

    // Call onChange callback
    if (onChange) {
      onChange({
        [field]: value,
      });
    }
  };

  // Handle feature change
  const handleFeaturesChange = (value: string) => {
    // Split by commas and trim
    const features = value
      .split(',')
      .map(feature => feature.trim())
      .filter(Boolean);

    setFormValues(prev => ({
      ...prev,
      features,
    }));

    // Call onChange callback
    if (onChange) {
      onChange({
        features,
      });
    }
  };

  // Handle sync request
  const handleSyncRequest = () => {
    if (onSyncRequest) {
      onSyncRequest();
    }
  };

  // Get features string
  const featuresString = formValues.features?.join(', ') || '';

  // Get sync status badge
  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Synced
          </Badge>
        );
      case SyncStatus.SYNCING:
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
          >
            <Refresh className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case SyncStatus.FAILED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Sync Failed
          </Badge>
        );
      case SyncStatus.CONFLICT:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Conflict
          </Badge>
        );
      case SyncStatus.UNSYNCED:
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1"
          >
            <CloudOff className="h-3 w-3" />
            Unsynced
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><>

        <h2 className="text-lg font-semibold">Property Details</h2>
        <div
</> className="flex gap-2 items-center">
          {getSyncStatusBadge()}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncRequest}
            disabled={isLoading || syncStatus === SyncStatus.SYNCING}
            className="flex items-center gap-1"
          >
            <Cloud className="h-4 w-4" />
            {syncStatus === SyncStatus.SYNCING ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      <Form>
        <div className="space-y-4">
          {/* Property ID - Read-only */}
          <FormField
            name="id"
            render={() => (
              <FormItem><>

                <FormLabel>Property ID</FormLabel>
                <FormControl
</>>
                  <Input value={formValues.id || ''} readOnly disabled />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            name="address"
            render={() => (
              <FormItem><>

                <FormLabel>Address</FormLabel>
                <FormControl
</>>
                  <Input
                    value={formValues.address || ''}
                    onChange={e => handleChange('address', e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter property address"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Owner */}
          <FormField
            name="owner"
            render={() => (
              <FormItem><>

                <FormLabel>Owner</FormLabel>
                <FormControl
</>>
                  <Input
                    value={formValues.owner || ''}
                    onChange={e => handleChange('owner', e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter property owner"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Value */}
          <FormField
            name="value"
            render={() => (
              <FormItem><>

                <FormLabel>Value</FormLabel>
                <FormControl
</>>
                  <Input
                    type="number"
                    value={formValues.value || ''}
                    onChange={e => handleChange('value', e.target.valueAsNumber)}
                    disabled={isLoading}
                    placeholder="Enter property value"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Last Inspection */}
          <FormField
            name="lastInspection"
            render={() => (
              <FormItem><>

                <FormLabel>Last Inspection</FormLabel>
                <FormControl
</>>
                  <Input
                    type="date"
                    value={formValues.lastInspection || ''}
                    onChange={e => handleChange('lastInspection', e.target.value)}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Features */}
          <FormField
            name="features"
            render={() => (
              <FormItem><>

                <FormLabel>Features</FormLabel>
                <FormControl
</>><>

                  <Input
                    value={featuresString}
                    onChange={e => handleFeaturesChange(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter features, separated by commas"
                  />
                </FormControl>
                <FormDescription
</>>
                  Enter features separated by commas (e.g. "3 bedrooms, 2 baths, garage")
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            name="notes"
            render={() => (
              <FormItem><>

                <FormLabel>Notes</FormLabel>
                <FormControl
</>>
                  <Textarea
                    value={formValues.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter property notes"
                    className="min-h-32"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
};
