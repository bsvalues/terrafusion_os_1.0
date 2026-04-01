import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { VoiceSearch } from './voice-search';
import { SearchParams } from '../services/voice-recognition-service';

export function VoiceSearchDemo() {
  const [searchResults, setSearchResults] = useState<SearchParams | null>(null);
  
  const handleSearch = (params: SearchParams) => {
    console.log('Search params:', params);
    setSearchResults(params);
    
    // Here you would typically trigger an actual search using these parameters
    // For example: fetchProperties(params)
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Voice Search Demo</CardTitle>
          <CardDescription>
            Try searching for properties using your voice. Click the button below and speak your search query.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <VoiceSearch onSearch={handleSearch} />
          </div>
          
          <div className="text-sm text-muted-foreground mb-4">
            <p>Example voice commands:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>"Show me residential properties in downtown area"</li>
              <li>"Find properties owned by Smith with more than 5 acres"</li>
              <li>"Search for commercial properties valued between 500,000 and 1,000,000 dollars"</li>
              <li>"Show properties with parcel number 12345"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {searchResults && Object.keys(searchResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              The following search parameters were extracted from your voice query:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(searchResults, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}