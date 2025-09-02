import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Home, DollarSign, BedDouble, Bath, Maximize, Calendar, Map as MapIcon, ExternalLink  } from '@mui/icons-material';
import { PropertyListing, searchPropertiesByCoordinates } from '@/lib/property-service';
import { formatCurrency } from '@/lib/utils';

interface PropertyListingsPanelProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
  radiusMiles?: number;
}

export function PropertyListingsPanel({
  latitude,
  longitude,
  onClose,
  radiusMiles = 1
}: PropertyListingsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  
  useEffect(() => {
    async function fetchProperties() {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await searchPropertiesByCoordinates({
          latitude,
          longitude,
          radius_miles: radiusMiles
        });
        
        if (result && result.results) {
          setProperties(result.results);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error('Error fetching property listings:', err);
        setError('Failed to load property listings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProperties();
  }, [latitude, longitude, radiusMiles]);
  
  return (
    <Card className="w-full max-w-md shadow-lg border-benton-navy">
      <CardHeader className="pb-2 bg-gradient-to-r from-benton-navy to-benton-slate text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center"><>

            <Home className="mr-2 h-5 w-5 text-benton-green" />
            Benton County Property Listings
          </CardTitle>
          <Button
</> variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-white hover:text-benton-tan hover:bg-benton-navy/50">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-benton-tan">
          Showing properties near {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[125px] w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" /><>

              <Skeleton className="h-4 w-[80%]" />
            </div>
            <div
</> className="flex space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No property listings found in this area.</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-4">
              {properties.map((property) => (
                <PropertyListingCard key={property.zpid} property={property} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between bg-gradient-to-r from-benton-slate/20 to-benton-navy/20"><>

        <Badge variant="outline" className="text-xs bg-benton-tan/10 text-benton-navy border-benton-navy">
          Data from Zillow
        </Badge>
        <Button
</> variant="outline" size="sm" onClick={onClose} className="border-benton-navy text-benton-navy hover:bg-benton-navy hover:text-white">
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}

interface PropertyListingCardProps {
  property: PropertyListing;
}

function PropertyListingCard({ property }: PropertyListingCardProps) {
  const [activeTab, setActiveTab] = useState<string>('details');
  
  const openZillowListing = () => {
    if (property.url) {
      window.open(property.url, '_blank');
    } else {
      window.open(`https://www.zillow.com/homes/${property.zpid}_zpid/`, '_blank');
    }
  };
  
  return (
    <Card className="border overflow-hidden border-benton-slate/30 hover:border-benton-navy transition-colors">
      <div className="relative h-[150px] bg-muted">
        {property.photos && property.photos.length > 0 ? (
          <img 
            src={property.photos[0]} 
            alt={property.address}
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-benton-tan/20">
            <Home className="h-12 w-12 text-benton-navy/50" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-benton-green text-white font-medium">
            {property.statusType || 'For Sale'}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle className="text-base">{formatCurrency(property.price)}</CardTitle>
            <CardDescription
</> className="line-clamp-1">{property.address}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={openZillowListing} title="View on Zillow">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-benton-tan/20"><>

            <TabsTrigger value="details" className="data-[state=active]:bg-benton-navy data-[state=active]:text-white">Details</TabsTrigger>
            <TabsTrigger
</> value="location" className="data-[state=active]:bg-benton-navy data-[state=active]:text-white">Location</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-2 pt-2">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col items-center p-1 border rounded border-benton-navy/20 bg-benton-tan/10">
                <BedDouble className="h-4 w-4 mb-1 text-benton-navy" /><>

                <span className="font-medium text-benton-slate">{property.bedrooms}</span>
                <span
</> className="text-xs text-benton-slate/80">Beds</span>
              </div>
              <div className="flex flex-col items-center p-1 border rounded border-benton-navy/20 bg-benton-tan/10">
                <Bath className="h-4 w-4 mb-1 text-benton-navy" /><>

                <span className="font-medium text-benton-slate">{property.bathrooms}</span>
                <span
</> className="text-xs text-benton-slate/80">Baths</span>
              </div>
              <div className="flex flex-col items-center p-1 border rounded border-benton-navy/20 bg-benton-tan/10">
                <Maximize className="h-4 w-4 mb-1 text-benton-navy" /><>

                <span className="font-medium text-benton-slate">{property.livingArea.toLocaleString()}</span>
                <span
</> className="text-xs text-benton-slate/80">Sq Ft</span>
              </div>
            </div>
            
            <div className="flex items-center text-sm">
              <Home className="h-4 w-4 mr-1 text-benton-blue" /><>

              <span className="text-benton-slate">Type:</span>
              <span
</> className="ml-1 font-medium text-benton-navy">{property.homeType}</span>
            </div>
            
            {property.yearBuilt && (
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1 text-benton-blue" /><>

                <span className="text-benton-slate">Built:</span>
                <span
</> className="ml-1 font-medium text-benton-navy">{property.yearBuilt}</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="location" className="pt-2 space-y-2">
            <div className="flex items-center text-sm space-x-1">
              <MapIcon className="h-4 w-4 text-benton-rust" /><>

              <span className="text-benton-slate">Location:</span>
              <span
</> className="font-medium line-clamp-1 text-benton-navy">
                {[property.city, property.state, property.zipcode].filter(Boolean).join(', ')}
              </span>
            </div>
            
            <div className="flex items-center text-sm"><>

              <span className="text-benton-slate">Coordinates:</span>
              <span
</> className="ml-1 font-medium text-benton-navy">
                {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
              </span>
            </div>
            
            {property.lotSize && (
              <div className="flex items-center text-sm"><>

                <span className="text-benton-slate">Lot Size:</span>
                <span
</> className="ml-1 font-medium text-benton-navy">{property.lotSize.toLocaleString()} Sq Ft</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="pt-0 pb-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full bg-benton-green hover:bg-benton-navy text-white" 
          onClick={openZillowListing}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          View Property Details
        </Button>
      </CardFooter>
    </Card>
  );
}