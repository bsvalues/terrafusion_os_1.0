import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Warning  } from '@mui/icons-material';

type Coordinate = {
  lat: number;
  lng: number;
};

type DescriptionPoint = {
  coordinate: Coordinate;
  description?: string;
  type: "corner" | "midpoint" | "reference";
};

type DescriptionSegment = {
  start: DescriptionPoint;
  end: DescriptionPoint;
  description?: string;
  type: "boundary" | "reference" | "extension";
  bearing?: string;
  distance?: string;
};

interface LegalDescriptionDetailsProps {
  description: {
    points: DescriptionPoint[];
    segments: DescriptionSegment[];
    polygon?: GeoJSON.Polygon;
    confidence: number;
    issues?: string[];
  };
}

/**
 * Legal Description Details Component
 * 
 * This component displays the details of a parsed legal description, including
 * points, segments, and other relevant information in a tabular format.
 */
export const LegalDescriptionDetails: React.FC<LegalDescriptionDetailsProps> = ({ description }) => {
  const { points, segments, confidence, issues } = description;
  
  const formatCoordinate = (coord: Coordinate): string => {
    return `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
  };
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const confidenceColor = getConfidenceColor(confidence);
  
  return (
    <Card className="w-full h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center"><>

          <CardTitle>Parsed Legal Description</CardTitle>
          <div
</>
className="flex items-center gap-2"><>

            <span className="text-sm">Confidence:</span>
            <Badge
</>
variant="outline" className="text-white" style={{ backgroundColor: confidenceColor }}>
              {(confidence * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 flex-1 flex flex-col">
        <Tabs defaultValue="points" className="w-full h-full flex flex-col">
          <TabsList><>

            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger
</>
value="segments">Segments</TabsTrigger>
            <TabsTrigger value="issues">Issues {issues && issues.length > 0 && <span className="ml-1">({issues.length})</span>}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="points" className="flex-1 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1">
              <div className="text-sm text-muted-foreground mb-2"><>

                <MapPin className="inline-block mr-1 h-4 w-4" /> {points.length} points identified in the description
              </div>
              
              <Table
</>
</>>
                <TableHeader>
                  <TableRow><>

                    <TableHead>#</TableHead>
                    <TableHead
</>
</>>Coordinates</TableHead><>

                    <TableHead>Type</TableHead>
                    <TableHead
</>
</>>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {points.map((point /* , index */) => (
                    <TableRow key={index}><>

                      <TableCell>{index + 1}</TableCell>
                      <TableCell
</>
</>>{formatCoordinate(point.coordinate)}</TableCell>
                      <TableCell>
                        <Badge variant={point.type === 'corner' ? 'default' : 'outline'}>
                          {point.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{point.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="segments" className="flex-1 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1">
              <div className="text-sm text-muted-foreground mb-2"><>

                <MapPin className="inline-block mr-1 h-4 w-4" /> {segments.length} segments identified in the description
              </div>
              
              <Table
</>
</>>
                <TableHeader>
                  <TableRow><>

                    <TableHead>#</TableHead>
                    <TableHead
</>
</>>From</TableHead><>

                    <TableHead>To</TableHead>
                    <TableHead
</>
</>>Type</TableHead><>

                    <TableHead>Bearing</TableHead>
                    <TableHead
</>
</>>Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment /* , index */) => (
                    <TableRow key={index}><>

                      <TableCell>{index + 1}</TableCell>
                      <TableCell
</>
</>>{formatCoordinate(segment.start.coordinate)}</TableCell><>

                      <TableCell>{formatCoordinate(segment.end.coordinate)}</TableCell>
                      <TableCell
</>
</>>
                        <Badge variant={segment.type === 'boundary' ? 'default' : 'outline'}>
                          {segment.type}
                        </Badge>
                      </TableCell><>

                      <TableCell>{segment.bearing || '-'}</TableCell>
                      <TableCell
</>
</>>{segment.distance || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="issues" className="flex-1 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1">
              <div className="text-sm text-muted-foreground mb-2">
                <Warning className="inline-block mr-1 h-4 w-4" /> 
                {issues && issues.length 
                  ? `${issues.length} issues detected with this description` 
                  : 'No issues detected with this description'}
              </div>
              
              {issues && issues.length > 0 ? (
                <div className="space-y-2">
                  {issues.map((issue /* , index */) => (
                    <div 
                      key={index} 
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2"
                    >
                      <Warning className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">{issue}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No issues detected. The legal description appears to be valid.
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};