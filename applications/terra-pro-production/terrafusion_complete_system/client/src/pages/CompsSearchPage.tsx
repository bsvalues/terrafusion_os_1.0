import React, { useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingCard } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWebSocketResource } from "@/hooks/use-websocket-resource";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Search, Map, Grid3X3, Refresh  } from '@mui/icons-material';

// Search form component with error boundary
const CompsSearchForm = () => {
  const [searchParams, setSearchParams] = useState({
    address: "",
    city: "",
    state: "TX",
    radius: "1",
    minPrice: "",
    maxPrice: "",
  });

  const { isConnected } = useWebSocket();

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useWebSocketResource({
    resource: "comps",
    params: searchParams,
    autoFetch: false,
    enabled: isConnected,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2"><>

        <h1 className="text-3xl font-bold tracking-tight">Comparable Property Search</h1>
        <p
</> className="text-muted-foreground">
          Search for comparable properties based on location and parameters
        </p>
      </div>

      <Card>
        <CardHeader><>

          <CardTitle>Search Parameters</CardTitle>
          <CardDescription
</>>Enter property details to find comparable sales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><>

                <Label htmlFor="address">Address</Label>
                <Input
</>
                  id="address"
                  name="address"
                  placeholder="123 Main St"
                  value={searchParams.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="city">City</Label>
                <Input
</>
                  id="city"
                  name="city"
                  placeholder="Austin"
                  value={searchParams.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="state">State</Label>
                <Select
</>
                  value={searchParams.state}
                  onValueChange={(value) => handleSelectChange("state", value)}
                >
                  <SelectTrigger id="state"><>

                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem
</> value="CA">California</SelectItem><>

                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem
</> value="FL">Florida</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="radius">Search Radius (miles)</Label>
                <Select
</>
                  value={searchParams.radius}
                  onValueChange={(value) => handleSelectChange("radius", value)}
                >
                  <SelectTrigger id="radius"><>

                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="0.5">0.5 miles</SelectItem>
                    <SelectItem
</> value="1">1 mile</SelectItem><>

                    <SelectItem value="2">2 miles</SelectItem>
                    <SelectItem
</> value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="minPrice">Minimum Price</Label>
                <Input
</>
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  placeholder="300000"
                  value={searchParams.minPrice}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="maxPrice">Maximum Price</Label>
                <Input
</>
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  placeholder="800000"
                  value={searchParams.maxPrice}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !isConnected}>
                {isLoading ? (
                  <>
                    <Refresh className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Comparables
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results section */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingCard />
        ) : error ? (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Error Loading Comparables</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error.message}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={refetch}>
                <Refresh className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardFooter>
          </Card>
        ) : searchResults ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center"><>

              <h2 className="text-2xl font-semibold">
                Search Results ({searchResults.length || 0} found)
              </h2>
              <div
</> className="flex items-center gap-2">
                <Button variant="outline" size="sm"><>

                  <Map className="mr-2 h-4 w-4" />
                  Map View
                </Button>
                <Button
</> variant="outline" size="sm">
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Grid View
                </Button>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchResults.map((comp: any) => (
                  <Card key={comp.id} className="overflow-hidden"><>

                    <div className="aspect-video bg-muted"></div>
                    <CardContent
</> className="p-4"><>

                      <h3 className="font-semibold truncate">{comp.address}</h3>
                      <p
</> className="text-sm text-muted-foreground">
                        {comp.city}, {comp.state}
                      </p>
                      <p className="text-lg font-bold mt-2">
                        ${comp.price?.toLocaleString() || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" /><>

                  <h3 className="font-medium text-lg">No results found</h3>
                  <p
</> className="text-muted-foreground max-w-md mt-1">
                    Try adjusting your search criteria or expanding the search radius to find more
                    comparable properties.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Main export with error boundary
export default function CompsSearchPage() {
  return (
    <ErrorBoundary>
      <CompsSearchForm />
    </ErrorBoundary>
  );
}
