import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, MapPin  } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { reverseGeocode } from '@/lib/geocoding-service';

interface CoordinateAddressDisplayProps {
  latitude: number;
  longitude: number;
  onClose?: () => void;
}

export function CoordinateAddressDisplay({
  latitude,
  longitude,
  onClose
}: CoordinateAddressDisplayProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Format coordinates for display
  const formatCoordinate = (value: number, isLatitude = false) => {
    const cardinal = isLatitude 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}° ${cardinal}`;
  };
  
  // Copy coordinates to clipboard
  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${latitude}, ${longitude}`);
    toast({
      title: 'Coordinates Copied',
      description: 'The coordinates have been copied to your clipboard.'
    });
  };
  
  // Fetch address information
  useEffect(() => {
    const getAddress = async () => {
      setLoading(true);
      setAddress(null);
      setError(null);
      
      try {
        const response = await reverseGeocode(latitude, longitude);
        
        if (response.status === 'success' && response.data) {
          setAddress(response.data.formattedAddress || response.data.address);
        } else {
          setError(response.message || 'Failed to retrieve address');
        }
      } catch (err) {
        setError('Error fetching address information');
        console.error('Geocoding error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getAddress();
  }, [latitude, longitude]);
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Location Information
          </span>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              &times;
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="bg-secondary p-2 rounded flex items-center justify-between">
            <div className="text-sm"><>

              <div>{formatCoordinate(latitude, true)}</div>
              <div
</>
</>>{formatCoordinate(longitude)}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCoordinates}
              title="Copy coordinates"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Address</h4>
            {loading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrieving address...
              </div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : address ? (
              <div className="text-sm">{address}</div>
            ) : (
              <div className="text-sm text-muted-foreground">No address found</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}