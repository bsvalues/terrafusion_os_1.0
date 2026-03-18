import { useQuery } from '@tanstack/react-query';

interface PropertyData {
  parcelId: string;
  apn: string;
  address: string;
  owner: string;
  propertyType: string;
  yearBuilt: number;
  sqft: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  condition: string;
  quality: string;
  neighborhood: string;
  assessedValue: number;
  marketValue: number;
  taxableValue: number;
  zoning: string;
  landUse: string;
}

export function usePropertyData(parcelId: string) {
  return useQuery<PropertyData>({
    queryKey: ['property', parcelId],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${parcelId}`);
      if (!res.ok) throw new Error('Failed to fetch property data');
      return res.json();
    },
    enabled: !!parcelId,
  });
}

export function usePropertySearch(params: { apn?: string; address?: string; owner?: string }) {
  const searchParams = new URLSearchParams();
  if (params.apn) searchParams.set('apn', params.apn);
  if (params.address) searchParams.set('address', params.address);
  if (params.owner) searchParams.set('owner', params.owner);
  const queryString = searchParams.toString();

  return useQuery<PropertyData[]>({
    queryKey: ['propertySearch', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/properties/search?${queryString}`);
      if (!res.ok) throw new Error('Property search failed');
      return res.json();
    },
    enabled: !!queryString,
  });
}
