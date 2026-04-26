export interface DiscoveredSegment {
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
