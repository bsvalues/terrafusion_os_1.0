import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Check, X, Edit } from 'lucide-react';
import { SearchParams } from '../../services/voice-recognition-service';

interface VoiceSearchResultsProps {
  text: string;
  searchParams: SearchParams;
  onApply: (modifiedParams?: SearchParams) => void;
  onClear: () => void;
  onCancel: () => void;
}

export function VoiceSearchResults({ 
  text, 
  searchParams, 
  onApply, 
  onClear, 
  onCancel 
}: VoiceSearchResultsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParams, setEditedParams] = useState<SearchParams>({...searchParams});

  const handleInputChange = (field: keyof SearchParams, value: string | number) => {
    setEditedParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setEditedParams(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedParams({...searchParams});
    }
  };

  const applySearch = () => {
    onApply(isEditing ? editedParams : searchParams);
  };

  // Helper to render search parameter values
  const renderParamValue = (param: any, field: string) => {
    if (param === undefined || param === null) return 'Not specified';
    if (field === 'dateRange') {
      return `${param.start || 'Any'} to ${param.end || 'Any'}`;
    }
    return param.toString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Voice Search Results</span>
          <Button variant="outline" size="sm" onClick={toggleEdit}>
            {isEditing ? <Check className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </CardTitle>
        <div className="text-muted-foreground text-sm mt-2">
          <strong>Transcribed:</strong> {text}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isEditing ? (
            // Edit mode
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Property ID</Label>
                  <Input 
                    id="propertyId"
                    value={editedParams.propertyId || ''}
                    onChange={(e) => handleInputChange('propertyId', e.target.value)}
                    placeholder="Property ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address"
                    value={editedParams.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcelNumber">Parcel Number</Label>
                  <Input 
                    id="parcelNumber"
                    value={editedParams.parcelNumber || ''}
                    onChange={(e) => handleInputChange('parcelNumber', e.target.value)}
                    placeholder="Parcel Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input 
                    id="owner"
                    value={editedParams.owner || ''}
                    onChange={(e) => handleInputChange('owner', e.target.value)}
                    placeholder="Owner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Input 
                    id="area"
                    value={editedParams.area || ''}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="Area"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Input 
                    id="propertyType"
                    value={editedParams.propertyType || ''}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    placeholder="Property Type"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minValue">Min Value ($)</Label>
                  <Input 
                    id="minValue"
                    type="number"
                    value={editedParams.minValue || ''}
                    onChange={(e) => handleInputChange('minValue', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min Value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Max Value ($)</Label>
                  <Input 
                    id="maxValue"
                    type="number"
                    value={editedParams.maxValue || ''}
                    onChange={(e) => handleInputChange('maxValue', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max Value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minAcres">Min Acres</Label>
                  <Input 
                    id="minAcres"
                    type="number"
                    value={editedParams.minAcres || ''}
                    onChange={(e) => handleInputChange('minAcres', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min Acres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAcres">Max Acres</Label>
                  <Input 
                    id="maxAcres"
                    type="number"
                    value={editedParams.maxAcres || ''}
                    onChange={(e) => handleInputChange('maxAcres', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max Acres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateStart">Date Range (Start)</Label>
                  <Input 
                    id="dateStart"
                    type="date"
                    value={editedParams.dateRange?.start || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateEnd">Date Range (End)</Label>
                  <Input 
                    id="dateEnd"
                    type="date"
                    value={editedParams.dateRange?.end || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            // View mode
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(searchParams).map(([key, value]) => {
                  if (value === undefined || value === null) return null;
                  
                  // Skip empty arrays or objects
                  if (
                    (Array.isArray(value) && value.length === 0) || 
                    (typeof value === 'object' && Object.keys(value).length === 0)
                  ) {
                    return null;
                  }
                  
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {renderParamValue(value, key)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" onClick={onCancel} className="mr-2">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button variant="secondary" onClick={onClear}>
            Clear
          </Button>
        </div>
        <Button onClick={applySearch}>
          <Check className="h-4 w-4 mr-1" /> Apply Search
        </Button>
      </CardFooter>
    </Card>
  );
}