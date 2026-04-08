import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AlertCircle, Search, Lightbulb, FileText } from 'lucide-react';
import AppLayout from '@/layout/app-layout';

export default function NaturalLanguagePage() {
  const [query, setQuery] = useState('');
  const [queryMode, setQueryMode] = useState<'query' | 'summary'>('query');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Example queries to help users get started
  const exampleQueries = [
    "Show me all residential properties in Richland",
    "Find properties larger than 2 acres in West Richland",
    "List commercial properties valued over $500,000 in Kennewick",
    "Show me properties with land use code R1 in Benton City",
    "Find all properties with improvements built after 2000"
  ];

  // Mutation for making natural language queries
  const queryMutation = useMutation({
    mutationFn: async (queryText: string) => {
      return apiRequest<any>(`/api/natural-language/${queryMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: queryText })
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
    }
  });

  // Query to fetch results (only if a query has been submitted)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [`/api/natural-language/${queryMode}`, query],
    enabled: isSubmitted,
    queryFn: async () => {
      return queryMutation.data;
    }
  });

  const handleQuerySubmit = () => {
    if (query.trim()) {
      queryMutation.mutate(query);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">
          Benton County Property Tax Natural Language Search
        </h1>

        <Tabs defaultValue="query" className="mb-6" onValueChange={(value) => setQueryMode(value as 'query' | 'summary')}>
          <TabsList className="mb-4">
            <TabsTrigger value="query">Property Search</TabsTrigger>
            <TabsTrigger value="summary">Summary Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="query">
            <Card>
              <CardHeader>
                <CardTitle>Search Properties with Natural Language</CardTitle>
                <CardDescription>
                  Ask questions about Benton County properties in plain English
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Textarea 
                    placeholder="Example: Show me all residential properties in Richland with at least 3 bedrooms" 
                    className="h-24"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Example Queries:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.map((exampleQuery, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExampleClick(exampleQuery)}
                      >
                        {exampleQuery}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setQuery('')}
                  disabled={!query || queryMutation.isPending}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleQuerySubmit} 
                  disabled={!query || queryMutation.isPending}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Property Data Summary</CardTitle>
                <CardDescription>
                  Get an AI-generated summary of Benton County property data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Textarea 
                    placeholder="Example: Summarize residential properties in West Richland built after 2010" 
                    className="h-24"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Example Summary Requests:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Summarize all commercial properties in Benton County",
                      "Give me a summary of land records in Richland",
                      "Summarize properties valued over $400,000"
                    ].map((exampleQuery, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExampleClick(exampleQuery)}
                      >
                        {exampleQuery}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setQuery('')}
                  disabled={!query || queryMutation.isPending}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleQuerySubmit} 
                  disabled={!query || queryMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {queryMutation.isPending && (
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}

        {queryMutation.isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(queryMutation.error as Error)?.message || 'Failed to process your query. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            {queryMode === 'summary' && data.summary && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>AI-generated summary of property data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="whitespace-pre-line">{data.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.results && data.results.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>Found {data.count} matching properties in Benton County</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Property ID</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Address</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Parcel Number</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Value</th>
                            <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.results.map((result: any, index: number) => {
                            // Determine if the result is a property or has an embedded property
                            const property = result.property || result;

                            return (
                              <tr key={index} className="border-t">
                                <td className="p-3 text-sm">{property.propertyId}</td>
                                <td className="p-3 text-sm">{property.address}</td>
                                <td className="p-3 text-sm">{property.propertyType}</td>
                                <td className="p-3 text-sm">{property.parcelNumber}</td>
                                <td className="p-3 text-sm">
                                  {property.value ? `$${property.value.toLocaleString()}` : 'Not Assessed'}
                                </td>
                                <td className="p-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs 
                                    ${property.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                      property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-gray-100 text-gray-800'}`}>
                                    {property.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              data.results && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No results found</AlertTitle>
                  <AlertDescription>
                    No properties matching your query were found in Benton County. Try a different search.
                  </AlertDescription>
                </Alert>
              )
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}