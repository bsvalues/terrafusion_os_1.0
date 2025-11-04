import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Permit } from '@/types';
import { Search, AlertCircle, FileText, MapPin, Tag, BarChart, Calendar, DollarSign  } from '@mui/icons-material';
import { Skeleton } from '@/components/ui/skeleton';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface SimilarPermitSearchProps {
  onSelectPermit: (permit: Permit) => void;
}

export function SimilarPermitSearch({ onSelectPermit }: SimilarPermitSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  
  // Vector search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/ai/vector/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 10 }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search permits');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSearched(true);
    },
    onError: (error) => {
      toast({
        title: 'Search Failed',
        description: String(error),
        variant: 'destructive',
      });
    },
  });
  
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search query required',
        description: 'Please enter a search term to find similar permits',
        variant: 'destructive',
      });
      return;
    }
    
    searchMutation.mutate(searchQuery);
  };
  
  const results = searchMutation.data?.results || [];
  const isLoading = searchMutation.isPending;
  const hasNoResults = searched && results.length === 0;
  
  const handleSelectPermit = (permit: Permit) => {
    onSelectPermit(permit);
    toast({
      title: 'Permit Selected',
      description: `Permit ${permit.id} selected for analysis`,
    });
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getSimilarityLabel = (similarity: number) => {
    if (similarity > 0.9) return 'Very High';
    if (similarity > 0.8) return 'High';
    if (similarity > 0.7) return 'Good';
    if (similarity > 0.6) return 'Moderate';
    return 'Low';
  };
  
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.9) return 'bg-green-500';
    if (similarity > 0.8) return 'bg-green-400';
    if (similarity > 0.7) return 'bg-amber-400';
    if (similarity > 0.6) return 'bg-amber-500';
    return 'bg-red-400';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><>

          <Search className="mr-2 h-5 w-5" /> Semantic Search
        </CardTitle>
        <CardDescription
</>>
          Use natural language to search for similar permits across your database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6">
          <Input
            placeholder="Search for permits similar to..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <>Searching...</>
            ) : (
              <>Search</>
            )}
          </Button>
        </div>
        
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {hasNoResults && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>No results found</AlertTitle>
            <AlertDescription
</>>
              Try broadening your search terms or using different keywords.
            </AlertDescription>
          </Alert>
        )}
        
        {!isLoading && results.length > 0 && (
          <div className="space-y-4">
            {results.map(({ permit, similarity }: { permit: Permit, similarity: number }) => (
              <Card 
                key={permit.id} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-l-4"
                style={{ borderLeftColor: getSimilarityColor(similarity) }}
                onClick={() => handleSelectPermit(permit)}
              >
                <CardContent className="p-4 relative">
                  <div className="absolute top-2 right-2 flex items-center"><>

                    <span className="text-sm mr-2">
                      Match: {getSimilarityLabel(similarity)}
                    </span>
                    <div
</> 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: getSimilarityColor(similarity) }}
                    ></div>
                  </div>
                  
                  <div className="mb-2 mt-2">
                    <div className="flex items-start mb-1">
                      <FileText className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div className="font-medium flex-1">
                        {permit.permitDescription || 'No Description'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Neighborhood:</span>
                      {permit.neighborhoodCode || 'N/A'}
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Date:</span>
                      {formatDate(permit.issueDate)}
                    </div>
                    
                    <div className="flex items-center">
                      <DollarSign className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Value:</span>
                      {formatCurrency(permit.value)}
                    </div>
                    
                    <div className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><>

                      <span className="text-muted-foreground mr-1">Status:</span>
                      <Badge
</> variant={permit.enterPermit ? "default" : "destructive"}>
                        {permit.enterPermit ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground"><>

        <div>
          {searchMutation.data?.count ? `${searchMutation.data.count} results found` : 'Search for similar permits'}
        </div>
        <div
</>>
          Powered by vector similarity search
        </div>
      </CardFooter>
    </Card>
  );
}