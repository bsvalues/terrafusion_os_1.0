/**
 * SegmentDiscoveryDashboard.tsx (TFR-059)
 *
 * Shows auto-discovered market segments. Map placeholder + list view.
 * Accept/reject actions. No domain math in component.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiscoveredSegment {
  id: string;
  name: string;
  parcelCount: number;
  medianValue: number;
  avgSqft: number;
  avgAge: number;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  boundaryDescription: string;
  keyCharacteristics: string[];
}

const DISCOVERED_SEGMENTS: DiscoveredSegment[] = [
  { id: 'd1', name: 'Cluster A: New Construction SFR', parcelCount: 312, medianValue: 425000, avgSqft: 2200, avgAge: 3, confidence: 0.92, status: 'pending', boundaryDescription: 'NE quadrant, north of Highway 240', keyCharacteristics: ['Built after 2022', '2000+ sqft', 'Quality Grade: Good+'] },
  { id: 'd2', name: 'Cluster B: Historic Downtown', parcelCount: 178, medianValue: 285000, avgSqft: 1450, avgAge: 65, confidence: 0.87, status: 'pending', boundaryDescription: 'Downtown core, within 0.5mi of Main St', keyCharacteristics: ['Pre-1970 construction', 'Mixed use zone', 'Walkable area'] },
  { id: 'd3', name: 'Cluster C: Rural Large Lot', parcelCount: 524, medianValue: 195000, avgSqft: 1600, avgAge: 28, confidence: 0.78, status: 'accepted', boundaryDescription: 'South county, lots > 2 acres', keyCharacteristics: ['Lot > 2 acres', 'Agricultural proximity', 'Well/septic'] },
  { id: 'd4', name: 'Cluster D: Waterfront Premium', parcelCount: 67, medianValue: 680000, avgSqft: 2800, avgAge: 18, confidence: 0.95, status: 'pending', boundaryDescription: 'Columbia River frontage, 500ft buffer', keyCharacteristics: ['Water access', 'View premium', 'Higher quality grade'] },
  { id: 'd5', name: 'Cluster E: Commercial Corridor', parcelCount: 143, medianValue: 520000, avgSqft: 4500, avgAge: 22, confidence: 0.81, status: 'rejected', boundaryDescription: 'Along US-395, commercial zoning', keyCharacteristics: ['Commercial zone', 'High traffic', 'Strip mall proximity'] },
];

export function SegmentDiscoveryDashboard() {
  const [segments, setSegments] = useState<DiscoveredSegment[]>(DISCOVERED_SEGMENTS);
  const [loading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleAction = useCallback((id: string, action: 'accepted' | 'rejected') => {
    setSegments(prev => prev.map(s =>
      s.id === id ? { ...s, status: action } : s
    ));
  }, []);

  const pendingCount = segments.filter(s => s.status === 'pending').length;
  const acceptedCount = segments.filter(s => s.status === 'accepted').length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Segment Discovery</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{segments.length}</div>
            <div className="text-sm text-muted-foreground">Discovered Segments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{acceptedCount}</div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading discovered segments...</span>
        </div>
      ) : viewMode === 'map' ? (
        <Card>
          <CardHeader>
            <CardTitle>Segment Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded border-2 border-dashed border-gray-300">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">Map View</div>
                <p className="text-sm">GIS map integration renders discovered segment boundaries here</p>
                <p className="text-xs mt-1">Connect to mapping service for spatial visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {segments.map(seg => (
            <Card key={seg.id} className={seg.status === 'rejected' ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{seg.name}</h3>
                    <p className="text-sm text-muted-foreground">{seg.boundaryDescription}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      seg.status === 'accepted' ? 'default' :
                      seg.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {seg.status}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(seg.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="p-2 rounded bg-gray-50">
                    <div className="text-xs text-muted-foreground">Parcels</div>
                    <div className="font-bold">{seg.parcelCount.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-50">
                    <div className="text-xs text-muted-foreground">Median Value</div>
                    <div className="font-bold">${seg.medianValue.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-50">
                    <div className="text-xs text-muted-foreground">Avg Sqft</div>
                    <div className="font-bold">{seg.avgSqft.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-50">
                    <div className="text-xs text-muted-foreground">Avg Age</div>
                    <div className="font-bold">{seg.avgAge} yr</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {seg.keyCharacteristics.map((char, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{char}</Badge>
                  ))}
                </div>

                {seg.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(seg.id, 'accepted')}>
                      Accept Segment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(seg.id, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SegmentDiscoveryDashboard;
