import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { Loader2, Info  } from '@mui/icons-material';
import { CollaborativeMap } from '@/components/maps/collaborative-map';
import { MapboxMap } from '@/components/maps/mapbox/mapbox-map';

interface LegalDescriptionResult {
  points: Array<{
    coordinate: { lat: number; lng: number };
    description?: string;
    type: string;
  }>;
  segments: Array<{
    start: { coordinate: { lat: number; lng: number } };
    end: { coordinate: { lat: number; lng: number } };
    description?: string;
    type: string;
    bearing?: string;
    distance?: string;
  }>;
  polygon?: any;
  confidence: number;
  issues?: string[];
}

export default function LegalDescriptionDemo() {
  const [description, setDescription] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<LegalDescriptionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('map');

  const handleParseDescription = async () => {
    if (!description.trim()) {
      setError('Please enter a legal description to parse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/legal-description/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: description }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setParsedResult(data);
      
      // Switch to map tab to show the result
      setActiveTab('map');
    } catch (err) {
      console.error('Error parsing legal description:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleDescriptions = [
    'The Northwest Quarter of the Northeast Quarter of Section 12, Township 10 North, Range 21 East of the Willamette Meridian, Benton County, Washington.',
    'Beginning at the Northeast corner of Lot 2, Block 5, of VISTA HEIGHTS ADDITION to the City of Kennewick, according to the recorded plat thereof; thence South along the East line of said Lot, a distance of 100 feet to the Southeast corner thereof; thence West along the South line of said Lot, a distance of 50 feet to the Southwest corner thereof; thence North along the West line of said Lot, a distance of 100 feet to the Northwest corner thereof; thence East along the North line of said Lot, a distance of 50 feet to the point of beginning.',
    'Commencing at a point on the north line of Washington Street 150 feet west of the SW corner of the intersection of Washington Street and First Avenue; thence north and parallel with First Avenue 100 feet; thence west 50 feet; thence south and parallel with First Avenue 100 feet to the north line of Washington Street; thence east along said north line 50 feet to the point of beginning.'
  ];

  const loadExampleDescription = (index: number) => {
    setDescription(exampleDescriptions[index]);
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Moderate';
    return 'Low';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="container mx-auto p-4"><>

      <h1 className="text-3xl font-bold mb-6">Legal Description Parser</h1>
      <p
</> className="mb-6 text-gray-600">
        Enter a legal description of a property to visualize it on the map. The parser supports various formats
        including metes and bounds, rectangular survey system (township/range), and lot/block descriptions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4"><>

            <h2 className="text-xl font-semibold mb-4">Input Description</h2>
            <Textarea
</>
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a legal property description..."
              className="min-h-[200px] mb-4"
            />

            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <Button 
                  onClick={handleParseDescription} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    'Parse & Visualize'
                  )}
                </Button>
              </div><>


              <div className="text-center text-sm text-gray-500 mt-2">Or try an example:</div>
              <div
</> className="grid grid-cols-3 gap-2">
                {exampleDescriptions.map((_ /* , index */) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => loadExampleDescription(index)}
                    disabled={isLoading}
                  >
                    Example {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="error" className="mt-4" title="Error">
                {error}
              </Alert>
            )}

            {parsedResult && (
              <div className="mt-4 border-t pt-4"><>

                <h3 className="font-semibold">Parse Results</h3>
                <div
</> className="grid grid-cols-2 gap-4 mt-2">
                  <div><>

                    <span className="text-sm text-gray-500">Confidence:</span>
                    <span
</> className={`ml-2 font-medium ${getConfidenceColor(parsedResult.confidence)}`}>
                      {getConfidenceLabel(parsedResult.confidence)} ({Math.round(parsedResult.confidence * 100)}%)
                    </span>
                  </div>
                  <div><>

                    <span className="text-sm text-gray-500">Points:</span>
                    <span
</> className="ml-2 font-medium">{parsedResult.points.length}</span>
                  </div>
                  <div><>

                    <span className="text-sm text-gray-500">Line Segments:</span>
                    <span
</> className="ml-2 font-medium">{parsedResult.segments.length}</span>
                  </div>
                  <div><>

                    <span className="text-sm text-gray-500">Polygon Created:</span>
                    <span
</> className="ml-2 font-medium">{parsedResult.polygon ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {parsedResult.issues && parsedResult.issues.length > 0 && (
                  <Alert className="mt-4" title="Parsing Notes">
                    <ul className="list-disc list-inside">
                      {parsedResult.issues.map((issue, i) => (
                        <li key={i} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4"><>

                <TabsTrigger value="map">Map Visualization</TabsTrigger>
                <TabsTrigger
</> value="json">Raw JSON Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="map" className="h-[600px]">
                {parsedResult ? (
                  <MapboxMap
                    geoJsonData={parsedResult.polygon}
                    points={parsedResult.points}
                    initialCenter={
                      parsedResult.points.length > 0 
                        ? [parsedResult.points[0].coordinate.lng, parsedResult.points[0].coordinate.lat] 
                        : [-122.347, 47.586]
                    }
                    initialZoom={14}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-md">
                    <div className="text-center">
                      <Info className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Enter a legal description and click "Parse & Visualize" to see the property on the map.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="json">
                <div className="bg-gray-50 p-4 rounded-md overflow-auto h-[600px]">
                  <pre className="text-sm">
                    {parsedResult ? JSON.stringify(parsedResult, null, 2) : 'No data available yet.'}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}